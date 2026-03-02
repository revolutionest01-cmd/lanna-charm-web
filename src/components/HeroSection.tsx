import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useHeroContent } from "@/hooks/useContentData";
import { Skeleton } from "@/components/ui/skeleton";


const HeroSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { data: hero, isLoading } = useHeroContent();
  
  // Use database content - show loading if not ready
  const heroTitle = hero 
    ? (language === 'th' ? hero.title_th : hero.title_en)
    : null;
  const heroSubtitle = hero
    ? (language === 'th' ? hero.subtitle_th : hero.subtitle_en)
    : null;
  const heroImageUrl = hero?.image_url;

  // Show skeleton state while fetching data
  if (isLoading) {
    return (
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-muted">
        <div className="absolute inset-0 z-0">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
        <div className="relative z-10 container mx-auto px-5 sm:px-6 text-center pt-20 sm:pt-0">
          <Skeleton className="h-5 w-48 mx-auto mb-6" />
          <Skeleton className="h-12 sm:h-16 w-3/4 mx-auto mb-6" />
          <Skeleton className="h-6 sm:h-8 w-2/3 mx-auto mb-4" />
          <Skeleton className="h-5 w-1/2 mx-auto mb-10" />
          <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  // No data available after loading
  if (!hero) {
    return (
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-muted">
        <p className="text-muted-foreground">{language === 'th' ? 'ไม่พบข้อมูล' : 'No content available'}</p>
      </section>
    );
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImageUrl}
          alt="Plern Ping Cafe outdoor seating area with natural ambiance"
          className="w-full h-full object-cover"
          style={{
            filter: 'contrast(1.1) saturate(1.0)',
          }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 sm:px-6 text-center animate-fade-in pt-20 sm:pt-0">
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <MapPin className="text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]" size={20} />
          <p className="text-sm sm:text-lg text-white font-medium drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">{t.location}</p>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 font-serif drop-shadow-[0_6px_16px_rgba(0,0,0,0.98)] leading-tight">
          {heroTitle}
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-4 sm:mb-8 max-w-2xl mx-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] px-2">
          {heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center px-3 sm:px-0 w-full sm:w-auto">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-12 text-sm sm:text-base font-semibold group rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-[#b94a2f] via-[#c65539] to-[#b94a2f] hover:from-[#a8422a] hover:via-[#c65539] hover:to-[#a8422a] text-white shadow-[0_10px_24px_rgba(198,85,57,0.35),0_6px_14px_rgba(0,0,0,0.35)] hover:shadow-[0_14px_30px_rgba(198,85,57,0.45),0_10px_20px_rgba(0,0,0,0.42)]"
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.exploreMenu}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-12 text-sm sm:text-base font-semibold bg-white/20 hover:bg-white/30 text-white border-2 border-white/90 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg drop-shadow-[0_4px_12px_rgba(0,0,0,0.65)]"
            onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.viewRooms}
          </Button>
        </div>
      </div>

      {/* Scroll Indicator - Hide on mobile */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce hidden sm:block">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-foreground/30 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
