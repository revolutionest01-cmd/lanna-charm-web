import { useState, useEffect, useRef } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
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

  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-stone-900/[0.97]',
          border: 'border-stone-700/30',
          text: 'text-stone-100',
          subText: 'text-stone-400',
          buttonBg: 'hover:bg-stone-700/50',
          buttonText: 'text-stone-300',
          divider: 'bg-stone-600/30',
        };
      case 'warm':
        return {
          bg: 'bg-amber-50/[0.97]',
          border: 'border-amber-200/40',
          text: 'text-stone-800',
          subText: 'text-stone-500',
          buttonBg: 'hover:bg-amber-100/70',
          buttonText: 'text-stone-600',
          divider: 'bg-amber-300/30',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-50/[0.97]',
          border: 'border-stone-200/40',
          text: 'text-stone-800',
          subText: 'text-stone-500',
          buttonBg: 'hover:bg-stone-100/70',
          buttonText: 'text-stone-600',
          divider: 'bg-stone-200/50',
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
    <div className="fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 md:h-14 safe-area-top">
      <div 
        className={cn(
          "absolute inset-0 transition-colors duration-500",
          themeStyles.bg,
        )} 
      />

      {/* Subtle bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px",
        themeStyles.border,
        "border-b"
      )} />
      
      <div className="relative z-10 h-full flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Left side - Menu Toggle & Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200 active:scale-95",
              themeStyles.buttonBg,
              themeStyles.buttonText,
              "border-0 shadow-none"
            )}
            aria-label="Toggle sidebar"
          >
            {isOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          {/* Subtle vertical divider */}
          <div className={cn("w-px h-6 sm:h-7", themeStyles.divider)} />

          <div className="flex items-center gap-2">
            <img 
              src={logo} 
              alt="Plern Ping" 
              className="h-6 sm:h-7 md:h-8 w-auto" 
            />
            <div className="flex flex-col">
              <span className={cn(
                "text-sm sm:text-base md:text-lg font-semibold tracking-wide leading-tight transition-colors duration-300",
                themeStyles.text
              )}>
                Plern Ping
              </span>
              <span className={cn(
                "text-[8px] sm:text-[9px] md:text-[10px] font-medium tracking-[0.15em] uppercase leading-tight transition-colors duration-300",
                themeStyles.subText
              )}>
                Cafe & Stay
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Volume Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div 
            className={cn(
              "hidden md:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
            )}
          >
            <Slider
              value={[volume * 100]}
              onValueChange={(value) => setVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 2000)}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200",
              "active:scale-95 border-0 shadow-none",
              themeStyles.buttonBg,
              isPlaying ? "text-highlight" : themeStyles.buttonText
            )}
            aria-label={isPlaying ? "Mute sound" : "Play sound"}
          >
            {isPlaying ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Secondbar;
