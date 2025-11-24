import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Star } from "lucide-react";
import coffeeImage from "@/assets/menu-coffee.jpg";
import foodImage from "@/assets/menu-food.jpg";

const MenuSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const coffeeMenu = [
    { name: t.espresso, price: "70", description: t.espressoDesc },
    { name: t.cappuccino, price: "95", description: t.cappuccinoDesc },
    { name: t.latte, price: "95", description: t.latteDesc },
    { name: t.thaiIcedCoffee, price: "85", description: t.thaiIcedCoffeeDesc },
  ];

  const foodMenu = [
    { name: t.padThai, price: "120", description: t.padThaiDesc },
    { name: t.greenCurry, price: "150", description: t.greenCurryDesc },
    { name: t.somTam, price: "90", description: t.somTamDesc },
    { name: t.khaoSoi, price: "140", description: t.khaoSoiDesc },
  ];

  const recommendedMenu = [
    { name: t.khaoSoi, price: "140", description: t.khaoSoiDesc, image: foodImage, category: "food" },
    { name: t.cappuccino, price: "95", description: t.cappuccinoDesc, image: coffeeImage, category: "coffee" },
  ];

  return (
    <section id="menu" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        {/* Recommended Menu Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="text-primary fill-primary" size={32} />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground font-serif">
                {t.recommended}
              </h2>
              <Star className="text-primary fill-primary" size={32} />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.recommendedSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {recommendedMenu.map((item, index) => (
              <Card
                key={index}
                className="border-border hover:border-primary transition-all duration-300 overflow-hidden group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-1">
                    <Star size={16} fill="currentColor" />
                    <span className="font-semibold">{t.recommended}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-semibold text-foreground">{item.name}</h3>
                    <div className="text-2xl font-bold text-primary">฿{item.price}</div>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Regular Menu Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            {t.menuTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t.menuSubtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="coffee" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="coffee" className="text-lg">{t.coffeeAndDrinks}</TabsTrigger>
              <TabsTrigger value="food" className="text-lg">{t.food}</TabsTrigger>
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
              {t.viewFullMenu}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
