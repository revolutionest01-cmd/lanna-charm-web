import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, MessageCircle, Phone, DollarSign, MessageSquare } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import PricingChatbot from "./PricingChatbot";
import QuickInfoPopup from "./QuickInfoPopup";
import natureSound from "@/assets/nature-ambient.m4a";

const FloatingActions = () => {
  const { language } = useLanguage();
  
  // Sound state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  
  // Chat state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = useState(false);

  // Audio setup
  useEffect(() => {
    const audio = new Audio(natureSound);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const attemptAutoplay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
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
    <>
      <TooltipProvider>
        {/* Floating action group - fixed bottom-right */}
        <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-40 flex flex-col items-end gap-3">
          
          {/* Volume Control Popup */}
          <div 
            className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${
              showVolumeControl ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-[120px]">
                <VolumeX className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Slider 
                  value={[volume * 100]} 
                  onValueChange={value => setVolume(value[0] / 100)} 
                  max={100} 
                  step={1} 
                  className="flex-1" 
                />
                <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Expanded Chat Options */}
          {isExpanded && (
            <div className="flex flex-col gap-2 animate-fade-in mb-2">
              {/* Call Now Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="highlight"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
                    onClick={() => window.open('tel:+66818469098')}
                  >
                    <Phone size={20} />
                    <span className="hidden sm:inline">
                      {language === 'th' ? 'โทรเลย' : 'Call Now'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{language === 'th' ? 'โทรติดต่อเรา' : 'Contact us by phone'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Inquire Information Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="highlight"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
                    onClick={() => {
                      setIsQuickInfoOpen(true);
                      setIsExpanded(false);
                    }}
                  >
                    <DollarSign size={20} />
                    <span className="hidden sm:inline">
                      {language === 'th' ? 'สอบถามข้อมูลเบื้องต้น' : 'Inquire Information'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{language === 'th' ? 'สอบถามข้อมูลเบื้องต้น' : 'Inquire basic information'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Plernping AI Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    variant="highlight"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
                    onClick={() => {
                      setIsChatOpen(true);
                      setIsExpanded(false);
                    }}
                  >
                    <MessageSquare size={20} />
                    <span className="hidden sm:inline">
                      Plernping AI
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Plernping AI</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Button Group */}
          <div className="flex items-center gap-2">
            {/* Sound Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  onClick={togglePlay} 
                  onMouseEnter={() => setShowVolumeControl(true)} 
                  onMouseLeave={() => setTimeout(() => setShowVolumeControl(false), 1500)} 
                  variant={isPlaying ? "default" : "secondary"} 
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                >
                  {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isPlaying 
                  ? (language === 'th' ? 'ปิดเสียง' : 'Mute') 
                  : (language === 'th' ? 'เปิดเสียง' : 'Unmute')
                }</p>
              </TooltipContent>
            </Tooltip>

            {/* Main Chat Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-11 w-11 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
                >
                  <MessageCircle
                    size={22}
                    className={isExpanded ? "rotate-90 transition-transform" : "transition-transform"}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{language === 'th' ? 'เปิดเมนู' : 'Open menu'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      <PricingChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <QuickInfoPopup isOpen={isQuickInfoOpen} onClose={() => setIsQuickInfoOpen(false)} />
    </>
  );
};

export default FloatingActions;
