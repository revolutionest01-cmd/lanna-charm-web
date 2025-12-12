import { useState, useEffect, useCallback, startTransition } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, MessageCircle, LogIn, LogOut, Shield, Home, Info, Calendar, Bed, Coffee, Image, Star, Mail, User } from "lucide-react";
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
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  const scrollToSection = useCallback((sectionId: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    if (href.startsWith('/#')) {
      const sectionId = href.substring(2);
      if (location.pathname === '/') {
        scrollToSection(sectionId);
      } else {
        startTransition(() => {
          navigate('/');
        });
        setTimeout(() => scrollToSection(sectionId), 150);
      }
    } else if (href === '/') {
      if (location.pathname !== '/') {
        startTransition(() => {
          navigate('/');
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      startTransition(() => {
        navigate(href);
      });
    }
  }, [location.pathname, navigate, scrollToSection]);
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg" : "bg-black/30 backdrop-blur-sm"}`}>
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

          {/* Mobile Menu Button */}
          <button className={`md:hidden ${isScrolled ? "text-foreground" : "text-white"}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && <nav className="md:hidden mt-4 pb-4 flex flex-col space-y-4 animate-fade-in">
            {navItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <a 
                  key={item.label} 
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center gap-2 ${isScrolled ? "text-foreground" : "text-white"} hover:text-highlight hover:[text-shadow:0_0_12px_rgba(198,85,57,0.8)] transition-all duration-300 font-medium transform hover:translate-x-2 cursor-pointer`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <IconComponent size={18} />
                  {item.label}
                </a>
              );
            })}
            
            {/* Mobile Auth Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              {!isForumPage && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    navigate('/forum');
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {t.forum}
                </Button>
              )}
              
              {isAuthenticated && user ? (
                <>
                  {/* Mobile User Profile Display */}
                  <div className="flex items-center gap-2 py-2">
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
                      onClick={() => {
                        navigate('/admin');
                        setIsMobileMenuOpen(false);
                      }}
                      className="justify-start gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      {language === 'th' ? 'Admin Panel' : 'Admin Panel'}
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {language === 'th' ? 'ออกจากระบบ' : 'Logout'}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    navigate('/auth');
                    setIsMobileMenuOpen(false);
                  }}
                  className="justify-start gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="inline-flex items-center bg-secondary rounded-full p-1 gap-1">
                <button
                  onClick={() => setLanguage('th')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    language === 'th'
                      ? 'bg-highlight text-highlight-foreground shadow-sm'
                      : 'text-foreground hover:bg-background/50'
                  }`}
                >
                  <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇹🇭</span>
                  <span className="text-sm font-semibold">ไทย</span>
                </button>
                <button
                  onClick={() => setLanguage('zh')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    language === 'zh'
                      ? 'bg-highlight text-highlight-foreground shadow-sm'
                      : 'text-foreground hover:bg-background/50'
                  }`}
                >
                  <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇨🇳</span>
                  <span className="text-sm font-semibold">中文</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    language === 'en'
                      ? 'bg-highlight text-highlight-foreground shadow-sm'
                      : 'text-foreground hover:bg-background/50'
                  }`}
                >
                  <span className="text-base transition-transform duration-300 inline-block hover:rotate-12">🇬🇧</span>
                  <span className="text-sm font-semibold">EN</span>
                </button>
              </div>
              <BookingDialog>
                <Button variant="default" size="lg" className="flex-1 font-semibold">
                  {t.bookNow}
                </Button>
              </BookingDialog>
            </div>
          </nav>}
      </div>
    </header>;
};
export default Header;