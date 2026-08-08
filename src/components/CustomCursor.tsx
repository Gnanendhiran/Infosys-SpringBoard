import { useEffect, useState } from 'react';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    window.addEventListener('mousemove', updateCursor);

    return () => {
      window.removeEventListener('mousemove', updateCursor);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  // Don't show on mobile
  if (window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      {/* Main Cursor */}
      <div
        className="fixed top-0 left-0 w-6 h-6 rounded-full bg-primary/30 pointer-events-none z-[9999] mix-blend-difference transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${position.x - 12}px, ${position.y - 12}px)`,
          scale: isHovering ? 1.5 : 1,
        }}
      />
      {/* Outer Ring */}
      <div
        className="fixed top-0 left-0 w-12 h-12 rounded-full border-2 border-primary/50 pointer-events-none z-[9998] mix-blend-difference transition-all duration-500 ease-out"
        style={{
          transform: `translate(${position.x - 24}px, ${position.y - 24}px)`,
          scale: isHovering ? 1.8 : 1,
          opacity: isHovering ? 0.5 : 1,
        }}
      />
    </>
  );
};

export default CustomCursor;


