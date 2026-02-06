import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, 
  MessageCircle, LogIn, LogOut, Shield, User
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { language } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const t = translations[language];
  const isCollapsed = state === "collapsed";

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
    <TooltipProvider delayDuration={0}>
      <Sidebar 
        variant="sidebar" 
        collapsible="icon"
        className="border-none top-14 h-[calc(100vh-3.5rem)]"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-r border-border/30" />
        
        <div className="relative z-10 flex flex-col h-full">

        {/* Navigation */}
        <SidebarContent className="px-2">
          <ScrollArea className="flex-1">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item, index) => {
                    const IconComponent = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          onClick={() => handleNavClick(item.href)}
                          isActive={active}
                          tooltip={item.label}
                          className={cn(
                            "group relative transition-all duration-300",
                            "hover:bg-highlight/10 hover:text-highlight",
                            active && "bg-highlight/15 text-highlight font-medium",
                            "animate-fade-in"
                          )}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                            active 
                              ? "bg-highlight/20 shadow-[0_0_12px_rgba(198,85,57,0.3)]" 
                              : "bg-muted/30 group-hover:bg-highlight/15 group-hover:shadow-[0_0_8px_rgba(198,85,57,0.2)]"
                          )}>
                            <IconComponent className={cn(
                              "h-4 w-4 transition-all duration-300",
                              active ? "text-highlight" : "text-muted-foreground group-hover:text-highlight"
                            )} />
                          </div>
                          <span className={cn(
                            "transition-colors duration-300",
                            active ? "text-highlight" : "text-foreground group-hover:text-highlight"
                          )}>
                            {item.label}
                          </span>
                          
                          {/* Active indicator line */}
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-highlight rounded-r-full" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="opacity-30 my-2" />

            {/* Forum Link */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleNavClick('/forum')}
                      isActive={location.pathname === '/forum'}
                      tooltip={t.forum}
                      className={cn(
                        "group transition-all duration-300",
                        "hover:bg-highlight/10 hover:text-highlight",
                        location.pathname === '/forum' && "bg-highlight/15 text-highlight font-medium"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                        location.pathname === '/forum'
                          ? "bg-highlight/20 shadow-[0_0_12px_rgba(198,85,57,0.3)]"
                          : "bg-muted/30 group-hover:bg-highlight/15"
                      )}>
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span>{t.forum}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </ScrollArea>
        </SidebarContent>

        {/* Footer with User & Actions */}
        <SidebarFooter className="p-3 mt-auto">
          <SidebarSeparator className="opacity-30 mb-3" />
          
          {/* User Section */}
          {isAuthenticated && user ? (
            <div className="space-y-2">
              {/* User Profile */}
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-xl bg-muted/30 backdrop-blur-sm",
                isCollapsed && "justify-center p-2"
              )}>
                <Avatar className={cn("border-2 border-highlight/30", isCollapsed ? "h-8 w-8" : "h-10 w-10")}>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-highlight/20 text-highlight text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'th' ? 'ผู้ใช้งาน' : language === 'zh' ? '用户' : 'User'}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Button */}
              {isAdmin && (
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                        navigate('/admin');
                      }}
                      tooltip={language === 'th' ? 'แผงควบคุม' : 'Admin Panel'}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <span>{language === 'th' ? 'แผงควบคุม' : language === 'zh' ? '管理面板' : 'Admin Panel'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              )}

              {/* Logout */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      logout();
                    }}
                    tooltip={language === 'th' ? 'ออกจากระบบ' : 'Logout'}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <span>{language === 'th' ? 'ออกจากระบบ' : language === 'zh' ? '退出登录' : 'Logout'}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          ) : (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    if (isMobile) setOpenMobile(false);
                    navigate('/auth');
                  }}
                  tooltip={language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                  className="hover:bg-highlight/10 hover:text-highlight"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/30">
                    <LogIn className="h-4 w-4" />
                  </div>
                  <span>{language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : 'Login'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          )}

          <SidebarSeparator className="opacity-30 my-2" />

          {/* Language & Booking */}
          <div className={cn(
            "flex gap-2",
            isCollapsed ? "flex-col items-center" : "items-center"
          )}>
            <LanguageDropdown variant="dark" />
            
            {!isCollapsed && (
              <BookingDialog>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 font-semibold bg-[#c65539] hover:bg-[#b34a2f] shadow-lg"
                >
                  {t.bookNow}
                </Button>
              </BookingDialog>
            )}
          </div>
          
          {isCollapsed && (
            <BookingDialog>
              <Button 
                variant="default" 
                size="icon" 
                className="w-full h-10 font-semibold bg-[#c65539] hover:bg-[#b34a2f] shadow-lg"
                title={t.bookNow}
              >
                <Bed className="h-4 w-4" />
              </Button>
            </BookingDialog>
          )}
        </SidebarFooter>
        </div>
      </Sidebar>
    </TooltipProvider>
  );
};

export default AppSidebar;
