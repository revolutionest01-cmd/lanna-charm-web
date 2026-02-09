import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, 
  MessageCircle, LogIn, LogOut, Shield, User, X, Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import LanguageDropdown from "./LanguageDropdown";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveSection, SectionTheme } from "@/hooks/useActiveSection";
import logo from "@/assets/logo.png";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { activeTheme } = useActiveSection();
  const t = translations[language];
  const isCollapsed = state === "collapsed";

  // Theme-based styling - high contrast for visibility
  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-black/70',
          border: 'border-white/20',
          text: 'text-white',
          muted: 'text-white/70',
          hover: 'hover:bg-white/15',
          active: 'bg-white/20',
          separator: 'bg-white/20',
        };
      case 'warm':
        return {
          bg: 'bg-background/80',
          border: 'border-highlight/30',
          text: 'text-foreground',
          muted: 'text-foreground/70',
          hover: 'hover:bg-highlight/15',
          active: 'bg-highlight/20',
          separator: 'bg-highlight/30',
        };
      case 'light':
      default:
        return {
          bg: 'bg-background/90',
          border: 'border-border/30',
          text: 'text-foreground',
          muted: 'text-foreground/60',
          hover: 'hover:bg-muted/50',
          active: 'bg-muted/60',
          separator: 'bg-border/40',
        };
    }
  };

  const themeStyles = getThemeStyles(activeTheme);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data && !error);
    };

    checkAdminStatus();
  }, [user]);

  const navItems = [
    { label: t.home, href: "/", icon: Home },
    { label: t.about, href: "/#features", icon: Info },
    { label: t.eventsTitle, href: "/#events", icon: Calendar },
    { label: t.rooms, href: "/#rooms", icon: Bed },
    { label: t.menu, href: "/#menu", icon: Coffee },
    { label: t.gallery, href: "/gallery", icon: Image },
    { label: t.reviews, href: "/reviews", icon: Star },
    { label: t.contact, href: "/#contact", icon: Mail },
  ];

  const handleNavClick = (href: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    
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

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="offcanvas"
      className="border-none top-0 h-screen z-50"
    >
      {/* Solid background with enhanced shadow */}
      <div 
        className={cn(
          "absolute inset-0 border-r transition-colors duration-500",
          "shadow-2xl shadow-black/20",
          themeStyles.bg,
          themeStyles.border
        )} 
      />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header with Logo & Close - responsive sizing */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <img 
                src={logo} 
                alt="Plern Ping" 
                className="h-8 sm:h-10 w-auto drop-shadow-[0_0_15px_rgba(198,85,57,0.5)]" 
              />
              <Sparkles className="absolute -top-1 -right-1 h-2.5 sm:h-3 w-2.5 sm:w-3 text-highlight animate-pulse" />
            </div>
            <div>
              <h2 className={cn("text-base sm:text-lg font-bold tracking-wide", themeStyles.text)}>
                Plern Ping
              </h2>
              <p className={cn("text-[10px] sm:text-xs", themeStyles.muted)}>
                {language === 'th' ? 'คาเฟ่ & ที่พัก' : language === 'zh' ? '咖啡馆 & 住宿' : 'Cafe & Stay'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
            className={cn(
              "h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-all duration-300",
              "hover:bg-white/10 active:scale-95",
              themeStyles.text
            )}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Navigation - responsive padding */}
        <SidebarContent className="px-2 sm:px-3 py-3 sm:py-4">
          <ScrollArea className="flex-1">
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupLabel className={cn("text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 sm:mb-2", themeStyles.muted)}>
                {language === 'th' ? 'นำทาง' : language === 'zh' ? '导航' : 'Navigation'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 sm:space-y-1">
                  {navItems.map((item, index) => {
                    const IconComponent = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.href)}
                          isActive={active}
                          className={cn(
                            "group relative w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl",
                            "transition-all duration-300 active:scale-[0.98]",
                            "hover:translate-x-1",
                            active 
                              ? cn(themeStyles.active, "shadow-lg shadow-highlight/10")
                              : themeStyles.hover,
                            "animate-fade-in"
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl transition-all duration-300",
                            active 
                              ? "bg-highlight/30 shadow-[0_0_15px_rgba(198,85,57,0.4)]" 
                              : "bg-white/5 group-hover:bg-highlight/20"
                          )}>
                            <IconComponent className={cn(
                              "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300",
                              active ? "text-highlight" : cn(themeStyles.muted, "group-hover:text-highlight")
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm sm:text-base font-medium transition-colors duration-300",
                            active ? "text-highlight" : cn(themeStyles.text, "group-hover:text-highlight")
                          )}>
                            {item.label}
                          </span>
                          
                          {/* Active indicator */}
                          {active && (
                            <div className="absolute right-2 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-highlight shadow-[0_0_8px_rgba(198,85,57,0.6)]" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className={cn("my-3 sm:my-4", themeStyles.separator)} />

            {/* Community Section */}
            <SidebarGroup>
              <SidebarGroupLabel className={cn("text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1.5 sm:mb-2", themeStyles.muted)}>
                {language === 'th' ? 'ชุมชน' : language === 'zh' ? '社区' : 'Community'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavClick('/forum')}
                      isActive={location.pathname === '/forum'}
                      className={cn(
                        "group w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl",
                        "transition-all duration-300 active:scale-[0.98]",
                        "hover:translate-x-1",
                        location.pathname === '/forum' 
                          ? cn(themeStyles.active, "shadow-lg")
                          : themeStyles.hover
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl transition-all duration-300",
                        location.pathname === '/forum'
                          ? "bg-highlight/30 shadow-[0_0_15px_rgba(198,85,57,0.4)]"
                          : "bg-white/5 group-hover:bg-highlight/20"
                      )}>
                        <MessageCircle className={cn(
                          "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300",
                          location.pathname === '/forum' ? "text-highlight" : themeStyles.muted
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm sm:text-base font-medium transition-colors duration-300",
                        location.pathname === '/forum' ? "text-highlight" : themeStyles.text
                      )}>
                        {t.forum}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        {/* Footer - responsive sizing */}
        <SidebarFooter className="p-3 sm:p-4 mt-auto border-t border-white/10">
          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="space-y-2 sm:space-y-3">
              {/* User Profile Card */}
              <div className={cn(
                "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300",
                "bg-gradient-to-r from-white/10 to-white/5 border",
                themeStyles.border
              )}>
                <Avatar className="h-9 w-9 sm:h-11 sm:w-11 ring-2 ring-highlight/40 ring-offset-2 ring-offset-transparent">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-highlight/20 text-highlight font-semibold text-sm sm:text-base">
                    {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm sm:text-base font-semibold truncate", themeStyles.text)}>{user.name}</p>
                  <p className={cn("text-[10px] sm:text-xs", themeStyles.muted)}>
                    {isAdmin 
                      ? (language === 'th' ? 'ผู้ดูแลระบบ' : language === 'zh' ? '管理员' : 'Administrator')
                      : (language === 'th' ? 'สมาชิก' : language === 'zh' ? '会员' : 'Member')
                    }
                  </p>
                </div>
              </div>

              {/* Admin & Logout Buttons */}
              <div className="flex gap-1.5 sm:gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      navigate('/admin');
                    }}
                    className="flex-1 gap-1.5 sm:gap-2 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary"
                  >
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-[10px] sm:text-xs">Admin</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    logout();
                  }}
                  className={cn(
                    "gap-1.5 sm:gap-2 h-8 sm:h-9 rounded-lg sm:rounded-xl bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive",
                    isAdmin ? "" : "flex-1"
                  )}
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-[10px] sm:text-xs">
                    {language === 'th' ? 'ออก' : language === 'zh' ? '退出' : 'Logout'}
                  </span>
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                navigate('/auth');
              }}
              className="w-full gap-2 h-9 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>{language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : 'Login'}</span>
            </Button>
          )}

          <SidebarSeparator className={cn("my-2 sm:my-3", themeStyles.separator)} />

          {/* Language & Booking */}
          <div className="flex gap-1.5 sm:gap-2">
            <LanguageDropdown variant="dark" />
            <BookingDialog>
              <Button 
                className="flex-1 gap-1.5 sm:gap-2 h-9 sm:h-10 text-sm font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-highlight to-primary hover:opacity-90 shadow-lg shadow-highlight/20"
              >
                <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {t.bookNow}
              </Button>
            </BookingDialog>
          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
