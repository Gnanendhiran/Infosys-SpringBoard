import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, TrendingUp, ExternalLink, Bookmark } from "lucide-react";
import { use3DTilt } from "@/hooks/use3DTilt";
import { useState } from "react";

interface Project {
  title: string;
  description: string;
  skills: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  impactScore: number;
  resources: Array<{
    name: string;
    url: string;
  }>;
}

interface ProjectRecommendationsProps {
  projects: Project[];
}

export const ProjectRecommendations = ({ projects }: ProjectRecommendationsProps) => {
  const cardRef = use3DTilt();
  const [savedProjects, setSavedProjects] = useState<Set<number>>(new Set());

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const toggleSave = (index: number) => {
    const newSaved = new Set(savedProjects);
    if (newSaved.has(index)) {
      newSaved.delete(index);
    } else {
      newSaved.add(index);
    }
    setSavedProjects(newSaved);
  };

  return (
    <Card ref={cardRef} className="glass rounded-2xl p-6 card-tilt">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-yellow-600 flex items-center justify-center glow-gold">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Projects to Boost Your Resume</h3>
          <p className="text-sm text-muted-foreground">Build these projects to close skill gaps</p>
        </div>
      </div>
      <div className="grid gap-4">
        {projects.map((project, idx) => (
          <div
            key={idx}
            className="glass rounded-lg p-5 hover:scale-[1.02] transition-all duration-300 border border-white/10 hover:border-accent/30"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-lg text-foreground mb-2">{project.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSave(idx)}
                className={savedProjects.has(idx) ? "text-accent" : ""}
              >
                <Bookmark className={`h-4 w-4 ${savedProjects.has(idx) ? "fill-current" : ""}`} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.skills.map((skill, sidx) => (
                <Badge key={sidx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className={getDifficultyColor(project.difficulty)}>
                  {project.difficulty}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{project.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span>Impact: {project.impactScore}%</span>
              </div>
            </div>
            <div className="flex gap-2">
              {project.resources.map((resource, ridx) => (
                <Button
                  key={ridx}
                  variant="outline"
                  size="sm"
                  className="flex-1 glass hover:bg-primary/10"
                  asChild
                >
                  <a
                    href={resource.url.includes('search_query=') ? `${resource.url}${encodeURIComponent(project.title + " tutorial")}` : resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{resource.name}</span>
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


