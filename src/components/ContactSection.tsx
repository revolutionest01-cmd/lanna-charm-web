import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const contactInfo = [
    {
      icon: Phone,
      title: t.phone,
      details: [
        "(66) 081-846-9098",
        "(66) 081-710-0611"
      ],
      link: "tel:+66818469098"
    },
    {
      icon: Mail,
      title: t.email,
      details: ["plernping5445@gmail.com"],
      link: "mailto:plernping5445@gmail.com"
    },
    {
      icon: MessageCircle,
      title: t.socialMedia,
      details: ["@plernpingcafe"],
      link: "https://www.facebook.com/plernpingcafe"
    },
    {
      icon: MapPin,
      title: t.address,
      details: [
        language === 'th' 
          ? "123/45 หมู่บ้านท่าวังตาล"
          : "123/45 Tha Wang Tan Village",
        language === 'th'
          ? "ต.สุเทพ อ.เมือง จ.เชียงใหม่ 50200"
          : "Suthep, Mueang, Chiang Mai 50200"
      ],
      link: "https://maps.google.com"
    },
    {
      icon: Clock,
      title: t.openingHours,
      details: [
        language === 'th' ? "จันทร์ - ศุกร์: 08:00 - 20:00" : "Mon - Fri: 08:00 - 20:00",
        language === 'th' ? "เสาร์ - อาทิตย์: 07:00 - 21:00" : "Sat - Sun: 07:00 - 21:00"
      ],
      link: null
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            {t.contactTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            const CardWrapper = info.link ? 'a' : 'div';
            const cardProps = info.link ? { href: info.link, target: "_blank", rel: "noopener noreferrer" } : {};

            return (
              <CardWrapper key={index} {...cardProps} className="block">
                <Card
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-border/50 h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl mb-4 text-foreground">
                      {info.title}
                    </h3>
                    <div className="space-y-2">
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardWrapper>
            );
          })}
        </div>

        {/* Map placeholder */}
        <div className="mt-12 max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Card className="overflow-hidden border-border/50">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'th' ? 'แผนที่จะแสดงที่นี่' : 'Map will be displayed here'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
