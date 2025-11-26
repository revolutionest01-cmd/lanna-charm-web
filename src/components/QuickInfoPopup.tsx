import { useState, useEffect } from "react";
import { X, Phone, Mail, MapPin, Clock, DollarSign, Instagram, MessageCircle } from "lucide-react";
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
  address?: string;
  googleMaps?: string;
  openingHours?: string;
}

interface MinRoomPrice {
  price: number;
  name: string;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl max-h-[80vh] bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">
            {language === 'th' ? 'ข้อมูลเบื้องต้น' : 'Quick Information'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-accent"
          >
            <X size={24} />
          </Button>
        </div>

        <ScrollArea className="h-full max-h-[calc(80vh-5rem)]">
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : data ? (
              <>
                {/* Business Info */}
                {data.businessInfo && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-primary">
                      {data.businessInfo.name}
                    </h3>

                    {/* Opening Hours */}
                    {data.businessInfo.openingHours && (
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {language === 'th' ? 'เวลาทำการ' : 'Opening Hours'}
                          </p>
                          <p className="text-muted-foreground">{data.businessInfo.openingHours}</p>
                        </div>
                      </div>
                    )}

                    {/* Contact Info */}
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}
                        </p>
                        <p className="text-muted-foreground">{data.businessInfo.phone}</p>
                        {data.businessInfo.phoneSecondary && (
                          <p className="text-muted-foreground">{data.businessInfo.phoneSecondary}</p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    {data.businessInfo.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {language === 'th' ? 'อีเมล' : 'Email'}
                          </p>
                          <p className="text-muted-foreground">{data.businessInfo.email}</p>
                        </div>
                      </div>
                    )}

                    {/* LINE */}
                    {data.businessInfo.line && (
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">LINE</p>
                          <p className="text-muted-foreground">{data.businessInfo.line}</p>
                        </div>
                      </div>
                    )}

                    {/* Instagram */}
                    {data.businessInfo.instagram && (
                      <div className="flex items-start gap-3">
                        <Instagram className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-foreground">Instagram</p>
                          <p className="text-muted-foreground">{data.businessInfo.instagram}</p>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {data.businessInfo.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {language === 'th' ? 'ที่อยู่' : 'Address'}
                          </p>
                          <p className="text-muted-foreground">{data.businessInfo.address}</p>
                          {data.businessInfo.googleMaps && (
                            <a
                              href={data.businessInfo.googleMaps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm mt-1 inline-block"
                            >
                              {language === 'th' ? 'ดูแผนที่' : 'View Map'} →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Room Pricing */}
                {data.minRoomPrice && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">
                          {language === 'th' ? 'ราคาห้องพัก' : 'Room Rates'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'th' ? 'เริ่มต้นที่' : 'Starting from'}{' '}
                          <span className="text-lg font-bold text-primary">
                            ฿{data.minRoomPrice.price.toLocaleString()}
                          </span>{' '}
                          {language === 'th' ? 'ต่อคืน' : 'per night'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Menus */}
                {data.recommendedMenus && data.recommendedMenus.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-foreground">
                      {language === 'th' ? 'เมนูแนะนำ' : 'Recommended Menu'}
                    </h4>
                    <div className="space-y-2">
                      {data.recommendedMenus.map((menu, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border"
                        >
                          <span className="text-foreground">
                            {language === 'th' ? menu.name_th : menu.name_en}
                          </span>
                          <span className="font-semibold text-primary">
                            ฿{menu.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {language === 'th' 
                  ? 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง' 
                  : 'Unable to load information. Please try again.'}
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default QuickInfoPopup;
