import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Home, Info, Calendar, Bed, Coffee, Image, Star, Mail } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useActiveSection, SectionTheme } from "@/hooks/useActiveSection";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const TabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { activeTheme } = useActiveSection();
  const t = translations[language];

  // Hide on scroll down, show on scroll up
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tabs = [
    { label: t.home, href: "/", icon: Home },
    { label: t.about, href: "/#features", icon: Info },
    { label: t.eventsTitle, href: "/#events", icon: Calendar },
    { label: t.rooms, href: "/#rooms", icon: Bed },
    { label: t.menu, href: "/#menu", icon: Coffee },
    { label: t.gallery, href: "/gallery", icon: Image },
    { label: t.reviews, href: "/reviews", icon: Star },
    { label: t.contact, href: "/#contact", icon: Mail },
  ];

  const getThemeStyles = (theme: SectionTheme) => {
    // All themes now use consistent darkbrown + light text
    return {
      bg: 'bg-foreground/95',
      border: 'border-primary/20',
      text: 'text-background/60',
      activeText: 'text-background',
      activeBg: 'bg-primary/20',
      activeRing: 'ring-1 ring-primary/20',
      hoverBg: 'hover:bg-primary/10',
      hoverText: 'hover:text-background/80',
    };
  };

  const themeStyles = getThemeStyles(activeTheme);

  const handleTabClick = (href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.substring(2);
      if (location.pathname === '/') {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(href);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    if (href.startsWith('/#')) return false;
    return location.pathname === href;
  };

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40 md:hidden overflow-hidden",
        "transition-all duration-300 ease-out",
        "top-12 sm:top-14",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-colors duration-500 backdrop-blur-sm bg-foreground"
        )}
      />
      {/* Subtle bottom gradient border */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent",
        themeStyles.border
      )} />

      <ScrollArea className="relative z-10 h-10 sm:h-12 w-full">
        <div className="flex items-center h-full px-2 sm:px-3 gap-1.5 sm:gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const active = isActive(tab.href);

            return (
              <button
                key={tab.href}
                onClick={() => handleTabClick(tab.href)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg shrink-0",
                  "text-[11px] sm:text-sm font-semibold tracking-wide",
                  "transition-all duration-200 whitespace-nowrap",
                  "active:scale-90 touch-manipulation",
                  "border shadow-md",
                  themeStyles.text,
                  "border-primary/30 bg-background/15",
                  "hover:bg-primary/20 hover:border-primary/50 hover:text-background/90 hover:shadow-lg"
                )}
              >
                <IconComponent className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0 transition-transform hover:scale-110" />
                <span className="truncate font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
};

export default TabBar;
