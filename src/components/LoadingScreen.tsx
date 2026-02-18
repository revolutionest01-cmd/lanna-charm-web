import { useEffect, useState } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

const DURATION = 3000; // 3 seconds
const FADE_DURATION = 400;

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => setFadeOut(true), 100);
        setTimeout(() => onLoadingComplete(), 100 + FADE_DURATION);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ transitionDuration: `${FADE_DURATION}ms` }}
    >
      {/* Logo */}
      <div className="mb-6 animate-scale-in">
        <img
          src={plernpingLogo}
          alt="Plern Ping Cafe"
          className="w-36 h-36 object-contain"
        />
      </div>

      {/* Brand */}
      <h2 className="text-xl font-semibold text-foreground animate-fade-in tracking-wide">
        Plern Ping
      </h2>
      <p className="text-xs text-muted-foreground mt-1 mb-8 animate-fade-in tracking-[0.2em] uppercase">
        Cafe & Stay
      </p>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default LoadingScreen;
