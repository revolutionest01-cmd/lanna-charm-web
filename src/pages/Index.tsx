import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import RoomsSection from "@/components/RoomsSection";
import MenuSection from "@/components/MenuSection";
import GallerySection from "@/components/GallerySection";
import FallingLeaves from "@/components/FallingLeaves";
import Footer from "@/components/Footer";

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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
