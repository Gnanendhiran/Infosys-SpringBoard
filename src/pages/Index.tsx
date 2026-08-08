import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Upload, BarChart3, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import AntigravityBackground from "@/components/ui/AntigravityBackground";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-emerald-950 to-blue-950">
      {/* Background Effect */}
      <AntigravityBackground />

      {/* Content Overlay */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              SkillNavigator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/candidate-dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/10">For Candidates</Button>
            </Link>
            <Link to="/hr-dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">For Recruiters</Button>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-600/30 text-emerald-400 text-sm font-medium animate-fade-in backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Now with Advanced ATS Scoring
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 drop-shadow-2xl">
              Experience the <br />
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Future of Hiring
              </span>
            </h1>

            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              AI-powered resume analysis that goes beyond keywords. Get detailed insights,
              semantic matching, and industry-standard ATS scoring in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/candidate-dashboard">
                <Button size="lg" className="h-14 px-8 text-lg gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  Analyze My Resume <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/hr-dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2 border-2 border-emerald-600 text-white hover:bg-emerald-900/30 backdrop-blur-sm">
                  I'm a Recruiter
                </Button>
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-3 gap-6 pt-20 text-left">
              <Card className="p-6 bg-gradient-to-br from-black/50 to-emerald-950/50 border-emerald-700/30 backdrop-blur-md shadow-lg hover:shadow-emerald-500/20 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Semantic AI Matching</h3>
                <p className="text-white/70">
                  Our AI understands context, not just keywords. Matches "ML" with "Machine Learning" automatically.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-black/50 to-blue-950/50 border-blue-700/30 backdrop-blur-md shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Advanced ATS Scoring</h3>
                <p className="text-white/70">
                  Get a comprehensive 5-factor score breakdown including skills, experience, and formatting.
                </p>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-black/50 to-emerald-950/50 border-emerald-700/30 backdrop-blur-md shadow-lg hover:shadow-emerald-500/20 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">Instant Feedback</h3>
                <p className="text-white/70">
                  Receive actionable recommendations to improve your resume and close skill gaps immediately.
                </p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
