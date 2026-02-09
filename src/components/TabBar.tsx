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
          bg: 'bg-black/60',
          border: 'border-white/20',
          text: 'text-white/80',
          activeText: 'text-white',
          activeBg: 'bg-white/25',
          hoverBg: 'hover:bg-white/15',
        };
      case 'warm':
        return {
          bg: 'bg-background/70',
          border: 'border-highlight/25',
          text: 'text-foreground/80',
          activeText: 'text-highlight',
          activeBg: 'bg-highlight/25',
          hoverBg: 'hover:bg-highlight/15',
        };
      case 'light':
      default:
        return {
          bg: 'bg-background/80',
          border: 'border-border/25',
          text: 'text-foreground/80',
          activeText: 'text-foreground',
          activeBg: 'bg-muted/60',
          hoverBg: 'hover:bg-muted/40',
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

  // Hide on desktop (md and above)
  return (
    <div className="fixed top-14 left-0 right-0 z-40 h-11 md:hidden">
      {/* Glassmorphism background */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-xl border-b transition-all duration-700",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <ScrollArea className="relative z-10 h-full w-full">
        <div className="flex items-center h-full px-2 gap-1 min-w-max">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const active = isActive(tab.href);
            
            return (
              <button
                key={tab.href}
                onClick={() => handleTabClick(tab.href)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  "transition-all duration-300 whitespace-nowrap",
                  active 
                    ? cn(themeStyles.activeBg, themeStyles.activeText, "shadow-sm")
                    : cn(themeStyles.text, themeStyles.hoverBg)
                )}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
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
