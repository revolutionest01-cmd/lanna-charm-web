import { useEffect, useState } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

const MIN_DURATION = 1500; // 1.5 seconds minimum to show branding
const MAX_DURATION = 8000; // 8 seconds maximum to allow data fetching
const FADE_DURATION = 300;

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    let completed = false;

    const handleComplete = () => {
      if (completed) return;
      completed = true;
      setFadeOut(true);
      setTimeout(() => {
        onLoadingComplete();
      }, FADE_DURATION);
    };

    // Update progress bar
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / MAX_DURATION) * 100, 100);
      setProgress(pct);
    }, 50);

    // Minimum duration before allowing close
    const minTimer = setTimeout(() => {
      // Check if document is ready
      if (document.readyState === 'complete') {
        handleComplete();
      }
    }, MIN_DURATION);

    // Absolute maximum timeout to prevent infinite loading
    const maxTimer = setTimeout(() => {
      clearInterval(interval);
      handleComplete();
    }, MAX_DURATION);

    // Also complete when DOM is fully loaded
    const completeOnReady = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= MIN_DURATION) {
        clearInterval(interval);
        clearTimeout(minTimer);
        clearTimeout(maxTimer);
        handleComplete();
      }
    };

    if (document.readyState === 'complete') {
      // Page already loaded, complete loading screen
      completeOnReady();
    } else {
      document.addEventListener('readystatechange', completeOnReady);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      document.removeEventListener('readystatechange', completeOnReady);
    };
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
