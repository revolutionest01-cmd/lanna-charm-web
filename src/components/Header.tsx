import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageCircle, LogIn, LogOut, Shield, Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import BookingDialog from "./BookingDialog";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const t = translations[language];
  const isForumPage = location.pathname === '/forum' || location.pathname === '/auth';

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
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const navItems = [{
    label: t.home,
    href: "/",
    icon: Home
  }, {
    label: t.about,
    href: "/#features",
    icon: Info
  }, {
    label: t.eventsTitle,
    href: "/#events",
    icon: Calendar
  }, {
    label: t.rooms,
    href: "/#rooms",
    icon: Bed
  }, {
    label: t.menu,
    href: "/#menu",
    icon: Coffee
  }, {
    label: t.gallery,
    href: "/gallery",
    icon: Image
  }, {
    label: t.reviews,
    href: "/reviews",
    icon: Star
  }, {
    label: t.contact,
    href: "/#contact",
    icon: Mail
  }];
  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (href.startsWith('/#')) {
      // Hash navigation within homepage
      const sectionId = href.substring(2);
      if (location.pathname === '/') {
        // Already on homepage, just scroll
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to homepage first, then scroll
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } else {
      // Regular page navigation
      navigate(href);
    }
  };
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg" : "bg-black/30 backdrop-blur-sm"}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={logo} alt="Plern Ping Cafe Logo" className="h-12 w-auto drop-shadow-[0_0_8px_rgba(198,85,57,0.3)] hover:drop-shadow-[0_0_15px_rgba(198,85,57,0.7)] transition-all duration-300" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map(item => {
              const IconComponent = item.icon;
              return (
                <a 
                  key={item.label} 
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative flex items-center gap-2 ${isScrolled ? "text-foreground hover:text-highlight" : "text-white"} font-medium transition-all duration-200 px-4 py-2.5 rounded-lg hover:bg-[#8B6F47]/20 hover:backdrop-blur-sm cursor-pointer`}
                >
                  <IconComponent size={18} className="flex-shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Language Toggle & CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            {!isForumPage && <Button variant="ghost" size="sm" onClick={() => navigate('/forum')} className={`${!isScrolled ? "text-white hover:text-white hover:bg-white/20" : ""}`}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {t.forum}
              </Button>}
            
            {/* Auth Buttons */}
            {isAuthenticated && user ? (
              <>
                {/* User Profile Display */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-highlight/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-highlight/20 text-highlight text-xs">
                      {user.name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`text-sm font-medium ${!isScrolled ? "text-white" : "text-foreground"}`}>
                    {user.name}
                  </span>
                </div>
                
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin')}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {language === 'th' ? 'Admin Panel' : 'Admin Panel'}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logout()}
                  className={`gap-2 ${!isScrolled ? "text-white hover:text-white hover:bg-white/20" : ""}`}
                >
                  <LogOut className="h-4 w-4" />
                  {language === 'th' ? 'ออกจากระบบ' : 'Logout'}
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className={`gap-2 ${!isScrolled ? "text-white hover:text-white hover:bg-white/20" : ""}`}
              >
                <LogIn className="h-4 w-4" />
                {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
              </Button>
            )}
            <div className={`inline-flex items-center rounded-full p-1 gap-1 transition-all duration-300 ${isScrolled ? "bg-secondary" : "bg-white/20 backdrop-blur-sm"}`}>
              <button
                onClick={() => setLanguage('th')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  language === 'th'
                    ? 'bg-highlight text-highlight-foreground shadow-sm scale-100'
                    : isScrolled
                    ? 'text-foreground hover:bg-background/50'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Switch to Thai"
              >
                <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇹🇭</span>
                <span className="text-sm font-semibold">ไทย</span>
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  language === 'zh'
                    ? 'bg-highlight text-highlight-foreground shadow-sm scale-100'
                    : isScrolled
                    ? 'text-foreground hover:bg-background/50'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Switch to Chinese"
              >
                <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇨🇳</span>
                <span className="text-sm font-semibold">中文</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  language === 'en'
                    ? 'bg-highlight text-highlight-foreground shadow-sm scale-100'
                    : isScrolled
                    ? 'text-foreground hover:bg-background/50'
                    : 'text-white hover:bg-white/10'
                }`}
                aria-label="Switch to English"
              >
                <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇬🇧</span>
                <span className="text-sm font-semibold">EN</span>
              </button>
            </div>
            <BookingDialog>
              <Button variant="default" size="lg" className="font-semibold shadow-lg hover:shadow-xl transition-shadow bg-[#c65539]">
                {t.bookNow}
              </Button>
            </BookingDialog>
          </div>

          {/* Mobile Menu Button - Using Sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button 
                className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"}`} 
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-0 pt-6 bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl">
              <nav className="px-6 py-4 flex flex-col h-full overflow-y-auto">
                {/* Navigation Links */}
                <div className="space-y-1">
                  {navItems.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <a 
                        key={item.label} 
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="group flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-[#8B6F47]/20 hover:text-highlight transition-all duration-300 active:scale-[0.98] cursor-pointer animate-fade-in hover:shadow-[0_0_20px_rgba(198,85,57,0.3)] hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B6F47]/20 to-[#c65539]/20 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-[0_0_15px_rgba(198,85,57,0.4)] transition-all duration-300">
                          <IconComponent size={20} className="text-highlight group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-base font-medium">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
                
                {/* Divider */}
                <div className="my-6 border-t border-border" />
                
                {/* User Section */}
                <div className="space-y-3">
                  {!isForumPage && (
                    <button 
                      onClick={() => {
                        navigate('/forum');
                        setIsMobileMenuOpen(false);
                      }}
                      className="group flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-[#8B6F47]/20 hover:text-highlight transition-all duration-300 w-full text-left hover:shadow-[0_0_20px_rgba(198,85,57,0.3)] hover:scale-[1.02]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B6F47]/20 to-[#c65539]/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(198,85,57,0.4)] transition-all duration-300">
                        <MessageCircle size={20} className="text-highlight group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <span className="text-base font-medium">{t.forum}</span>
                    </button>
                  )}
                  
                  {isAuthenticated && user ? (
                    <>
                      {/* Mobile User Profile Display */}
                      <div className="flex items-center gap-4 px-4 py-4 bg-muted/50 rounded-xl">
                        <Avatar className="h-12 w-12 border-2 border-highlight/30">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-highlight/20 text-highlight">
                            {user.name?.charAt(0)?.toUpperCase() || <User className="h-5 w-5" />}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-base font-semibold text-foreground block">
                            {user.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {language === 'th' ? 'ผู้ใช้งาน' : 'User'}
                          </span>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            navigate('/admin');
                            setIsMobileMenuOpen(false);
                          }}
                          className="group flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 w-full text-left hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:scale-[1.02]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(var(--primary),0.4)] transition-all duration-300">
                            <Shield size={20} className="text-primary group-hover:scale-110 transition-transform duration-300" />
                          </div>
                          <span className="text-base font-medium">{language === 'th' ? 'Admin Panel' : 'Admin Panel'}</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="group flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 w-full text-left hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.02]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300">
                          <LogOut size={20} className="text-destructive group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <span className="text-base font-medium">{language === 'th' ? 'ออกจากระบบ' : 'Logout'}</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        navigate('/auth');
                        setIsMobileMenuOpen(false);
                      }}
                      className="group flex items-center gap-4 px-4 py-4 rounded-xl text-foreground hover:bg-[#8B6F47]/20 hover:text-highlight transition-all duration-300 w-full text-left hover:shadow-[0_0_20px_rgba(198,85,57,0.3)] hover:scale-[1.02]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B6F47]/20 to-[#c65539]/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(198,85,57,0.4)] transition-all duration-300">
                        <LogIn size={20} className="text-highlight group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <span className="text-base font-medium">{language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}</span>
                    </button>
                  )}
                </div>
                
                {/* Bottom Actions */}
                <div className="mt-auto pt-6 space-y-4">
                  {/* Language Switcher */}
                  <div className="flex justify-center">
                    <div className="inline-flex items-center bg-muted rounded-full p-1.5 gap-1">
                      <button
                        onClick={() => setLanguage('th')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium transition-all duration-300 ${
                          language === 'th'
                            ? 'bg-highlight text-highlight-foreground shadow-sm'
                            : 'text-foreground hover:bg-background/50'
                        }`}
                      >
                        <span className="text-lg">🇹🇭</span>
                        <span className="text-sm font-semibold">ไทย</span>
                      </button>
                      <button
                        onClick={() => setLanguage('zh')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium transition-all duration-300 ${
                          language === 'zh'
                            ? 'bg-highlight text-highlight-foreground shadow-sm'
                            : 'text-foreground hover:bg-background/50'
                        }`}
                      >
                        <span className="text-lg">🇨🇳</span>
                        <span className="text-sm font-semibold">中文</span>
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium transition-all duration-300 ${
                          language === 'en'
                            ? 'bg-highlight text-highlight-foreground shadow-sm'
                            : 'text-foreground hover:bg-background/50'
                        }`}
                      >
                        <span className="text-lg">🇬🇧</span>
                        <span className="text-sm font-semibold">EN</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Book Now Button - Full Width */}
                  <BookingDialog>
                    <Button variant="default" size="lg" className="w-full h-14 text-base font-semibold bg-[#c65539] hover:bg-[#b34a2f] rounded-xl">
                      {t.bookNow}
                    </Button>
                  </BookingDialog>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;