import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { 
  Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, 
  MessageCircle, LogIn, LogOut, Shield, User, X, Sparkles, Menu, Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import LanguageDropdown from "./LanguageDropdown";
import UtilityTools from "./UtilityTools";
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
import { useActiveSection, type SectionTheme } from "@/hooks/useActiveSection";
import logo from "@/assets/logo.png";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('hero');
  const { language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { activeSection } = useActiveSection();
  const t = translations[language];

  const getThemeStyles = (theme: SectionTheme) => {
    // Use consistent dark foreground color like Help button
    return {
      bg: 'bg-foreground',
      border: 'border-primary/30',
      text: 'text-background',
      muted: 'text-background/60',
      hover: 'hover:bg-primary/20',
      active: 'bg-primary/20',
      separator: 'bg-primary/20',
    };
  };

  // Use fixed dark theme for sidebar - consistent with Help button
  const themeStyles = getThemeStyles('dark');

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

  // Sync selectedMenuItem with scroll position
  useEffect(() => {
    if (location.pathname === '/') {
      setSelectedMenuItem(activeSection || 'hero');
    }
  }, [activeSection, location.pathname]);


  const navItems = useMemo(() => ([
    { label: t.home, href: "/", icon: Home },
    { label: t.about, href: "/#features", icon: Info },
    { label: t.eventsTitle, href: "/#events", icon: Calendar },
    { label: t.rooms, href: "/#rooms", icon: Bed },
    { label: t.menu, href: "/#menu", icon: Coffee },
    { label: t.gallery, href: "/gallery", icon: Image },
    { label: t.reviews, href: "/reviews", icon: Star },
    { label: t.contact, href: "/#contact", icon: Mail },
  ]), [language]);

  const handleNavClick = (href: string) => {
    if (isMobile) setOpenMobile(false);
    
    if (href.startsWith('/#')) {
      const sectionId = href.substring(2);
      setSelectedMenuItem(sectionId);
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
      setSelectedMenuItem(href === '/' ? 'hero' : '');
      navigate(href);
      if (href === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const isActive = (href: string) => {
    if (href === '/') return selectedMenuItem === 'hero' && location.pathname === '/';
    if (href.startsWith('/#')) {
      const sectionId = href.substring(2);
      return selectedMenuItem === sectionId;
    }
    return location.pathname === href;
  };

  return (
    <Sidebar
      role="navigation"
      aria-label="Main navigation"
      variant="sidebar"
      collapsible="offcanvas"
      className="border-none top-0 h-screen z-50"
    >
      {/* Deep dark brown background (matching Help button) */}
      <div className={cn(
        "absolute inset-0 border-r transition-colors duration-500",
        "bg-foreground shadow-2xl shadow-black/40",
        themeStyles.border
      )} />

      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary/60 to-primary/40" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className={cn("flex items-center justify-between p-4 border-b", themeStyles.border)}>
          {/* Logo Card */}
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
            "border shadow-sm transition-all duration-200",
            "bg-primary/40 hover:shadow-md hover:bg-primary/50",
            "border-primary/50 hover:border-primary/60"
          )}>
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
            aria-label={isMobile ? 'Close mobile menu' : 'Toggle sidebar'}
            variant="ghost"
            size="icon"
            onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
            className={cn("h-8 w-8 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", themeStyles.hover, themeStyles.text)}
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
                <SidebarMenu className="space-y-1 relative">
                  {navItems.map((item, index) => {
                    const IconComponent = item.icon;
                    const active = isActive(item.href);
                    const isHovered = hoveredIndex === index;
                    const isFocused = focusedIndex === index;
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.href)}
                          isActive={active}
                          aria-current={active ? 'page' : undefined}
                          title={item.label}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick(item.href); } }}
                          onFocus={() => setFocusedIndex(index)}
                          onBlur={() => setFocusedIndex(null)}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={cn(
                            "group relative w-full pl-2 pr-4 py-3 rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground/5",
                            active 
                              ? "bg-primary/35 shadow-lg" 
                              : isHovered || isFocused
                                ? "bg-primary/15 shadow-sm"
                                : "hover:bg-primary/10",
                          )}
                        >
                          {/* Highlight bar - ONLY shows when ACTIVE, not on hover/focus */}
                          {active && (
                            <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-xl transition-all duration-300 ease-out",
                              "bg-gradient-to-b from-primary via-primary to-primary/50 shadow-lg shadow-primary/60"
                            )} />
                          )}
                          
                          {/* Icon */}
                          <div className={cn(
                            "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 flex-shrink-0",
                            active 
                              ? "bg-background/20 shadow-md" 
                              : isHovered || isFocused
                                ? "bg-primary/30 shadow-sm" 
                                : "bg-background/10 group-hover:bg-primary/20"
                          )}>
                            <IconComponent
                              className="h-4 w-4 transition-all duration-300 drop-shadow-sm"
                              style={{ color: (active || isHovered || isFocused) ? 'hsl(var(--primary))' : 'hsl(var(--background))' }}
                              aria-hidden
                            />
                          </div>
                          
                          {/* Label - always visible, truncate for long text */}
                          <span
                            className={cn(
                              "text-sm transition-all duration-300 font-medium flex-1 truncate",
                              active 
                                ? "font-bold drop-shadow-sm text-primary" 
                                : isHovered || isFocused
                                  ? "drop-shadow-sm text-primary" 
                                  : "text-background"
                            )}
                          >
                            {item.label}
                          </span>
                          
                          {/* Active indicator dot - only shows when active */}
                          {active && (
                            <div className="w-2 h-2 rounded-full bg-background animate-pulse shadow-lg shadow-background/50 flex-shrink-0" />
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
                      aria-current={location.pathname === '/forum' ? 'page' : undefined}
                      title={t.forum}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavClick('/forum'); } }}
                      onFocus={() => setFocusedIndex(8)}
                      onBlur={() => setFocusedIndex(null)}
                      onMouseEnter={() => setHoveredIndex(8)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={cn(
                        "group relative w-full pl-2 pr-4 py-3 rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground/5",
                        location.pathname === '/forum' 
                          ? "bg-primary/35 shadow-lg" 
                          : hoveredIndex === 8
                            ? "bg-primary/15 shadow-sm"
                            : "hover:bg-primary/10",
                      )}
                    >
                      {/* Highlight bar - ONLY shows when ACTIVE, not on hover */}
                      {location.pathname === '/forum' && (
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-xl transition-all duration-300 ease-out",
                          "bg-gradient-to-b from-primary via-primary to-primary/50 shadow-lg shadow-primary/60"
                        )} />
                      )}
                      
                      {/* Icon */}
                      <div className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 flex-shrink-0",
                        location.pathname === '/forum' 
                          ? "bg-background/20 shadow-md" 
                          : hoveredIndex === 8 || focusedIndex === 8
                            ? "bg-primary/30 shadow-sm"
                            : "bg-background/10 group-hover:bg-primary/20"
                      )}>
                        <MessageCircle
                          className="h-4 w-4 transition-all duration-300 drop-shadow-sm"
                          style={{ color: (location.pathname === '/forum' || hoveredIndex === 8 || focusedIndex === 8) ? 'hsl(var(--primary))' : 'hsl(var(--background))' }}
                          aria-hidden
                        />
                      </div>
                      
                      {/* Label - always visible and readable */}
                      <span className={cn(
                        "text-sm transition-all duration-300 font-medium flex-1 truncate",
                        location.pathname === '/forum' 
                          ? "text-primary font-bold drop-shadow-sm" 
                          : hoveredIndex === 8 || focusedIndex === 8
                            ? "text-primary drop-shadow-sm"
                            : "text-background"
                      )}>
                        {t.forum}
                      </span>
                      
                      {/* Active indicator dot - only shows when active */}
                      {location.pathname === '/forum' && (
                        <div className="w-2 h-2 rounded-full bg-background animate-pulse shadow-lg shadow-background/50 flex-shrink-0" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Utility Tools - Bottom of Sidebar (Admin Only) */}
            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-primary/20">
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-3", themeStyles.muted)}>
                  {language === 'th' ? 'เครื่องมือ' : language === 'zh' ? '工具' : 'Tools'}
                </p>
                <UtilityTools />
              </div>
            )}
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
                {/* Avatar - Handle both emoji and URL avatars */}
                {user.avatar && /^[\p{Emoji}]$/u.test(user.avatar) ? (
                  // Emoji Avatar
                  <div className="h-10 w-10 rounded-lg bg-highlight/15 flex items-center justify-center text-lg font-semibold ring-2 ring-highlight/30">
                    {user.avatar}
                  </div>
                ) : (
                  // Image or Fallback Avatar
                  <Avatar className="h-10 w-10 ring-2 ring-highlight/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-highlight/15 text-highlight font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
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
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      navigate('/admin');
                    }}
                    className="flex-1 gap-2 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-md ring-1 ring-primary/30"
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
