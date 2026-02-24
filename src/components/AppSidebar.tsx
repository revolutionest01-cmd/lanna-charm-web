import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { 
  Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, 
  MessageCircle, LogIn, LogOut, Shield, User, X, Sparkles, Menu, Trash2, Heart, Map
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import sweetAlert from "@/lib/sweetAlert";
import BookingDialog from "./BookingDialog";
import LanguageDropdown from "./LanguageDropdown";
import UtilityTools from "./UtilityTools";
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
import logo from "@/assets/plernping-logo-White.png";
import logoNormal from "@/assets/logo.png";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>('hero');
  const [isBookingHovered, setIsBookingHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const { language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdmin } = useAdminStatus();
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

  // Sync selectedMenuItem with scroll position
  useEffect(() => {
    if (location.pathname === '/') {
      setSelectedMenuItem(activeSection || 'hero');
    }
  }, [activeSection, location.pathname]);

  // Listen for dark mode changes
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    };

    const observer = new MutationObserver(() => {
      handleThemeChange();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);


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
          <button
            onClick={() => navigate("/")}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 rounded-lg flex-1",
              "border shadow-sm transition-all duration-200",
              "bg-primary/40 hover:shadow-md hover:bg-primary/50",
              "border-primary/50 hover:border-primary/60",
              "active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40"
            )}
            aria-label="Go to home"
          >
            <img src={isDarkMode ? logoNormal : logo} alt="Plern Ping" className="h-16 w-auto object-contain" />
            <div className="flex-1">
              <h2 className={cn("text-lg font-black tracking-wider leading-tight", themeStyles.text)}>
                Plern Ping
              </h2>
              <p className={cn("text-xs font-semibold tracking-wide", themeStyles.muted)}>
                {language === 'th' ? 'คาเฟ่ & ที่พัก' : language === 'zh' ? '咖啡馆 & 住宿' : 'Cafe & Stay'}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <SidebarContent className="px-3 py-4">
          <ScrollArea className="flex-1">
            <div className="mb-3 px-2">
              <p className={cn("text-sm font-semibold italic text-center", themeStyles.muted)}>
                {language === 'th' ? 'ค้นหามุมสงบ จบที่เพลินพิง' : language === 'zh' ? '宻找一个安静的角久，就在橫汇沧' : 'Find Your Sanctuary, Stay With Plern Ping'}
              </p>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2 text-center w-full flex justify-center", themeStyles.muted)}>
                {language === 'th' ? 'กรุณาเลือกหัวข้อที่ต้องการ' : language === 'zh' ? '选择您要的主题' : 'Choose Your Topic'}
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
              <SidebarGroupLabel className={cn("text-[10px] font-semibold uppercase tracking-wider mb-2 text-center w-full flex justify-center", themeStyles.muted)}>
                {language === 'th' ? 'เข้าร่วมชุมชนของเรา' : language === 'zh' ? '社区' : 'Community'}
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
                  
                  {/* Store Map Button */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        navigate('/');
                        setTimeout(() => {
                          const element = document.getElementById('contact');
                          if (element) {
                            const rect = element.getBoundingClientRect();
                            window.scrollTo({
                              top: window.scrollY + rect.top - 100,
                              behavior: 'smooth'
                            });
                          }
                        }, 100);
                      }}
                      title={language === 'th' ? 'แผนที่ของร้าน' : language === 'zh' ? '店铺地图' : 'Store Map'}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}
                      onFocus={() => setFocusedIndex(9)}
                      onBlur={() => setFocusedIndex(null)}
                      onMouseEnter={() => setHoveredIndex(9)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={cn(
                        "group relative w-full pl-2 pr-4 py-3 rounded-lg transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground/5",
                        hoveredIndex === 9 || focusedIndex === 9
                          ? "bg-primary/15 shadow-sm"
                          : "hover:bg-primary/10",
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 flex-shrink-0",
                        hoveredIndex === 9 || focusedIndex === 9
                          ? "bg-primary/30 shadow-sm"
                          : "bg-background/10 group-hover:bg-primary/20"
                      )}>
                        <Map
                          className="h-4 w-4 transition-all duration-300 drop-shadow-sm"
                          style={{ color: (hoveredIndex === 9 || focusedIndex === 9) ? 'hsl(var(--primary))' : 'hsl(var(--background))' }}
                          aria-hidden
                        />
                      </div>
                      
                      {/* Label - always visible and readable */}
                      <span className={cn(
                        "text-sm transition-all duration-300 font-medium flex-1 truncate",
                        hoveredIndex === 9 || focusedIndex === 9
                          ? "text-primary drop-shadow-sm"
                          : "text-background"
                      )}>
                        {language === 'th' ? 'แผนที่ของร้าน' : language === 'zh' ? '店铺地图' : 'Store Map'}
                      </span>
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
        <SidebarFooter className={cn("p-3 mt-auto border-t", themeStyles.border)}>
          {isAuthenticated && user ? (
            <div className="space-y-2.5">
              {/* User Profile Card - Minimal & Elegant */}
              <div className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200",
                "bg-gradient-to-br from-highlight/8 to-highlight/5",
                "border border-highlight/15 hover:border-highlight/25",
                "hover:shadow-sm hover:from-highlight/12 hover:to-highlight/8"
              )}>
                {/* Avatar - Handle both emoji and URL avatars */}
                {user.avatar && /^[\p{Emoji}]$/u.test(user.avatar) ? (
                  // Emoji Avatar
                  <div className="h-10 w-10 rounded-[10px] bg-gradient-to-br from-primary/25 to-primary/15 flex items-center justify-center text-lg font-semibold ring-1.5 ring-primary/30 text-foreground flex-shrink-0">
                    {user.avatar}
                  </div>
                ) : (
                  // Image or Fallback Avatar
                  <Avatar className="h-10 w-10 ring-1.5 ring-primary/30 flex-shrink-0">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-foreground font-semibold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", themeStyles.text)}>{user.name}</p>
                  <p className={cn("text-[11px] tracking-wide", themeStyles.muted)}>
                    {isAdmin 
                      ? (language === 'th' ? 'ผู้ดูแลระบบ' : language === 'zh' ? '管理员' : 'Administrator')
                      : (language === 'th' ? 'สมาชิก' : language === 'zh' ? '会员' : 'Member')
                    }
                  </p>
                </div>
              </div>

              {/* Admin & Logout - Refined & Minimal */}
              <div className="flex gap-2 mt-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      navigate('/admin');
                    }}
                    className={cn(
                      "flex-1 gap-2 h-9 rounded-lg font-medium text-xs transition-all duration-200",
                      "bg-gradient-to-r from-[hsl(var(--highlight))]/20 to-[hsl(var(--highlight))]/10",
                      "border border-[hsl(var(--highlight))]/40 hover:border-[hsl(var(--highlight))]/60",
                      "text-[hsl(var(--highlight))]",
                      "hover:bg-gradient-to-r hover:from-[hsl(var(--highlight))]/30 hover:to-[hsl(var(--highlight))]/20",
                      "hover:shadow-md hover:shadow-[hsl(var(--highlight))]/15 active:scale-95"
                    )}
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
                    sweetAlert.success(language === 'th' ? 'ออกจากระบบสำเร็จ' : language === 'zh' ? '成功登出' : language === 'ja' ? 'ログアウトしました' : 'Logged out successfully');
                  }}
                  className={cn(
                    "flex-1 gap-2 h-9 rounded-lg font-medium text-xs transition-all duration-200",
                    "bg-gradient-to-r from-[hsl(var(--accent))]/25 to-[hsl(var(--secondary))]/20",
                    "border border-[hsl(var(--accent))]/40 hover:border-[hsl(var(--accent))]/60",
                    "text-foreground/75 hover:text-foreground",
                    "hover:bg-gradient-to-r hover:from-[hsl(var(--accent))]/35 hover:to-[hsl(var(--secondary))]/30",
                    "hover:shadow-md hover:shadow-foreground/10 active:scale-95"
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
          <div className="space-y-2">
            <LanguageDropdown variant="dark" className="w-full" />
            <BookingDialog>
              <button 
                className="w-full relative"
                onMouseEnter={() => setIsBookingHovered(true)}
                onMouseLeave={() => setIsBookingHovered(false)}
              >
                {/* Hover Badge - Only shows on button hover */}
                <div className={cn(
                  "absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-foreground rounded-full text-background/70 font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-300 pointer-events-none shadow-lg border border-primary/30 z-50",
                  isBookingHovered ? "opacity-100 animate-bounce-up scale-100" : "opacity-0 scale-0"
                )}>
                  {language === 'th' ? '😍 กดจองเลย!' : language === 'zh' ? '😍 点击预定!' : '😍 Book Now!'}
                </div>
                
                {/* Glow background - outer */}
                <div className={cn(
                  "absolute inset-0 h-11 rounded-lg bg-gradient-to-r from-slate-100 via-white to-slate-100 transition-opacity duration-300 blur-lg animate-pulse -z-10 -m-1",
                  isBookingHovered ? "opacity-40" : "opacity-0"
                )} />
                
                {/* Glow background - inner */}
                <div className={cn(
                  "absolute inset-0 h-11 rounded-lg bg-gradient-to-r from-white via-slate-50 to-white transition-opacity duration-300 blur-md -z-5 animate-pulse",
                  isBookingHovered ? "opacity-35" : "opacity-0"
                )} style={{ animationDelay: '0.2s' }} />
                
                {/* Main button */}
                <div className={cn(
                  "w-full gap-2 h-11 text-sm font-bold rounded-lg transition-all duration-300 active:scale-95 relative z-10",
                  "bg-primary/35 shadow-lg border-2 border-white/60",
                  isBookingHovered 
                    ? "scale-105 bg-primary/45 shadow-[0_4px_16px_rgba(var(--primary),0.4)] border-white/80" 
                    : "hover:scale-105 hover:bg-primary/45 hover:shadow-[0_4px_16px_rgba(var(--primary),0.4)]",
                  "text-background overflow-hidden flex items-center justify-center"
                )}>
                  <span className={cn(
                    "absolute inset-0 rounded-lg transition-colors duration-200",
                    isBookingHovered ? "bg-white/10" : "bg-black/0"
                  )} />
                  <Heart className={cn(
                    "h-4 w-4 flex-shrink-0 relative z-10 fill-current text-pink-500",
                    isBookingHovered && "animate-pulse"
                  )} style={{ animationDelay: '0s' }} />
                  <span className="truncate relative z-10 ml-1">{t.bookNow}</span>
                </div>
              </button>
            </BookingDialog>


          </div>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
