import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import plernpingLogo from "@/assets/plernping-logo.png";

const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];

  // Fetch business info from database
  const { data: businessInfo } = useQuery({
    queryKey: ['business_info_footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const address = language === 'th' ? businessInfo?.address_th : businessInfo?.address_en;
  const displayAddress = address || (language === 'th' ? 'เชียงใหม่, ประเทศไทย' : 'Chiang Mai, Thailand');

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <img 
            src={plernpingLogo} 
            alt="Plern Ping Cafe Logo" 
            className="h-24 w-auto opacity-90"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 font-serif">{t.contactUs}</h3>
            <div className="space-y-3 text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                {businessInfo?.google_maps_url ? (
                  <a 
                    href={businessInfo.google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {displayAddress}
                  </a>
                ) : (
                  <span>{displayAddress}</span>
                )}
              </div>
              {businessInfo?.phone_primary && (
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-primary flex-shrink-0" />
                  <a href={`tel:${businessInfo.phone_primary}`} className="hover:text-primary transition-colors">
                    {businessInfo.phone_primary}
                    {businessInfo.phone_secondary && `, ${businessInfo.phone_secondary}`}
                  </a>
                </div>
              )}
              {businessInfo?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-primary flex-shrink-0" />
                  <a href={`mailto:${businessInfo.email}`} className="hover:text-primary transition-colors">
                    {businessInfo.email}
                  </a>
                </div>
              )}
              {businessInfo?.line_id && (
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-primary flex-shrink-0" />
                  <span>LINE: {businessInfo.line_id}</span>
                </div>
              )}
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
              {businessInfo?.facebook && (
                <a
                  href={businessInfo.facebook.startsWith('http') ? businessInfo.facebook : `https://facebook.com/${businessInfo.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
              )}
              {businessInfo?.instagram && (
                <a
                  href={businessInfo.instagram.startsWith('http') ? businessInfo.instagram : `https://instagram.com/${businessInfo.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
              )}
              {!businessInfo?.facebook && !businessInfo?.instagram && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {businessInfo?.business_name_en || 'Plern Ping Cafe'}. {t.allRightsReserved}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;