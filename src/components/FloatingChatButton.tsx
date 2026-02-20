import { useState, useEffect, useRef } from "react";
import { Phone, HelpCircle, MessageCircle, X, ChevronLeft } from "lucide-react";
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

  // Hide on scroll down, show on scroll up (like TabBar)
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
        if (isOpen) setIsOpen(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const actions = [
    {
      icon: Phone,
      label: language === 'th' ? 'โทรเลย' : language === 'zh' ? '立即致电' : 'Call Now',
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-950',
      onClick: () => window.open('tel:+66818469098'),
    },
    {
      icon: HelpCircle,
      label: language === 'th' ? 'สอบถามข้อมูล' : language === 'zh' ? '查询信息' : 'Quick Info',
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-950',
      onClick: () => { setIsQuickInfoOpen(true); setIsOpen(false); },
    },
    {
      icon: MessageCircle,
      label: 'Plernping AI',
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-950',
      onClick: () => { setIsChatOpen(true); setIsOpen(false); },
    },
  ];

  return (
    <>
      {/* Toggle Tab - right edge, vertically centered */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed z-50 flex items-center gap-1.5",
          "rounded-l-2xl px-2.5 py-3 sm:px-3 sm:py-4",
          "bg-foreground text-background",
          "shadow-xl",
          "transition-all duration-300 ease-out",
          "hover:px-4 active:scale-95",
          // Position: vertically centered, move left when panel is open
          "top-1/2 -translate-y-1/2",
          isOpen ? "right-[15rem] sm:right-[17rem]" : "right-0",
          // Hide on scroll down
          !isVisible && !isOpen && "translate-x-full opacity-0 pointer-events-none"
        )}
        aria-label="Toggle help menu"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-semibold tracking-wide [writing-mode:vertical-lr] rotate-180">
              {language === 'th' ? 'ช่วยเหลือ' : language === 'zh' ? '帮助' : 'HELP'}
            </span>
          </>
        )}
      </button>

      {/* Slide-out Panel */}
      <div
        className={cn(
          "fixed top-1/2 -translate-y-1/2 right-0 z-40",
          "w-60 sm:w-[17rem] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="bg-card border border-border/60 rounded-l-2xl shadow-2xl overflow-hidden">
          {/* Panel Header */}
          <div className="px-5 py-4 bg-foreground">
            <p className="text-background font-bold text-base">
              {language === 'th' ? 'ช่วยเหลือ' : language === 'zh' ? '帮助中心' : 'Help Center'}
            </p>
            <p className="text-muted text-xs mt-0.5">
              {language === 'th' ? 'เลือกบริการที่ต้องการ' : language === 'zh' ? '选择您需要的服务' : 'Select a service'}
            </p>
          </div>

          {/* Actions */}
          <div className="p-3 space-y-2">
            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl",
                    "bg-card border border-border/40",
                    "hover:shadow-md hover:border-border active:scale-[0.98]",
                    "transition-all duration-200 text-left"
                  )}
                >
                  <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl", action.bg)}>
                    <Icon className={cn("h-4.5 w-4.5", action.color)} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{action.label}</span>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground ml-auto rotate-180" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
      )}

      <PricingChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <QuickInfoPopup isOpen={isQuickInfoOpen} onClose={() => setIsQuickInfoOpen(false)} />
    </>
  );
};

export default FloatingChatButton;
