import { useState } from "react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type GalleryImage = {
  id: string;
  image_url: string;
  title_en: string | null;
  title_th: string | null;
  sort_order: number;
};

const Gallery = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["gallery-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    },
    staleTime: 5 * 60 * 1000,
  });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") closeLightbox();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 sm:pt-20 pb-20 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-0 w-80 h-80 bg-primary/50 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-5 sm:px-6 relative z-10">
          {/* Page Header with Premium Treatment */}
          <div className="text-center mb-12 sm:mb-20">
            <div className="inline-flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-primary/60" />
              <span className="text-xs sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary font-medium">
                {language === 'th' ? 'ชุมชนของเรา' : 'Our Gallery'}
              </span>
              <div className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-primary/60" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3 sm:mb-4 font-serif leading-tight">
              {t.galleryTitle}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
              {t.gallerySubtitle}
            </p>
          </div>

          {/* Gallery Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {language === "th" ? "ไม่มีรูปภาพในขณะนี้" : language === "zh" ? "暂无图片" : "No images available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {images.map((image, index) => (
                <div 
                  key={image.id} 
                  className="group animate-scale-in" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    onClick={() => openLightbox(index)}
                    className="relative overflow-hidden rounded-xl sm:rounded-2xl aspect-square group cursor-pointer mb-3 sm:mb-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/30 hover:border-primary/50"
                  >
                    <img
                      src={image.image_url}
                      alt={language === "th" ? image.title_th || "" : image.title_en || ""}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl border border-border/50">
                        <p className="text-foreground font-semibold text-xs sm:text-sm">
                          {language === "th" ? "คลิกเพื่อดูเต็มหน้าจอ" : "Click to view"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-2">
                    <p className="text-center text-xs sm:text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {language === "th" ? image.title_th : image.title_en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Lightbox Modal */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent 
          className="max-w-7xl w-full h-[90vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
        >
          {selectedImageIndex !== null && images[selectedImageIndex] && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Previous Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-12">
                <img
                  src={images[selectedImageIndex].image_url}
                  alt={language === "th" 
                    ? images[selectedImageIndex].title_th || "" 
                    : images[selectedImageIndex].title_en || ""
                  }
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>

              {/* Next Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>

              {/* Image Title */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-background/90 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-2xl border border-border/50">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    {language === "th" 
                      ? images[selectedImageIndex].title_th 
                      : images[selectedImageIndex].title_en
                    }
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm text-center mt-2">
                    {selectedImageIndex + 1} / {images.length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Gallery;
