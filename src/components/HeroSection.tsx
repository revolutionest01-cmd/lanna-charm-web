import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Plern Ping Cafe outdoor seating area with natural ambiance"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="text-primary" size={24} />
          <p className="text-lg text-foreground/90 font-medium">Chiang Mai, Thailand</p>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 font-serif">
          Plern Ping Cafe
        </h1>
        
        <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto">
          Experience the perfect blend of traditional Lanna charm and modern comfort
        </p>
        
        <p className="text-lg text-foreground/70 mb-10 max-w-xl mx-auto">
          Nestled in nature's embrace, where exceptional food meets artisan coffee in a tranquil garden setting
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="default" size="lg" className="font-semibold group">
            Explore Menu
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
          </Button>
          <Button variant="outline" size="lg" className="font-semibold">
            View Rooms
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
