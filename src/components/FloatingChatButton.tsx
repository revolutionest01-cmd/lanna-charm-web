import { useState } from "react";
import { MessageCircle, Phone, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import PricingChatbot from "./PricingChatbot";
import QuickInfoPopup from "./QuickInfoPopup";

const FloatingChatButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      <TooltipProvider>
        <div className="fixed top-1/2 -translate-y-1/2 right-4 sm:right-6 z-50 flex flex-col gap-3 items-end">
          {isExpanded && (
            <div className="flex flex-col gap-2 animate-fade-in">
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

          {/* Main Floating Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-11 w-11 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
              >
                <MessageCircle
                  size={22}
                  className={
                    isExpanded ? "rotate-90 transition-transform" : "transition-transform"
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{language === 'th' ? 'เปิดเมนู' : 'Open menu'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <PricingChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <QuickInfoPopup isOpen={isQuickInfoOpen} onClose={() => setIsQuickInfoOpen(false)} />
    </>
  );
};

export default FloatingChatButton;