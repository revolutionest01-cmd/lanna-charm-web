import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useContentData } from "@/hooks/useContentData";

const HeroSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { hero, isLoading } = useContentData();
  
  // Use database content if available, fallback to translations
  const heroTitle = hero 
    ? (language === 'th' ? hero.title_th : hero.title_en)
    : t.heroTitle;
  const heroSubtitle = hero
    ? (language === 'th' ? hero.subtitle_th : hero.subtitle_en)
    : t.heroSubtitle;
  const heroImageUrl = hero?.image_url || heroImage;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImageUrl}
          alt="Plern Ping Cafe outdoor seating area with natural ambiance"
          className="w-full h-full object-cover"
          style={{
            filter: 'contrast(1.1) saturate(1.0) brightness(0.85)',
          }}
        />
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" size={24} />
          <p className="text-lg text-white font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{t.location}</p>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          {heroTitle}
        </h1>
        
        <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {heroSubtitle}
        </p>
        
        <p className="text-lg text-white mb-10 max-w-xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {t.heroDescription}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="highlight" 
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
            className="font-semibold bg-background/20 backdrop-blur-sm hover:bg-background/40 text-white border-white/40 hover:text-white"
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
