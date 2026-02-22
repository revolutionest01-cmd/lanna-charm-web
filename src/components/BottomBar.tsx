import { useNavigate, useLocation } from "react-router-dom";
import { Home, Bed, Coffee, MessageCircle, Menu, Sparkles, Heart } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import BookingDialog from "./BookingDialog";
import { useState, useEffect } from "react";

const BottomBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { toggleSidebar } = useSidebar();
  const t = translations[language];
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Detect scroll direction - hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show if scroll up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } 
      // Hide if scroll down past threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Use consistent theme with Navbar/Sidebar - dark foreground
  const getThemeStyles = () => {
    return {
      bg: 'bg-foreground',
      border: 'border-primary/20',
      text: 'text-background/70',
      activeText: 'text-background',
      activeBg: 'bg-primary/20',
    };
  };

  const themeStyles = getThemeStyles();

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
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out h-auto",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
    )}>
      {/* Darkbrown to grey glassmorphism background */}
      <div 
        className={cn(
          "absolute inset-0 border-t transition-all duration-300",
          "bg-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.4)]",
          "backdrop-blur-xl"
        )}
      />
      
      <div className="relative z-10 flex items-center justify-around h-14 sm:h-16 px-1 sm:px-2 pb-safe gap-0">
        {quickLinks.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 px-2.5 transition-all duration-300",
                "min-w-[56px] sm:min-w-[64px] active:scale-85 touch-manipulation relative",
                "hover:text-background hover:bg-primary/25 rounded-lg",
                "hover:shadow-[0_4px_16px_rgba(var(--primary),0.3)]",
                active 
                  ? "text-background bg-primary/30 shadow-[0_4px_16px_rgba(var(--primary),0.35)]"
                  : themeStyles.text
              )}
            >
              {active && (
                <div className="absolute inset-0 rounded-lg bg-primary/30 -z-10" />
              )}
              <IconComponent className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300",
                "hover:scale-125 active:scale-95",
                active ? "text-background font-bold scale-110" : ""
              )} />
              <span className={cn(
                "text-[8px] sm:text-[9px] leading-tight transition-all duration-300 font-semibold mt-1",
                active ? "text-background" : ""
              )}>{item.label}</span>
            </button>
          );
        })}
        
        {/* Book Now Button - Center - Inverted prominent design with glow */}
        <BookingDialog>
          <button className="flex flex-col items-center justify-center py-2.5 px-2 touch-manipulation transition-all duration-300 active:scale-85 hover:scale-125 relative group">
            {/* Hover Badge */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 rounded-full text-background font-bold text-sm sm:text-base whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-lg border-2 border-background/90 scale-0 group-hover:scale-100 transform group-hover:-translate-y-2 transition-all duration-300">
              {language === 'th' ? '😍 กดเพื่อจองเลย!' : language === 'zh' ? '😍 点击立即预定!' : '😍 Book Now!'}
            </div>
            
            {/* Animated glow background with theme colors */}
            <div className="absolute inset-0 -inset-1 w-14 h-14 sm:w-15 sm:h-15 rounded-lg bg-gradient-to-r from-slate-100 via-white to-slate-100 opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-lg animate-pulse -z-10" />
            
            {/* Second layer glow */}
            <div className="absolute inset-0 w-12 h-12 sm:w-13 sm:h-13 rounded-lg bg-gradient-to-r from-white via-slate-50 to-white opacity-0 group-hover:opacity-35 transition-opacity duration-300 blur-md -z-5 animate-pulse" style={{ animationDelay: '0.2s' }} />
            
            {/* Main button */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-lg relative z-10",
              "bg-primary/35 hover:bg-primary/45 active:bg-primary/55",
              "border-2 border-background/70 hover:border-background/80",
              "shadow-[0_4px_16px_rgba(var(--primary),0.3)] hover:shadow-[0_8px_24px_rgba(var(--primary),0.4)] -my-0.5",
              "transition-all duration-300 active:shadow-[0_2px_8px_rgba(var(--primary),0.2)]"
            )}>
              <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-background transition-all duration-300 hover:scale-130 font-bold fill-current animate-bounce" style={{ animationDelay: '0s' }} />
            </div>
          </button>
        </BookingDialog>
        
        {/* Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2.5 px-2.5 transition-all duration-300 rounded-lg",
            "min-w-[56px] sm:min-w-[64px] active:scale-85 touch-manipulation relative",
            "hover:text-background hover:bg-primary/25",
            "hover:shadow-[0_4px_16px_rgba(var(--primary),0.3)]",
            themeStyles.text
          )}
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300 hover:scale-125 active:scale-95" />
          <span className="text-[8px] sm:text-[9px] leading-tight transition-all duration-300 font-semibold mt-1">
            {language === 'th' ? 'เมนู' : language === 'zh' ? '菜单' : 'Menu'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
