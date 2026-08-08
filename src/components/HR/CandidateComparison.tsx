import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";
import { CircularProgress } from "@/components/Animations/CircularProgress";

interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  skillsMatched: number;
  totalSkills: number;
  matchedSkills: string[];
  missingSkills: string[];
  experience?: string;
  education?: string;
}

interface CandidateComparisonProps {
  candidates: Candidate[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const CandidateComparison = ({
  candidates,
  onRemove,
  onClear,
}: CandidateComparisonProps) => {
  if (candidates.length === 0) return null;

  return (
    <Card className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground">Candidate Comparison</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(300px, 1fr))` }}>
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-foreground">{candidate.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(candidate.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center mb-4">
                <CircularProgress score={candidate.matchScore} size={100} />
              </div>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Skills: </span>
                  <span className="font-semibold">
                    {candidate.skillsMatched}/{candidate.totalSkills}
                  </span>
                </div>
                {candidate.experience && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Experience: </span>
                    <span className="font-semibold">{candidate.experience}</span>
                  </div>
                )}
                {candidate.education && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Education: </span>
                    <span className="font-semibold">{candidate.education}</span>
                  </div>
                )}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-semibold text-foreground">Matched Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.matchedSkills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-semibold text-foreground">Missing Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {candidate.missingSkills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-orange-500/20 text-orange-400">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
};


