import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";

const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 font-serif">{t.contactUs}</h3>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                <span>123 Riverside Road, Chiang Mai, Thailand 50100</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-primary flex-shrink-0" />
                <span>+66 (0) 53-123-456</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={20} className="text-primary flex-shrink-0" />
                <span>hello@plernping.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 font-serif">{t.quickLinks}</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#home" className="hover:text-primary transition-colors">{t.home}</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">{t.about}</a></li>
              <li><a href="#rooms" className="hover:text-primary transition-colors">{t.rooms}</a></li>
              <li><a href="#menu" className="hover:text-primary transition-colors">{t.menu}</a></li>
              <li><a href="#gallery" className="hover:text-primary transition-colors">{t.gallery}</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 font-serif">{t.followUs}</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Plern Ping Cafe. {t.allRightsReserved}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
