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
                                  className="border-border/50 hover:border-primary/50 transition-all duration-500 animate-fade-in overflow-hidden group hover:shadow-lg"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                      {/* Image Section - Left */}
                                      <div className="relative w-full md:w-64 h-56 md:h-64 overflow-hidden flex-shrink-0 bg-muted">
                                        {item.image_url ? (
                                          <>
                                            <img
                                              src={item.image_url}
                                              alt={language === "th" ? item.name_th : item.name_en}
                                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                              loading="lazy"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                  parent.innerHTML = `
                                                    <div class="w-full h-full flex flex-col items-center justify-center bg-muted">
                                                      <svg class="w-16 h-16 text-muted-foreground/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                      </svg>
                                                      <span class="text-muted-foreground text-sm">${language === "th" ? "ไม่สามารถโหลดรูปภาพ" : "Cannot load image"}</span>
                                                    </div>
                                                  `;
                                                }
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10 pointer-events-none" />
                                            {/* Lanna decorative corner */}
                                            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/30 opacity-60 pointer-events-none" />
                                            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary/30 opacity-60 pointer-events-none" />
                                          </>
                                        ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                                            <svg className="w-16 h-16 text-muted-foreground/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-muted-foreground text-sm">
                                              {language === "th" ? "ไม่มีรูปภาพ" : "No image"}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Details Section - Right */}
                                      <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                          <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-2">
                                              {item.icon_url && (
                                                <img
                                                  src={item.icon_url}
                                                  alt="icon"
                                                  className="w-6 h-6 object-contain"
                                                />
                                              )}
                                              <h3 className="text-xl md:text-2xl font-bold text-foreground">
                                                {language === "th" ? item.name_th : item.name_en}
                                              </h3>
                                            </div>
                                            <div className="text-2xl md:text-3xl font-bold text-primary flex-shrink-0">
                                              ฿{item.price}
                                            </div>
                                          </div>
                                          
                                          {/* Decorative divider */}
                                          <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/30 mb-3" />
                                          
                                          {(item.description_th || item.description_en) && (
                                            <p className="text-base text-muted-foreground leading-relaxed">
                                              {language === "th" ? item.description_th : item.description_en}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {/* Bottom decorative element */}
                                        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground/60">
                                          <div className="w-3 h-3 rotate-45 border border-primary/40" />
                                          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                        </div>
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
