import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Languages } from "lucide-react";
import logo from "@/assets/logo.png";
import { useLanguage, translations } from "@/hooks/useLanguage";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: t.home, href: "#home" },
    { label: t.about, href: "#features" },
    { label: t.rooms, href: "#rooms" },
    { label: t.menu, href: "#menu" },
    { label: t.gallery, href: "#gallery" },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'th' ? 'en' : 'th');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-card/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center space-x-3">
            <img src={logo} alt="Plern Ping Cafe Logo" className="h-12 w-auto" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Language Toggle & CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleLanguage}
              className="font-semibold"
              aria-label="Toggle language"
            >
              <Languages size={20} />
            </Button>
            <Button variant="default" size="lg" className="font-semibold">
              {t.bookNow}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col space-y-4">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={toggleLanguage}
                className="flex-1 font-semibold"
              >
                <Languages size={18} className="mr-2" />
                {language === 'th' ? 'EN' : 'TH'}
              </Button>
              <Button variant="default" size="lg" className="flex-1 font-semibold">
                {t.bookNow}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
