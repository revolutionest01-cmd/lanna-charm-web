import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Maximize, Wifi } from "lucide-react";

const rooms = [
  {
    name: "Deluxe Garden Room",
    price: "2,500",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    capacity: "2 Guests",
    size: "35 sqm",
    features: ["Garden View", "King Bed", "Private Balcony"],
  },
  {
    name: "Premium Suite",
    price: "3,800",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    capacity: "4 Guests",
    size: "50 sqm",
    features: ["Pool View", "Living Area", "Bathtub"],
  },
  {
    name: "Lanna Villa",
    price: "5,500",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    capacity: "6 Guests",
    size: "80 sqm",
    features: ["Private Pool", "Kitchen", "Garden"],
  },
];

const RoomsSection = () => {
  return (
    <section id="rooms" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            Our Rooms & Villas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Luxurious accommodations designed for comfort and relaxation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map((room, index) => (
            <Card
              key={index}
              className="overflow-hidden border-border hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
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
                  <span className="text-muted-foreground">/ night</span>
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
                <Button variant="default" className="w-full font-semibold">
                  Book Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoomsSection;
