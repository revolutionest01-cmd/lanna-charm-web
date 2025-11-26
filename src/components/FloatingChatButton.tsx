import { useState } from "react";
import { MessageCircle, Phone, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import PricingChatbot from "./PricingChatbot";

const FloatingChatButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3 items-end">
        {isExpanded && (
          <div className="flex flex-col gap-2 animate-fade-in">
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

            <Button
              size="lg"
              variant="highlight"
              className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2"
              onClick={() => {
                setIsChatOpen(true);
                setIsExpanded(false);
              }}
            >
              <Bot size={20} />
              <span className="hidden sm:inline">
                {language === 'th' ? 'ถามราคา' : 'Ask Price'}
              </span>
            </Button>
          </div>
        )}

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
      </div>

      <PricingChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default FloatingChatButton;