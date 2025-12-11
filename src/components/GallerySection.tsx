import { useLanguage, translations } from "@/hooks/useLanguage";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useContentData } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GallerySkeleton } from "@/components/SkeletonCard";

type GalleryImage = {
  id: string;
  image_url: string;
  title_en: string | null;
  title_th: string | null;
};

const GallerySection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { gallery: images = [], isLoading: loading } = useContentData();

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
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={image.id} className="md:basis-1/2 lg:basis-1/3">
                  <div
                    className="relative overflow-hidden rounded-lg aspect-square group cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <img
                      src={image.image_url}
                      alt={language === "th" ? image.title_th || "" : image.title_en || ""}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-foreground font-medium">
                          {language === "th" ? image.title_th : image.title_en}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        )}

        {/* View All Button */}
        {images.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/gallery">
              <Button 
                size="lg" 
                className="group hover:shadow-lg transition-all duration-300"
              >
                {language === "th" ? "ดูรูปภาพทั้งหมด" : "View All Images"}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
