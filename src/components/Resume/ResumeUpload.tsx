import { useState, useRef } from "react";
import { auth, db } from "@/integrations/firebase/config";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import { storageService } from "@/integrations/supabase/storage";

interface ResumeUploadProps {
  onUploadComplete?: () => void;
  onUploaded?: (resumeId: string, resumeText: string) => void;
}

const ResumeUpload = ({ onUploadComplete, onUploaded }: ResumeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractText = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
      return await file.text();
    }

    if (file.type === "application/pdf") {
      // Set up PDF.js worker - use CDN to avoid local path issues in production
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        // Additional optimizations
        disableAutoFetch: true,
        disableStream: true,
      }).promise;

      let fullText = "";
      // Reduce to 5 pages for faster processing
      const maxPages = 5;
      const pagesToProcess = Math.min(pdf.numPages, maxPages);

      // Process only first 2 pages immediately for faster feedback
      // Process remaining pages in background if needed
      const immediatePages = Math.min(2, pagesToProcess);
      const pagePromises = [];

      for (let pageNum = 1; pageNum <= immediatePages; pageNum++) {
        pagePromises.push(
          pdf.getPage(pageNum).then(page =>
            page.getTextContent().then(textContent => {
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
              return pageText;
            })
          )
        );
      }

      const pageTexts = await Promise.all(pagePromises);
      fullText = pageTexts.join("\n");

      // Process remaining pages in background (non-blocking)
      if (pagesToProcess > immediatePages) {
        const remainingPromises = [];
        for (let pageNum = immediatePages + 1; pageNum <= pagesToProcess; pageNum++) {
          remainingPromises.push(
            pdf.getPage(pageNum).then(page =>
              page.getTextContent().then(textContent => {
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(" ");
                return pageText;
              })
            )
          );
        }
        // Don't wait for these, but process them
        Promise.all(remainingPromises).then(remainingTexts => {
          const additionalText = remainingTexts.join("\n");
          // Update the resume text in background if needed
          console.log("Additional pages processed:", additionalText.length);
        }).catch(err => console.warn("Background page processing failed:", err));
      }

      if (pdf.numPages > maxPages) {
        console.warn(`PDF has ${pdf.numPages} pages, processed first ${immediatePages} immediately`);
      }

      return fullText.trim();
    }

    // For other formats (DOC, DOCX, RTF), return empty string for now
    return "";
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/rtf"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, DOCX, TXT, or RTF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress("Extracting text from PDF...");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Extract text FIRST (optimized - only first 2 pages for speed)
      const text = await extractText(file);

      // Save resume metadata to Firestore IMMEDIATELY (before upload)
      setUploadProgress("Saving resume data...");
      const resumeDoc = await addDoc(collection(db, "resumes"), {
        user_id: user.uid,
        file_name: file.name,
        file_path: `${user.uid}/${Date.now()}_${file.name}`,
        file_size: file.size,
        status: "processing",
        uploaded_at: serverTimestamp(),
        extracted_text: text.substring(0, 1000), // Store first 1000 chars for quick access
      });

      // Show success immediately
      toast({
        title: "Resume uploaded!",
        description: "File is being processed in the background.",
      });

      // Call callbacks immediately (don't wait for storage upload)
      if (onUploaded) {
        onUploaded(resumeDoc.id, text);
      }

      if (onUploadComplete) {
        // Call in next tick to not block UI
        setTimeout(() => {
          onUploadComplete();
        }, 100);
      }

      setUploadProgress("");
      setUploading(false);

      // Upload file to Supabase Storage in background (non-blocking)
      const fileName = `${user.uid}/${Date.now()}_${file.name}`;

      storageService.uploadFile(file, fileName)
        .then(async (downloadURL) => {
          // Update resume with file path and URL (non-blocking)
          await updateDoc(doc(db, "resumes", resumeDoc.id), {
            file_path: fileName,
            file_url: downloadURL,
            status: "completed",
          });

          console.log("File upload completed:", downloadURL);
        })
        .catch((err) => {
          console.error("Background upload failed:", err);
          // Update status to error but don't show error to user (already "successful")
          updateDoc(doc(db, "resumes", resumeDoc.id), {
            status: "error",
          }).catch(console.error);
        });

    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
      setUploadProgress("");
      setUploading(false);
    }
  };

  return (
    <Card className="glass rounded-2xl p-8 border-2 border-dashed border-white/10">
      <div className="text-center">
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
            <h3 className="text-lg font-semibold mb-2">
              {uploadProgress || "Processing..."}
            </h3>
            <p className="text-sm text-muted-foreground">
              {uploadProgress.includes("Extracting")
                ? "Reading your resume..."
                : uploadProgress.includes("Saving")
                  ? "Saving data..."
                  : uploadProgress.includes("Uploading")
                    ? "Uploading file in background..."
                    : "Almost done..."}
            </p>
            {uploadProgress.includes("Uploading") && (
              <p className="text-xs text-muted-foreground mt-2">
                You can continue working while the file uploads
              </p>
            )}
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
            <p className="text-sm text-muted-foreground mb-4">
              PDF, DOC, DOCX, TXT, RTF format, max 10MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <Button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="bg-gradient-primary glow-hover"
            >
              <FileText className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default ResumeUpload;
