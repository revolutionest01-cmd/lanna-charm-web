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

  // Theme-based styling - high contrast with warm tones
  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-stone-900/95',
          border: 'border-stone-700/50',
          text: 'text-stone-100',
          buttonBg: 'bg-stone-800/80 hover:bg-stone-700/80',
          buttonText: 'text-stone-100',
        };
      case 'warm':
        return {
          bg: 'bg-amber-50/95',
          border: 'border-amber-200/60',
          text: 'text-stone-800',
          buttonBg: 'bg-amber-100/80 hover:bg-amber-200/80',
          buttonText: 'text-stone-700',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-50/95',
          border: 'border-stone-200/60',
          text: 'text-stone-800',
          buttonBg: 'bg-stone-100/80 hover:bg-stone-200/80',
          buttonText: 'text-stone-700',
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
    <div className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16">
      {/* Premium glassmorphism background with shadow for separation */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-2xl border-b transition-all duration-700 ease-out",
          "shadow-lg shadow-black/5",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <div className="relative z-10 h-full flex items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left side - Menu Toggle & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all duration-500",
              "hover:scale-105 border backdrop-blur-sm",
              themeStyles.buttonBg,
              themeStyles.border,
              themeStyles.buttonText
            )}
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <X className={cn("h-4 w-4 md:h-5 md:w-5 transition-transform duration-300", themeStyles.buttonText)} />
            ) : (
              <Menu className={cn("h-4 w-4 md:h-5 md:w-5 transition-transform duration-300", themeStyles.buttonText)} />
            )}
          </Button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <img 
              src={logo} 
              alt="Plern Ping" 
              className="h-7 sm:h-8 md:h-9 w-auto drop-shadow-[0_0_12px_rgba(198,85,57,0.5)]" 
            />
            <span className={cn(
              "text-base sm:text-lg md:text-xl font-semibold tracking-wide transition-colors duration-500",
              themeStyles.text
            )}>
              Plern Ping
            </span>
          </div>
        </div>

        {/* Right side - Volume Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Volume Slider - shows on hover/click - hidden on small mobile */}
          <div 
            className={cn(
              "hidden sm:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              showVolumeSlider ? "w-24 md:w-32 opacity-100" : "w-0 opacity-0"
            )}
          >
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-20 md:w-24"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 2000)}
            className={cn(
              "h-9 w-9 md:h-10 md:w-10 rounded-xl transition-all duration-500",
              "hover:scale-105 border backdrop-blur-sm",
              themeStyles.buttonBg,
              themeStyles.border,
              isPlaying ? "bg-highlight/30 text-highlight" : themeStyles.buttonText
            )}
            aria-label={isPlaying ? "Mute sound" : "Play sound"}
          >
            {isPlaying ? (
              <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Secondbar;
