import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle,
  Eye,
  Heart,
  ArrowLeft,
  Send,
  Clock
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";

interface Reply {
  id: number;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
}

interface Topic {
  id: number;
  title: string;
  author: string;
  authorId: string;
  replies: number;
  views: number;
  likes: number;
  category: 'general' | 'question' | 'review' | 'shopping';
  content: string;
  createdAt: string;
  image?: string;
}

// Import images
import foodImage from "@/assets/forum-food-1.jpg";
import staffImage from "@/assets/forum-staff-1.jpg";
import cakeImage from "@/assets/forum-cake-1.jpg";
import parkingImage from "@/assets/forum-parking-1.jpg";
import wifiImage from "@/assets/forum-wifi-1.jpg";

const TopicDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated } = useAuth();

  const [replyContent, setReplyContent] = useState("");

  // Mock topics data (same as Forum page)
  const topics: Topic[] = [
    {
      id: 1,
      title: language === 'th' ? 'แนะนำเมนูอร่อยที่ Plern Ping 🍜' : 'Recommended delicious menu at Plern Ping 🍜',
      author: language === 'th' ? 'คุณสมชาย' : 'Somchai',
      authorId: 'user1',
      replies: 5,
      views: 234,
      likes: 15,
      category: 'review',
      content: language === 'th' 
        ? 'ขอบคุณมุมกาแฟแจ่งสบาย ๆ อาหารรสชาติดี เมนูแนะนำให้ไปได้เลย อร่อยมากครับ หอมทั้งกลิ่นกาแฟและกลิ่นอาหาร ข้าวซอยรสชาติเข้มข้น เส้นกรอบอร่อย น้ำแกงหอมเครื่องเทศ แนะนำเลยครับ'
        : 'Thank you for the cool coffee corner. The food tastes good. Recommended menu to go. The Khao Soi is rich in flavor, crispy noodles, fragrant curry.',
      createdAt: '2025-01-20',
      image: foodImage
    },
    {
      id: 2,
      title: language === 'th' ? 'พนักงานบริการดีมาก ยิ้มแย้มเสมอ 😊' : 'Great service staff, always smiling 😊',
      author: language === 'th' ? 'คุณนิดา' : 'Nida',
      authorId: 'user2',
      replies: 3,
      views: 123,
      likes: 8,
      category: 'review',
      content: language === 'th'
        ? 'ประทับใจพนักงานทุกคน ยินดีเป็นกันเอง พูดจาสุภาพ เป็นมิตรกับลูกค้าและเราได้รับการดูแลเป็นอย่างดี ทำให้รู้สึกอบอุ่นและเป็นกันเอง พนักงานแนะนำเมนูดีมาก รู้จักรสชาติของลูกค้า'
        : 'Impressed with all the staff. Friendly, polite, and we receive excellent service. The staff are great at recommending menus and understanding customer tastes.',
      createdAt: '2025-01-19',
      image: staffImage
    },
    {
      id: 3,
      title: language === 'th' ? 'เค้กโรมนอร่อยมาก ต้องลอง! 🍰' : 'Delicious cake, must try! 🍰',
      author: language === 'th' ? 'คุณปิยะ' : 'Piya',
      authorId: 'user3',
      replies: 2,
      views: 156,
      likes: 12,
      category: 'review',
      content: language === 'th'
        ? 'ลองมาเค้กโรมนอร่อยงามมาก วัตถุดิบดี ๆ ครอซซองเหมือนไป ความอร่อยเดินบทาให้งงงง รสชาติดีจริงๆ แนะนำเลยค่ะ ราคาไม่แพง คุ้มค่ามากๆ ครอสซองต์หอมมาก เนยแท้'
        : 'Try the delicious croissant. Good ingredients. Really good taste. Reasonable price, very worth it. The croissant is very fragrant with real butter.',
      createdAt: '2025-01-18',
      image: cakeImage
    },
    {
      id: 4,
      title: language === 'th' ? 'ที่จอดรถว่างวาง จอดสะดวก 🚗' : 'Spacious parking, easy to park 🚗',
      author: language === 'th' ? 'คุณวันเพ็ญ' : 'Wanpen',
      authorId: 'user4',
      replies: 1,
      views: 89,
      likes: 5,
      category: 'general',
      content: language === 'th'
        ? 'ที่จอดรถว่างมาก จอดสะดวก นี่เป็นข้อดีที่สุด ปลอดภัย มีรักษาความปลอดภัย จอดง่ายมาก มีเจ้าหน้าที่ดูแล พื้นที่กว้าง จอดได้หลายคัน'
        : 'Lots of parking space, easy to park. Very safe. There are security guards. Wide area, can park many cars.',
      createdAt: '2025-01-17',
      image: parkingImage
    },
    {
      id: 5,
      title: language === 'th' ? 'WiFi เร็วมาก ทำงานได้เลย 📶' : 'Fast WiFi, can work 📶',
      author: language === 'th' ? 'คุณธนากร' : 'Thanakorn',
      authorId: 'user5',
      replies: 4,
      views: 67,
      likes: 3,
      category: 'general',
      content: language === 'th'
        ? 'WiFi เร็วมาก เหมาะมาทำงาน สะดวก มีปลั๊กไฟให้ทุกที่ บรรยากาศดีเงียบสงบ เหมาะสำหรับนั่งทำงาน มีโต๊ะเยอะ นั่งสบาย'
        : 'Very fast WiFi, suitable for working. Convenient. Quiet atmosphere, suitable for sitting and working. Many tables, comfortable seating.',
      createdAt: '2025-01-16',
      image: wifiImage
    },
  ];

  const [replies, setReplies] = useState<Reply[]>([
    {
      id: 1,
      author: language === 'th' ? 'คุณมานี' : 'Manee',
      authorId: 'user6',
      content: language === 'th' ? 'เห็นด้วยค่ะ อาหารอร่อยจริงๆ' : 'I agree, the food is really delicious',
      createdAt: language === 'th' ? '1 ชั่วโมงที่แล้ว' : '1 hour ago',
      likes: 3
    },
    {
      id: 2,
      author: language === 'th' ? 'คุณสมหมาย' : 'Sommai',
      authorId: 'user7',
      content: language === 'th' ? 'ขอบคุณสำหรับรีวิวครับ จะไปลองดูแน่นอน' : 'Thank you for the review. Will definitely try it',
      createdAt: language === 'th' ? '30 นาทีที่แล้ว' : '30 minutes ago',
      likes: 1
    }
  ]);

  const topic = topics.find(t => t.id === Number(id));

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{language === 'th' ? 'ไม่พบกระทู้' : 'Topic not found'}</h2>
          <Button onClick={() => navigate('/forum')}>
            {language === 'th' ? 'กลับไปหน้าเว็บบอร์ด' : 'Back to Forum'}
          </Button>
        </div>
      </div>
    );
  }

  const getCategoryLabel = (category: Topic['category']) => {
    const labels = {
      general: language === 'th' ? 'ทั่วไป' : 'General',
      question: language === 'th' ? 'คำถาม' : 'Question',
      review: language === 'th' ? 'รีวิว' : 'Review',
    };
    return labels[category];
  };

  const getCategoryColor = (category: Topic['category']) => {
    const colors = {
      general: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200',
      question: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200',
      review: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200',
    };
    return colors[category];
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : 'Please login first');
      navigate('/auth');
      return;
    }

    if (!replyContent.trim()) {
      sweetAlert.error(language === 'th' ? 'กรุณาใส่ข้อความ' : 'Please enter a message');
      return;
    }

    const newReply: Reply = {
      id: Date.now(),
      author: user.name,
      authorId: user.id,
      content: replyContent,
      createdAt: language === 'th' ? 'เมื่อสักครู่' : 'Just now',
      likes: 0
    };

    setReplies([...replies, newReply]);
    setReplyContent("");
    sweetAlert.success(language === 'th' ? 'ตอบกลับสำเร็จ' : 'Reply submitted successfully');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/forum')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'th' ? 'กลับไปเว็บบอร์ด' : 'Back to Forum'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Topic Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Category Badge */}
            <Badge variant="outline" className={`${getCategoryColor(topic.category)} text-xs border mb-4`}>
              {getCategoryLabel(topic.category)}
            </Badge>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {topic.title}
            </h1>

            {/* Author & Stats */}
            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-sm">
                    {topic.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{topic.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{topic.createdAt}</span>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{topic.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{topic.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{replies.length}</span>
                </div>
              </div>
            </div>

            {/* Image */}
            {topic.image && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img 
                  src={topic.image} 
                  alt={topic.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {topic.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {language === 'th' ? 'ความคิดเห็น' : 'Replies'} ({replies.length})
          </h2>

          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-primary/20">
                        {reply.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{reply.author}</span>
                        <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                      </div>
                      <p className="text-foreground mb-2">{reply.content}</p>
                      <Button variant="ghost" size="sm" className="h-auto p-1 text-muted-foreground hover:text-primary">
                        <Heart className="w-4 h-4 mr-1" />
                        {reply.likes}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Reply Form */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'th' ? 'แสดงความคิดเห็น' : 'Leave a Reply'}
            </h3>
            {isAuthenticated ? (
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={language === 'th' ? 'เขียนความคิดเห็น...' : 'Write your reply...'}
                  rows={4}
                  className="resize-none"
                />
                <Button type="submit" className="w-full sm:w-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {language === 'th' ? 'ส่งความคิดเห็น' : 'Submit Reply'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น' : 'Please login to leave a reply'}
                </p>
                <Button onClick={() => navigate('/auth')}>
                  {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopicDetail;
