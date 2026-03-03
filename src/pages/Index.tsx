import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import EventsSection from "@/components/EventsSection";
import RoomsSection from "@/components/RoomsSection";
import MenuSection from "@/components/MenuSection";
import GallerySection from "@/components/GallerySection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import FallingLeaves from "@/components/FallingLeaves";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ParallaxBackground from "@/components/ParallaxBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";

const Index = () => {
  const { toggles, isFeatureEnabled, isLoading: featureLoading } = useFeatureToggle();

  const hasToggleKey = (key: string) => Object.prototype.hasOwnProperty.call(toggles, key);
  const isToggleOff = (key: string) => hasToggleKey(key) && toggles[key] === false;

  const isSectionVisible = (primaryKey: string, relatedKeys: string[] = []) => {
    if (featureLoading) return false;
    if (isToggleOff(primaryKey)) return false;
    if (relatedKeys.some((key) => isToggleOff(key))) return false;
    return isFeatureEnabled(primaryKey);
  };

  const showFallingLeaves = isSectionVisible("falling_leaves");
  const showFeatures = isSectionVisible("features");
  const showEvents = isSectionVisible("events");
  const showRooms = isSectionVisible("rooms", ["booking"]);
  const showMenu = isSectionVisible("menu");
  const showGallery = isSectionVisible("gallery");
  const showReviews = isSectionVisible("reviews");
  const showContact = isSectionVisible("contact");

  return (
    <div className="relative min-h-screen page-gradient-bg">
      {/* Parallax gradient orbs */}
      <ParallaxBackground />
      
      {showFallingLeaves && <FallingLeaves />}

      <main className="relative z-10">
        <HeroSection />
        
        {showFeatures && (
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="section-glow">
              <FeaturesSection />
            </div>
          </ScrollReveal>
        )}
        
        {showEvents && (
          <ScrollReveal animation="fade-up" delay={100}>
            <EventsSection />
          </ScrollReveal>
        )}
        
        {showRooms && (
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="section-glow">
              <RoomsSection />
            </div>
          </ScrollReveal>
        )}
        
        {showMenu && (
          <ScrollReveal animation="fade-up" delay={100}>
            <MenuSection />
          </ScrollReveal>
        )}
        
        {showGallery && (
          <ScrollReveal animation="fade-up" delay={0}>
            <div className="section-glow">
              <GallerySection />
            </div>
          </ScrollReveal>
        )}
        
        {showReviews && (
          <ScrollReveal animation="fade-up" delay={100}>
            <ReviewsSection />
          </ScrollReveal>
        )}
        
        {showContact && (
          <ScrollReveal animation="fade-up" delay={0}>
            <ContactSection />
          </ScrollReveal>
        )}
      </main>
      <Footer />
      <BackToTop />
      <Toaster />
    </div>
  );
};

export default Index;
