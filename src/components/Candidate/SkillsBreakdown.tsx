import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { use3DTilt } from "@/hooks/use3DTilt";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Skill {
  name: string;
  proficiency?: string;
  matchPercentage?: number;
  requiredLevel?: string;
  priority?: "High" | "Medium" | "Low";
}

interface SkillsBreakdownProps {
  matchedSkills: Skill[];
  missingSkills: Skill[];
}

export const SkillsBreakdown = ({ matchedSkills, missingSkills }: SkillsBreakdownProps) => {
  const matchedCardRef = use3DTilt();
  const missingCardRef = use3DTilt();
  const chartCardRef = use3DTilt();

  const data = [
    { name: "Matched", value: matchedSkills.length, color: "#10B981" },
    { name: "Missing", value: missingSkills.length, color: "#F59E0B" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Chart Section */}
      <Card ref={chartCardRef} className="glass rounded-2xl p-6 card-tilt flex flex-col justify-center items-center lg:col-span-1">
        <div className="flex items-center gap-3 mb-2 w-full">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <PieChartIcon className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Overview</h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2">
          <p className="text-2xl font-black gradient-text">
            {Math.round((matchedSkills.length / (matchedSkills.length + missingSkills.length || 1)) * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </div>
      </Card>

      {/* Matched Skills */}
      <Card ref={matchedCardRef} className="glass rounded-2xl p-6 card-tilt lg:col-span-1 flex flex-col max-h-[450px]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981] to-emerald-600 flex items-center justify-center glow">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Matched Skills</h3>
            <p className="text-xs text-muted-foreground">{matchedSkills.length} skills found</p>
          </div>
        </div>
        <div className="grid gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
          {matchedSkills.map((skill, idx) => (
            <div
              key={idx}
              className="glass rounded-lg p-3 hover:scale-[1.02] transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500/40"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-foreground">{skill.name}</span>
                {skill.matchPercentage && (
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
                    {skill.matchPercentage}%
                  </Badge>
                )}
              </div>
              {skill.proficiency && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{skill.proficiency}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Missing Skills */}
      <Card ref={missingCardRef} className="glass rounded-2xl p-6 card-tilt lg:col-span-1 flex flex-col max-h-[450px]">
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-orange-600 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Missing Skills</h3>
            <p className="text-xs text-muted-foreground">{missingSkills.length} skills to learn</p>
          </div>
        </div>
        <div className="grid gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
          {missingSkills.map((skill, idx) => (
            <div
              key={idx}
              className="glass rounded-lg p-3 hover:scale-[1.02] transition-all duration-300 border border-orange-500/20 hover:border-orange-500/40 hover:animate-pulse"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-foreground">{skill.name}</span>
                {skill.priority && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${skill.priority === "High"
                        ? "bg-red-500/20 text-red-400"
                        : skill.priority === "Medium"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                  >
                    {skill.priority}
                  </Badge>
                )}
              </div>
              {skill.requiredLevel && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Req: {skill.requiredLevel}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};


