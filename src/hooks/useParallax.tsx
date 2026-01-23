import { useState, useEffect, useCallback } from 'react';

interface ParallaxConfig {
  speed?: number; // 0.1 = slow, 1 = same as scroll
  direction?: 'up' | 'down';
}

export const useParallax = (config: ParallaxConfig = {}) => {
  const { speed = 0.5, direction = 'up' } = config;
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const multiplier = direction === 'up' ? -1 : 1;
    setOffset(scrollY * speed * multiplier);
  }, [speed, direction]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return offset;
};

export const useMultiParallax = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    scrollY,
    getOffset: (speed: number, direction: 'up' | 'down' = 'up') => {
      const multiplier = direction === 'up' ? -1 : 1;
      return scrollY * speed * multiplier;
    }
  };
};
