import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import RoomsSection from "@/components/RoomsSection";
import MenuSection from "@/components/MenuSection";
import GallerySection from "@/components/GallerySection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSection from "@/components/ContactSection";
import ForumSection from "@/components/ForumSection";
import FallingLeaves from "@/components/FallingLeaves";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import FloatingActionButton from "@/components/FloatingActionButton";
import { Toaster } from "@/components/ui/sonner";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <FallingLeaves />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <RoomsSection />
        <MenuSection />
        <GallerySection />
        <ReviewsSection />
        <ContactSection />
        <ForumSection />
      </main>
      <Footer />
      <BackToTop />
      <FloatingActionButton />
      <Toaster />
    </div>
  );
};

export default Index;
