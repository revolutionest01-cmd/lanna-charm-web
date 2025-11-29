import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Toaster } from "@/components/ui/sonner";
import { useContentData } from "@/hooks/useContentData";
import { MenuSkeleton } from "@/components/SkeletonCard";

const Menu = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const { menus: menuData, isLoading: loading } = useContentData();
  
  const menus = menuData?.menus || [];
  const categories = menuData?.categories || [];

  const getMenusByCategory = (categoryId: string) => {
    return menus.filter((m) => m.category_id === categoryId);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="relative z-10 pt-20">
        {/* Hero Header */}
        <section className="py-16 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 font-serif">
              {t.menuTitle}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.menuSubtitle}
            </p>
          </div>
        </section>

        {/* Menu Content */}
        <section className="py-12 bg-card">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <MenuSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {categories.length > 0 ? (
                  <Tabs defaultValue={categories[0]?.id} className="w-full">
                    <div className="overflow-x-auto mb-8 -mx-4 px-4 sticky top-20 bg-card/95 backdrop-blur-sm z-10 py-4 border-b border-border">
                      <TabsList 
                        className="inline-flex w-auto min-w-full justify-start md:grid md:w-full md:grid-cols-2 lg:grid-cols-4 gap-2"
                      >
                        {categories.map((cat) => (
                          <TabsTrigger 
                            key={cat.id} 
                            value={cat.id} 
                            className="text-sm md:text-base lg:text-lg whitespace-nowrap flex-shrink-0"
                          >
                            {language === "th" ? cat.name_th : cat.name_en}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {categories.map((cat) => {
                      const categoryMenus = getMenusByCategory(cat.id);
                      return (
                        <TabsContent key={cat.id} value={cat.id} className="space-y-4">
                          {categoryMenus.length > 0 ? (
                            <>
                              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 font-serif">
                                {language === "th" ? cat.name_th : cat.name_en}
                              </h2>
                              {categoryMenus.map((item, index) => (
                                <Card
                                  key={item.id}
                                  className="border-border hover:border-primary transition-colors animate-fade-in"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                      <div className="flex-1 flex items-start gap-3 md:gap-4 min-w-0">
                                        {item.icon_url && (
                                          <img
                                            src={item.icon_url}
                                            alt="icon"
                                            className="w-6 h-6 md:w-8 md:h-8 object-contain flex-shrink-0 mt-1"
                                          />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-1 break-words">
                                            {language === "th" ? item.name_th : item.name_en}
                                          </h3>
                                          {(item.description_th || item.description_en) && (
                                            <p className="text-sm md:text-base text-muted-foreground break-words">
                                              {language === "th" ? item.description_th : item.description_en}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xl md:text-2xl font-bold text-primary flex-shrink-0 self-start sm:self-center">
                                        ฿{item.price}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </>
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
                  <p className="text-center text-muted-foreground py-12">
                    {language === "th" ? "ยังไม่มีเมนู" : "No menus available"}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <BackToTop />
      <Toaster />
    </div>
  );
};

export default Menu;
