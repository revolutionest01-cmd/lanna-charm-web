import { useEffect, useState } from "react";
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
import DynamicSections from "@/components/DynamicSections";
import { Toaster } from "@/components/ui/sonner";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { supabase } from "@/integrations/supabase/client";

interface SectionOrder {
  section_key: string;
  order_index: number;
  is_visible: boolean;
}

const BUILT_IN_KEYS = ["hero", "features", "events", "rooms", "menu", "gallery", "reviews", "contact"];

const Index = () => {
  const { toggles, isFeatureEnabled, isLoading: featureLoading } = useFeatureToggle();
  const [sectionOrder, setSectionOrder] = useState<SectionOrder[] | null>(null);
  const [customSections, setCustomSections] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      const [orderRes, customRes] = await Promise.all([
        supabase.from("homepage_section_order").select("section_key, order_index, is_visible").order("order_index", { ascending: true }),
        supabase.from("custom_sections").select("*").eq("is_active", true).order("order_index", { ascending: true }),
      ]);
      if (orderRes.data && orderRes.data.length > 0) {
        setSectionOrder(orderRes.data as unknown as SectionOrder[]);
      }
      if (customRes.data) setCustomSections(customRes.data as any[]);
    };
    fetchOrder();
  }, []);

  const hasToggleKey = (key: string) => Object.prototype.hasOwnProperty.call(toggles, key);
  const isToggleOff = (key: string) => hasToggleKey(key) && toggles[key] === false;

  const isSectionVisible = (primaryKey: string, relatedKeys: string[] = []) => {
    if (featureLoading) return false;
    if (isToggleOff(primaryKey)) return false;
    if (relatedKeys.some((key) => isToggleOff(key))) return false;
    return isFeatureEnabled(primaryKey);
  };

  const showFallingLeaves = isSectionVisible("falling_leaves");

  const renderBuiltInSection = (key: string, index: number) => {
    const featureMap: Record<string, { check: () => boolean; component: JSX.Element; glow?: boolean }> = {
      hero: { check: () => true, component: <HeroSection /> },
      features: { check: () => isSectionVisible("features"), component: <FeaturesSection />, glow: true },
      events: { check: () => isSectionVisible("events"), component: <EventsSection /> },
      rooms: { check: () => isSectionVisible("rooms", ["booking"]), component: <RoomsSection />, glow: true },
      menu: { check: () => isSectionVisible("menu"), component: <MenuSection /> },
      gallery: { check: () => isSectionVisible("gallery"), component: <GallerySection />, glow: true },
      reviews: { check: () => isSectionVisible("reviews"), component: <ReviewsSection /> },
      contact: { check: () => isSectionVisible("contact"), component: <ContactSection /> },
    };

    const info = featureMap[key];
    if (!info || !info.check()) return null;

    if (key === "hero") return <div key={key}>{info.component}</div>;

    return (
      <ScrollReveal key={key} animation="fade-up" delay={index % 2 === 0 ? 0 : 100}>
        {info.glow ? <div className="section-glow">{info.component}</div> : info.component}
      </ScrollReveal>
    );
  };

  const renderCustomSection = (sectionKey: string, index: number) => {
    const customId = sectionKey.replace("custom_", "");
    const section = customSections.find((s) => s.id === customId);
    if (!section) return null;

    return (
      <DynamicSections key={sectionKey} sections={[section]} startIndex={index} />
    );
  };

  const renderSections = () => {
    // If we have section order from DB, use it
    if (sectionOrder && sectionOrder.length > 0) {
      return sectionOrder
        .filter((s) => s.is_visible)
        .map((s, i) => {
          if (BUILT_IN_KEYS.includes(s.section_key)) {
            return renderBuiltInSection(s.section_key, i);
          }
          if (s.section_key.startsWith("custom_")) {
            return renderCustomSection(s.section_key, i);
          }
          return null;
        });
    }

    // Fallback: default order
    return (
      <>
        <HeroSection />
        {isSectionVisible("features") && (
          <ScrollReveal animation="fade-up" delay={0}><div className="section-glow"><FeaturesSection /></div></ScrollReveal>
        )}
        {isSectionVisible("events") && (
          <ScrollReveal animation="fade-up" delay={100}><EventsSection /></ScrollReveal>
        )}
        {isSectionVisible("rooms", ["booking"]) && (
          <ScrollReveal animation="fade-up" delay={0}><div className="section-glow"><RoomsSection /></div></ScrollReveal>
        )}
        {isSectionVisible("menu") && (
          <ScrollReveal animation="fade-up" delay={100}><MenuSection /></ScrollReveal>
        )}
        {isSectionVisible("gallery") && (
          <ScrollReveal animation="fade-up" delay={0}><div className="section-glow"><GallerySection /></div></ScrollReveal>
        )}
        {isSectionVisible("reviews") && (
          <ScrollReveal animation="fade-up" delay={100}><ReviewsSection /></ScrollReveal>
        )}
        {isSectionVisible("contact") && (
          <ScrollReveal animation="fade-up" delay={0}><ContactSection /></ScrollReveal>
        )}
        <DynamicSections sections={customSections} startIndex={0} />
      </>
    );
  };

  return (
    <div className="relative min-h-screen page-gradient-bg">
      <ParallaxBackground />
      {showFallingLeaves && <FallingLeaves />}

      <main className="relative z-10">
        {renderSections()}
      </main>
      <Footer />
      <BackToTop />
      <Toaster />
    </div>
  );
};

export default Index;
