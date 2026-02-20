import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Promotion {
  id: string;
  title_th: string;
  title_en: string;
  description_th: string | null;
  description_en: string | null;
  image_url: string | null;
  discount_percentage: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  display_order: number;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

// Mock data for development
const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: '1',
    title_th: 'ส่วนลด 50% กาแฟพิเศษ',
    title_en: '50% Off Special Coffee',
    description_th: 'ลด 50% สำหรับเมนูกาแฟทั้งหมด ทุกวันจันทร์-ศุกร์',
    description_en: '50% discount on all coffee menus, Monday-Friday',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=400&fit=crop',
    discount_percentage: 50,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    display_order: 0,
  },
  {
    id: '2',
    title_th: 'อาหารชุด Buy 1 Get 1',
    title_en: 'Meal Set Buy 1 Get 1',
    description_th: 'ซื้อชุดอาหารรับประทุน 1 ชุด ฟรี 1 ชุด',
    description_en: 'Buy 1 food set, get 1 free on all bundles',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
    discount_percentage: 100,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    display_order: 1,
  },
];

const calculateCountdown = (endDate: string): CountdownTime => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  };
};

const PromotionSection = () => {
  const { language } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [countdowns, setCountdowns] = useState<Record<string, CountdownTime>>({});
  const [loading, setLoading] = useState(true);

  // Fetch promotions from database
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const now = new Date().toISOString();
        const { data } = await (supabase
          .from('promotions' as any)
          .select('*')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now)
          .order('display_order', { ascending: true })
          .order('start_date', { ascending: false }) as any).catch(() => ({ data: null }));

        if (data && data.length > 0) {
          setPromotions(data);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
        // Use mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  // Initialize and manage countdown timers
  useEffect(() => {
    if (promotions.length === 0) return;

    const newCountdowns: Record<string, CountdownTime> = {};
    promotions.forEach(promo => {
      newCountdowns[promo.id] = calculateCountdown(promo.end_date);
    });
    setCountdowns(newCountdowns);

    // Update countdown every second
    const interval = setInterval(() => {
      const updatedCountdowns: Record<string, CountdownTime> = {};
      promotions.forEach(promo => {
        updatedCountdowns[promo.id] = calculateCountdown(promo.end_date);
      });
      setCountdowns(updatedCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [promotions]);

  if (loading || promotions.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-950/10 dark:to-transparent">
      <div className="container mx-auto px-5 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground font-serif">
              {language === 'th' ? 'โปรโมชั่นพิเศษ' : language === 'zh' ? '特别优惠' : 'Special Offers'}
            </h2>
            <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={28} />
          </div>
          <p className="text-lg text-muted-foreground">
            {language === 'th' 
              ? 'อย่าพลาดโอกาสพิเศษของเดือนนี้' 
              : language === 'zh' 
              ? '不要错过本月的特别优惠'
              : "Don't miss this month's special offers"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {promotions.map((promo) => {
            const countdown = countdowns[promo.id];
            const title = language === 'th' ? promo.title_th : promo.title_en;
            const description = language === 'th' ? promo.description_th : promo.description_en;

            return (
              <Card 
                key={promo.id}
                className={cn(
                  "overflow-hidden border-2 transition-all duration-300 hover:shadow-lg hover:scale-105",
                  "border-orange-400 dark:border-orange-300",
                  "bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-950/20"
                )}
              >
                <CardContent className="p-5 sm:p-6">
                  {/* Promotion Image */}
                  {promo.image_url && (
                    <div className="relative mb-4 -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 overflow-hidden rounded-t-2xl h-48 sm:h-56">
                      <img 
                        src={promo.image_url} 
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/500x400?text=' + encodeURIComponent(title);
                        }}
                      />
                      {/* Discount Badge Overlay */}
                      {promo.discount_percentage && (
                        <div className="absolute top-3 right-3 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center font-bold shadow-lg animate-bounce">
                          <div className="text-center">
                            <div className="text-xl font-black">{promo.discount_percentage}%</div>
                            <div className="text-xs font-semibold">OFF</div>
                          </div>
                        </div>
                      )}
                      {/* Image Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="space-y-3">
                    {/* Header with icon */}
                    <div className="flex items-start gap-2">
                      <Flame className="w-5 h-5 text-orange-500 fill-orange-500 flex-shrink-0 animate-pulse mt-0.5" />
                      <h3 className="text-lg sm:text-xl font-bold text-foreground line-clamp-2">
                        {title}
                      </h3>
                    </div>

                    {description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    )}

                    {/* Countdown Timer */}
                    {!countdown?.isExpired && (
                      <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="text-orange-600 dark:text-orange-400" size={14} />
                          <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                            {language === 'th' 
                              ? 'เหลือเวลา' 
                              : language === 'zh' 
                              ? '剩余时间'
                              : 'Time Left'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {/* Days */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                              {String(countdown.days).padStart(2, '0')}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              {language === 'th' ? 'วัน' : language === 'zh' ? '天' : 'D'}
                            </div>
                          </div>

                          {/* Hours */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                              {String(countdown.hours).padStart(2, '0')}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              {language === 'th' ? 'ชม' : language === 'zh' ? 'H' : 'H'}
                            </div>
                          </div>

                          {/* Minutes */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                              {String(countdown.minutes).padStart(2, '0')}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              {language === 'th' ? 'นาที' : language === 'zh' ? 'M' : 'M'}
                            </div>
                          </div>

                          {/* Seconds */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-1.5 text-center">
                            <div className="text-sm font-bold text-red-600 dark:text-red-400 animate-pulse">
                              {String(countdown.seconds).padStart(2, '0')}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-medium">
                              {language === 'th' ? 'วินาที' : language === 'zh' ? 'S' : 'S'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expired message */}
                    {countdown?.isExpired && (
                      <div className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg p-3 text-center text-xs font-semibold">
                        {language === 'th' ? 'โปรโมชั่นหมดอายุแล้ว' : language === 'zh' ? '优惠已过期' : 'Offer Expired'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;
