import { useState } from "react";
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
import { useRooms } from "@/hooks/useContentData";
import { RoomSkeleton } from "@/components/SkeletonCard";
import BookingDialog from "@/components/BookingDialog";
import RoomDetailModal from "@/components/RoomDetailModal";


interface Room {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  price: number;
  is_active: boolean | null;
  is_available?: boolean; // Room availability status (for bookings)
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
  const { data: rooms = [], isLoading: loading } = useRooms();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleRoomChange = (room: Room) => {
    setSelectedRoom(room);
  };

  if (loading) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="rooms" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-5 md:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 md:mb-4 font-serif">
            {t.roomsTitle}
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {t.roomsSubtitle}
          </p>
        </div>

        <div className="w-full px-0 sm:px-2 md:px-4">
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
            <CarouselContent className="-ml-4 sm:-ml-2 md:ml-0">
              {rooms.map((room) => (
                <CarouselItem key={room.id} className="pl-4 sm:pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <button
                    onClick={() => handleRoomClick(room)}
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg transition-all"
                  >
                    <Card className="overflow-hidden border border-border hover:shadow-2xl transition-all duration-300 h-full cursor-pointer transform hover:scale-105">
                      <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden">
                        <img
                          src={room.images[0]?.image_url || "/placeholder.svg"}
                          alt={language === "th" ? room.name_th : room.name_en}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                        {/* Room Status Badge */}
                        <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full text-white text-[10px] sm:text-xs md:text-sm font-semibold ${
                          room.is_available === false 
                            ? 'bg-red-500/90 hover:bg-red-600' 
                            : 'bg-green-500/90 hover:bg-green-600'
                        } shadow-lg transition-colors`}>
                          {room.is_available === false 
                            ? (language === 'th' ? 'ไม่ว่าง' : language === 'zh' ? '已满房' : 'Unavailable')
                            : (language === 'th' ? 'ว่าง' : language === 'zh' ? '有房' : 'Available')}
                        </div>
                      </div>
                      
                      <CardHeader className="p-3 sm:p-4 md:p-6 pb-1 sm:pb-2 md:pb-3">
                        <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif line-clamp-1">
                          {language === "th" ? room.name_th : room.name_en}
                        </CardTitle>
                        <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2">
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">฿{room.price}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">{t.perNight}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-2 sm:space-y-3">
                        <p className="text-xs sm:text-sm md:text-base text-muted-foreground line-clamp-2">
                          {language === "th" ? room.description_th : room.description_en}
                        </p>

                        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Wifi size={14} className="sm:w-4 sm:h-4" />
                            <span>{language === 'th' ? 'WiFi ฟรี' : language === 'zh' ? '免费WiFi' : 'Free WiFi'}</span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="p-3 sm:p-4 md:p-6 pt-0">
                        <div className="w-full text-center text-primary font-semibold text-xs sm:text-sm">
                          {language === 'th' ? 'คลิกเพื่อดูรายละเอียด' : language === 'zh' ? '点击查看详情' : 'Click to view details'}
                        </div>
                      </CardFooter>
                    </Card>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-1/2 hidden sm:flex" />
            <CarouselNext className="right-0 translate-x-1/2 hidden sm:flex" />
          </Carousel>
        </div>
      </div>

      {/* Room Detail Modal */}
      <RoomDetailModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        allRooms={rooms}
        onRoomChange={handleRoomChange}
      />
    </section>
  );
};

export default RoomsSection;
