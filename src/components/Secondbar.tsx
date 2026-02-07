import { useState, useEffect, useRef } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import natureSound from "@/assets/nature-ambient.m4a";
import { useActiveSection, SectionTheme } from "@/hooks/useActiveSection";

const Secondbar = () => {
  const { toggleSidebar, state } = useSidebar();
  const isOpen = state === "expanded";
  const { activeTheme } = useActiveSection();
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Theme-based styling - improved text contrast
  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-black/30',
          border: 'border-white/20',
          text: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
          buttonBg: 'bg-white/15 hover:bg-white/25',
          buttonText: 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]',
        };
      case 'warm':
        return {
          bg: 'bg-background/40',
          border: 'border-highlight/25',
          text: 'text-foreground drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]',
          buttonBg: 'bg-highlight/15 hover:bg-highlight/25',
          buttonText: 'text-foreground',
        };
      case 'light':
      default:
        return {
          bg: 'bg-background/50',
          border: 'border-border/25',
          text: 'text-foreground',
          buttonBg: 'bg-muted/40 hover:bg-muted/60',
          buttonText: 'text-foreground',
        };
    }
  };

  const themeStyles = getThemeStyles(activeTheme);

  useEffect(() => {
    const audio = new Audio(natureSound);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const attemptAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.log('Autoplay prevented, waiting for user interaction');
      }
    };

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
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14">
      {/* Ultra transparent glassmorphism background */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-2xl border-b transition-all duration-700 ease-out",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <div className="relative z-10 h-full flex items-center justify-between px-4">
        {/* Left side - Menu Toggle & Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-500",
              "hover:scale-105 border backdrop-blur-sm",
              themeStyles.buttonBg,
              themeStyles.border,
              themeStyles.buttonText
            )}
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <X className={cn("h-5 w-5 transition-transform duration-300", themeStyles.buttonText)} />
            ) : (
              <Menu className={cn("h-5 w-5 transition-transform duration-300", themeStyles.buttonText)} />
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Plern Ping" 
              className="h-8 w-auto drop-shadow-[0_0_12px_rgba(198,85,57,0.5)]" 
            />
            <span className={cn(
              "text-lg font-semibold tracking-wide hidden sm:block transition-colors duration-500",
              themeStyles.text
            )}>
              Plern Ping
            </span>
          </div>
        </div>

        {/* Right side - Volume Controls */}
        <div className="flex items-center gap-2">
          {/* Volume Slider - shows on hover/click */}
          <div 
            className={cn(
              "flex items-center gap-2 transition-all duration-300 overflow-hidden",
              showVolumeSlider ? "w-32 opacity-100" : "w-0 opacity-0"
            )}
          >
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 2000)}
            className={cn(
              "h-10 w-10 rounded-xl transition-all duration-500",
              "hover:scale-105 border backdrop-blur-sm",
              themeStyles.buttonBg,
              themeStyles.border,
              isPlaying ? "bg-highlight/30 text-highlight" : themeStyles.buttonText
            )}
            aria-label={isPlaying ? "Mute sound" : "Play sound"}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Secondbar;
