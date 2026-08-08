
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/integrations/firebase/config";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  doc,
  updateDoc,
  getDoc,
  where,
  deleteDoc
} from "firebase/firestore";
import Header from "@/components/Layout/Header";
import { EnhancedResumeUpload } from "@/components/Resume/EnhancedResumeUpload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Upload, FileText, TrendingUp, Users, Loader2, CheckCircle2, Clock, Search, Download, Filter, X, BarChart3, Sparkles, Eye, UserPlus, UserMinus, Star, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Resume } from "@/integrations/firebase/types";
import { CandidateCard } from "@/components/HR/CandidateCard";
import { CandidateComparison } from "@/components/HR/CandidateComparison";
import { FloatingShapes } from "@/components/Animations/FloatingShapes";
import { exportToCSV, generateCandidateReport } from "@/utils/exportUtils";
import { analyzeResumeText } from "@/utils/resumeAnalyzer";

interface ResumeWithAnalysis extends Omit<Resume, 'status'> {
  matchScore?: number;
  candidateName?: string;
  status?: "pending" | "processing" | "completed" | "error" | "analyzed";
  matching_skills?: string[];
  missing_skills?: string[];
  extra_skills?: string[];
  ats_breakdown?: {
    skill_match_score: number;
    keyword_match_score: number;
    experience_match_score: number;
    education_match_score: number;
    formatting_score: number;
    final_ats_score: number;
  };
}

const HRDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth("recruiter");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [resumes, setResumes] = useState<ResumeWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    avgMatchScore: 0,
    pending: 0
  });
  const [jobDescription, setJobDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [topCandidatesCount, setTopCandidatesCount] = useState(10);
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("score");
  const [matchScoreRange, setMatchScoreRange] = useState([0, 100]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  // Track when the session started to only show new uploads
  const [sessionStartTime] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchResumes(true);
    }
  }, [user, authLoading]);

  const fetchResumes = async (initialLoad = false) => {
    if (!user) return;

    if (initialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      // Try with orderBy first, fallback if index doesn't exist
      let resumesData: ResumeWithAnalysis[] = [];
      let useOrderBy = true;

      try {
        const resumesQuery = query(
          collection(db, "resumes"),
          where("uploaded_at", ">=", sessionStartTime),
          orderBy("uploaded_at", "desc"),
          limit(30)
        );

        const snapshot = await getDocs(resumesQuery);
        snapshot.forEach((doc) => {
          const data = doc.data();
          resumesData.push({
            id: doc.id,
            ...data,
            uploaded_at: data.uploaded_at?.toDate?.()?.toISOString() || data.uploaded_at || new Date().toISOString(),
            status: data.status || "pending",
            matchScore: data.match_score || data.matchScore || 0,
            matching_skills: data.matching_skills || [],
            missing_skills: data.missing_skills || [],
            extra_skills: data.extra_skills || [],
          } as ResumeWithAnalysis);
        });
      } catch (indexError: any) {
        // If index doesn't exist, use fallback query
        if (indexError.code === 'failed-precondition' || indexError.message?.includes('index') || indexError.code === 9) {
          console.warn("Index not found, using fallback query:", indexError);
          useOrderBy = false;

          const fallbackQuery = query(
            collection(db, "resumes"),
            limit(50) // Get more to sort in memory
          );

          const snapshot = await getDocs(fallbackQuery);
          snapshot.forEach((doc) => {
            const data = doc.data();
            resumesData.push({
              id: doc.id,
              ...data,
              uploaded_at: data.uploaded_at?.toDate?.()?.toISOString() || data.uploaded_at || new Date().toISOString(),
              status: data.status || "pending",
              matchScore: data.match_score || data.matchScore || 0,
              matching_skills: data.matching_skills || [],
              missing_skills: data.missing_skills || [],
              extra_skills: data.extra_skills || [],
            } as ResumeWithAnalysis);
          });

          // Filter by session start time in memory for fallback
          resumesData = resumesData.filter(r => {
            const uploadedAt = new Date(r.uploaded_at);
            return uploadedAt >= sessionStartTime;
          });

          // Sort in memory
          if (resumesData.length > 0) {
            resumesData.sort((a, b) => {
              const dateA = new Date(a.uploaded_at).getTime();
              const dateB = new Date(b.uploaded_at).getTime();
              return dateB - dateA; // Descending order
            });
            // Limit to 30 after sorting
            resumesData = resumesData.slice(0, 30);
          }
        } else {
          throw indexError;
        }
      }

      // Sort by match score if analyzed, otherwise by date
      if (analyzed) {
        resumesData.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      } else {
        resumesData.sort((a, b) => {
          const dateA = new Date(a.uploaded_at).getTime();
          const dateB = new Date(b.uploaded_at).getTime();
          return dateB - dateA;
        });
      }

      setResumes(resumesData);

      // Calculate stats efficiently
      const total = resumesData.length;
      const shortlisted = 0; // Will be updated when HR manually shortlists candidates
      const avgMatchScore = resumesData.length > 0
        ? Math.round(resumesData.reduce((sum, r) => sum + (r.matchScore || 0), 0) / resumesData.length)
        : 0;
      const pending = resumesData.length; // All resumes start as pending review, decreases as HR views them

      setStats({ total, shortlisted, avgMatchScore, pending });
    } catch (error: any) {
      console.error("Error fetching resumes:", error);

      // Try simple fallback query
      try {
        const fallbackQuery = query(
          collection(db, "resumes"),
          limit(50)
        );
        const snapshot = await getDocs(fallbackQuery);
        const resumesData: ResumeWithAnalysis[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          resumesData.push({
            id: doc.id,
            ...data,
            uploaded_at: data.uploaded_at?.toDate?.()?.toISOString() || data.uploaded_at || new Date().toISOString(),
            status: data.status || "pending",
            matchScore: data.match_score || data.matchScore || 0,
            matching_skills: data.matching_skills || [],
            missing_skills: data.missing_skills || [],
            extra_skills: data.extra_skills || [],
          } as ResumeWithAnalysis);
        });

        // Sort and limit
        resumesData.sort((a, b) => {
          const dateA = new Date(a.uploaded_at).getTime();
          const dateB = new Date(b.uploaded_at).getTime();
          return dateB - dateA;
        });
        resumesData.splice(30);

        setResumes(resumesData);
        setStats({
          total: resumesData.length,
          shortlisted: resumesData.filter(r => r.status === "completed" && (r.matchScore || 0) >= 70).length,
          avgMatchScore: resumesData.length > 0
            ? Math.round(resumesData.reduce((sum, r) => sum + (r.matchScore || 0), 0) / resumesData.length)
            : 0,
          pending: resumesData.filter(r => r.status === "processing" || r.status === "pending").length
        });
      } catch (fallbackError: any) {
        console.error("Fallback query also failed:", fallbackError);
        const errorMessage = fallbackError.message || error.message || "Failed to load resumes";
        toast({
          title: "Error Loading Resumes",
          description: `${errorMessage}. Please check your Firestore security rules and indexes.`,
          variant: "destructive",
        });
        setResumes([]);
        setStats({ total: 0, shortlisted: 0, avgMatchScore: 0, pending: 0 });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (authLoading || (loading && resumes.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredResumes = resumes
    .filter(resume => {
      const matchesSearch =
        resume.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resume.matchScore !== undefined && resume.matchScore.toString().includes(searchTerm));
      const matchesScore =
        (resume.matchScore || 0) >= matchScoreRange[0] &&
        (resume.matchScore || 0) <= matchScoreRange[1];
      return matchesSearch && matchesScore;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return (b.matchScore || 0) - (a.matchScore || 0);
      } else if (sortBy === "date") {
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      } else {
        return (a.file_name || "").localeCompare(b.file_name || "");
      }
    })
    .slice(0, topCandidatesCount);

  const handleAnalyzeResumes = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description before analyzing resumes",
        variant: "destructive",
      });
      return;
    }

    if (resumes.length === 0) {
      toast({
        title: "No resumes found",
        description: "Please upload resumes before analyzing",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const updatedResumes: ResumeWithAnalysis[] = [];

      // Update local state to processing immediately
      setResumes(prev => prev.map(r => ({ ...r, status: "processing" })));

      // Analyze each resume
      for (const resume of resumes) {
        try {
          // Get the full resume text from Firestore
          const resumeDoc = await getDoc(doc(db, "resumes", resume.id));
          const resumeData = resumeDoc.data();

          // Get extracted text - it's stored in the resume document
          // Note: We store first 1000 chars in extracted_text, but for better analysis
          // we should ideally fetch the full text from storage. For now, use what we have.
          let resumeText = resumeData?.extracted_text || "";

          // If no extracted text in document, use what we have
          // Note: In production, you might want to fetch full text from storage
          if (!resumeText || resumeText.length < 50) {
            resumeText = `Resume: ${resume.file_name || "candidate"} `;
          }

          // Analyze resume against job description
          const analysis = await analyzeResumeText(resumeText, jobDescription);

          // Update resume with match score and status
          await updateDoc(doc(db, "resumes", resume.id), {
            match_score: analysis.match_score,
            analyzed_at: new Date(),
            status: "analyzed",
            matching_skills: analysis.matching_skills,
            missing_skills: analysis.missing_skills,
            extra_skills: analysis.extra_skills,
            ats_breakdown: analysis.ats_breakdown,
          });

          updatedResumes.push({
            ...resume,
            matchScore: analysis.match_score,
            matching_skills: analysis.matching_skills,
            missing_skills: analysis.missing_skills,
            extra_skills: analysis.extra_skills,
            status: "analyzed",
          });
        } catch (error: any) {
          console.error(`Error analyzing resume ${resume.id}: `, error);
          // Continue with other resumes even if one fails
          updatedResumes.push({
            ...resume,
            matchScore: 0,
          });
        }
      }

      // Sort by match score (highest first) and update state
      updatedResumes.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setResumes(updatedResumes);
      setAnalyzed(true);
      setSortBy("score"); // Set sort to score

      // Update stats
      const total = updatedResumes.length;
      const shortlisted = updatedResumes.filter(r => (r.matchScore || 0) >= 70).length;
      const avgMatchScore = updatedResumes.length > 0
        ? Math.round(updatedResumes.reduce((sum, r) => sum + (r.matchScore || 0), 0) / updatedResumes.length)
        : 0;

      setStats({
        total,
        shortlisted,
        avgMatchScore,
        pending: 0,
      });

      toast({
        title: "Analysis complete!",
        description: `Analyzed ${updatedResumes.length} resumes.Top match: ${updatedResumes[0]?.matchScore || 0}% `,
      });
    } catch (error: any) {
      console.error("Error analyzing resumes:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze resumes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShortlist = (id: string) => {
    const newShortlisted = new Set(shortlistedIds);
    if (newShortlisted.has(id)) {
      newShortlisted.delete(id);
    } else {
      newShortlisted.add(id);
    }
    setShortlistedIds(newShortlisted);

    // Update stats to reflect new shortlist count
    setStats(prev => ({
      ...prev,
      shortlisted: newShortlisted.size
    }));

    toast({
      title: newShortlisted.has(id) ? "Candidate shortlisted" : "Removed from shortlist",
    });
  };

  const handleCompare = (id: string) => {
    if (selectedCandidates.includes(id)) {
      setSelectedCandidates(selectedCandidates.filter(c => c !== id));
    } else if (selectedCandidates.length < 4) {
      setSelectedCandidates([...selectedCandidates, id]);
    } else {
      toast({
        title: "Maximum 4 candidates",
        description: "You can compare up to 4 candidates at once",
        variant: "destructive",
      });
    }
  };

  const candidatesForComparison = filteredResumes
    .filter(r => selectedCandidates.includes(r.id))
    .map(r => ({
      id: r.id,
      name: r.file_name || "Unknown",
      matchScore: r.matchScore || 0,
      skillsMatched: 8,
      totalSkills: 12,
      matchedSkills: ["React", "TypeScript", "Node.js", "AWS"],
      missingSkills: ["Docker", "Kubernetes"],
      experience: "5+ years",
      education: "BS in CS",
    }));

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "resumes", id));
      setResumes(prev => prev.filter(r => r.id !== id));
      toast({ title: "Resume deleted", description: "The resume has been permanently removed." });
      if (selectedResumeId === id) setSelectedResumeId(null);
    } catch (error: any) {
      console.error("Error deleting resume:", error);
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingShapes count={3} />
      <Header />

      <main className="container mx-auto px-4 py-8 pt-28 relative z-20">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">HR Dashboard</span>
            </h1>
            <p className="text-white/70 text-lg">Manage candidates and streamline your recruitment process</p>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            <Button variant="outline" onClick={signOut} className="bg-black/30 border-blue-600/30 text-white hover:bg-blue-900/20">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-black/30 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Total Resumes</p>
                <p className="text-3xl font-black text-white">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-black/30 backdrop-blur-sm border border-emerald-600/30 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Shortlisted</p>
                <p className="text-3xl font-black text-white">{stats.shortlisted}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-black/30 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Avg Match Score</p>
                <p className="text-3xl font-black text-white">{stats.avgMatchScore}%</p>
              </div>
            </div>
          </Card>

          <Card className="bg-black/30 backdrop-blur-sm border border-emerald-600/30 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Pending Review</p>
                <p className="text-3xl font-black text-white">{stats.pending}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8 relative z-20">
          <Card className="glass rounded-2xl p-8 relative z-20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 glow">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Bulk Upload Resumes</h2>
              <p className="text-muted-foreground">
                Upload multiple candidate resumes for AI-powered analysis and ranking
              </p>
            </div>
            <EnhancedResumeUpload
              multiple={true}
              onUploadComplete={() => {
                setTimeout(() => fetchResumes(false), 1000);
              }}
            />
          </Card>

          <Card className="glass rounded-2xl p-8 relative z-10">
            <div className="mb-6">
              <Label htmlFor="job-desc" className="text-lg font-semibold mb-2 block">
                Job Description
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Add a job description to match candidates against specific requirements
              </p>
              <Textarea
                id="job-desc"
                placeholder="Enter job description, requirements, and qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px] bg-background/50 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 relative z-10"
                maxLength={5000}
                disabled={false}
                style={{ pointerEvents: 'auto' }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {jobDescription.length}/5000 characters
              </p>
            </div>
            <Button
              type="button"
              onClick={handleAnalyzeResumes}
              className="w-full bg-gradient-primary glow-hover relative z-10"
              disabled={!jobDescription.trim() || resumes.length === 0 || analyzing}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resumes...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Resumes
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Filters and Controls */}
        {resumes.length > 0 && (
          <Card className="glass rounded-2xl p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search resumes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background/50 border border-white/10 focus:border-primary focus:outline-none"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[180px] glass">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Match Score</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Top:</Label>
                  <Select value={topCandidatesCount.toString()} onValueChange={(v) => setTopCandidatesCount(parseInt(v))}>
                    <SelectTrigger className="w-[100px] glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary" className="px-4 py-2">
                  {filteredResumes.length} {filteredResumes.length === 1 ? 'result' : 'results'}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm min-w-[100px]">Match Score:</Label>
                <div className="flex-1">
                  <Slider
                    value={matchScoreRange}
                    onValueChange={setMatchScoreRange}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="text-sm text-muted-foreground min-w-[80px]">
                  {matchScoreRange[0]}% - {matchScoreRange[1]}%
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Candidate Comparison */}
        {selectedCandidates.length > 0 && (
          <div className="mb-8">
            <CandidateComparison
              candidates={candidatesForComparison}
              onRemove={(id) => setSelectedCandidates(selectedCandidates.filter(c => c !== id))}
              onClear={() => setSelectedCandidates([])}
            />
          </div>
        )}

        {/* Candidates Grid/List */}
        <Card className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">Top Candidates</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="glass"
                onClick={() => {
                  const reportData = generateCandidateReport(
                    filteredResumes.map(r => ({
                      fileName: r.file_name || "Unknown",
                      matchScore: r.matchScore || 0,
                      skillsMatched: 8,
                      totalSkills: 12,
                      experience: "5+ years",
                      education: "BS in CS",
                      status: r.status,
                    }))
                  );
                  exportToCSV(reportData, `candidates_${new Date().toISOString().split('T')[0]}.csv`);
                  toast({ title: "Export successful", description: "CSV file downloaded" });
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" className="glass" onClick={() => setShowAnalytics(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>

          {filteredResumes.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg text-muted-foreground mb-2">
                {resumes.length === 0
                  ? "No resumes uploaded yet. Start by uploading your first batch!"
                  : "No resumes match your search."}
              </p>
              {resumes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Upload resumes to see AI-powered analysis and candidate rankings
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    {analyzed && <TableHead className="w-[80px]">Rank</TableHead>}
                    <TableHead>Candidate Name</TableHead>
                    {analyzed && <TableHead>Match Score</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResumes.map((resume, index) => (
                    <TableRow key={resume.id} className="border-white/10 hover:bg-white/5">
                      {analyzed && (
                        <TableCell className="font-medium">
                          <div className={`w - 8 h - 8 rounded - full flex items - center justify - center text - xs font - bold ${index === 0
                            ? "bg-yellow-500/20 text-yellow-500"
                            : index === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : index === 2
                                ? "bg-orange-500/20 text-orange-500"
                                : "bg-primary/20 text-primary"
                            } `}>
                            #{index + 1}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{resume.file_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      {analyzed && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full max-w-[100px] h-2 bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className={`h - full rounded - full ${(resume.matchScore || 0) >= 70 ? 'bg-green-500' :
                                  (resume.matchScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  } `}
                                style={{ width: `${resume.matchScore || 0}% ` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{resume.matchScore || 0}%</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${resume.status === 'analyzed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            resume.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }
`}>
                          {resume.status === 'analyzed' ? 'Analyzed' :
                            resume.status === 'processing' ? 'Processing' :
                              'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(resume.uploaded_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/20 hover:text-primary"
                            onClick={() => setSelectedResumeId(resume.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h - 8 w - 8 ${shortlistedIds.has(resume.id) ? 'text-green-500 bg-green-500/10' : 'hover:bg-green-500/20 hover:text-green-500'} `}
                            onClick={() => handleShortlist(resume.id)}
                          >
                            {shortlistedIds.has(resume.id) ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
                            onClick={() => handleDeleteResume(resume.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowAnalytics(false)}>
            <Card className="glass w-full max-w-3xl max-h-[80vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-background/95 backdrop-blur p-4 border-b border-white/10 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold gradient-text">Analytics Dashboard</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAnalytics(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-4 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Resumes</p>
                    <p className="text-3xl font-black">{stats.total}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Shortlisted</p>
                    <p className="text-3xl font-black text-green-500">{stats.shortlisted}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                    <p className="text-3xl font-black text-primary">{stats.avgMatchScore}%</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-3xl font-black text-yellow-500">{stats.pending}</p>
                  </div>
                </div>

                {/* Match Score Distribution */}
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Match Score Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { range: '90-100%', count: resumes.filter(r => (r.matchScore || 0) >= 90).length, color: 'bg-green-500' },
                      { range: '70-89%', count: resumes.filter(r => (r.matchScore || 0) >= 70 && (r.matchScore || 0) < 90).length, color: 'bg-blue-500' },
                      { range: '50-69%', count: resumes.filter(r => (r.matchScore || 0) >= 50 && (r.matchScore || 0) < 70).length, color: 'bg-yellow-500' },
                      { range: '30-49%', count: resumes.filter(r => (r.matchScore || 0) >= 30 && (r.matchScore || 0) < 50).length, color: 'bg-orange-500' },
                      { range: '0-29%', count: resumes.filter(r => (r.matchScore || 0) < 30).length, color: 'bg-red-500' }
                    ].map(({ range, count, color }) => (
                      <div key={range} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-20">{range}</span>
                        <div className="flex-1 h-8 bg-secondary/30 rounded-lg overflow-hidden relative">
                          <div
                            className={`h - full ${color} transition - all duration - 500`}
                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}% ` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {count} ({stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="glass rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Status Breakdown</h3>
                  {resumes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No resumes uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        // Count all unique statuses
                        const statusCounts = resumes.reduce((acc, r) => {
                          const status = r.status || 'pending';
                          acc[status] = (acc[status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const statusConfig = [
                          { key: 'analyzed', label: 'Analyzed', color: 'text-green-500', bgColor: 'bg-green-500' },
                          { key: 'completed', label: 'Completed', color: 'text-emerald-500', bgColor: 'bg-emerald-500' },
                          { key: 'processing', label: 'Processing', color: 'text-blue-500', bgColor: 'bg-blue-500' },
                          { key: 'pending', label: 'Pending', color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
                          { key: 'error', label: 'Error', color: 'text-red-500', bgColor: 'bg-red-500' },
                        ];

                        return statusConfig.map(({ key, label, color, bgColor }) => {
                          const count = statusCounts[key] || 0;
                          const percentage = resumes.length > 0 ? (count / resumes.length) * 100 : 0;

                          return (
                            <div key={key} className="flex items-center gap-3">
                              <span className={`text - sm font - medium w - 24 ${color} `}>{label}</span>
                              <div className="flex-1 h-8 bg-secondary/30 rounded-lg overflow-hidden relative">
                                <div
                                  className={`h - full ${bgColor} transition - all duration - 500`}
                                  style={{ width: `${percentage}% ` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                                  {count} ({Math.round(percentage)}%)
                                </span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Resume Details Modal */}
        {selectedResumeId && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResumeId(null)}>
            <Card className="glass w-full max-w-3xl max-h-[80vh] overflow-auto relative" onClick={(e) => e.stopPropagation()}>
              {(() => {
                const resume = resumes.find(r => r.id === selectedResumeId);
                if (!resume) return <div className="p-4">Resume not found</div>;

                // Mark this resume as reviewed when modal opens
                if (!reviewedIds.has(resume.id)) {
                  const newReviewedIds = new Set(reviewedIds);
                  newReviewedIds.add(resume.id);
                  setReviewedIds(newReviewedIds);

                  // Update pending count (total - reviewed)
                  setStats(prev => ({
                    ...prev,
                    pending: resumes.length - newReviewedIds.size
                  }));
                }

                return (
                  <>
                    <div className="sticky top-0 bg-background/95 backdrop-blur p-4 border-b border-white/10 flex items-center justify-between z-10">
                      <h2 className="text-xl font-bold gradient-text">Resume Details</h2>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedResumeId(null)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-6">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{resume.file_name || 'Unknown Candidate'}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${resume.status === 'completed' || resume.status === 'analyzed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              resume.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              } `}>
                              {resume.status || 'pending'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {analyzed && (
                          <div className="text-center glass rounded-xl p-4">
                            <p className="text-sm text-muted-foreground mb-1">Match Score</p>
                            <p className="text-4xl font-black gradient-text">{resume.matchScore || 0}%</p>
                          </div>
                        )}
                      </div>

                      {/* Match Score Progress */}
                      {analyzed && (
                        <div className="glass rounded-xl p-6">
                          <h4 className="text-sm font-semibold mb-3">ATS Score Analysis</h4>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span>Overall ATS Score</span>
                              <span className="font-bold text-2xl">{resume.matchScore || 0}%</span>
                            </div>
                            <div className="h-3 bg-secondary/30 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${(resume.matchScore || 0) >= 70 ? 'bg-green-500' :
                                  (resume.matchScore || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${resume.matchScore || 0}%` }}
                              />
                            </div>

                            {/* Detailed Breakdown */}
                            {resume.ats_breakdown && (
                              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Skill Match (40%)</span>
                                    <span>{resume.ats_breakdown.skill_match_score}/40</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(resume.ats_breakdown.skill_match_score / 40) * 100}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Keywords (25%)</span>
                                    <span>{resume.ats_breakdown.keyword_match_score}/25</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500" style={{ width: `${(resume.ats_breakdown.keyword_match_score / 25) * 100}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Experience (15%)</span>
                                    <span>{resume.ats_breakdown.experience_match_score}/15</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: `${(resume.ats_breakdown.experience_match_score / 15) * 100}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Education (10%)</span>
                                    <span>{resume.ats_breakdown.education_match_score}/10</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500" style={{ width: `${(resume.ats_breakdown.education_match_score / 10) * 100}%` }} />
                                  </div>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Formatting & ATS (10%)</span>
                                    <span>{resume.ats_breakdown.formatting_score}/10</span>
                                  </div>
                                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-500" style={{ width: `${(resume.ats_breakdown.formatting_score / 10) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Detailed Skill Matching */}
                      {analyzed && (resume.matching_skills?.length || resume.missing_skills?.length || resume.extra_skills?.length) ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Matching Skills */}
                          <div className="glass rounded-xl p-4 border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </div>
                              <h4 className="font-bold">Matching Skills</h4>
                            </div>
                            {resume.matching_skills && resume.matching_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {resume.matching_skills.map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No matching skills found</p>
                            )}
                          </div>

                          {/* Missing Skills */}
                          <div className="glass rounded-xl p-4 border-l-4 border-red-500">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <X className="h-4 w-4 text-red-500" />
                              </div>
                              <h4 className="font-bold">Missing Skills</h4>
                            </div>
                            {resume.missing_skills && resume.missing_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {resume.missing_skills.map((skill, i) => (
                                  <Badge key={i} variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No missing skills detected</p>
                            )}
                          </div>

                          {/* Extra Skills */}
                          <div className="glass rounded-xl p-4 border-l-4 border-blue-500 md:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Star className="h-4 w-4 text-blue-500" />
                              </div>
                              <h4 className="font-bold">Extra Skills</h4>
                            </div>
                            {resume.extra_skills && resume.extra_skills.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {resume.extra_skills.map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No extra skills found</p>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Resume Information */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="glass rounded-xl p-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">File Name</p>
                          <p className="font-medium">{resume.file_name || 'N/A'}</p>
                        </div>
                        <div className="glass rounded-xl p-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">File Size</p>
                          <p className="font-medium">{resume.file_size ? `${(resume.file_size / 1024).toFixed(2)} KB` : 'N/A'}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="glass"
                          onClick={() => handleShortlist(resume.id)}
                        >
                          {shortlistedIds.has(resume.id) ? (
                            <>
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Shortlist
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add to Shortlist
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          className="glass bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20"
                          onClick={() => handleDeleteResume(resume.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Resume
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default HRDashboard;
