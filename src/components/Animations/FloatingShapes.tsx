import { useEffect, useRef } from "react";

interface FloatingShapesProps {
  count?: number;
  className?: string;
}

export const FloatingShapes = ({ count = 5, className = "" }: FloatingShapesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const shapes = container.querySelectorAll(".floating-shape");
    
    const handleMouseMove = (e: MouseEvent) => {
      shapes.forEach((shape, index) => {
        const element = shape as HTMLElement;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (e.clientX - centerX) * 0.01;
        const deltaY = (e.clientY - centerY) * 0.01;
        const speed = 1 + index * 0.2; // Different speeds for parallax
        
        element.style.transform = `translate3d(${deltaX * speed}px, ${deltaY * speed}px, 0) rotateX(${deltaY * 0.5}deg) rotateY(${deltaX * 0.5}deg)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const size = 100 + Math.random() * 150;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 15 + Math.random() * 10;
        
        return (
          <div
            key={i}
            className="floating-shape absolute opacity-20 pointer-events-none"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${left}%`,
              top: `${top}%`,
              background: i % 2 === 0
                ? "linear-gradient(135deg, rgba(107, 70, 193, 0.3), rgba(124, 58, 237, 0.2))"
                : "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(244, 232, 193, 0.1))",
              borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "30%" : "10%",
              filter: "blur(40px)",
              animation: `float ${duration}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              transformStyle: "preserve-3d",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        );
      })}
    </div>
  );
};


