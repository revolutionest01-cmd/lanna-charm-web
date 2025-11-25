import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Maximize, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage, translations } from "@/hooks/useLanguage";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const RoomsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const rooms = [
    {
      name: t.deluxeRoom,
      price: "2,500",
      image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
      capacity: "2 " + (language === 'th' ? 'ท่าน' : 'Guests'),
      size: "35 sqm",
      features: language === 'th' 
        ? ["วิวสวน", "เตียงคิงไซส์", "ระเบียงส่วนตัว"] 
        : ["Garden View", "King Bed", "Private Balcony"],
      description: t.deluxeRoomDesc,
    },
    {
      name: t.familySuite,
      price: "3,800",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
      capacity: "4 " + (language === 'th' ? 'ท่าน' : 'Guests'),
      size: "50 sqm",
      features: language === 'th'
        ? ["วิวสระว่ายน้ำ", "พื้นที่นั่งเล่น", "อ่างอาบน้ำ"]
        : ["Pool View", "Living Area", "Bathtub"],
      description: t.familySuiteDesc,
    },
    {
      name: t.gardenView,
      price: "5,500",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
      capacity: "6 " + (language === 'th' ? 'ท่าน' : 'Guests'),
      size: "80 sqm",
      features: language === 'th'
        ? ["สระว่ายน้ำส่วนตัว", "ครัว", "สวน"]
        : ["Private Pool", "Kitchen", "Garden"],
      description: t.gardenViewDesc,
    },
  ];

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
              {rooms.map((room, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden border-border hover:shadow-2xl transition-all duration-300 h-full">
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif">{room.name}</CardTitle>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-bold text-primary">฿{room.price}</span>
                        <span className="text-muted-foreground">{t.perNight}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Maximize size={16} />
                          <span>{room.size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Wifi size={16} />
                          <span>Free WiFi</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {room.features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
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
