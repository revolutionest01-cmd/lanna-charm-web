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
          bg: 'bg-stone-900/95',
          border: 'border-stone-700/50',
          text: 'text-stone-300',
          activeText: 'text-stone-100',
          activeBg: 'bg-stone-800/80',
        };
      case 'warm':
        return {
          bg: 'bg-amber-50/95',
          border: 'border-amber-200/60',
          text: 'text-stone-600',
          activeText: 'text-highlight',
          activeBg: 'bg-amber-100/80',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-50/95',
          border: 'border-stone-200/60',
          text: 'text-stone-500',
          activeText: 'text-stone-800',
          activeBg: 'bg-stone-100/80',
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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Premium glassmorphism background with top shadow */}
      <div 
        className={cn(
          "absolute inset-0 backdrop-blur-2xl border-t transition-all duration-700",
          "shadow-[0_-8px_30px_rgba(0,0,0,0.12)]",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <div className="relative z-10 flex items-center justify-around h-16 sm:h-18 px-2 sm:px-4 pb-safe">
        {quickLinks.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2 sm:p-2.5 rounded-xl",
                "min-w-[56px] sm:min-w-[64px]",
                "transition-all duration-300 active:scale-90 touch-manipulation",
                active 
                  ? cn(themeStyles.activeBg, themeStyles.activeText)
                  : themeStyles.text
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all duration-300",
                active && "bg-highlight/20 shadow-[0_0_12px_rgba(198,85,57,0.35)]"
              )}>
                <IconComponent className={cn(
                  "h-5 w-5 sm:h-5.5 sm:w-5.5 transition-all duration-300",
                  active && "text-highlight scale-110"
                )} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
        
        {/* Book Now Button - Center - Elevated design */}
        <BookingDialog>
          <button className="flex flex-col items-center justify-center gap-0.5 p-1.5 sm:p-2 min-w-[56px] sm:min-w-[64px] touch-manipulation">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full",
              "bg-gradient-to-br from-highlight to-primary",
              "shadow-xl shadow-highlight/50 -mt-6 sm:-mt-7",
              "border-4 border-background/90",
              "transition-all duration-300 active:scale-90"
            )}>
              <Bed className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-highlight leading-tight">{t.bookNow}</span>
          </button>
        </BookingDialog>
        
        {/* Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2 sm:p-2.5 rounded-xl",
            "min-w-[56px] sm:min-w-[64px]",
            "transition-all duration-300 active:scale-90 touch-manipulation",
            themeStyles.text
          )}
        >
          <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl">
            <Menu className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
            {language === 'th' ? 'เมนู' : language === 'zh' ? '菜单' : 'Menu'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
