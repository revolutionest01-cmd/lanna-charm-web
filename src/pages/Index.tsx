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
import FloatingChatButton from "@/components/FloatingChatButton";
import ParallaxBackground from "@/components/ParallaxBackground";
import ScrollReveal from "@/components/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  return (
    <div className="relative min-h-screen page-gradient-bg">
      {/* Parallax gradient orbs */}
      <ParallaxBackground />
      
      <FallingLeaves />
      <main className="relative z-10">
        <HeroSection />
        
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="section-glow">
            <FeaturesSection />
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={100}>
          <EventsSection />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="section-glow">
            <RoomsSection />
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={100}>
          <MenuSection />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="section-glow">
            <GallerySection />
          </div>
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={100}>
          <ReviewsSection />
        </ScrollReveal>
        
        <ScrollReveal animation="fade-up" delay={0}>
          <ContactSection />
        </ScrollReveal>
      </main>
      <Footer />
      <BackToTop />
      <FloatingChatButton />
      <Toaster />
    </div>
  );
};

export default Index;
