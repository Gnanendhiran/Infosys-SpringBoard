import { useEffect, useRef } from 'react';

interface Use3DTiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
}

export const use3DTilt = (options: Use3DTiltOptions = {}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const {
    maxRotation = 10,
    perspective = 1000,
    scale = 1.02,
  } = options;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxRotation;
      const rotateY = ((x - centerX) / centerX) * maxRotation;

      card.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    };

    const handleMouseLeave = () => {
      card.style.transform = `perspective(${perspective}px) rotateX(0) rotateY(0) scale(1)`;
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxRotation, perspective, scale]);

  return cardRef;
};

