import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  limit,
  deleteDoc
} from "firebase/firestore";
import Header from "@/components/Layout/Header";
import ResumeUpload from "@/components/Resume/ResumeUpload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Target, BookOpen, Award, TrendingUp, Loader2, ChevronRight, Upload, Download, Mail, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { analyzeResumeText } from "@/utils/resumeAnalyzer";
import type { Resume, ResumeAnalysis } from "@/integrations/firebase/types";
import { CircularProgress } from "@/components/Animations/CircularProgress";
import { AnimatedScore } from "@/components/Animations/AnimatedScore";
import { JobRoleSelector } from "@/components/Candidate/JobRoleSelector";
import { SkillsBreakdown } from "@/components/Candidate/SkillsBreakdown";
import { SkillRecommendations } from "@/components/Candidate/SkillRecommendations";
import { ProjectRecommendations } from "@/components/Candidate/ProjectRecommendations";
import { FloatingShapes } from "@/components/Animations/FloatingShapes";
import { exportToPDF } from "@/utils/exportUtils";

const CandidateDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth("candidate");
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [uploadedResumeText, setUploadedResumeText] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [selectedJobRole, setSelectedJobRole] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [skipAnalysisFetch, setSkipAnalysisFetch] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch resumes for the current user
      // Try with orderBy first, fallback to without if index doesn't exist
      let resumesQuery;
      try {
        resumesQuery = query(
          collection(db, "resumes"),
          where("user_id", "==", user.uid),
          orderBy("uploaded_at", "desc"),
          limit(10)
        );
      } catch (indexError) {
        // If index doesn't exist, fetch without orderBy and sort in memory
        console.warn("Index not found, fetching without orderBy:", indexError);
        resumesQuery = query(
          collection(db, "resumes"),
          where("user_id", "==", user.uid),
          limit(10)
        );
      }

      const resumesSnapshot = await getDocs(resumesQuery);
      const resumesData: Resume[] = [];

      resumesSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        resumesData.push({
          id: doc.id,
          ...data,
          uploaded_at: data.uploaded_at?.toDate?.()?.toISOString() || data.uploaded_at || new Date().toISOString(),
        } as Resume);
      });

      // Sort by uploaded_at if we didn't use orderBy
      if (resumesData.length > 0) {
        resumesData.sort((a: Resume, b: Resume) => {
          const dateA = new Date(a.uploaded_at).getTime();
          const dateB = new Date(b.uploaded_at).getTime();
          return dateB - dateA; // Descending order (newest first)
        });

        setResumes(resumesData);

        // If skipAnalysisFetch is true, don't fetch analysis (user wants to upload new resume)
        if (skipAnalysisFetch) {
          setLatestAnalysis(null);
          setSkipAnalysisFetch(false); // Reset the flag
          return; // Exit early, don't fetch analysis
        }

        // Always fetch analysis for the LATEST (most recent) resume
        const latestResume = resumesData[0];

        // If we have an uploadedResumeId that matches a resume in the list, prioritize it
        // This ensures we show analysis for the newly uploaded resume, not an older one
        let resumeToAnalyze = latestResume;
        if (uploadedResumeId) {
          const uploadedResume = resumesData.find(r => r.id === uploadedResumeId);
          if (uploadedResume) {
            resumeToAnalyze = uploadedResume;
          } else {
            // If uploadedResumeId doesn't match any resume, use latest and update the state
            setUploadedResumeId(latestResume.id);
          }
        } else {
          // No uploadedResumeId set, use latest and set it
          setUploadedResumeId(latestResume.id);
        }

        const analysisQuery = query(
          collection(db, "resume_analysis"),
          where("resume_id", "==", resumeToAnalyze.id),
          limit(1)
        );

        try {
          const analysisSnapshot = await getDocs(analysisQuery);
          if (!analysisSnapshot.empty) {
            const analysisDoc = analysisSnapshot.docs[0];
            const analysisData = {
              id: analysisDoc.id,
              ...analysisDoc.data(),
              analyzed_at: analysisDoc.data().analyzed_at?.toDate?.()?.toISOString() || analysisDoc.data().analyzed_at || new Date().toISOString(),
            } as ResumeAnalysis;
            // CRITICAL: Only set analysis if it matches the resume we're working with
            // This ensures we don't show analysis for an old resume when a new one is uploaded
            if (analysisData.resume_id === resumeToAnalyze.id) {
              // Double-check: if we have an uploadedResumeId, only show analysis for that specific resume
              if (uploadedResumeId && analysisData.resume_id !== uploadedResumeId) {
                setLatestAnalysis(null);
              } else {
                setLatestAnalysis(analysisData);
              }
            } else {
              // Analysis doesn't match the resume we're working with - clear it
              setLatestAnalysis(null);
            }
          } else {
            // No analysis yet - clear it so user can upload and analyze
            setLatestAnalysis(null);
          }
        } catch (analysisError) {
          console.error("Error fetching analysis:", analysisError);
          setLatestAnalysis(null);
        }
      } else {
        setResumes([]);
        setLatestAnalysis(null);
        setUploadedResumeId(null);
        setUploadedResumeText(null);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      // If permission denied (likely due to mock user), just show empty state
      if (error.code === 'permission-denied' || error.message?.includes('Missing or insufficient permissions')) {
        setResumes([]);
        setLatestAnalysis(null);
        setLoading(false);
        return;
      }
      // If it's an index error, try without orderBy
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        try {
          const simpleQuery = query(
            collection(db, "resumes"),
            where("user_id", "==", user.uid),
            limit(10)
          );
          const snapshot = await getDocs(simpleQuery);
          const resumesData: Resume[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            resumesData.push({
              id: doc.id,
              ...data,
              uploaded_at: data.uploaded_at?.toDate?.()?.toISOString() || data.uploaded_at || new Date().toISOString(),
            } as Resume);
          });
          resumesData.sort((a, b) => {
            const dateA = new Date(a.uploaded_at).getTime();
            const dateB = new Date(b.uploaded_at).getTime();
            return dateB - dateA;
          });
          setResumes(resumesData);
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
          setResumes([]);
        }
      } else {
        setResumes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user is available
  useEffect(() => {
    if (user && !authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Only show loading if we have no data at all
  if (loading && resumes.length === 0 && !latestAnalysis && !uploadedResumeId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare data for components
  const matchedSkills = latestAnalysis?.extracted_skills?.map((skill, idx) => ({
    name: skill,
    proficiency: "Intermediate",
    matchPercentage: 85 + Math.floor(Math.random() * 15),
  })) || [];

  const missingSkills = latestAnalysis?.skill_gaps?.map((gap) => ({
    name: gap.skill,
    requiredLevel: "Advanced",
    priority: gap.importance === "high" ? "High" as const : gap.importance === "medium" ? "Medium" as const : "Low" as const,
  })) || [];

  // Define diverse learning platforms with all options for each skill
  const learningPlatforms = [
    { name: "Udemy", url: "https://www.udemy.com/courses/search/?q=", color: "bg-purple-600" },
    { name: "Coursera", url: "https://www.coursera.org/search?query=", color: "bg-blue-600" },
    { name: "Pluralsight", url: "https://www.pluralsight.com/search?q=", color: "bg-pink-600" },
    { name: "LinkedIn", url: "https://www.linkedin.com/learning/search?keywords=", color: "bg-blue-700" },
    { name: "edX", url: "https://www.edx.org/search?q=", color: "bg-blue-500" },
    { name: "Codecademy", url: "https://www.codecademy.com/search?query=", color: "bg-indigo-600" },
    { name: "FreeCodeCamp", url: "https://www.freecodecamp.org/news/search/?query=", color: "bg-green-600" },
    { name: "YouTube", url: "https://www.youtube.com/results?search_query=", color: "bg-red-600" },
  ];

  const skillRecommendations = latestAnalysis?.skill_gaps?.slice(0, 5).map((gap) => {
    // Generate all platform resources for this skill
    const platformResources = learningPlatforms.map(platform => ({
      name: platform.name,
      url: `${platform.url}${gap.skill}`,
      type: "Course" as const,
      color: platform.color
    }));

    return {
      skill: gap.skill,
      trend: "Hot" as const,
      resources: [
        ...platformResources,
        { name: "Documentation", url: `https://www.google.com/search?q=${gap.skill}+documentation`, type: "Documentation" as const, color: "bg-gray-600" },
      ],
      category: gap.importance === "high" ? "Must-have" as const : "Nice-to-have" as const,
    };
  }) || [];

  const projectRecommendations = latestAnalysis?.project_suggestions?.map((project) => ({
    title: project.title,
    description: project.description,
    skills: project.skills || [],
    difficulty: "Intermediate" as const,
    estimatedTime: "2-4 weeks",
    impactScore: 75 + Math.floor(Math.random() * 20),
    resources: [
      { name: "Tutorial", url: "https://www.youtube.com/results?search_query=" },
    ],
  })) || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingShapes count={3} />
      <Header />

      <main className="container mx-auto px-4 py-8 pt-28 relative z-10">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2">
              <span className="gradient-text">Candidate Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">Track your skills, get insights, and grow your career</p>
          </div>
          <Button variant="outline" onClick={signOut} className="glass">Sign Out</Button>
        </div>

        {!latestAnalysis ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 mt-2">
              <ResumeUpload
                onUploadComplete={async () => {
                  // Clear previous state immediately
                  setLatestAnalysis(null);
                  setJobDescription("");
                  // Wait a bit for Firestore to be ready, then fetch fresh data
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  await fetchData();
                }}
                onUploaded={(id, text) => {
                  // IMPORTANT: Clear old analysis immediately when new resume is uploaded
                  // This ensures the UI shows the upload form, not old analysis
                  setLatestAnalysis(null);
                  setUploadedResumeId(id);
                  setUploadedResumeText(text);
                  setJobDescription(""); // Clear job description for new resume
                }}
              />

              {resumes.length > 0 && (
                <Card className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Resume History</h3>
                  </div>
                  {uploadedResumeId && (
                    <div className="mb-4 flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                        onClick={async () => {
                          if (!confirm("Are you sure you want to delete this resume?")) return;
                          try {
                            await deleteDoc(doc(db, "resumes", uploadedResumeId));
                            setResumes(prev => prev.filter(r => r.id !== uploadedResumeId));
                            setUploadedResumeId(null);
                            setUploadedResumeText(null);
                            setLatestAnalysis(null);
                            toast({ title: "Resume deleted" });
                          } catch (e) {
                            console.error(e);
                            toast({ title: "Delete failed", variant: "destructive" });
                          }
                        }}
                      >
                        Delete Selected
                      </Button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-4">Select a previously uploaded resume to analyze</p>
                  <Select
                    value={uploadedResumeId || ""}
                    onValueChange={async (value) => {
                      const selectedResume = resumes.find(r => r.id === value);
                      if (selectedResume) {
                        setUploadedResumeId(value);
                        // Fetch text if not available (simplified for now, ideally fetch from storage)
                        setUploadedResumeText(selectedResume.extracted_text || `Resume: ${selectedResume.file_name}`);

                        // Check if analysis exists for this resume
                        const analysisQuery = query(
                          collection(db, "resume_analysis"),
                          where("resume_id", "==", value),
                          limit(1)
                        );
                        const snapshot = await getDocs(analysisQuery);
                        if (!snapshot.empty) {
                          const data = snapshot.docs[0].data();
                          setLatestAnalysis({
                            id: snapshot.docs[0].id,
                            ...data,
                            analyzed_at: data.analyzed_at?.toDate?.()?.toISOString() || new Date().toISOString(),
                          } as ResumeAnalysis);
                        } else {
                          setLatestAnalysis(null);
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resume" />
                    </SelectTrigger>
                    <SelectContent>
                      {resumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.file_name} ({new Date(resume.uploaded_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>
              )}

              <Card className="bg-black/30 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Job Role Selection</h3>
                <p className="text-sm text-white/70 mb-4">Select a job role or paste a custom job description</p>
                <div className="mb-4">
                  <JobRoleSelector
                    value={selectedJobRole}
                    onValueChange={setSelectedJobRole}
                  />
                </div>
                <div className="mb-4">
                  <p className="text-sm text-white/70 mb-2">Or paste custom Job Description:</p>
                  <Textarea
                    className="w-full min-h-[180px] p-3 border rounded-md bg-black/50 text-white border-blue-600/30 focus:border-emerald-500 placeholder:text-white/40"
                    placeholder="Example: We're looking for a React developer with 3+ years experience, strong TypeScript, testing, and API integration skills..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    maxLength={8000}
                  />
                  <div className="mt-2 text-xs text-white/60">
                    {jobDescription.length}/8000 characters
                  </div>
                </div>
                <Button
                  onClick={async () => {
                    if (!uploadedResumeId || !uploadedResumeText) {
                      toast({ title: "Upload your resume first", description: "Please upload a resume before analyzing.", variant: "destructive" });
                      return;
                    }
                    if (!jobDescription.trim() && !selectedJobRole) {
                      toast({ title: "Job description required", description: "Select a role or paste a job description to analyze the match.", variant: "destructive" });
                      return;
                    }
                    setAnalyzing(true);
                    try {
                      // Use client-side analysis (can be replaced with Cloud Function later)
                      const jdText = jobDescription || selectedJobRole || `Looking for ${selectedJobRole} with relevant experience and skills.`;
                      const analysis = await analyzeResumeText(uploadedResumeText!, jdText);

                      // Save to Firestore
                      await addDoc(collection(db, "resume_analysis"), {
                        resume_id: uploadedResumeId,
                        ...analysis,
                        analyzed_at: new Date(),
                      });

                      // Update resume status
                      await updateDoc(doc(db, "resumes", uploadedResumeId), {
                        status: "completed",
                      });

                      toast({ title: "Analysis complete", description: "Your insights are ready!" });
                      // Refresh data to show the new analysis
                      await fetchData();
                    } catch (e: any) {
                      console.error(e);
                      toast({ title: "Analysis failed", description: e?.message || "Please try again later.", variant: "destructive" });
                    } finally {
                      setAnalyzing(false);
                    }
                  }}
                  disabled={!uploadedResumeId || !uploadedResumeText || (!jobDescription.trim() && !selectedJobRole) || analyzing}
                  className="w-full bg-gradient-primary glow-hover"
                >
                  {analyzing ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...
                    </span>
                  ) : (
                    "Analyze Match"
                  )}
                </Button>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
              <Card className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Skill Gap Analysis</h3>
                <p className="text-sm text-muted-foreground">Upload resume to see missing skills</p>
              </Card>

              <Card className="p-6">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Learning Paths</h3>
                <p className="text-sm text-muted-foreground">Get personalized course recommendations</p>
              </Card>

              <Card className="p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Project Ideas</h3>
                <p className="text-sm text-muted-foreground">Build portfolio projects</p>
              </Card>

              <Card className="p-6">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Resume Score</h3>
                <p className="text-sm text-muted-foreground">ATS optimization insights</p>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  // Clear all state to allow uploading a new resume
                  setLatestAnalysis(null);
                  setUploadedResumeId(null);
                  setUploadedResumeText(null);
                  setJobDescription("");
                  // Set flag to skip analysis fetching
                  setSkipAnalysisFetch(true);
                  // Refresh to get latest resume list (but skip analysis)
                  fetchData();
                }}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload New Resume
              </Button>
            </div>
            {/* Match Score Dashboard */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <Card className="glass rounded-2xl p-8 flex flex-col items-center justify-center">
                <CircularProgress score={latestAnalysis.match_score} size={200} />
                <div className="mt-6 text-center">
                  <h3 className="text-lg font-bold text-foreground mb-2">Overall Match Score</h3>
                  <p className="text-sm text-muted-foreground">
                    {latestAnalysis.match_score >= 80
                      ? "Excellent match! You're well-qualified."
                      : latestAnalysis.match_score >= 60
                        ? "Good match. Consider improving a few skills."
                        : "Fair match. Focus on missing skills."}
                  </p>
                </div>
              </Card>

              <Card className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">ATS Score</h3>
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <AnimatedScore score={latestAnalysis.ats_score} size="lg" label="ATS Score" />
                <div className="mt-4 text-sm text-muted-foreground">
                  {latestAnalysis.ats_score >= 80
                    ? "Your resume is ATS-friendly"
                    : "Optimize keywords for better ATS parsing"}
                </div>

                {/* ATS Breakdown */}
                {latestAnalysis.ats_breakdown && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Skills (40%)</span>
                      <span className="font-bold">{latestAnalysis.ats_breakdown.skill_match_score}/40</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Keywords (25%)</span>
                      <span className="font-bold">{latestAnalysis.ats_breakdown.keyword_match_score}/25</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Experience (15%)</span>
                      <span className="font-bold">{latestAnalysis.ats_breakdown.experience_match_score}/15</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Education (10%)</span>
                      <span className="font-bold">{latestAnalysis.ats_breakdown.education_match_score}/10</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Format (10%)</span>
                      <span className="font-bold">{latestAnalysis.ats_breakdown.formatting_score}/10</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Experience</h3>
                  <Target className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-5xl font-black mb-2 gradient-text">
                  {latestAnalysis.experience_years}
                </div>
                <p className="text-sm text-muted-foreground mb-4">Years of Experience</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="secondary">{latestAnalysis.education_level}</Badge>
                  <span className="text-muted-foreground">Education Level</span>
                </div>
              </Card>
            </div>

            {/* Skills Breakdown */}
            <div className="mb-8">
              <SkillsBreakdown
                matchedSkills={matchedSkills}
                missingSkills={missingSkills}
              />
            </div>

            {/* Recommendations Section */}
            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <SkillRecommendations
                recommendations={skillRecommendations}
                jobRole={selectedJobRole}
              />
              <ProjectRecommendations projects={projectRecommendations} />
            </div>

            {/* Action Items & Export */}
            <Card className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Action Items & Next Steps</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="glass"
                    size="sm"
                    onClick={() => {
                      if (!latestAnalysis) return;
                      const reportContent = `
                        <h1>Resume Analysis Report</h1>
                        <h2>Match Score: ${latestAnalysis.match_score}%</h2>
                        <h2>ATS Score: ${latestAnalysis.ats_score}/100</h2>
                        <h3>Experience: ${latestAnalysis.experience_years} years</h3>
                        <h3>Education: ${latestAnalysis.education_level}</h3>
                        <h3>Skills:</h3>
                        <ul>
                          ${latestAnalysis.extracted_skills?.map(s => `<li>${s}</li>`).join("") || ""}
                        </ul>
                        <h3>Missing Skills:</h3>
                        <ul>
                          ${latestAnalysis.skill_gaps?.map(g => `<li>${g.skill} (${g.importance})</li>`).join("") || ""}
                        </ul>
                      `;
                      exportToPDF(reportContent, `resume_report_${new Date().toISOString().split('T')[0]}.pdf`);
                      toast({ title: "Report generated", description: "Opening print dialog" });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="glass"
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Email feature",
                        description: "Email functionality would be implemented with backend integration"
                      });
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Report
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Focus on Missing Skills</h4>
                    <p className="text-sm text-muted-foreground">
                      Prioritize learning {missingSkills.slice(0, 3).map(s => s.name).join(", ")} to improve your match score.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Complete Recommended Projects</h4>
                    <p className="text-sm text-muted-foreground">
                      Build portfolio projects to demonstrate your skills and close skill gaps.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Enroll in Trending Courses</h4>
                    <p className="text-sm text-muted-foreground">
                      Take courses on trending skills to stay competitive in the job market.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;
