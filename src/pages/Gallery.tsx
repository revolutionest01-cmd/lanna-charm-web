import { useState } from "react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
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
      <Header />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
              {t.galleryTitle}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
                {language === "th" ? "ไม่มีรูปภาพในขณะนี้" : "No images available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  onClick={() => openLightbox(index)}
                  className="relative overflow-hidden rounded-lg aspect-square group cursor-pointer animate-scale-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <img
                    src={image.image_url}
                    alt={language === "th" ? image.title_th || "" : image.title_en || ""}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-foreground font-medium text-sm">
                        {language === "th" ? image.title_th : image.title_en}
                      </p>
                    </div>
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
                <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full">
                  <p className="text-foreground font-medium">
                    {language === "th" 
                      ? images[selectedImageIndex].title_th 
                      : images[selectedImageIndex].title_en
                    }
                  </p>
                  <p className="text-muted-foreground text-sm text-center mt-1">
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
