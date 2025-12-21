import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useContentData } from "@/hooks/useContentData";
import { RoomSkeleton } from "@/components/SkeletonCard";
import BookingDialog from "@/components/BookingDialog";

interface Room {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  price: number;
  is_active: boolean | null;
  images: RoomImage[];
}

interface RoomImage {
  id: string;
  room_id: string;
  image_url: string;
  sort_order: number | null;
}

const RoomsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { rooms = [], isLoading: loading } = useContentData();

  if (loading) {
    return (
      <section id="rooms" className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
              {t.roomsTitle}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
              {t.roomsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(3)].map((_, i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="rooms" className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
            {t.roomsTitle}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            {t.roomsSubtitle}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-0 sm:px-8 lg:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 sm:-ml-4">
              {rooms.map((room) => (
                <CarouselItem key={room.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden border-border hover:shadow-2xl transition-all duration-300 h-full">
                    <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                      <img
                        src={room.images[0]?.image_url || "/placeholder.svg"}
                        alt={language === "th" ? room.name_th : room.name_en}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    
                    <CardHeader className="p-4 sm:p-5 lg:p-6">
                      <CardTitle className="text-lg sm:text-xl lg:text-2xl font-serif">
                        {language === "th" ? room.name_th : room.name_en}
                      </CardTitle>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">฿{room.price}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">{t.perNight}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5 lg:p-6 pt-0 space-y-3 sm:space-y-4">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {language === "th" ? room.description_th : room.description_en}
                      </p>

                      <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wifi size={14} />
                          <span>Free WiFi</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="p-4 sm:p-5 lg:p-6 pt-0">
                      <BookingDialog>
                        <Button variant="highlight" className="w-full font-semibold text-sm sm:text-base">
                          {t.bookRoom}
                        </Button>
                      </BookingDialog>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-1/2 hidden sm:flex" />
            <CarouselNext className="right-0 translate-x-1/2 hidden sm:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
