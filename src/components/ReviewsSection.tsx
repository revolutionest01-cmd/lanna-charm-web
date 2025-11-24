import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const ReviewsSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const reviews = [
    {
      id: 1,
      name: language === 'th' ? 'คุณสมชาย' : 'Somchai',
      rating: 5,
      comment: language === 'th' 
        ? 'บรรยากาศดีมาก อาหารอร่อย กาแฟเข้มข้น ห้องพักสะอาด บริการดีเยี่ยม จะกลับมาอีกแน่นอน'
        : 'Great atmosphere, delicious food, strong coffee, clean rooms, excellent service. Will definitely come back!',
      date: language === 'th' ? '15 มกราคม 2568' : 'January 15, 2025',
    },
    {
      id: 2,
      name: language === 'th' ? 'คุณนิดา' : 'Nida',
      rating: 5,
      comment: language === 'th'
        ? 'ชอบมากค่ะ สไตล์ล้านนาสวยงาม อาหารไทยรสชาติแท้ ราคาไม่แพง คุ้มค่ามาก'
        : 'Love it! Beautiful Lanna style, authentic Thai food taste, not expensive, great value.',
      date: language === 'th' ? '10 มกราคม 2568' : 'January 10, 2025',
    },
    {
      id: 3,
      name: language === 'th' ? 'คุณปิยะ' : 'Piya',
      rating: 4,
      comment: language === 'th'
        ? 'ที่นี่เหมาะกับการพักผ่อน เงียบสงบ มีสวนสวยๆ กาแฟอร่อย แนะนำเลยครับ'
        : 'Perfect place to relax, peaceful, beautiful garden, great coffee. Highly recommended!',
      date: language === 'th' ? '5 มกราคม 2568' : 'January 5, 2025',
    },
    {
      id: 4,
      name: language === 'th' ? 'คุณวันเพ็ญ' : 'Wanpen',
      rating: 5,
      comment: language === 'th'
        ? 'ข้าวซอยอร่อยมาก คาปูชิโนหอม บรรยากาศดี เหมาะมาพักผ่อนกับครอบครัว'
        : 'Delicious Khao Soi, fragrant cappuccino, great ambiance, perfect for family relaxation.',
      date: language === 'th' ? '28 ธันวาคม 2567' : 'December 28, 2024',
    },
    {
      id: 5,
      name: language === 'th' ? 'คุณธนากร' : 'Thanakorn',
      rating: 4,
      comment: language === 'th'
        ? 'ห้องพักกว้างขวาง สะอาด วิวสวย เจ้าหน้าที่น่ารัก อาหารเช้าอร่อย'
        : 'Spacious and clean rooms, beautiful view, friendly staff, delicious breakfast.',
      date: language === 'th' ? '20 ธันวาคม 2567' : 'December 20, 2024',
    },
    {
      id: 6,
      name: language === 'th' ? 'คุณสุดา' : 'Suda',
      rating: 5,
      comment: language === 'th'
        ? 'มาเที่ยวเชียงใหม่ต้องแวะที่นี่ บรรยากาศล้านนาแท้ อาหารรสชาติดี ราคาเป็นกันเอง'
        : 'Must visit when in Chiang Mai! Authentic Lanna atmosphere, tasty food, reasonable prices.',
      date: language === 'th' ? '15 ธันวาคม 2567' : 'December 15, 2024',
    },
    {
      id: 7,
      name: language === 'th' ? 'คุณชัยวัฒน์' : 'Chaiwat',
      rating: 4,
      comment: language === 'th'
        ? 'เหมาะกับการพักผ่อนหย่อนใจ มีที่จอดรถสะดวก อาหารอร่อย เสิร์ฟเร็ว'
        : 'Great for relaxation, convenient parking, delicious food, quick service.',
      date: language === 'th' ? '8 ธันวาคม 2567' : 'December 8, 2024',
    },
    {
      id: 8,
      name: language === 'th' ? 'คุณอรุณี' : 'Arunee',
      rating: 5,
      comment: language === 'th'
        ? 'ประทับใจมากค่ะ ห้องพักสวยงาม อาหารหลากหลาย กาแฟเข้มข้นหอม แนะนำเลยค่ะ'
        : 'Very impressed! Beautiful rooms, variety of food, rich aromatic coffee. Highly recommend!',
      date: language === 'th' ? '1 ธันวาคม 2567' : 'December 1, 2024',
    },
    {
      id: 9,
      name: language === 'th' ? 'คุณประสิทธิ์' : 'Prasit',
      rating: 4,
      comment: language === 'th'
        ? 'สถานที่สวย เงียบสงบ เหมาะกับการพักผ่อน อาหารอร่อย พนักงานบริการดี'
        : 'Beautiful place, peaceful, perfect for relaxation, delicious food, good service.',
      date: language === 'th' ? '25 พฤศจิกายน 2567' : 'November 25, 2024',
    },
    {
      id: 10,
      name: language === 'th' ? 'คุณมนัสวี' : 'Manussawee',
      rating: 5,
      comment: language === 'th'
        ? 'ชอบมากค่ะ บรรยากาศดี อาหารอร่อย กาแฟชั้นเยี่ยม ห้องพักสะดวกสบาย คุ้มค่ามาก'
        : 'Love it! Great atmosphere, delicious food, excellent coffee, comfortable rooms, great value.',
      date: language === 'th' ? '18 พฤศจิกายน 2567' : 'November 18, 2024',
    },
  ];

  return (
    <section id="reviews" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            {t.reviewsTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.reviewsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {reviews.map((review, index) => (
            <Card
              key={review.id}
              className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-foreground">{review.name}</h3>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {review.comment}
                </p>
                <p className="text-sm text-muted-foreground/70">{review.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
