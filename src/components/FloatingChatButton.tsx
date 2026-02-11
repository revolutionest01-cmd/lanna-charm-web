import { useState } from "react";
import { MessageCircle, Phone, DollarSign, MessageSquare, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import PricingChatbot from "./PricingChatbot";
import QuickInfoPopup from "./QuickInfoPopup";

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      {/* Toggle Tab - always visible, docked to right edge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-40 flex items-center justify-center",
          "w-10 h-12 sm:w-11 sm:h-14 rounded-l-xl",
          "bg-gradient-to-b from-highlight to-primary text-white",
          "shadow-lg transition-all duration-300 ease-out",
          "hover:w-12 sm:hover:w-14 active:scale-95",
          isOpen ? "right-56 sm:right-64" : "right-0"
        )}
        aria-label="Toggle help menu"
      >
        {isOpen ? (
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </button>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed top-1/2 -translate-y-1/2 right-0 z-40",
          "w-56 sm:w-64 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="bg-card border border-border rounded-l-2xl shadow-2xl overflow-hidden">
          {/* Panel Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-highlight to-primary">
            <p className="text-white font-semibold text-sm">
              {language === 'th' ? 'ช่วยเหลือ' : language === 'zh' ? '帮助' : 'Help'}
            </p>
            <p className="text-white/70 text-[10px]">
              {language === 'th' ? 'เลือกบริการที่ต้องการ' : language === 'zh' ? '选择您需要的服务' : 'Select a service'}
            </p>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {/* Call Now */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-11 rounded-xl border-border/50 hover:bg-accent text-foreground"
              onClick={() => window.open('tel:+66818469098')}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <Phone className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium">
                {language === 'th' ? 'โทรเลย' : language === 'zh' ? '立即致电' : 'Call Now'}
              </span>
            </Button>

            {/* Quick Info */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-11 rounded-xl border-border/50 hover:bg-accent text-foreground"
              onClick={() => {
                setIsQuickInfoOpen(true);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium">
                {language === 'th' ? 'สอบถามข้อมูล' : language === 'zh' ? '查询信息' : 'Quick Info'}
              </span>
            </Button>

            {/* Plernping AI */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-11 rounded-xl border-border/50 hover:bg-accent text-foreground"
              onClick={() => {
                setIsChatOpen(true);
                setIsOpen(false);
              }}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-highlight/10">
                <MessageSquare className="h-3.5 w-3.5 text-highlight" />
              </div>
              <span className="text-sm font-medium">Plernping AI</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/10"
          onClick={() => setIsOpen(false)}
        />
      )}

      <PricingChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <QuickInfoPopup isOpen={isQuickInfoOpen} onClose={() => setIsQuickInfoOpen(false)} />
    </>
  );
};

export default FloatingChatButton;
