import { useEffect, useState } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isDataLoaded?: boolean;
}

const LoadingScreen = ({ onLoadingComplete, isDataLoaded = false }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        // If data is loaded, speed up to 100%
        if (isDataLoaded && prev >= 80) {
          return Math.min(prev + 20, 100);
        }
        // Normal progress, cap at 90% until data loads
        if (prev >= 90 && !isDataLoaded) {
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [isDataLoaded]);

  // When progress reaches 100 and data is loaded, trigger fade out
  useEffect(() => {
    if (progress >= 100 && isDataLoaded) {
      setFadeOut(true);
      const timer = setTimeout(onLoadingComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, isDataLoaded, onLoadingComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
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

      {/* Loading Text with Shimmer */}
      <div className="relative mb-2">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground animate-fade-in">
          Plern Ping
        </h2>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      
      <p className="text-muted-foreground mb-8 animate-fade-in text-sm md:text-base">
        กำลังโหลด...
      </p>

      {/* Progress Bar with Shimmer */}
      <div className="relative w-64 md:w-72">
        <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect on progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        
        {/* Glow under progress bar */}
        <div 
          className="absolute -bottom-2 left-0 h-4 bg-primary/30 rounded-full blur-md transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <p className="mt-4 text-sm text-muted-foreground font-medium">
        {progress}%
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
