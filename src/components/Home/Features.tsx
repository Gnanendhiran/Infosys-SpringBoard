import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, FileSearch, Award, Sparkles, LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { use3DTilt } from "@/hooks/use3DTilt";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface FeatureCardProps {
  index: number;
  feature: {
    icon: LucideIcon;
    title: string;
    description: string;
  };
  Icon: LucideIcon;
  isVisible: boolean;
}

const FeatureCard = ({ index, feature, Icon, isVisible }: FeatureCardProps) => {
  const cardRef = use3DTilt({ maxRotation: 8, perspective: 1000, scale: 1.03 });

  return (
    <Card
      ref={cardRef}
      data-index={index}
      className={`card-tilt group bg-black/30 backdrop-blur-sm border border-blue-600/30 hover:border-emerald-500/50 rounded-2xl p-8 transition-all duration-500 cursor-pointer ${isVisible ? 'fade-in-up visible' : 'opacity-0 translate-y-10'
        }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        <Icon className="h-8 w-8 text-white icon-bounce" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 transition-all duration-300">
        {feature.title}
      </h3>
      <p className="text-white/70 leading-relaxed">
        {feature.description}
      </p>
      <div className="mt-6 h-1 w-0 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all duration-500 rounded-full" />
    </Card>
  );
};

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Advanced NLP and semantic similarity models analyze resumes and job descriptions for perfect matches.",
    gradient: "from-purple-500 to-blue-500"
  },
  {
    icon: Target,
    title: "Skill Gap Analysis",
    description: "Identify missing skills and get personalized recommendations to bridge the gap.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    title: "Learning Pathways",
    description: "Curated courses, certifications, and projects tailored to your career goals.",
    gradient: "from-cyan-500 to-teal-500"
  },
  {
    icon: FileSearch,
    title: "Bulk Resume Screening",
    description: "Upload multiple resumes at once and get automated ranking by match score.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Award,
    title: "ATS Optimization",
    description: "Improve resume quality with ATS compatibility checks and actionable feedback.",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    icon: Sparkles,
    title: "Job Role Prediction",
    description: "AI suggests suitable career paths based on your skills and experience.",
    gradient: "from-pink-500 to-rose-500"
  }
];

const Features = () => {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = sectionRef.current?.querySelectorAll('[data-index]');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const { ref: headingRef, isVisible: headingVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section ref={sectionRef} className="relative pt-4 pb-32 overflow-hidden bg-gradient-to-b from-black via-emerald-950/50 to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent" />

      <div className="container relative mx-auto px-4 z-10">
        <div
          ref={headingRef as React.RefObject<HTMLDivElement>}
          className={`text-center mb-20 fade-in-up ${headingVisible ? 'visible' : ''}`}
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">Powerful Features</span>
            <span className="block text-white mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">for Modern Recruitment</span>
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Everything you need to streamline hiring and accelerate career growth
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const isVisible = visibleCards.has(index);
            const Icon = feature.icon;

            return (
              <FeatureCard
                key={index}
                index={index}
                feature={feature}
                Icon={Icon}
                isVisible={isVisible}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
