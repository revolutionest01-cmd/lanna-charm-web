import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import EventsSection from "@/components/EventsSection";
import RoomsSection from "@/components/RoomsSection";
import MenuSection from "@/components/MenuSection";
import GallerySection from "@/components/GallerySection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import FallingLeaves from "@/components/FallingLeaves";
import AmbientSound from "@/components/AmbientSound";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import FloatingChatButton from "@/components/FloatingChatButton";
import ParallaxBackground from "@/components/ParallaxBackground";
import CustomCursor from "@/components/CustomCursor";
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  return (
    <div className="relative min-h-screen page-gradient-bg">
      {/* Custom cursor - desktop only */}
      <CustomCursor />
      
      {/* Parallax gradient orbs */}
      <ParallaxBackground />
      
      <FallingLeaves />
      <AmbientSound />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <div className="section-glow">
          <FeaturesSection />
        </div>
        <EventsSection />
        <div className="section-glow">
          <RoomsSection />
        </div>
        <MenuSection />
        <div className="section-glow">
          <GallerySection />
        </div>
        <ReviewsSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <FloatingChatButton />
      <Toaster />
    </div>
  );
};

export default Index;
