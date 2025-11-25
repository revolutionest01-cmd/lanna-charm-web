import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, MessageCircle, LogIn, LogOut, Shield } from "lucide-react";
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
    href: "/"
  }, {
    label: t.about,
    href: "/#features"
  }, {
    label: t.eventsTitle,
    href: "/#events"
  }, {
    label: t.rooms,
    href: "/#rooms"
  }, {
    label: t.menu,
    href: "/#menu"
  }, {
    label: t.gallery,
    href: "/gallery"
  }, {
    label: t.reviews,
    href: "/reviews"
  }, {
    label: t.contact,
    href: "/#contact"
  }];
  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg" : "bg-black/30 backdrop-blur-sm"}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center space-x-3">
            <img src={logo} alt="Plern Ping Cafe Logo" className="h-12 w-auto drop-shadow-[0_0_8px_rgba(198,85,57,0.3)] hover:drop-shadow-[0_0_15px_rgba(198,85,57,0.7)] transition-all duration-300" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map(item => <a 
                key={item.label} 
                href={item.href} 
                className={`relative ${isScrolled ? "text-foreground hover:text-highlight" : "text-white hover:text-highlight"} font-medium drop-shadow-md transition-all duration-300 hover:scale-110 hover:[text-shadow:0_0_12px_rgba(198,85,57,0.8)] after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-highlight after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left`}
              >
                {item.label}
              </a>)}
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
            {navItems.map((item, index) => <a 
                key={item.label} 
                href={item.href} 
                className={`${isScrolled ? "text-foreground" : "text-white"} hover:text-highlight hover:[text-shadow:0_0_12px_rgba(198,85,57,0.8)] transition-all duration-300 font-medium transform hover:translate-x-2`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>)}
            
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