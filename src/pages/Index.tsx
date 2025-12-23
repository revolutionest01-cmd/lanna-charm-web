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
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import FloatingActions from "@/components/FloatingActions";
import LoadingScreen from "@/components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";
import { useContentData } from "@/hooks/useContentData";

// Storage key - must match LoadingScreen
const STORAGE_KEY = 'plernping_loaded';

// Check if loading screen was already shown in this session
const wasLoadingShown = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const Index = () => {
  // Initialize loadingComplete based on sessionStorage
  const [loadingComplete, setLoadingComplete] = useState(wasLoadingShown);
  const { isLoading } = useContentData();

  const isDataLoaded = !isLoading;

  return (
    <>
      {!loadingComplete && (
        <LoadingScreen 
          onLoadingComplete={() => setLoadingComplete(true)} 
          isDataLoaded={isDataLoaded}
        />
      )}
      <div className={`relative min-h-screen transition-opacity duration-300 ${!loadingComplete ? 'opacity-0' : 'opacity-100'}`}>
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
