import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Volume2, VolumeX, X, ChevronDown, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import logo from "@/assets/plernping-logo-White.png";
import logoNormal from "@/assets/logo.png";
import natureSound from "@/assets/nature-ambient.m4a";
import { type SectionTheme } from "@/hooks/useActiveSection";
import { useLanguage, Language } from "@/hooks/useLanguage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: 'th' as Language, flag: '🇹🇭', nativeName: 'ไทย' },
  { code: 'zh' as Language, flag: '🇨🇳', nativeName: '中文' },
  { code: 'en' as Language, flag: '🇬🇧', nativeName: 'EN' },
  { code: 'ja' as Language, flag: '🇯🇵', nativeName: '日本語' },
];

const Secondbar = () => {
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const { language, setLanguage } = useLanguage();
  const currentLang = languages.find(l => l.code === language) || languages[0];
  const isOpen = state === "expanded";
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });

  const getThemeStyles = (theme: SectionTheme) => {
    // Use consistent dark foreground color like Help button
    return {
      bg: 'bg-foreground',
      bottomLine: 'bg-primary/20',
      text: 'text-background',
      subText: 'text-background/70',
      buttonBg: 'hover:bg-background/20',
      buttonText: 'text-background',
      divider: 'bg-primary/30',
    };
  };

  const themeStyles = getThemeStyles('warm');

  useEffect(() => {
    const audio = new Audio(natureSound);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;
    setAudioReady(true);

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

  // Listen for dark mode changes
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    const observer = new MutationObserver(() => {
      handleThemeChange();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

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

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-12 sm:h-14 md:h-14 safe-area-top">
      <div 
        className={cn(
          "absolute inset-0 transition-colors duration-500 shadow-lg shadow-black/40 bg-foreground"
        )}
      />

      {/* Top gradient accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        "bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      )} />

      {/* Subtle bottom accent line */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px",
        "bg-gradient-to-r from-transparent via-primary/40 to-transparent"
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

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 hover:opacity-85 transition-all duration-200 active:scale-95 px-3 py-1.5 rounded-lg hover:bg-background/10"
            aria-label="Go to home"
          >
            <img 
              src={isDarkMode ? logoNormal : logo}
              alt="Plern Ping" 
              className="h-8 sm:h-9 md:h-10 w-auto object-contain" 
            />
            <div className="flex flex-col">
              <span className={cn(
                "text-sm sm:text-base md:text-lg font-bold tracking-wide leading-tight transition-colors duration-300",
                themeStyles.text
              )}>
                Plern Ping
              </span>
              <span className={cn(
                "text-[7px] sm:text-[8px] md:text-[9px] font-semibold tracking-[0.15em] uppercase leading-tight transition-colors duration-300",
                themeStyles.subText
              )}>
                Cafe & Stay
              </span>
            </div>
          </button>
        </div>

        {/* Right side - Language + Sound Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Volume slider - visible on hover on md+ */}
          <div 
            className={cn(
              "hidden md:flex items-center gap-2 transition-all duration-300 overflow-hidden",
              showVolumeSlider && isPlaying ? "w-24 opacity-100" : "w-0 opacity-0"
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

          {/* Label text */}
          <span className={cn(
            "hidden md:flex flex-col text-[10px] font-semibold leading-tight text-right transition-colors duration-300 max-w-[100px] text-background/90"
          )}>
            {isPlaying ? (
              <><span>กำลังเล่น</span><span className={cn("text-[9px] font-normal mt-0.5", "text-background/70")}>เสียงธรรมชาติ</span></>
            ) : (
              <><span>กดเปิด / ปิด</span><span className={cn("text-[9px] font-normal mt-0.5", "text-background/70")}>เพื่อฟังเสียงธรรมชาติ</span></>
            )}
          </span>

          {/* Sound Toggle Button */}
          <Button
            variant={isPlaying ? "default" : "ghost"}
            size="icon"
            onClick={togglePlay}
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 2000)}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200 active:scale-95 flex-shrink-0",
              isPlaying
                ? "bg-[#c65539] text-white shadow-lg hover:bg-[#c65539]/90"
                : "bg-background/40 text-background hover:bg-background/60"
            )}
            aria-label={isPlaying ? "ปิดเสียง" : "เปิดเสียงธรรมชาติ"}
          >
            {isPlaying ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200 active:scale-95 flex-shrink-0",
              "bg-background/40 text-background hover:bg-background/60"
            )}
            aria-label={isDarkMode ? "Switch to Light mode" : "Switch to Dark mode"}
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          {/* Divider */}
          <div className={cn("w-px h-5", themeStyles.divider)} />

          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg",
                  "border transition-all duration-200 active:scale-95",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30",
                  "bg-background/20 border-background/40 hover:bg-background/30",
                  "text-background"
                )}
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className={cn(
                  "text-[10px] sm:text-xs font-semibold tracking-wide hidden sm:inline",
                  "text-background"
                )}>
                  {currentLang.nativeName}
                </span>
                <ChevronDown className={cn("h-3 w-3 opacity-70", "text-background")} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-[160px] p-1.5 bg-card border border-border/50 rounded-xl shadow-2xl z-[200]"
            >
              {languages.map((lang, i) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                    language === lang.code
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground",
                    "animate-in fade-in-0 slide-in-from-top-1"
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={cn(
                    "font-semibold text-sm",
                    language === lang.code ? "text-primary" : ""
                  )}>
                    {lang.nativeName}
                  </span>
                  {language === lang.code && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Secondbar;
