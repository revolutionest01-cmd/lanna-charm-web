import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  Eye,
  Heart,
  PlusCircle,
  LogOut,
  User,
  ArrowLeft,
  Search
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { createTopicValidation } from "@/lib/validation";

// Import forum images
import foodImage from "@/assets/forum-food-1.jpg";
import staffImage from "@/assets/forum-staff-1.jpg";
import cakeImage from "@/assets/forum-cake-1.jpg";
import parkingImage from "@/assets/forum-parking-1.jpg";
import wifiImage from "@/assets/forum-wifi-1.jpg";

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

const Forum = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<Topic['category']>("general");
  const [newTopicImage, setNewTopicImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [likedTopicIds, setLikedTopicIds] = useState<Set<number>>(new Set());

  const categories = [
    { value: "all", label: language === 'th' ? 'ทั้งหมด' : language === 'zh' ? '全部' : language === 'ja' ? 'すべて' : 'All' },
    { value: "general", label: language === 'th' ? 'ทั่วไป' : language === 'zh' ? '一般' : language === 'ja' ? '一般' : 'General' },
    { value: "question", label: language === 'th' ? 'คำถาม' : language === 'zh' ? '问题' : language === 'ja' ? '質問' : 'Question' },
    { value: "review", label: language === 'th' ? 'รีวิว' : language === 'zh' ? '评论' : language === 'ja' ? 'レビュー' : 'Review' },
    { value: "shopping", label: "Shoppable" },
  ];

  const [topics, setTopics] = useState<Topic[]>([
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
        ? 'ขอบคุณมุมกาแฟแจ่งสบาย ๆ อาหารรสชาติดี เมนูแนะนำให้ไปได้เลย อร่อยมากครับ หอมทั้งกลิ่นกาแฟและกลิ่นอาหาร'
        : 'Thank you for the cool coffee corner. The food tastes good. Recommended menu to go.',
      createdAt: '2025-01-20',
      image: foodImage
    },
    {
      id: 2,
      title: language === 'th' ? 'พนักงานบริการดีมาก ยิ้มแย้มเสมอ 😊' : 'Great service staff, always smiling 😊',
      author: language === 'th' ? 'คุณนิดา' : 'Nida',
      authorId: 'user2',
      replies: 0,
      views: 123,
      likes: 8,
      category: 'review',
      content: language === 'th'
        ? 'ประทับใจพนักงานทุกคน ยินดีเป็นกันเอง พูดจาสุภาพ เป็นมิตรกับลูกค้าและเราได้รับการดูแลเป็นอย่างดี ทำให้รู้สึกอบอุ่นและเป็นกันเอง'
        : 'Impressed with all the staff. Friendly, polite, and we receive excellent service.',
      createdAt: '2025-01-19',
      image: staffImage
    },
    {
      id: 3,
      title: language === 'th' ? 'เค้กโรมนอร่อยมาก ต้องลอง! 🍰' : 'Delicious cake, must try! 🍰',
      author: language === 'th' ? 'คุณปิยะ' : 'Piya',
      authorId: 'user3',
      replies: 1,
      views: 156,
      likes: 12,
      category: 'review',
      content: language === 'th'
        ? 'ลองมาเค้กโรมนอร่อยงามมาก วัตถุดิบดี ๆ ครอซซองเหมือนไป ความอร่อยเดินบทาให้งงงง รสชาติดีจริงๆ แนะนำเลยค่ะ'
        : 'Try the delicious croissant. Good ingredients. Really good taste.',
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
        ? 'ที่จอดรถว่างมาก จอดสะดวก นี่เป็นข้อดีที่สุด ปลอดภัย มีรักษาความปลอดภัย จอดง่ายมาก'
        : 'Lots of parking space, easy to park. Very safe.',
      createdAt: '2025-01-17',
      image: parkingImage
    },
    {
      id: 5,
      title: language === 'th' ? 'WiFi เร็วมาก ทำงานได้เลย 📶' : 'Fast WiFi, can work 📶',
      author: language === 'th' ? 'คุณธนากร' : 'Thanakorn',
      authorId: 'user5',
      replies: 0,
      views: 67,
      likes: 3,
      category: 'general',
      content: language === 'th'
        ? 'WiFi เร็วมาก เหมาะมาทำงาน สะดวก มีปลั๊กไฟให้ทุกที่ บรรยากาศดีเงียบสงบ'
        : 'Very fast WiFi, suitable for working. Convenient.',
      createdAt: '2025-01-16',
      image: wifiImage
    },
  ]);

  const popularTopics = [...topics].sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2)).slice(0, 5);

  const filteredTopics = () => {
    let filtered = topics;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(topic => topic.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getCategoryLabel = (category: Topic['category']) => {
    const labels = {
      general: language === 'th' ? 'ทั่วไป' : language === 'zh' ? '一般' : language === 'ja' ? '一般' : 'General',
      question: language === 'th' ? 'คำถาม' : language === 'zh' ? '问题' : language === 'ja' ? '質問' : 'Question',
      review: language === 'th' ? 'รีวิว' : language === 'zh' ? '评论' : language === 'ja' ? 'レビュー' : 'Review',
      shopping: 'Shoppable',
    };
    return labels[category];
  };

  const getCategoryColor = (category: Topic['category']) => {
    const colors = {
      general: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200',
      question: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200',
      review: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200',
      shopping: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200',
    };
    return colors[category];
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : language === 'zh' ? '请先登录' : language === 'ja' ? '先にログインしてください' : 'Please login first');
      return;
    }

    try {
      // Validate input
      const topicSchema = createTopicValidation(language);
      topicSchema.parse({
        title: newTopicTitle,
        content: newTopicContent,
      });

      const newTopic: Topic = {
        id: Date.now(),
        title: newTopicTitle.trim(),
        author: user.name,
        authorId: user.id,
        replies: 0,
        views: 0,
        likes: 0,
        category: newTopicCategory,
        content: newTopicContent.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        image: newTopicImage || undefined
      };

      setTopics([newTopic, ...topics]);
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicCategory("general");
      setNewTopicImage(null);
      setIsDialogOpen(false);
      sweetAlert.success(language === 'th' ? 'สร้างกระทู้สำเร็จ' : language === 'zh' ? '主题创建成功' : language === 'ja' ? 'トピックを作成しました' : 'Topic created successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        sweetAlert.error(firstError.message);
      } else {
        sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : language === 'ja' ? 'エラーが発生しました。もう一度お試しください' : 'An error occurred. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    logout();
    sweetAlert.success(language === 'th' ? 'ออกจากระบบสำเร็จ' : language === 'zh' ? '成功登出' : language === 'ja' ? 'ログアウトしました' : 'Logged out successfully');
    navigate("/");
  };

  const handleLikeTopic = (e: React.MouseEvent, topicId: number) => {
    e.stopPropagation();
    
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : language === 'zh' ? '请先登录' : language === 'ja' ? '先にログインしてください' : 'Please login first');
      return;
    }

    setLikedTopicIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });

    setTopics(prev => 
      prev.map(topic => {
        if (topic.id === topicId) {
          const isNowLiked = !likedTopicIds.has(topicId);
          return {
            ...topic,
            likes: isNowLiked ? topic.likes + 1 : Math.max(0, topic.likes - 1)
          };
        }
        return topic;
      })
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-foreground"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === 'th' ? 'หน้าแรก' : language === 'zh' ? '首页' : language === 'ja' ? 'ホーム' : 'Home'}
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Plern Ping Cafe" className="h-8" />
                <h1 className="font-serif font-bold text-lg text-foreground hidden sm:block">
                  {language === 'th' ? 'ชุมชนคนเพลินพิง' : language === 'zh' ? 'Plern Ping 社区' : language === 'ja' ? 'Plern Ping コミュニティ' : 'Plern Ping Community'}
                </h1>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{language === 'th' ? 'ออกจากระบบ' : language === 'zh' ? '退出登录' : language === 'ja' ? 'ログアウト' : 'Logout'}</span>
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => navigate("/auth")}>
                  {language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : language === 'ja' ? 'ログイン' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Title & Description */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            {language === 'th' ? 'ชุมชนคนเพลินพิง' : language === 'zh' ? 'Plern Ping 社区' : language === 'ja' ? 'Plern Ping コミュニティ' : 'Plern Ping Community'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'th' 
              ? 'แลกเปลี่ยนประสบการณ์และความรู้เกี่ยวกับคาเฟ่และรีสอร์ท' 
              : language === 'zh'
              ? '分享有关咖啡馆和度假村的经验和知识'
              : language === 'ja'
              ? 'カフェとリゾートに関する体験と知識を共有しましょう'
              : 'Share experiences and knowledge about cafe and resort'}
          </p>
        </div>

        {/* Search & Create Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={language === 'th' ? 'ค้นหากระทู้...' : language === 'zh' ? '搜索主题...' : language === 'ja' ? 'トピックを検索...' : 'Search topics...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {isAuthenticated ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {language === 'th' ? 'ตั้งกระทู้ใหม่' : language === 'zh' ? '创建主题' : language === 'ja' ? 'トピックを作成' : 'Create Topic'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {language === 'th' ? 'ตั้งกระทู้ใหม่' : language === 'zh' ? '创建新主题' : language === 'ja' ? '新しいトピックを作成' : 'Create New Topic'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTopic} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic-category" className="text-foreground">
                      {language === 'th' ? 'หมวดหมู่' : language === 'zh' ? '类别' : language === 'ja' ? 'カテゴリ' : 'Category'}
                    </Label>
                    <Select value={newTopicCategory} onValueChange={(value: any) => setNewTopicCategory(value)}>
                      <SelectTrigger className="bg-white text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{getCategoryLabel('general')}</SelectItem>
                        <SelectItem value="question">{getCategoryLabel('question')}</SelectItem>
                        <SelectItem value="review">{getCategoryLabel('review')}</SelectItem>
                        <SelectItem value="shopping">{getCategoryLabel('shopping')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic-title" className="text-foreground">
                      {language === 'th' ? 'หัวข้อ' : language === 'zh' ? '标题' : language === 'ja' ? 'タイトル' : 'Title'}
                    </Label>
                    <Input
                      id="topic-title"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder={language === 'th' ? 'ระบุหัวข้อกระทู้' : language === 'zh' ? '输入主题标题' : language === 'ja' ? 'トピックのタイトルを入力' : 'Enter topic title'}
                      className="bg-white text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic-content" className="text-foreground">
                      {language === 'th' ? 'เนื้อหา' : language === 'zh' ? '内容' : language === 'ja' ? '内容' : 'Content'}
                    </Label>
                    <Textarea
                      id="topic-content"
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder={language === 'th' ? 'เขียนเนื้อหากระทู้...' : language === 'zh' ? '撰写您的主题内容...' : language === 'ja' ? 'トピックの内容を書いてください...' : 'Write your topic content...'}
                      className="bg-white text-foreground"
                      rows={6}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic-image" className="text-foreground">
                      {language === 'th' ? 'อัพโหลดรูปภาพ (ไม่จำเป็น)' : language === 'zh' ? '上传图片（可选）' : language === 'ja' ? '画像をアップロード（オプション）' : 'Upload Image (Optional)'}
                    </Label>
                    <Input
                      id="topic-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setNewTopicImage(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="bg-white text-foreground cursor-pointer"
                    />
                    {newTopicImage && (
                      <div className="relative w-32 h-32 mt-3 rounded-lg overflow-hidden border border-gray-300">
                        <img src={newTopicImage} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewTopicImage(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    {language === 'th' ? 'โพสต์' : language === 'zh' ? '发布' : language === 'ja' ? '投稿する' : 'Post'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button onClick={() => navigate("/auth")} className="whitespace-nowrap">
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === 'th' ? 'เข้าสู่ระบบเพื่อโพสต์' : language === 'zh' ? '登录以发布' : language === 'ja' ? 'ログインして投稿する' : 'Login to Post'}
            </Button>
          )}
        </div>

        {/* Category Tabs - Premium Styling */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full justify-start bg-gradient-to-r from-background via-muted to-background p-1 rounded-xl border border-border/30 gap-1 flex-wrap h-auto">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.value} 
                value={cat.value} 
                className="whitespace-nowrap font-medium transition-all duration-200 text-foreground bg-background/50 data-[state=active]:shadow-lg data-[state=active]:bg-foreground data-[state=active]:text-background hover:bg-foreground/10 px-4 py-2 rounded-lg"
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Topics */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              {language === 'th' ? 'กระทู้ล่าสุด' : language === 'zh' ? '最新主题' : language === 'ja' ? '最新のトピック' : 'Latest Topics'}
            </h3>
            
            {filteredTopics().length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    {language === 'th' ? 'ไม่พบกระทู้' : language === 'zh' ? '未找到主题' : language === 'ja' ? 'トピックが見つかりません' : 'No topics found'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTopics().map((topic) => (
                <Card
                  key={topic.id}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer border-border/50"
                  onClick={() => navigate(`/forum/${topic.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {topic.image && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <img 
                            src={topic.image} 
                            alt={topic.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge variant="outline" className={`${getCategoryColor(topic.category)} text-xs border`}>
                            {getCategoryLabel(topic.category)}
                          </Badge>
                        </div>
                        
                        <h4 className="font-semibold text-foreground mb-2 line-clamp-1">
                          {topic.title}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {topic.content}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{topic.views}</span>
                          </div>
                          <button
                            onClick={(e) => handleLikeTopic(e, topic.id)}
                            className="flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer"
                          >
                            <Heart 
                              className="w-3.5 h-3.5" 
                              fill={likedTopicIds.has(topic.id) ? "currentColor" : "none"}
                              color={likedTopicIds.has(topic.id) ? "#ef4444" : "currentColor"}
                            />
                            <span>{topic.likes}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{topic.replies}</span>
                          </div>
                          <span className="ml-auto">{topic.author}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Popular Topics Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Eye className="w-5 h-5 text-primary" />
                  {language === 'th' ? 'กระทู้ยอดนิยม' : 'Popular Topics'}
                </h3>
                
                <div className="space-y-3">
                  {popularTopics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/forum/${topic.id}`)}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm line-clamp-2 mb-1">
                          {topic.title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {topic.views}
                          </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLikeTopic(e, topic.id);
                            }}
                            className="flex items-center gap-1 transition-colors hover:text-red-500 cursor-pointer"
                          >
                            <Heart 
                              className="w-3 h-3" 
                              fill={likedTopicIds.has(topic.id) ? "currentColor" : "none"}
                              color={likedTopicIds.has(topic.id) ? "#ef4444" : "currentColor"}
                            />
                            {topic.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
