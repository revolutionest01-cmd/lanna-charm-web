import { useEffect, useState, useRef, useCallback } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isDataLoaded?: boolean;
}

// Storage key constant
const STORAGE_KEY = 'plernping_loaded';

// Check if loading was already shown in this session
const wasLoadingShown = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

// Mark loading as shown
const markLoadingShown = (): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
};

const LoadingScreen = ({ onLoadingComplete, isDataLoaded = false }: LoadingScreenProps) => {
  // Check on initial render if we should skip
  const shouldSkip = useRef(wasLoadingShown());
  const [progress, setProgress] = useState(shouldSkip.current ? 100 : 0);
  const [fadeOut, setFadeOut] = useState(false);
  const [isVisible, setIsVisible] = useState(!shouldSkip.current);
  const [showContent, setShowContent] = useState(false);
  const hasCompletedRef = useRef(shouldSkip.current);

  const completeLoading = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    markLoadingShown();
    setProgress(100);
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 500);
  }, [onLoadingComplete]);

  // Animate content in
  useEffect(() => {
    if (!shouldSkip.current) {
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // If already shown, immediately complete
  useEffect(() => {
    if (shouldSkip.current) {
      setIsVisible(false);
      onLoadingComplete();
    }
  }, [onLoadingComplete]);

  // Progress animation
  useEffect(() => {
    if (shouldSkip.current || hasCompletedRef.current) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Speed up when data is loaded
        if (isDataLoaded) {
          return Math.min(prev + 20, 100);
        }
        
        // Normal progress - go to 80% then slow down
        if (prev >= 80) {
          return prev + 2;
        }
        return prev + 8;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isDataLoaded]);

  // Complete when progress reaches 100
  useEffect(() => {
    if (progress >= 100 && !hasCompletedRef.current) {
      completeLoading();
    }
  }, [progress, completeLoading]);

  // Fallback timeout - force complete after 3 seconds max
  useEffect(() => {
    if (shouldSkip.current) return;

    const timeout = setTimeout(() => {
      completeLoading();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [completeLoading]);

  // Don't render if skipped or completed
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 transition-all duration-500 ${fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating orb - top left */}
        <div 
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl"
          style={{
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        {/* Medium orb - bottom right */}
        <div 
          className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-tl from-highlight/15 to-transparent rounded-full blur-3xl"
          style={{
            animation: 'float 6s ease-in-out infinite reverse',
          }}
        />
        {/* Small accent orb - center right */}
        <div 
          className="absolute top-1/3 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl"
          style={{
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        {/* Tiny floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              animation: `floatParticle ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className={`relative flex flex-col items-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Logo Container with Glow Ring */}
        <div className="relative mb-10">
          {/* Outer glow ring */}
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 via-highlight/30 to-primary/40 blur-2xl scale-150"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          />
          {/* Inner rotating ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-primary/20 scale-125"
            style={{ animation: 'spin 8s linear infinite' }}
          />
          {/* Logo with shadow */}
          <div className="relative p-4 rounded-full bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm shadow-2xl">
            <img 
              src={plernpingLogo} 
              alt="Plern Ping Cafe" 
              className="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg"
              style={{ animation: 'breathe 3s ease-in-out infinite' }}
            />
          </div>
        </div>

        {/* Brand Text */}
        <h2 
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-2"
          style={{ 
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        >
          Plern Ping
        </h2>
        
        <p className="text-muted-foreground mb-10 text-sm md:text-base font-medium tracking-wide">
          กำลังเตรียมประสบการณ์...
        </p>

        {/* Progress Bar Container */}
        <div className="relative w-72 md:w-80">
          {/* Background track */}
          <div className="w-full h-1.5 bg-secondary/30 rounded-full overflow-hidden backdrop-blur-sm">
            {/* Animated progress fill */}
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-200 ease-out"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--highlight)), hsl(var(--primary)))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
              }}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: 'shine 1.5s ease-in-out infinite' }}
              />
            </div>
          </div>
          
          {/* Progress glow */}
          <div 
            className="absolute top-1/2 left-0 h-4 bg-primary/20 rounded-full blur-md -translate-y-1/2 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Percentage */}
        <p className="mt-6 text-lg font-semibold text-primary/80 tabular-nums">
          {Math.round(progress)}%
        </p>

        {/* Animated loading dots */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-primary/50 rounded-full"
              style={{ 
                animation: 'loadingDot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes loadingDot {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.8); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
