import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { useMenus } from "@/hooks/useContentData";
import { MenuSkeleton } from "@/components/SkeletonCard";
import MenuDetailModal from "@/components/MenuDetailModal";

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
  const { data: menuData, isLoading: loading } = useMenus();
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const menus = menuData?.menus || [];
  const categories = menuData?.categories || [];

  const recommendedMenus = menus.filter((m) => m.is_recommended);
  
  const getMenusByCategory = (categoryId: string, limit?: number) => {
    const filtered = menus.filter((m) => m.category_id === categoryId);
    return limit ? filtered.slice(0, limit) : filtered;
  };

  const handleMenuClick = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsModalOpen(true);
  };

  const handleMenuChange = (menu: Menu) => {
    setSelectedMenu(menu);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  if (loading) {
    return (
      <section id="menu" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
              {t.menuTitle}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.menuSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <MenuSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-16 sm:py-20 bg-card">
      <div className="container mx-auto px-5 sm:px-6">
        {/* Recommended Menu Section */}
        {recommendedMenus.length > 0 && (
          <div className="mb-14 sm:mb-20">
            <div className="text-center mb-8 sm:mb-12">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Star className="text-primary fill-primary" size={24} />
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground font-serif">
                  {t.recommended}
                </h2>
                <Star className="text-primary fill-primary" size={24} />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                {t.recommendedSubtitle}
              </p>
            </div>

            <div className="w-full px-2 sm:px-4">
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
                    <CarouselItem key={item.id} className="pl-2 sm:pl-4 basis-[calc(100%-0.5rem)] sm:basis-1/2 lg:basis-1/2">
                      <button
                        onClick={() => handleMenuClick(item)}
                        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg transition-all"
                      >
                        <Card className="border-border hover:border-primary transition-all duration-500 overflow-hidden group h-full cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md">
                          {/* Image Section */}
                          {item.image_url && (
                            <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
                              <img
                                src={item.image_url}
                                alt={language === "th" ? item.name_th : item.name_en}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              {/* Recommended Badge */}
                              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-primary/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex items-center gap-1">
                                <Star size={14} fill="currentColor" className="text-white" />
                                <span className="font-semibold text-xs sm:text-sm text-white">{t.recommended}</span>
                              </div>
                              {/* Price Badge */}
                              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                                <span className="font-bold text-sm sm:text-base text-white">฿{item.price}</span>
                              </div>
                            </div>
                          )}
                          <CardContent className="p-3 sm:p-4 md:p-5">
                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                              {language === "th" ? item.name_th : item.name_en}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                              {language === "th" ? item.description_th : item.description_en}
                            </p>
                            <p className="text-primary font-semibold text-xs sm:text-sm">
                              {language === 'th' ? 'คลิกเพื่อดูรายละเอียด' : language === 'zh' ? '点击查看详情' : 'Click to view details'}
                            </p>
                          </CardContent>
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
        )}

        {/* Regular Menu Section */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
            {t.menuTitle}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {t.menuSubtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.id} className="w-full">
              <div className="mb-6 sm:mb-8 w-full">
                {/* Mobile & Tablet: Scrollable */}
                <div className="lg:hidden">
                  <ScrollArea className="w-full">
                    <TabsList 
                      className="inline-flex gap-2 bg-transparent p-0 h-auto"
                    >
                      {categories.map((cat) => (
                        <TabsTrigger 
                          key={cat.id} 
                          value={cat.id} 
                          className="text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg font-semibold whitespace-nowrap flex-shrink-0 min-h-[42px] flex items-center justify-center transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-muted/80 border border-transparent data-[state=active]:border-primary/30"
                        >
                          {language === "th" ? cat.name_th : cat.name_en}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" className="h-1.5" />
                  </ScrollArea>
                </div>

                {/* Desktop: Grid Layout */}
                <div className="hidden lg:block">
                  <TabsList 
                    className="w-full grid grid-cols-auto-fit gap-3 bg-transparent p-0 h-auto"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
                    }}
                  >
                    {categories.map((cat) => (
                      <TabsTrigger 
                        key={cat.id} 
                        value={cat.id} 
                        className="text-sm md:text-base px-4 sm:px-5 py-3 sm:py-3.5 rounded-lg font-semibold whitespace-nowrap text-center min-h-[44px] flex items-center justify-center transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg hover:bg-muted/80 border border-transparent data-[state=active]:border-primary/30"
                      >
                        {language === "th" ? cat.name_th : cat.name_en}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              {categories.map((cat) => {
                const categoryMenus = getMenusByCategory(cat.id, 5);
                return (
                  <TabsContent key={cat.id} value={cat.id} className="space-y-3 sm:space-y-4">
                    {categoryMenus.length > 0 ? (
                      categoryMenus.map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item)}
                          className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background rounded-xl transition-all animate-fade-in"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <Card
                            className="border-border/60 hover:border-primary/40 hover:shadow-xl transition-all duration-500 cursor-pointer group overflow-hidden rounded-xl"
                          >
                            <CardContent className="p-0">
                              <div className="flex items-stretch">
                                {/* Image thumbnail */}
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-l-xl bg-muted">
                                  {item.image_url ? (
                                    <img
                                      src={item.image_url}
                                      alt={language === "th" ? item.name_th : item.name_en}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                  ) : item.icon_url ? (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/50">
                                      <img
                                        src={item.icon_url}
                                        alt="icon"
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-accent/30">
                                      <span className="text-3xl">🍽️</span>
                                    </div>
                                  )}
                                  {/* Subtle gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/10 pointer-events-none" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 min-w-0 gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-0.5 break-words line-clamp-1 tracking-wide">
                                      {language === "th" ? item.name_th : item.name_en}
                                    </h3>
                                    {(item.description_th || item.description_en) && (
                                      <p className="text-xs sm:text-sm text-muted-foreground break-words line-clamp-1 mb-1">
                                        {language === "th" ? item.description_th : item.description_en}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground/70 group-hover:text-primary transition-colors duration-300">
                                      {language === 'th' ? 'คลิกเพื่อดูรายละเอียด' : language === 'zh' ? '点击查看详情' : 'Click to view details'}
                                    </p>
                                  </div>

                                  {/* Price badge */}
                                  <div className="flex-shrink-0 text-right">
                                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-highlight">
                                      ฿{item.price}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </button>
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

          <div className="text-center mt-8 sm:mt-10">
            <Button 
              size="lg" 
              className="font-semibold w-full sm:w-auto h-12 sm:h-11 text-base rounded-xl sm:rounded-lg bg-foreground text-background hover:bg-foreground/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate('/menu')}
            >
              {t.viewFullMenu}
            </Button>
          </div>
        </div>

        {/* Menu Detail Modal */}
        <MenuDetailModal
          menu={selectedMenu}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          allMenus={menus}
          onMenuChange={handleMenuChange}
        />
      </div>
    </section>
  );
};

export default MenuSection;
