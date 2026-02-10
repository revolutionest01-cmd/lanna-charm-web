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
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-stone-800',
          border: 'border-stone-700/60',
          text: 'text-stone-400',
          activeText: 'text-stone-100',
          activeBg: 'bg-stone-700',
          hoverBg: 'hover:bg-stone-700/60',
        };
      case 'warm':
        return {
          bg: 'bg-amber-100',
          border: 'border-amber-200/60',
          text: 'text-stone-500',
          activeText: 'text-highlight',
          activeBg: 'bg-amber-200',
          hoverBg: 'hover:bg-amber-200/60',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-100',
          border: 'border-stone-200/60',
          text: 'text-stone-500',
          activeText: 'text-stone-800',
          activeBg: 'bg-stone-200',
          hoverBg: 'hover:bg-stone-200/60',
        };
    }
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
        "transition-all duration-300 ease-in-out",
        // Position below Secondbar with proper spacing
        "top-12 sm:top-14",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 border-b transition-colors duration-300 shadow-sm",
          themeStyles.bg,
          themeStyles.border
        )}
      />

      <ScrollArea className="relative z-10 h-10 sm:h-11 w-full">
        <div className="flex items-center h-full px-2 sm:px-3 gap-1 sm:gap-1.5">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const active = isActive(tab.href);

            return (
              <button
                key={tab.href}
                onClick={() => handleTabClick(tab.href)}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full shrink-0",
                  "text-[10px] sm:text-xs font-medium",
                  "transition-colors duration-200 whitespace-nowrap",
                  "active:scale-95 touch-manipulation",
                  active
                    ? cn(themeStyles.activeBg, themeStyles.activeText, "shadow-sm")
                    : cn(themeStyles.text, themeStyles.hoverBg)
                )}
              >
                <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-0.5" />
      </ScrollArea>
    </div>
  );
};

export default TabBar;
