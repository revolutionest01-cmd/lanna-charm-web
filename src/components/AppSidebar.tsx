import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, 
  MessageCircle, LogIn, LogOut, Shield, User, X, Sparkles, Menu
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

  const getThemeStyles = (theme: SectionTheme) => {
    switch (theme) {
      case 'dark':
        return {
          bg: 'bg-stone-900',
          border: 'border-stone-700/40',
          text: 'text-stone-100',
          muted: 'text-stone-400',
          hover: 'hover:bg-stone-800',
          active: 'bg-stone-800',
          separator: 'bg-stone-700/40',
        };
      case 'warm':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200/50',
          text: 'text-stone-800',
          muted: 'text-stone-500',
          hover: 'hover:bg-amber-100',
          active: 'bg-amber-100',
          separator: 'bg-amber-200/50',
        };
      case 'light':
      default:
        return {
          bg: 'bg-stone-50',
          border: 'border-stone-200/50',
          text: 'text-stone-800',
          muted: 'text-stone-500',
          hover: 'hover:bg-stone-100',
          active: 'bg-stone-100',
          separator: 'bg-stone-200/50',
        };
    }
  };

  const themeStyles = getThemeStyles(activeTheme);

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
    if (isMobile) setOpenMobile(false);
    
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
    <Sidebar 
      variant="sidebar" 
      collapsible="offcanvas"
      className="border-none top-0 h-screen z-50"
    >
      {/* Solid background */}
      <div className={cn(
        "absolute inset-0 border-r transition-colors duration-500 shadow-xl",
        themeStyles.bg,
        themeStyles.border
      )} />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className={cn("flex items-center justify-between p-4 border-b", themeStyles.border)}>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Plern Ping" className="h-9 w-auto" />
            <div>
              <h2 className={cn("text-lg font-bold tracking-wide", themeStyles.text)}>
                Plern Ping
              </h2>
              <p className={cn("text-[10px]", themeStyles.muted)}>
                {language === 'th' ? 'คาเฟ่ & ที่พัก' : language === 'zh' ? '咖啡馆 & 住宿' : 'Cafe & Stay'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
            className={cn("h-8 w-8 rounded-lg", themeStyles.hover, themeStyles.text)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4">
          <ScrollArea className="flex-1">
            <SidebarGroup>
              <SidebarGroupLabel className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", themeStyles.muted)}>
                {language === 'th' ? 'นำทาง' : language === 'zh' ? '导航' : 'Navigation'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.href)}
                          isActive={active}
                          className={cn(
                            "group w-full px-3 py-2.5 rounded-lg transition-all duration-200",
                            active 
                              ? cn(themeStyles.active, "shadow-sm")
                              : themeStyles.hover,
                          )}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                            active ? "bg-highlight/20" : "bg-transparent group-hover:bg-highlight/10"
                          )}>
                            <IconComponent className={cn(
                              "h-4 w-4 transition-colors duration-200",
                              active ? "text-highlight" : cn(themeStyles.muted, "group-hover:text-highlight")
                            )} />
                          </div>
                          <span className={cn(
                            "text-sm font-medium transition-colors duration-200",
                            active ? "text-highlight" : cn(themeStyles.text, "group-hover:text-highlight")
                          )}>
                            {item.label}
                          </span>
                          {active && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-highlight" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className={cn("my-3", themeStyles.separator)} />

            {/* Community */}
            <SidebarGroup>
              <SidebarGroupLabel className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2", themeStyles.muted)}>
                {language === 'th' ? 'ชุมชน' : language === 'zh' ? '社区' : 'Community'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavClick('/forum')}
                      isActive={location.pathname === '/forum'}
                      className={cn(
                        "group w-full px-3 py-2.5 rounded-lg transition-all duration-200",
                        location.pathname === '/forum' ? cn(themeStyles.active, "shadow-sm") : themeStyles.hover
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                        location.pathname === '/forum' ? "bg-highlight/20" : "bg-transparent group-hover:bg-highlight/10"
                      )}>
                        <MessageCircle className={cn(
                          "h-4 w-4 transition-colors duration-200",
                          location.pathname === '/forum' ? "text-highlight" : themeStyles.muted
                        )} />
                      </div>
                      <span className={cn(
                        "text-sm font-medium transition-colors duration-200",
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

        {/* Footer */}
        <SidebarFooter className={cn("p-4 mt-auto border-t", themeStyles.border)}>
          {isAuthenticated && user ? (
            <div className="space-y-3">
              {/* User Profile */}
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border",
                themeStyles.border, themeStyles.active
              )}>
                <Avatar className="h-10 w-10 ring-2 ring-highlight/30">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-highlight/15 text-highlight font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", themeStyles.text)}>{user.name}</p>
                  <p className={cn("text-[10px]", themeStyles.muted)}>
                    {isAdmin 
                      ? (language === 'th' ? 'ผู้ดูแลระบบ' : language === 'zh' ? '管理员' : 'Administrator')
                      : (language === 'th' ? 'สมาชิก' : language === 'zh' ? '会员' : 'Member')
                    }
                  </p>
                </div>
              </div>

              {/* Admin & Logout */}
              <div className="flex gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      navigate('/admin');
                    }}
                    className="flex-1 gap-2 h-9 rounded-lg bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary text-xs"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Admin
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
                    "gap-2 h-9 rounded-lg bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive text-xs",
                    isAdmin ? "" : "flex-1"
                  )}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {language === 'th' ? 'ออกจากระบบ' : language === 'zh' ? '退出' : 'Logout'}
                </Button>
              </div>
            </div>
          ) : (
            /* Login Button - clearly visible */
            <Button
              variant="highlight"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                navigate('/auth');
              }}
              className="w-full gap-2 h-10 rounded-lg font-semibold shadow-md"
            >
              <LogIn className="h-4 w-4" />
              {language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : 'Login'}
            </Button>
          )}

          <SidebarSeparator className={cn("my-2", themeStyles.separator)} />

          {/* Language & Booking */}
          <div className="flex gap-2">
            <LanguageDropdown variant="dark" />
            <BookingDialog>
              <Button 
                className="flex-1 gap-2 h-10 text-sm font-semibold rounded-lg bg-gradient-to-r from-highlight to-primary hover:opacity-90 shadow-md text-white"
              >
                <Bed className="h-4 w-4" />
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
