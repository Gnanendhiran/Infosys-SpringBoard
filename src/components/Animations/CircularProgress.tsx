import { useEffect, useState } from "react";

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export const CircularProgress = ({ 
  score, 
  size = 200, 
  strokeWidth = 12,
  className = "",
  showLabel = true 
}: CircularProgressProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

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

  const getColor = () => {
    if (score >= 80) return "#D4AF37";
    if (score >= 60) return "#0EA5E9";
    if (score >= 40) return "#F59E0B";
    return "#EF4444";
  };

  const offset = circumference - (displayScore / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(107, 70, 193, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span 
            className="text-4xl font-black transition-colors duration-300"
            style={{ color: getColor() }}
          >
            {displayScore}%
          </span>
          <span className="text-xs text-muted-foreground mt-1">Match</span>
        </div>
      )}
    </div>
  );
};


