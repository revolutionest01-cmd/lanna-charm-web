import { useState } from "react";
import { MessageCircle, Phone, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage";
import PricingChatbot from "./PricingChatbot";

const FloatingChatButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      <TooltipProvider>
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3 items-end">
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
                      setIsChatOpen(true);
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
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-[#c65539] hover:bg-[#8B6F47]"
              >
                <MessageCircle
                  size={24}
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
    </>
  );
};

export default FloatingChatButton;