import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const coffeeMenu = [
  { name: "Espresso", price: "70", description: "Rich, bold single shot" },
  { name: "Cappuccino", price: "95", description: "Espresso with steamed milk foam" },
  { name: "Latte", price: "95", description: "Smooth espresso with creamy milk" },
  { name: "Thai Iced Coffee", price: "85", description: "Traditional style with condensed milk" },
];

const foodMenu = [
  { name: "Pad Thai", price: "120", description: "Classic Thai stir-fried noodles" },
  { name: "Green Curry", price: "150", description: "Aromatic Thai green curry with chicken" },
  { name: "Som Tam", price: "90", description: "Spicy papaya salad, Lanna style" },
  { name: "Khao Soi", price: "140", description: "Northern Thai curry noodle soup" },
];

const MenuSection = () => {
  return (
    <section id="menu" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            Our Menu
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Authentic Thai cuisine and premium coffee crafted with passion
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="coffee" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="coffee" className="text-lg">Coffee & Drinks</TabsTrigger>
              <TabsTrigger value="food" className="text-lg">Food</TabsTrigger>
            </TabsList>

            <TabsContent value="coffee" className="space-y-4">
              {coffeeMenu.map((item, index) => (
                <Card
                  key={index}
                  className="border-border hover:border-primary transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">{item.name}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary ml-4">฿{item.price}</div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="food" className="space-y-4">
              {foodMenu.map((item, index) => (
                <Card
                  key={index}
                  className="border-border hover:border-primary transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">{item.name}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-primary ml-4">฿{item.price}</div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          <div className="text-center mt-10">
            <Button variant="default" size="lg" className="font-semibold">
              View Full Menu
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
