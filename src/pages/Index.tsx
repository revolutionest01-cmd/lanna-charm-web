import { useState, useEffect } from "react";
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
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import FloatingActions from "@/components/FloatingActions";
import LoadingScreen from "@/components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";
import { useContentData } from "@/hooks/useContentData";

// Check if loading screen was already shown in this session
const checkLoadingAlreadyShown = (): boolean => {
  try {
    return sessionStorage.getItem('plernping_loading_shown') === 'true';
  } catch {
    return false;
  }
};

const Index = () => {
  // Initialize loadingComplete based on sessionStorage
  const [loadingComplete, setLoadingComplete] = useState(checkLoadingAlreadyShown);
  const { isLoading } = useContentData();

  const isDataLoaded = !isLoading;

  // Handle loading completion
  const handleLoadingComplete = () => {
    setLoadingComplete(true);
  };

  return (
    <>
      {!loadingComplete && (
        <LoadingScreen 
          onLoadingComplete={handleLoadingComplete} 
          isDataLoaded={isDataLoaded}
        />
      )}
      <div className={`relative min-h-screen ${!loadingComplete ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
        <FallingLeaves />
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
        <FloatingActions />
        <Toaster />
      </div>
    </>
  );
};

export default Index;
