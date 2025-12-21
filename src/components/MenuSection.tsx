import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useContentData } from "@/hooks/useContentData";
import { MenuSkeleton } from "@/components/SkeletonCard";

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
  const navigate = useNavigate();
  const { menus: menuData, isLoading: loading } = useContentData();
  
  const menus = menuData?.menus || [];
  const categories = menuData?.categories || [];

  const recommendedMenus = menus.filter((m) => m.is_recommended);
  
  const getMenusByCategory = (categoryId: string, limit?: number) => {
    const filtered = menus.filter((m) => m.category_id === categoryId);
    return limit ? filtered.slice(0, limit) : filtered;
  };

  if (loading) {
    return (
      <section id="menu" className="py-12 sm:py-16 lg:py-20 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
              {t.menuTitle}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
              {t.menuSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => (
              <MenuSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-12 sm:py-16 lg:py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Recommended Menu Section */}
        {recommendedMenus.length > 0 && (
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Star className="text-primary fill-primary" size={24} />
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground font-serif">
                  {t.recommended}
                </h2>
                <Star className="text-primary fill-primary" size={24} />
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
                {t.recommendedSubtitle}
              </p>
            </div>

            <div className="max-w-5xl mx-auto px-0 sm:px-8 lg:px-12">
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
                <CarouselContent className="-ml-2 sm:-ml-4">
                  {recommendedMenus.map((item) => (
                    <CarouselItem key={item.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2">
                      <Card className="border-border hover:border-primary transition-all duration-500 overflow-hidden group h-full">
                        <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={language === "th" ? item.name_th : item.name_en}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-primary text-primary-foreground px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1 animate-pulse">
                            <Star size={14} fill="currentColor" />
                            <span className="font-semibold text-xs sm:text-sm">{t.recommended}</span>
                          </div>
                        </div>
                        <CardContent className="p-4 sm:p-5 lg:p-6">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">
                              {language === "th" ? item.name_th : item.name_en}
                            </h3>
                            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary flex-shrink-0">฿{item.price}</div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {language === "th" ? item.description_th : item.description_en}
                          </p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 -translate-x-1/2 hidden sm:flex" />
                <CarouselNext className="right-0 translate-x-1/2 hidden sm:flex" />
              </Carousel>
            </div>
          </div>
        )}

        {/* Regular Menu Section */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
            {t.menuTitle}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto">
            {t.menuSubtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id} className="w-full">
              <div className="overflow-x-auto mb-6 sm:mb-8 -mx-4 px-4 scrollbar-hide">
                <TabsList 
                  className="inline-flex w-auto min-w-full justify-start sm:grid sm:w-full sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2"
                >
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.id} 
                      className="text-xs sm:text-sm lg:text-base whitespace-nowrap flex-shrink-0 px-3 sm:px-4"
                    >
                      {language === "th" ? cat.name_th : cat.name_en}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((cat) => {
                const categoryMenus = getMenusByCategory(cat.id, 5);
                return (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-3 sm:space-y-4">
                    {categoryMenus.length > 0 ? (
                      categoryMenus.map((item, index) => (
                        <Card
                          key={item.id}
                          className="border-border hover:border-primary transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <CardContent className="p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                              <div className="flex-1 flex items-start gap-2 sm:gap-3 md:gap-4 min-w-0">
                                {item.icon_url && (
                                  <img
                                    src={item.icon_url}
                                    alt="icon"
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 object-contain flex-shrink-0 mt-0.5"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground mb-0.5 sm:mb-1 break-words">
                                    {language === "th" ? item.name_th : item.name_en}
                                  </h3>
                                  {(item.description_th || item.description_en) && (
                                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words line-clamp-2 sm:line-clamp-none">
                                      {language === "th" ? item.description_th : item.description_en}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-primary flex-shrink-0 self-end sm:self-center">
                                ฿{item.price}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm sm:text-base">
                        {language === "th" ? "ไม่มีเมนูในหมวดหมู่นี้" : "No items in this category"}
                      </p>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground text-sm sm:text-base">
              {language === "th" ? "ยังไม่มีเมนู" : "No menus available"}
            </p>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Button 
              variant="highlight" 
              size="lg" 
              className="font-semibold text-sm sm:text-base w-full sm:w-auto"
              onClick={() => navigate('/menu')}
            >
              {t.viewFullMenu}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuSection;
