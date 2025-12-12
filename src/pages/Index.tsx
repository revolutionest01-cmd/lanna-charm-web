import { useState } from "react";
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
import LoadingScreen from "@/components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";
import { useContentData } from "@/hooks/useContentData";

const Index = () => {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const { isLoading } = useContentData();

  const showLoading = !loadingComplete || isLoading;

  return (
    <>
      {showLoading && (
        <LoadingScreen onLoadingComplete={() => setLoadingComplete(true)} />
      )}
      <div className={`relative min-h-screen ${showLoading ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
        <FallingLeaves />
        <AmbientSound />
        <Header />
        <main className="relative z-10">
          <HeroSection />
          <FeaturesSection />
          <EventsSection />
          <RoomsSection />
          <MenuSection />
          <GallerySection />
          <ReviewsSection />
          <ContactSection />
        </main>
        <Footer />
        <BackToTop />
        <FloatingChatButton />
        <Toaster />
      </div>
    </>
  );
};

export default Index;
