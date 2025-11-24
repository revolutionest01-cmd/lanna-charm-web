import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";
import { useLanguage, translations } from "@/hooks/useLanguage";

const HeroSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Plern Ping Cafe outdoor seating area with natural ambiance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-6 drop-shadow-lg">
          <MapPin className="text-primary drop-shadow-md" size={24} />
          <p className="text-lg text-foreground font-medium drop-shadow-md">{t.location}</p>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 font-serif drop-shadow-lg">
          {t.heroTitle}
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground mb-8 max-w-2xl mx-auto drop-shadow-md">
          {t.heroSubtitle}
        </p>
        
        <p className="text-lg text-foreground/90 mb-10 max-w-xl mx-auto drop-shadow-md">
          {t.heroDescription}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="default" 
            size="lg" 
            className="font-semibold group"
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.exploreMenu}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="font-semibold bg-background/20 backdrop-blur-sm hover:bg-background/40"
            onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.viewRooms}
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-foreground/30 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
