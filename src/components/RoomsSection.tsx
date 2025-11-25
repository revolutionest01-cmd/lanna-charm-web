import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Loader2 } from "lucide-react";
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
      <section id="rooms" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="rooms" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            {t.roomsTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.roomsSubtitle}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-12">
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
            <CarouselContent className="-ml-4">
              {rooms.map((room) => (
                <CarouselItem key={room.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden border-border hover:shadow-2xl transition-all duration-300 h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={room.images[0]?.image_url || "/placeholder.svg"}
                        alt={language === "th" ? room.name_th : room.name_en}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif">
                        {language === "th" ? room.name_th : room.name_en}
                      </CardTitle>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold text-primary">฿{room.price}</span>
                        <span className="text-muted-foreground">{t.perNight}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {language === "th" ? room.description_th : room.description_en}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Wifi size={16} />
                          <span>Free WiFi</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button variant="highlight" className="w-full font-semibold">
                        {t.bookRoom}
                      </Button>
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-1/2" />
            <CarouselNext className="right-0 translate-x-1/2" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
