import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useEventSpaces, useEventSpaceImages, useEventSpaceFeatures } from "@/hooks/useContentData";
import { EventSkeleton } from "@/components/SkeletonCard";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { cn } from "@/lib/utils";

// Dynamic icon resolver
const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.HelpCircle;
};

const EventsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { data: eventSpace, isLoading: loading } = useEventSpaces();
  const { data: galleryImages = [] } = useEventSpaceImages(eventSpace?.id);
  const { data: features = [] } = useEventSpaceFeatures(eventSpace?.id);
  const { isFeatureEnabled } = useFeatureToggle();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!isFeatureEnabled("events")) return null;

  const handleInquireClick = () => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      contactElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section id="events" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {t.eventsTitle}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t.eventsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <EventSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const title = language === "th" ? eventSpace?.title_th : eventSpace?.title_en;
  const description = language === "th" ? eventSpace?.description_th : eventSpace?.description_en;
  
  // Combine main image + gallery images
  const allImages: string[] = [];
  if (eventSpace?.image_url) allImages.push(eventSpace.image_url);
  galleryImages.forEach((img) => {
    if (img.image_url && !allImages.includes(img.image_url)) {
      allImages.push(img.image_url);
    }
  });

  const mainImage = allImages[selectedImageIndex] || eventSpace?.image_url || "/placeholder.svg";

  // Fallback features if DB is empty
  const displayFeatures = features.length > 0 ? features : [
    { icon_name: "Presentation", title_th: t.presentationRoom, title_en: t.presentationRoom, description_th: t.presentationRoomDesc, description_en: t.presentationRoomDesc },
    { icon_name: "Utensils", title_th: t.cateringService, title_en: t.cateringService, description_th: t.cateringServiceDesc, description_en: t.cateringServiceDesc },
    { icon_name: "Wifi", title_th: t.privateEvents, title_en: t.privateEvents, description_th: t.privateEventsDesc, description_en: t.privateEventsDesc },
  ];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const lightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const lightboxNext = () => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <section id="events" className="py-16 sm:py-24 bg-gradient-to-b from-background via-background to-card/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/50 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 sm:mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-primary/60" />
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary font-medium">
                {language === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Event Services'}
              </span>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-primary/60" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-foreground font-serif leading-tight">
              {t.eventsTitle}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              {t.eventsSubtitle}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start mb-16 sm:mb-20">
            {/* Left - Image Gallery */}
            <div className="animate-fade-in space-y-3">
              {/* Main Image */}
              <div className="relative group cursor-pointer" onClick={() => openLightbox(selectedImageIndex)}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <img
                  src={mainImage}
                  alt={title || "Conference Room"}
                  className="relative rounded-2xl sm:rounded-3xl shadow-2xl w-full h-[260px] sm:h-[350px] lg:h-[450px] object-cover transition-all duration-500 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-3">
                    <LucideIcons.Maximize2 className="w-5 h-5 text-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm text-foreground text-xs px-2.5 py-1 rounded-lg border border-border/50">
                  © PlernPing Cafe
                </div>
              </div>

              {/* Thumbnail Strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {allImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "flex-shrink-0 w-20 h-16 sm:w-24 sm:h-[72px] rounded-lg overflow-hidden border-2 transition-all duration-300 hover:opacity-100",
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/30 opacity-100"
                          : "border-border/50 opacity-60 hover:border-primary/50"
                      )}
                    >
                      <img
                        src={img}
                        alt={`${title || "Event"} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right - Content & Services */}
            <div className="space-y-6 sm:space-y-8 animate-fade-in">
              {/* Title & Description */}
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-serif">
                  {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base lg:text-lg">
                  {description}
                </p>
              </div>

              {/* Services Grid - Dynamic from DB */}
              <div className="space-y-3 sm:space-y-4">
                {displayFeatures.map((feature: any, index: number) => {
                  const IconComponent = getIcon(feature.icon_name);
                  const featureTitle = language === "th" ? feature.title_th : feature.title_en;
                  const featureDesc = language === "th" ? feature.description_th : feature.description_en;

                  return (
                    <div
                      key={feature.id || index}
                      className="group relative p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent size={20} className="text-primary sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base mb-1 group-hover:text-primary transition-colors">
                            {featureTitle}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {featureDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Button */}
              <div className="pt-2 sm:pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-11 text-base rounded-xl sm:rounded-lg transition-all duration-300 hover:scale-105 bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl" 
                  onClick={handleInquireClick}
                >
                  {t.inquirePrice}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxOpen && allImages.length > 0 && (
        <LightboxModal
          images={allImages}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
          title={title || "Event Space"}
        />
      )}
    </>
  );
};

// Lightbox component
const LightboxModal = ({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  title,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  title: string;
}) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-foreground/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 transition-colors text-background"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-background/80 text-sm font-medium bg-background/20 px-3 py-1 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 sm:left-6 z-10 p-2 sm:p-3 rounded-full bg-background/20 hover:bg-background/40 transition-colors text-background"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt={`${title} ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 sm:right-6 z-10 p-2 sm:p-3 rounded-full bg-background/20 hover:bg-background/40 transition-colors text-background"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
    </div>
  );
};

export default EventsSection;
