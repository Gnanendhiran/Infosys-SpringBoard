import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, User, ArrowRight, CheckCircle, Sparkles, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { use3DTilt } from "@/hooks/use3DTilt";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface UserTypeCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  items: string[];
  gradient: string;
  iconColor: string;
  delay: string;
  isVisible: boolean;
}

const UserTypeCard = ({ icon: Icon, title, subtitle, items, gradient, iconColor, delay, isVisible }: UserTypeCardProps) => {
  const cardRef = use3DTilt({ maxRotation: 8, perspective: 1000, scale: 1.02 });

  return (
    <Card
      ref={cardRef}
      className={`card-tilt group bg-black/30 backdrop-blur-sm border border-blue-600/30 hover:border-emerald-500/50 rounded-3xl p-10 transition-all duration-500 ${isVisible ? 'fade-in-up visible' : ''
        }`}
      style={{ transitionDelay: delay }}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className={`relative w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-8 w-8 text-white icon-bounce" />
          <div className={`absolute inset-0 rounded-2xl ${gradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white transition-all duration-300">{title}</h3>
          <p className="text-white/60 font-medium">{subtitle}</p>
        </div>
      </div>

      <ul className="space-y-4 mb-10">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 group/item"
            style={{ animationDelay: `${parseFloat(delay) + 0.1 + idx * 0.1}s` }}
          >
            <CheckCircle className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0 group-hover/item:scale-110 transition-transform icon-bounce`} />
            <span className="text-white font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

const UserTypes = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-4 pb-32 overflow-hidden bg-gradient-to-b from-black via-blue-950/50 to-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/10 to-transparent" />

      <div className="container relative mx-auto px-4 z-10">
        <div className={`text-center mb-20 fade-in-up ${isVisible ? 'visible' : ''}`}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-emerald-900/30 border border-emerald-600/30 backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4 text-emerald-400 icon-bounce" />
            <span className="text-sm font-semibold text-emerald-400">Choose Your Path</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">Built for</span>
            <span className="block text-white mt-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Recruiters & Candidates</span>
          </h2>
          <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
            Tailored experiences for every stage of the hiring journey
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* HR/Recruiter Card */}
          <UserTypeCard
            icon={Users}
            title="For HR & Recruiters"
            subtitle="Streamline your hiring workflow"
            items={[
              "Upload and analyze bulk resumes instantly",
              "Automated candidate ranking by match score",
              "Comprehensive skill insights for each candidate",
              "Bias-free screening with anonymized views",
              "Export shortlists and detailed reports"
            ]}
            gradient="bg-blue-600"
            iconColor="text-blue-400"
            delay="0.1s"
            isVisible={isVisible}
          />

          {/* Candidate Card */}
          <UserTypeCard
            icon={User}
            title="For Candidates"
            subtitle="Accelerate your career growth"
            items={[
              "Identify skill gaps with AI analysis",
              "Get personalized learning pathways",
              "Receive project recommendations",
              "Improve resume with ATS optimization",
              "Discover suitable job roles for you"
            ]}
            gradient="bg-emerald-600"
            iconColor="text-emerald-400"
            delay="0.2s"
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
};

export default UserTypes;
