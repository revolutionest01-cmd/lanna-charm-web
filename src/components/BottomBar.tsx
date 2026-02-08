import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bed, Coffee, MessageCircle, Menu } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useActiveSection, SectionTheme } from "@/hooks/useActiveSection";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import BookingDialog from "./BookingDialog";

const BottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { activeTheme } = useActiveSection();
  const { toggleSidebar } = useSidebar();
  const t = translations[language];

  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-black/40',
          border: 'border-white/15',
          text: 'text-white/60',
          activeText: 'text-white',
          activeBg: 'bg-white/20',
        };
      case 'warm':
        return {
          bg: 'bg-background/50',
          border: 'border-highlight/20',
          text: 'text-foreground/60',
          activeText: 'text-highlight',
          activeBg: 'bg-highlight/20',
        };
      case 'light':
      default:
        return {
          bg: 'bg-background/60',
          border: 'border-border/20',
          text: 'text-foreground/60',
          activeText: 'text-foreground',
          activeBg: 'bg-muted/50',
        };
    }
  };

  const themeStyles = getThemeStyles(activeTheme);

  const handleNavClick = (href: string) => {
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

  const quickLinks = [
    { label: t.home, href: "/", icon: Home },
    { label: t.rooms, href: "/#rooms", icon: Bed },
    { label: t.menu, href: "/#menu", icon: Coffee },
    { label: t.forum, href: "/forum", icon: MessageCircle },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/' && !location.hash;
    if (href === '/forum') return location.pathname === '/forum';
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      {/* Glassmorphism background */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-2xl border-t transition-all duration-700",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <div className="relative z-10 flex items-center justify-around h-16 px-2">
        {quickLinks.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl min-w-[60px]",
                "transition-all duration-300",
                active 
                  ? cn(themeStyles.activeBg, themeStyles.activeText)
                  : themeStyles.text
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300",
                active && "bg-highlight/20 shadow-[0_0_10px_rgba(198,85,57,0.3)]"
              )}>
                <IconComponent className={cn(
                  "h-5 w-5 transition-all duration-300",
                  active && "text-highlight scale-110"
                )} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {/* Book Now Button - Center */}
        <BookingDialog>
          <button className="flex flex-col items-center justify-center gap-0.5 p-2 min-w-[60px]">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-highlight shadow-lg shadow-highlight/30 -mt-4 border-4 border-background/50">
              <Bed className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-highlight">{t.bookNow}</span>
          </button>
        </BookingDialog>
        
        {/* Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl min-w-[60px]",
            "transition-all duration-300",
            themeStyles.text
          )}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">
            {language === 'th' ? 'เมนู' : language === 'zh' ? '菜单' : 'Menu'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
