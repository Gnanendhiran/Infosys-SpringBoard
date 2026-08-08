import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useParallax } from "@/hooks/useParallax";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { ref: badgeRef, isVisible: badgeVisible } = useScrollAnimation({ threshold: 0.2 });
  const parallaxRef1 = useParallax({ speed: 0.3, direction: 'up' });
  const parallaxRef2 = useParallax({ speed: 0.5, direction: 'up' });
  const parallaxRef3 = useParallax({ speed: 0.4, direction: 'up' });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-br from-black via-emerald-950 to-blue-950"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-emerald-900/20 opacity-30" />

      {/* 3D Floating Geometric Shapes */}
      <div
        ref={parallaxRef1 as React.RefObject<HTMLDivElement>}
        className="absolute top-20 left-10 w-72 h-72 opacity-20 float rotate-3d"
        style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(5, 150, 105, 0.3))',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          filter: 'blur(60px)',
          animation: 'float 6s ease-in-out infinite, rotate-3d 20s linear infinite',
        }}
      />
      <div
        ref={parallaxRef2 as React.RefObject<HTMLDivElement>}
        className="absolute bottom-20 right-10 w-96 h-96 opacity-15 float rotate-3d"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.3))',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          filter: 'blur(80px)',
          animation: 'float 8s ease-in-out infinite, rotate-3d 25s linear infinite',
          animationDelay: '2s',
        }}
      />
      <div
        ref={parallaxRef3 as React.RefObject<HTMLDivElement>}
        className="absolute top-1/2 left-1/2 w-64 h-64 opacity-10 float rotate-3d"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4), rgba(37, 99, 235, 0.2))',
          borderRadius: '50%',
          filter: 'blur(70px)',
          animation: 'float 7s ease-in-out infinite, rotate-3d 30s linear infinite',
          animationDelay: '4s',
        }}
      />

      {/* Additional smaller floating shapes */}
      <div
        className="absolute top-1/4 right-1/4 w-32 h-32 opacity-10 float"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(34, 197, 94, 0.4))',
          borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%',
          filter: 'blur(40px)',
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '1s',
        }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-40 h-40 opacity-10 float"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3), rgba(37, 99, 235, 0.2))',
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          filter: 'blur(50px)',
          animation: 'float 6.5s ease-in-out infinite',
          animationDelay: '3s',
        }}
      />

      <div className="container relative mx-auto px-4 pt-4 pb-20 md:pb-32 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div
            ref={badgeRef as React.RefObject<HTMLDivElement>}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 bg-emerald-900/30 border border-emerald-600/30 backdrop-blur-sm mb-8 fade-in-up ${badgeVisible ? 'visible' : ''
              }`}
            style={{ animationDelay: '0.1s' }}
          >
            <Sparkles className="h-4 w-4 text-emerald-400 icon-bounce" />
            <span className="text-sm font-semibold text-emerald-400">Powered by Advanced AI</span>
            <Zap className="h-4 w-4 text-blue-400 icon-bounce" />
          </div>

          {/* Main Heading */}
          <h1
            className={`text-5xl md:text-6xl lg:text-8xl font-black mb-6 fade-in-up ${isVisible ? 'visible' : ''
              }`}
            style={{ animationDelay: '0.2s' }}
          >
            <span className="block text-white drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]">Smart Hiring,</span>
            <span className="block bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mt-2 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]">Better Talent</span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-12 fade-in-up ${isVisible ? 'visible' : ''
              }`}
            style={{ animationDelay: '0.3s' }}
          >
            Intelligent hiring for recruiters. Clear career paths for candidates. Bridging the gap with AI-driven screening and personalized growth plans.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 fade-in-up ${isVisible ? 'visible' : ''
              }`}
            style={{ animationDelay: '0.4s' }}
          >
            <Link to="/auth">
              <Button
                size="lg"
                className="btn-premium group relative px-8 py-6 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white overflow-hidden shadow-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  For Candidates
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 icon-bounce" />
                </span>
                <div className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="btn-premium group px-8 py-6 text-lg font-bold rounded-xl bg-black/30 backdrop-blur-sm border-2 border-emerald-600/50 text-white hover:border-emerald-500 hover:bg-emerald-900/20"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 icon-bounce" />
                  For Recruiters
                </span>
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto fade-in-up ${isVisible ? 'visible' : ''
              }`}
            style={{ animationDelay: '0.5s' }}
          >
            <div className="card-3d bg-black/30 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">80%</div>
              <div className="text-sm text-white/60 font-medium">Time Saved</div>
            </div>
            <div className="card-3d bg-black/30 backdrop-blur-sm border border-emerald-600/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">95%</div>
              <div className="text-sm text-white/60 font-medium">Match Accuracy</div>
            </div>
            <div className="card-3d bg-black/30 backdrop-blur-sm border border-blue-600/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300">
              <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">10k+</div>
              <div className="text-sm text-white/60 font-medium">Resumes Analyzed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-emerald-400/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-emerald-400 rounded-full mt-2" />
        </div>
      </div>
    </section >
  );
};

export default Hero;
