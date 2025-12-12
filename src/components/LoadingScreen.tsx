import { useEffect, useState, useRef } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isDataLoaded?: boolean;
}

const LoadingScreen = ({ onLoadingComplete, isDataLoaded = false }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const hasCompletedRef = useRef(false);

  // Progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        
        // Speed up when data is loaded
        if (isDataLoaded) {
          return Math.min(prev + 15, 100);
        }
        
        // Normal progress - go to 85% then slow down
        if (prev >= 85) {
          return prev + 1;
        }
        return prev + 8;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [isDataLoaded]);

  // Complete loading when progress reaches 100 OR after max timeout
  useEffect(() => {
    // Complete when progress hits 100
    if (progress >= 100 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setFadeOut(true);
      setTimeout(onLoadingComplete, 400);
    }
  }, [progress, onLoadingComplete]);

  // Fallback timeout - force complete after 4 seconds max
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setProgress(100);
        setFadeOut(true);
        setTimeout(onLoadingComplete, 400);
      }
    }, 4000);

    return () => clearTimeout(timeout);
  }, [onLoadingComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Logo with Glow Effect */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse scale-110" />
        <img 
          src={plernpingLogo} 
          alt="Plern Ping Cafe" 
          className="relative w-32 h-32 md:w-40 md:h-40 object-contain animate-scale-in drop-shadow-lg"
        />
      </div>

      {/* Loading Text */}
      <h2 className="text-2xl md:text-3xl font-semibold text-foreground animate-fade-in mb-2">
        Plern Ping
      </h2>
      
      <p className="text-muted-foreground mb-8 animate-fade-in text-sm md:text-base">
        กำลังโหลด...
      </p>

      {/* Progress Bar */}
      <div className="relative w-64 md:w-72">
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Progress Percentage */}
      <p className="mt-4 text-sm text-muted-foreground font-medium">
        {Math.round(progress)}%
      </p>

      {/* Floating Dots Animation */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;
