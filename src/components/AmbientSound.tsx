import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import natureSound from "@/assets/nature-ambient.m4a";

const AmbientSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Default volume 30%
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // Create audio element
    const audio = new Audio(natureSound);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Try to autoplay
    const attemptAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        // Autoplay was prevented, user will need to click play
        console.log('Autoplay prevented, waiting for user interaction');
        setShowControls(true);
      }
    };

    // Small delay to ensure page is loaded
    setTimeout(attemptAutoplay, 1000);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setShowControls(false);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  return (
    <div className="fixed bottom-24 left-6 z-50 flex flex-col items-start gap-2">
      {/* Volume Control - shows when hovering */}
      <div
        className={`transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-[120px]">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="flex-1"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Play/Pause Button */}
      <Button
        size="icon"
        onClick={togglePlay}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setTimeout(() => setShowControls(false), 1000)}
        className="w-12 h-12 rounded-full shadow-lg"
        variant={isPlaying ? "default" : "secondary"}
      >
        {isPlaying ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </Button>
    </div>
  );
};

export default AmbientSound;
