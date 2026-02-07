import { useState, useEffect } from 'react';

type SectionTheme = 'light' | 'dark' | 'warm';

interface SectionConfig {
  id: string;
  theme: SectionTheme;
}

const sectionConfigs: SectionConfig[] = [
  { id: 'hero', theme: 'dark' },
  { id: 'features', theme: 'light' },
  { id: 'events', theme: 'warm' },
  { id: 'rooms', theme: 'light' },
  { id: 'menu', theme: 'warm' },
  { id: 'gallery', theme: 'light' },
  { id: 'reviews', theme: 'warm' },
  { id: 'contact', theme: 'light' },
];

export const useActiveSection = () => {
  const [activeTheme, setActiveTheme] = useState<SectionTheme>('dark');
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionConfigs.forEach(({ id, theme }) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
              setActiveTheme(theme);
              setActiveSection(id);
            }
          });
        },
        {
          threshold: [0.3, 0.5, 0.7],
          rootMargin: '-10% 0px -10% 0px',
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return { activeTheme, activeSection };
};

export type { SectionTheme };
