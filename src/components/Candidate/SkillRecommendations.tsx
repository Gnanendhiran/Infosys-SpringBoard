import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, TrendingUp, Star, ExternalLink } from "lucide-react";
import { use3DTilt } from "@/hooks/use3DTilt";

interface Recommendation {
  skill: string;
  trend: "Hot" | "Rising" | "Essential";
  resources: Array<{
    name: string;
    url: string;
    type: "Course" | "Tutorial" | "Documentation";
  }>;
  category: "Must-have" | "Nice-to-have" | "Complementary";
}

interface SkillRecommendationsProps {
  recommendations: Recommendation[];
  jobRole?: string;
}

export const SkillRecommendations = ({ recommendations, jobRole }: SkillRecommendationsProps) => {
  const cardRef = use3DTilt();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Hot":
        return <Flame className="h-4 w-4 text-orange-500" />;
      case "Rising":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "Essential":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Must-have":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Nice-to-have":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Complementary":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card ref={cardRef} className="glass rounded-2xl p-6 card-tilt">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-blue-600 flex items-center justify-center glow">
          <TrendingUp className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            Trending Skills {jobRole && `for ${jobRole}`}
          </h3>
          <p className="text-sm text-muted-foreground">Boost your profile with these in-demand skills</p>
        </div>
      </div>
      <div className="grid gap-4">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="glass rounded-lg p-5 hover:scale-[1.02] transition-all duration-300 border border-white/10 hover:border-primary/30"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-foreground">{rec.skill}</h4>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(rec.trend)}
                    <span className="text-xs text-muted-foreground">{rec.trend}</span>
                  </div>
                </div>
                <Badge variant="outline" className={getCategoryColor(rec.category)}>
                  {rec.category}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Learn on:</p>
              <div className="flex flex-wrap gap-2">
                {rec.resources.map((resource, ridx) => (
                  <a
                    key={ridx}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${(resource as any).color || 'bg-blue-600'} text-white text-xs font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200`}
                    title={`Learn ${rec.skill} on ${resource.name}`}
                  >
                    <span>{resource.name}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


