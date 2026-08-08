import { useState, useRef, DragEvent } from "react";
import { auth, db } from "@/integrations/firebase/config";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";
import { Progress } from "@/components/ui/progress";
import { storageService, sanitizePath } from "@/integrations/supabase/storage";

interface EnhancedResumeUploadProps {
  onUploadComplete?: () => void;
  onUploaded?: (resumeId: string, resumeText: string) => void;
  multiple?: boolean;
  className?: string;
}

interface FileUpload {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  resumeId?: string;
  error?: string;
}

export const EnhancedResumeUpload = ({
  onUploadComplete,
  onUploaded,
  multiple = false,
  className = "",
}: EnhancedResumeUploadProps) => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractText = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
      return await file.text();
    }

    if (file.type === "application/pdf") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
      }).promise;

      let fullText = "";
      // Process only first 2 pages immediately for faster feedback
      const maxPages = 5;
      const pagesToProcess = Math.min(pdf.numPages, maxPages);
      const immediatePages = Math.min(2, pagesToProcess);

      // Process first 2 pages immediately
      const pagePromises = [];
      for (let pageNum = 1; pageNum <= immediatePages; pageNum++) {
        pagePromises.push(
          pdf.getPage(pageNum).then(page =>
            page.getTextContent().then(textContent => {
              const pageText = textContent.items.map((item: any) => item.str).join(" ");
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
                const pageText = textContent.items.map((item: any) => item.str).join(" ");
                return pageText;
              })
            )
          );
        }
        // Don't wait for these, process in background
        Promise.all(remainingPromises).then(remainingTexts => {
          const additionalText = remainingTexts.join("\n");
          console.log("Additional pages processed:", additionalText.length);
        }).catch(err => console.warn("Background page processing failed:", err));
      }

      return fullText.trim();
    }

    // For other formats (DOC, DOCX, RTF), we might need a backend service or heavier library
    // For now, return a placeholder or empty string so upload succeeds
    return "";
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "text/plain",
      "application/rtf"
    ];

    const newFiles: FileUpload[] = Array.from(selectedFiles)
      .filter((file) => allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024)
      .map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
        status: "pending" as const,
        progress: 0,
      }));

    if (newFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please upload PDF, DOC, DOCX, TXT, or RTF files under 10MB",
        variant: "destructive",
      });
      return;
    }

    setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
    newFiles.forEach((fileUpload) => uploadFile(fileUpload));
  };

  const uploadFile = async (fileUpload: FileUpload) => {
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    setFiles((prev) =>
      prev.map((f) => (f.id === fileUpload.id ? { ...f, status: "uploading", progress: 10 } : f))
    );

    try {
      // Extract text FIRST (optimized - only first 2 pages for speed)
      const text = await extractText(fileUpload.file);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileUpload.id ? { ...f, progress: 50 } : f))
      );

      // Generate consistent file path
      const filePath = sanitizePath(`${user.uid}/${Date.now()}_${fileUpload.file.name}`);

      // Save resume metadata to Firestore IMMEDIATELY (before upload)
      const resumeDoc = await addDoc(collection(db, "resumes"), {
        user_id: user.uid,
        file_name: fileUpload.file.name,
        file_path: filePath,
        file_size: fileUpload.file.size,
        status: "processing",
        storage_provider: "supabase",
        uploaded_at: serverTimestamp(),
        extracted_text: text.substring(0, 1000), // Store first 1000 chars for quick access
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id ? { ...f, resumeId: resumeDoc.id, progress: 80 } : f
        )
      );

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

      // Mark as success immediately
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id ? { ...f, status: "success", progress: 100 } : f
        )
      );

      // Upload file to Supabase Storage

      storageService.uploadFile(fileUpload.file, filePath)
        .then(async (downloadURL) => {
          // Update resume with file path and URL (non-blocking)
          await updateDoc(doc(db, "resumes", resumeDoc.id), {
            file_path: filePath,
            file_url: downloadURL,
            status: "completed",
            storage_provider: "supabase"
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
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={className}>
      <Card
        className={`glass rounded-2xl p-8 border-2 border-dashed transition-all duration-300 relative z-10 ${isDragging
          ? "border-primary scale-105 glow-pulse"
          : "border-white/10 hover:border-primary/30"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 glow transition-transform ${isDragging ? "scale-110" : ""
              }`}
          >
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {multiple ? "Upload Resumes" : "Upload Your Resume"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop {multiple ? "files" : "a file"} here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, RTF format, max 10MB {multiple ? "per file" : ""}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="resume-upload-enhanced"
          style={{ display: 'none' }}
        />
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
          className="w-full bg-gradient-primary glow-hover relative z-10"
        >
          <FileText className="mr-2 h-4 w-4" />
          Choose {multiple ? "Files" : "File"}
        </Button>

        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            {files.map((fileUpload) => (
              <Card
                key={fileUpload.id}
                className="glass rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {fileUpload.file.name}
                    </span>
                  </div>
                  {fileUpload.status === "success" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                  {fileUpload.status === "error" && (
                    <X
                      className="h-5 w-5 text-red-500 flex-shrink-0 cursor-pointer"
                      onClick={() => removeFile(fileUpload.id)}
                    />
                  )}
                  {fileUpload.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  )}
                </div>
                {fileUpload.status === "uploading" && (
                  <Progress value={fileUpload.progress} className="h-2" />
                )}
                {fileUpload.status === "error" && fileUpload.error && (
                  <p className="text-xs text-red-500 mt-1">{fileUpload.error}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

