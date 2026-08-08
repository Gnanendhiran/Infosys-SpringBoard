import { useEffect, useRef } from 'react';

interface UseMouseParallaxOptions {
  intensity?: number;
}

export const useMouseParallax = (options: UseMouseParallaxOptions = {}) => {
  const { intensity = 0.1 } = options;
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const moveX = x * intensity;
      const moveY = y * intensity;

      element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate3d(0, 0, 0)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  return elementRef;
};

