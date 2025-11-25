import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Star, Loader2 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useContentData } from "@/hooks/useContentData";

interface Menu {
  id: string;
  name_th: string;
  name_en: string;
  description_th: string | null;
  description_en: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  icon_url: string | null;
  is_recommended: boolean;
  is_active: boolean;
}

interface Category {
  id: string;
  name_th: string;
  name_en: string;
}

const MenuSection = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { menus: menuData, isLoading: loading } = useContentData();
  
  const menus = menuData?.menus || [];
  const categories = menuData?.categories || [];

  const recommendedMenus = menus.filter((m) => m.is_recommended);
  
  const getMenusByCategory = (categoryId: string) => {
    return menus.filter((m) => m.category_id === categoryId);
  };

  if (loading) {
    return (
      <section id="menu" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        {/* Recommended Menu Section */}
        {recommendedMenus.length > 0 && (
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

            <div className="max-w-5xl mx-auto px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {recommendedMenus.map((item) => (
                    <CarouselItem key={item.id} className="pl-4 md:basis-1/2">
                      <Card className="border-border hover:border-primary transition-all duration-500 overflow-hidden group h-full">
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={language === "th" ? item.name_th : item.name_en}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-1 animate-pulse">
                            <Star size={16} fill="currentColor" />
                            <span className="font-semibold">{t.recommended}</span>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-semibold text-foreground">
                              {language === "th" ? item.name_th : item.name_en}
                            </h3>
                            <div className="text-2xl font-bold text-primary">฿{item.price}</div>
                          </div>
                          <p className="text-muted-foreground">
                            {language === "th" ? item.description_th : item.description_en}
                          </p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-x-1/2" />
                <CarouselNext className="right-0 translate-x-1/2" />
              </Carousel>
            </div>
          </div>
        )}

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
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id} className="w-full">
              <TabsList 
                className={`grid w-full mb-8 ${
                  categories.length === 1 ? 'grid-cols-1' :
                  categories.length === 2 ? 'grid-cols-2' :
                  categories.length === 3 ? 'grid-cols-3' :
                  'grid-cols-4'
                }`}
              >
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-lg">
                    {language === "th" ? cat.name_th : cat.name_en}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => {
                const categoryMenus = getMenusByCategory(cat.id);
                return (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-4">
                    {categoryMenus.length > 0 ? (
                      categoryMenus.map((item, index) => (
                        <Card
                          key={item.id}
                          className="border-border hover:border-primary transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <CardContent className="p-6 flex justify-between items-center">
                            <div className="flex-1 flex items-center gap-4">
                              {item.icon_url && (
                                <img
                                  src={item.icon_url}
                                  alt="icon"
                                  className="w-8 h-8 object-contain flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                  {language === "th" ? item.name_th : item.name_en}
                                </h3>
                                {(item.description_th || item.description_en) && (
                                  <p className="text-muted-foreground">
                                    {language === "th" ? item.description_th : item.description_en}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-2xl font-bold text-primary ml-4 flex-shrink-0">
                              ฿{item.price}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        {language === "th" ? "ไม่มีเมนูในหมวดหมู่นี้" : "No items in this category"}
                      </p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground">
              {language === "th" ? "ยังไม่มีเมนู" : "No menus available"}
            </p>
          )}

          <div className="text-center mt-10">
            <Button variant="highlight" size="lg" className="font-semibold">
              {t.viewFullMenu}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
