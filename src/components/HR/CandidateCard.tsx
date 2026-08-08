import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, Eye, Star, X } from "lucide-react";
import { use3DTilt } from "@/hooks/use3DTilt";
import { CircularProgress } from "@/components/Animations/CircularProgress";

interface CandidateCardProps {
  candidate: {
    id: string;
    name?: string;
    fileName: string;
    matchScore: number;
    skillsMatched: number;
    totalSkills: number;
    experience?: string;
    education?: string;
    topSkills?: string[];
    status?: string;
  };
  onViewDetails: () => void;
  onShortlist: () => void;
  onReject: () => void;
  isShortlisted?: boolean;
}

export const CandidateCard = ({
  candidate,
  onViewDetails,
  onShortlist,
  onReject,
  isShortlisted = false,
}: CandidateCardProps) => {
  const cardRef = use3DTilt();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[#D4AF37]";
    if (score >= 60) return "text-[#0EA5E9]";
    if (score >= 40) return "text-[#F59E0B]";
    return "text-red-500";
  };

  return (
    <Card
      ref={cardRef}
      className="glass rounded-2xl p-6 card-tilt hover:border-primary/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center glow">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-foreground">
              {candidate.name || candidate.fileName}
            </h4>
            <p className="text-xs text-muted-foreground">{candidate.fileName}</p>
          </div>
        </div>
        {isShortlisted && (
          <Badge variant="default" className="bg-accent text-black">
            <Star className="h-3 w-3 mr-1" />
            Shortlisted
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-center mb-4">
        <CircularProgress score={candidate.matchScore} size={120} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Skills Matched</span>
          <span className="font-semibold text-foreground">
            {candidate.skillsMatched}/{candidate.totalSkills}
          </span>
        </div>
        {candidate.experience && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Experience</span>
            <span className="font-semibold text-foreground">{candidate.experience}</span>
          </div>
        )}
        {candidate.education && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Education</span>
            <span className="font-semibold text-foreground">{candidate.education}</span>
          </div>
        )}
      </div>

      {candidate.topSkills && candidate.topSkills.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Top Skills:</p>
          <div className="flex flex-wrap gap-1">
            {candidate.topSkills.slice(0, 4).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 glass hover:bg-primary/10"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
        {candidate.matchScore >= 70 && (
          <Button
            size="sm"
            className="flex-1 bg-gradient-primary text-white"
            onClick={onShortlist}
            disabled={isShortlisted}
          >
            <Star className="h-4 w-4 mr-2" />
            {isShortlisted ? "Shortlisted" : "Shortlist"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="glass hover:bg-destructive/10"
          onClick={onReject}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};


