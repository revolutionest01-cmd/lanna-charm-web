import { useEffect, useState } from "react";
import plernpingLogo from "@/assets/plernping-logo.png";

const LoadingScreen = ({ onLoadingComplete }: { onLoadingComplete: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash for 1 second, then fade out over 400ms
    const timer = setTimeout(() => setFadeOut(true), 1000);
    const done = setTimeout(() => onLoadingComplete(), 1400);
    return () => { clearTimeout(timer); clearTimeout(done); };
  }, [onLoadingComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="mb-6 animate-scale-in">
        <img
          src={plernpingLogo}
          alt="Plern Ping Cafe"
          className="w-32 h-32 object-contain"
        />
      </div>
      <h2 className="text-lg font-semibold text-foreground animate-fade-in">
        Plern Ping
      </h2>
      <p className="text-xs text-muted-foreground mt-1 animate-fade-in">
        CAFE & STAY
      </p>
    </div>
  );
};

export default LoadingScreen;
