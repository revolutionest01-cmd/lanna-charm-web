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
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  return (
    <div className="relative min-h-screen page-gradient-bg">
      {/* Decorative gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[hsl(var(--highlight)/0.05)] to-transparent blur-3xl" />
        <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-[hsl(var(--lanna-leaf)/0.04)] to-transparent blur-3xl" />
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[300px] rounded-full bg-gradient-to-tr from-[hsl(var(--gradient-accent)/0.06)] to-transparent blur-3xl" />
      </div>
      
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
