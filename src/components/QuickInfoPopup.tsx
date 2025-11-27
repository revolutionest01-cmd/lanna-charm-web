import { useState, useEffect } from "react";
import { X, Phone, Mail, MapPin, Clock, DollarSign, Instagram, MessageCircle, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";

interface QuickInfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BusinessInfo {
  name: string;
  phone: string;
  phoneSecondary?: string;
  email?: string;
  line?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
  googleMaps?: string;
  openingHours?: string;
}

interface MinRoomPrice {
  price: number;
  name: string;
}

interface RoomStats {
  count: number;
  minPrice: number;
  maxPrice: number;
  minRoomName: string;
}

interface RecommendedMenu {
  name_th: string;
  name_en: string;
  price: number;
  image_url?: string;
}

interface QuickInfoData {
  businessInfo: BusinessInfo | null;
  minRoomPrice: MinRoomPrice | null;
  roomStats: RoomStats | null;
  recommendedMenus: RecommendedMenu[];
}

const QuickInfoPopup = ({ isOpen, onClose }: QuickInfoPopupProps) => {
  const { language } = useLanguage();
  const [data, setData] = useState<QuickInfoData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !data) {
      fetchQuickInfo();
    }
  }, [isOpen]);

  const fetchQuickInfo = async () => {
    setLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('quick-info', {
        body: { language }
      });

      if (error) throw error;
      setData(responseData);
    } catch (error) {
      console.error('Error fetching quick info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <Card className="relative w-full max-w-[95vw] md:max-w-2xl max-h-[90vh] md:max-h-[85vh] bg-background rounded-3xl shadow-2xl border-0 overflow-hidden animate-scale-in">
        {/* Header with gradient background */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary/90 to-primary">
          <div className="flex items-center gap-3">
            <div className="bg-background/20 p-2 rounded-full backdrop-blur-sm">
              <MessageCircle className="w-5 h-5 text-background" />
            </div>
            <h2 className="text-xl font-bold text-background">
              {language === 'th' ? 'ข้อมูลเบื้องต้น' : 'Quick Information'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-background/20 text-background rounded-full h-9 w-9"
          >
            <X size={20} />
          </Button>
        </div>

        <ScrollArea className="h-full max-h-[calc(90vh-5rem)] md:max-h-[calc(85vh-5rem)] overflow-y-auto">
          <div className="p-4 md:p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
                  </p>
                </div>
              </div>
            ) : data ? (
              <>
                {/* Business Name Card */}
                {data.businessInfo && (
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
                    <h3 className="text-xl font-bold text-primary mb-1">
                      {data.businessInfo.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'th' ? 'ยินดีต้อนรับ' : 'Welcome'}
                    </p>
                  </div>
                )}

                {/* Contact Information Cards */}
                {data.businessInfo && (
                  <div className="space-y-3">
                    {/* Opening Hours */}
                    {data.businessInfo.openingHours && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">
                              {language === 'th' ? 'เวลาทำการ' : 'Opening Hours'}
                            </p>
                            <p className="text-muted-foreground text-sm">{data.businessInfo.openingHours}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm mb-1">
                            {language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
                          </p>
                          <a href={`tel:${data.businessInfo.phone}`} className="text-muted-foreground hover:text-primary transition-colors text-sm block">
                            {data.businessInfo.phone}
                          </a>
                          {data.businessInfo.phoneSecondary && (
                            <a href={`tel:${data.businessInfo.phoneSecondary}`} className="text-muted-foreground hover:text-primary transition-colors text-sm block">
                              {data.businessInfo.phoneSecondary}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    {data.businessInfo.email && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <Mail className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">
                              {language === 'th' ? 'อีเมล' : 'Email'}
                            </p>
                            <a href={`mailto:${data.businessInfo.email}`} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                              {data.businessInfo.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LINE */}
                    {data.businessInfo.line && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">LINE</p>
                            <p className="text-muted-foreground text-sm">{data.businessInfo.line}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Instagram */}
                    {data.businessInfo.instagram && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <Instagram className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">Instagram</p>
                            <a 
                              href={`https://instagram.com/${data.businessInfo.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors text-sm"
                            >
                              {data.businessInfo.instagram}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Facebook */}
                    {data.businessInfo.facebook && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">Facebook</p>
                            <a 
                              href={data.businessInfo.facebook.startsWith('http') 
                                ? data.businessInfo.facebook 
                                : `https://facebook.com/${data.businessInfo.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors text-sm"
                            >
                              {data.businessInfo.facebook}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {data.businessInfo.address && (
                      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground text-sm mb-1">
                              {language === 'th' ? 'ที่อยู่' : 'Address'}
                            </p>
                            <p className="text-muted-foreground text-sm mb-2">{data.businessInfo.address}</p>
                            {data.businessInfo.googleMaps && (
                              <a
                                href={data.businessInfo.googleMaps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                              >
                                {language === 'th' ? 'ดูแผนที่' : 'View Map'}
                                <span>→</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Room Pricing - Highlighted */}
                {data.roomStats && (
                  <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-5 border border-primary/30 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/20 p-2.5 rounded-xl">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <p className="font-bold text-foreground">
                        {language === 'th' ? 'ข้อมูลห้องพัก' : 'Room Information'}
                      </p>
                    </div>
                    <div className="ml-12 space-y-3">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          {language === 'th' ? 'จำนวนห้องพัก' : 'Total Rooms'}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {data.roomStats.count} {language === 'th' ? 'ห้อง' : 'rooms'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">
                          {language === 'th' ? 'ช่วงราคา' : 'Price Range'}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          ฿{data.roomStats.minPrice.toLocaleString()} - ฿{data.roomStats.maxPrice.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            {language === 'th' ? 'ต่อคืน' : 'per night'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Menus */}
                {data.recommendedMenus && data.recommendedMenus.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Coffee className="w-5 h-5 text-primary" />
                      <h4 className="font-bold text-foreground">
                        {language === 'th' ? 'เมนูแนะนำ' : 'Recommended Menu'}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {data.recommendedMenus.map((menu, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all group"
                        >
                          <span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">
                            {language === 'th' ? menu.name_th : menu.name_en}
                          </span>
                          <span className="font-bold text-primary text-sm">
                            ฿{menu.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="bg-accent/30 rounded-2xl p-8 max-w-sm mx-auto">
                  <p className="text-muted-foreground">
                    {language === 'th' 
                      ? 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง' 
                      : 'Unable to load information. Please try again.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default QuickInfoPopup;
