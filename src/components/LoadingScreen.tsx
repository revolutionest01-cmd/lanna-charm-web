import { useEffect, useState } from "react";

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoadingComplete, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Logo */}
      <div className="mb-8 animate-scale-in">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary animate-pulse" />
        </div>
      </div>

      {/* Loading Text */}
      <h2 className="text-2xl font-semibold mb-2 animate-fade-in">
        Loading
      </h2>
      <p className="text-muted-foreground mb-8 animate-fade-in">
        Please wait...
      </p>

      {/* Progress Bar */}
      <div className="w-64 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <p className="mt-4 text-sm text-muted-foreground">
        {progress}%
      </p>
    </div>
  );
};

export default LoadingScreen;
