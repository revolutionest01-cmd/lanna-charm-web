import { useNavigate, useLocation } from "react-router-dom";
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

  const tabs = [
    { label: t.home, href: "/", icon: Home, section: "hero" },
    { label: t.about, href: "/#features", icon: Info, section: "features" },
    { label: t.eventsTitle, href: "/#events", icon: Calendar, section: "events" },
    { label: t.rooms, href: "/#rooms", icon: Bed, section: "rooms" },
    { label: t.menu, href: "/#menu", icon: Coffee, section: "menu" },
    { label: t.gallery, href: "/gallery", icon: Image, section: "gallery" },
    { label: t.reviews, href: "/reviews", icon: Star, section: "reviews" },
    { label: t.contact, href: "/#contact", icon: Mail, section: "contact" },
  ];

  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-stone-800/95',
          border: 'border-stone-700/50',
          text: 'text-stone-300',
          activeText: 'text-stone-100',
          activeBg: 'bg-stone-700/80',
          hoverBg: 'hover:bg-stone-700/60',
        };
      case 'warm':
        return {
          bg: 'bg-amber-100/95',
          border: 'border-amber-200/60',
          text: 'text-stone-600',
          activeText: 'text-highlight',
          activeBg: 'bg-amber-200/80',
          hoverBg: 'hover:bg-amber-200/60',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-100/95',
          border: 'border-stone-200/60',
          text: 'text-stone-500',
          activeText: 'text-stone-800',
          activeBg: 'bg-stone-200/80',
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
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
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

  // Hide on desktop (md and above), show on mobile/tablet
  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-10 sm:h-11 md:hidden">
      {/* Premium glassmorphism background with subtle shadow */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-xl border-b transition-all duration-700",
          "shadow-md shadow-black/5",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <ScrollArea className="relative z-10 h-full w-full">
        <div className="flex items-center h-full px-2 sm:px-3 gap-1 sm:gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const active = isActive(tab.href);
            
            return (
              <button
                key={tab.href}
                onClick={() => handleTabClick(tab.href)}
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full",
                  "text-[10px] sm:text-xs font-medium",
                  "transition-all duration-300 whitespace-nowrap",
                  "active:scale-95",
                  active 
                    ? cn(themeStyles.activeBg, themeStyles.activeText, "shadow-sm")
                    : cn(themeStyles.text, themeStyles.hoverBg)
                )}
              >
                <IconComponent className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-0.5 sm:h-1" />
      </ScrollArea>
    </div>
  );
};

export default TabBar;
