import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface AnimatedScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const AnimatedScore = ({ 
  score, 
  size = "lg", 
  showLabel = true, 
  label = "Match Score",
  className = "" 
}: AnimatedScoreProps) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const increment = score / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setDisplayScore(Math.round(current));
    }, 20);

    return () => clearInterval(timer);
  }, [score]);

  const getColorClass = () => {
    if (score >= 80) return "text-[#D4AF37]";
    if (score >= 60) return "text-[#0EA5E9]";
    if (score >= 40) return "text-[#F59E0B]";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (score >= 80) return "bg-gradient-to-r from-[#D4AF37] to-[#10B981]";
    if (score >= 60) return "bg-[#0EA5E9]";
    if (score >= 40) return "bg-[#F59E0B]";
    return "bg-red-500";
  };

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showLabel && (
        <p className="text-sm text-muted-foreground mb-2 font-medium">{label}</p>
      )}
      <div className="relative">
        <div className={`${sizeClasses[size]} font-black ${getColorClass()} transition-all duration-300`}>
          {displayScore}%
        </div>
        {score >= 80 && (
          <div className="absolute inset-0 animate-pulse-glow opacity-50">
            <div className={`${sizeClasses[size]} font-black ${getColorClass()}`}>
              {displayScore}%
            </div>
          </div>
        )}
      </div>
      <div className="w-full mt-4 max-w-xs">
        <Progress 
          value={displayScore} 
          className="h-3"
        />
        <div 
          className={`h-3 mt-[-12px] rounded-full ${getProgressColor()} transition-all duration-500`}
          style={{ width: `${displayScore}%` }}
        />
      </div>
    </div>
  );
};


