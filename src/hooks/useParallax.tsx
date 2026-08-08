import { useEffect, useRef } from 'react';

interface UseParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
}

export const useParallax = (options: UseParallaxOptions = {}) => {
  const { speed = 0.5, direction = 'up' } = options;
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const rate = scrolled * speed * (direction === 'up' ? -1 : 1);
      element.style.transform = `translate3d(0, ${rate}px, 0)`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, direction]);

  return elementRef;
};

