import { useLanguage, translations } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Eye, Clock, TrendingUp, Sparkles } from "lucide-react";

const ForumSection = () => {
  const { language } = useLanguage();
  const t = translations[language];

  const latestTopics = [
    {
      id: 1,
      title: language === 'th' ? 'แนะนำเมนูอร่อยที่ Plern Ping' : 'Recommended delicious menu at Plern Ping',
      author: language === 'th' ? 'คุณสมชาย' : 'Somchai',
      replies: 15,
      views: 234,
      lastPost: language === 'th' ? '2 ชั่วโมงที่แล้ว' : '2 hours ago',
      isHot: true
    },
    {
      id: 2,
      title: language === 'th' ? 'ถ่ายรูปมุมไหนสวยที่สุด?' : 'Which angle is the most beautiful for photos?',
      author: language === 'th' ? 'คุณนิดา' : 'Nida',
      replies: 8,
      views: 156,
      lastPost: language === 'th' ? '5 ชั่วโมงที่แล้ว' : '5 hours ago',
      isHot: false
    },
    {
      id: 3,
      title: language === 'th' ? 'จองห้องพักแบบไหนดี?' : 'Which room should I book?',
      author: language === 'th' ? 'คุณปิยะ' : 'Piya',
      replies: 12,
      views: 189,
      lastPost: language === 'th' ? 'เมื่อวาน' : 'Yesterday',
      isHot: false
    },
    {
      id: 4,
      title: language === 'th' ? 'เที่ยวเชียงใหม่ไปไหนดี?' : 'Where to visit in Chiang Mai?',
      author: language === 'th' ? 'คุณวันเพ็ญ' : 'Wanpen',
      replies: 23,
      views: 445,
      lastPost: language === 'th' ? '2 วันที่แล้ว' : '2 days ago',
      isHot: true
    },
    {
      id: 5,
      title: language === 'th' ? 'บรรยากาศยามเช้าสวยมาก!' : 'Beautiful morning atmosphere!',
      author: language === 'th' ? 'คุณธนากร' : 'Thanakorn',
      replies: 6,
      views: 98,
      lastPost: language === 'th' ? '3 วันที่แล้ว' : '3 days ago',
      isHot: false
    }
  ];

  const popularTopics = [
    {
      id: 1,
      title: language === 'th' ? 'รีวิว Plern Ping Cafe ครบครัน' : 'Complete review of Plern Ping Cafe',
      author: language === 'th' ? 'คุณสุดา' : 'Suda',
      replies: 45,
      views: 1234,
      lastPost: language === 'th' ? '1 สัปดาห์ที่แล้ว' : '1 week ago',
      isHot: true
    },
    {
      id: 2,
      title: language === 'th' ? 'เมนูแนะนำสำหรับมาครั้งแรก' : 'Recommended menu for first-timers',
      author: language === 'th' ? 'คุณชัยวัฒน์' : 'Chaiwat',
      replies: 38,
      views: 987,
      lastPost: language === 'th' ? '3 วันที่แล้ว' : '3 days ago',
      isHot: true
    },
    {
      id: 3,
      title: language === 'th' ? 'กาแฟอร่อยที่สุดในเชียงใหม่' : 'Best coffee in Chiang Mai',
      author: language === 'th' ? 'คุณอรุณี' : 'Arunee',
      replies: 52,
      views: 1456,
      lastPost: language === 'th' ? '5 วันที่แล้ว' : '5 days ago',
      isHot: true
    },
    {
      id: 4,
      title: language === 'th' ? 'เคล็ดลับการถ่ายรูปสวยๆ' : 'Tips for beautiful photos',
      author: language === 'th' ? 'คุณประสิทธิ์' : 'Prasit',
      replies: 29,
      views: 756,
      lastPost: language === 'th' ? '1 สัปดาห์ที่แล้ว' : '1 week ago',
      isHot: false
    },
    {
      id: 5,
      title: language === 'th' ? 'ห้องพักแบบไหนเหมาะกับครอบครัว?' : 'Which room is suitable for families?',
      author: language === 'th' ? 'คุณมนัสวี' : 'Manussawee',
      replies: 17,
      views: 543,
      lastPost: language === 'th' ? '4 วันที่แล้ว' : '4 days ago',
      isHot: false
    }
  ];

  const renderTopicList = (topics: typeof latestTopics) => (
    <div className="space-y-3">
      {topics.map((topic, index) => (
        <Card
          key={topic.id}
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50 animate-fade-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar placeholder */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer flex-1">
                    {topic.title}
                  </h3>
                  {topic.isHot && (
                    <Badge variant="destructive" className="flex-shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {t.startedBy} {topic.author}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{topic.replies} {t.replies}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{topic.views} {t.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{topic.lastPost}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <section id="forum" className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            {t.forumTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t.forumSubtitle}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="latest" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t.latestTopics}
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t.popularTopics}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="latest" className="animate-fade-in">
              {renderTopicList(latestTopics)}
            </TabsContent>

            <TabsContent value="popular" className="animate-fade-in">
              {renderTopicList(popularTopics)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default ForumSection;
