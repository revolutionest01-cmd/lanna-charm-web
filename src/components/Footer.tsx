import { Facebook, Instagram, Mail, MapPin, Phone, MessageCircle, Twitter } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import plernpingLogo from "@/assets/plernping-logo.png";
import { Skeleton } from "@/components/ui/skeleton";

const Footer = () => {
  const { language } = useLanguage();
  const t = translations[language];

  // Fetch business info from database
  const { data: businessInfo, isLoading } = useQuery({
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
    staleTime: 5 * 60 * 1000,
  });

  const address = language === 'th' ? businessInfo?.address_th : businessInfo?.address_en;

  if (isLoading) {
    return (
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-8">
            <Skeleton className="h-24 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  // Don't render footer content if no business info
  if (!businessInfo) {
    return (
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            {language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading...'}
          </p>
        </div>
      </footer>
    );
  }

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
              {address && (
                <div className="flex items-start gap-2">
                  <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                  {businessInfo.google_maps_url ? (
                    <a 
                      href={businessInfo.google_maps_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {address}
                    </a>
                  ) : (
                    <span>{address}</span>
                  )}
                </div>
              )}
              {businessInfo.phone_primary && (
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-primary flex-shrink-0" />
                  <a href={`tel:${businessInfo.phone_primary}`} className="hover:text-primary transition-colors">
                    {businessInfo.phone_primary}
                    {businessInfo.phone_secondary && `, ${businessInfo.phone_secondary}`}
                  </a>
                </div>
              )}
              {businessInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail size={20} className="text-primary flex-shrink-0" />
                  <a href={`mailto:${businessInfo.email}`} className="hover:text-primary transition-colors">
                    {businessInfo.email}
                  </a>
                </div>
              )}
              {businessInfo.line_id && (
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
            <div className="flex gap-4 flex-wrap">
              {businessInfo.line_id && (
                <a
                  href={`https://line.me/R/ti/p/${businessInfo.line_id.replace('@', '%40')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="LINE"
                >
                  <MessageCircle size={20} />
                </a>
              )}
              {businessInfo.facebook && (
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
              {businessInfo.instagram && (
                <a
                  href={`https://instagram.com/${businessInfo.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
              )}
              {(businessInfo as any).twitter && (
                <a
                  href={(businessInfo as any).twitter.startsWith('http') 
                    ? (businessInfo as any).twitter 
                    : `https://x.com/${(businessInfo as any).twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="X (Twitter)"
                >
                  <Twitter size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {language === 'th' ? businessInfo.business_name_th : businessInfo.business_name_en}. {t.allRightsReserved}.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;