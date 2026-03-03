import { useLanguage, translations } from "@/hooks/useLanguage";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useGalleryImages } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { GallerySkeleton } from "@/components/SkeletonCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useRef, useEffect } from "react";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { useSectionHeading } from "@/hooks/useSectionHeading";


type GalleryImage = {
  id: string;
  image_url: string;
  title_en: string | null;
  title_th: string | null;
};

const GallerySection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { data: images = [], isLoading: loading } = useGalleryImages(9);
  const { isFeatureEnabled } = useFeatureToggle();
  const { title: sectionTitle, subtitle: sectionSubtitle } = useSectionHeading("gallery");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  if (!isFeatureEnabled("gallery")) return null;

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") closeLightbox();
  };

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
              {t.galleryTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.gallerySubtitle}
            </p>
          </div>
          <GallerySkeleton />
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
            {sectionTitle || t.galleryTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {sectionSubtitle || t.gallerySubtitle}
          </p>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{language === "th" ? "ไม่มีรูปภาพ" : "No images"}</p>
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {images.map((image, index) => (
                <CarouselItem key={image.id} className="pl-2 sm:pl-4 basis-[calc(100%-0.5rem)] sm:basis-1/2 lg:basis-1/3">
                  <div
                    onClick={() => openLightbox(index)}
                    className="relative overflow-hidden rounded-xl sm:rounded-lg aspect-square group cursor-pointer animate-scale-in transition-all duration-300 hover:shadow-lg border border-border/30 hover:border-primary/50"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <img
                      src={image.image_url}
                      alt={language === "th" ? image.title_th || "" : image.title_en || ""}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="bg-background px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-lg">
                        <p className="text-foreground font-medium text-sm sm:text-base">
                          {language === "th" ? "คลิกเพื่อดู" : "Click to view"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 sm:left-4 hidden sm:flex" />
            <CarouselNext className="right-2 sm:right-4 hidden sm:flex" />
          </Carousel>
        )}

        {/* View All Button */}
        {images.length > 0 && (
          <div className="text-center mt-10 sm:mt-12">
            <Link to="/gallery">
              <Button 
                size="lg" 
                className="group hover:shadow-lg transition-all duration-300 w-full sm:w-auto h-12 sm:h-11 text-base rounded-xl sm:rounded-lg"
              >
                {language === "th" ? "ดูรูปภาพทั้งหมด" : "View All Images"}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Homepage Gallery */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent 
          className="max-w-4xl w-full max-h-[90vh] p-0 bg-black/98 border-none rounded-2xl overflow-hidden"
          onKeyDown={handleKeyDown}
          hideDefaultClose={true}
        >
          {selectedImageIndex !== null && images[selectedImageIndex] && (
            <div 
              className="relative w-full h-[70vh] sm:h-[80vh] flex items-center justify-center touch-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Previous Button - Mobile/Tablet friendly */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center px-4 sm:px-8">
                <img
                  src={images[selectedImageIndex].image_url}
                  alt={language === "th" 
                    ? images[selectedImageIndex].title_th || "" 
                    : images[selectedImageIndex].title_en || ""
                  }
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />
              </div>

              {/* Next Button - Mobile/Tablet friendly */}
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 text-white hover:bg-white/20 p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-110"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {/* Image Info */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-xl border border-white/20">
                  <p className="text-white font-semibold text-xs sm:text-sm text-center">
                    {language === "th" 
                      ? images[selectedImageIndex].title_th 
                      : images[selectedImageIndex].title_en
                    }
                  </p>
                  <p className="text-white/70 text-xs sm:text-xs text-center mt-1">
                    {selectedImageIndex + 1} / {images.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default GallerySection;
