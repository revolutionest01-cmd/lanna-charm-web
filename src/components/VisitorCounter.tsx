import { useEffect, useState, useRef } from 'react';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

const VisitorCounter = () => {
  const [count, setCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const hasIncremented = useRef(false);
  const { language } = useLanguage();

  const t = {
    th: {
      visitors: 'ผู้เข้าชม',
      people: 'คน'
    },
    en: {
      visitors: 'Visitors',
      people: ''
    },
    zh: {
      visitors: '访客',
      people: '人'
    }
  };

  const text = t[language as keyof typeof t] || t.th;

  useEffect(() => {
    const fetchAndIncrement = async () => {
      // Check if already incremented in this session
      const sessionKey = 'visitor_counted';
      const hasVisited = sessionStorage.getItem(sessionKey);

      try {
        if (!hasVisited && !hasIncremented.current) {
          hasIncremented.current = true;
          
          // Increment count for new visitor
          const { data, error } = await supabase.functions.invoke('visitor-counter', {
            body: { action: 'increment' }
          });

          if (error) {
            console.error('Error incrementing visitor count:', error);
            // Fallback to just fetching
            const { data: getData } = await supabase.functions.invoke('visitor-counter', {
              body: { action: 'get' }
            });
            setCount(getData?.total_visits || 5000);
          } else {
            setCount(data?.total_visits || 5000);
            sessionStorage.setItem(sessionKey, 'true');
          }
        } else {
          // Just fetch current count
          const { data, error } = await supabase.functions.invoke('visitor-counter', {
            body: { action: 'get' }
          });

          if (error) {
            console.error('Error fetching visitor count:', error);
            setCount(5000);
          } else {
            setCount(data?.total_visits || 5000);
          }
        }
      } catch (error) {
        console.error('Visitor counter error:', error);
        setCount(5000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndIncrement();
  }, []);

  // Animate counter
  useEffect(() => {
    if (count === null) return;

    const duration = 2000; // 2 seconds
    const startValue = Math.max(0, count - 100);
    const difference = count - startValue;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + difference * easeOut);
      
      setDisplayCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [count]);

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="h-4 w-4" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground group">
      <Users className="h-4 w-4 transition-colors group-hover:text-primary" />
      <span className="text-sm font-medium">
        {text.visitors}: <span className="text-foreground font-bold tabular-nums">{formatNumber(displayCount)}</span> {text.people}
      </span>
    </div>
  );
};

export default VisitorCounter;
