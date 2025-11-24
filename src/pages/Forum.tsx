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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle,
  Eye,
  Clock,
  TrendingUp,
  Sparkles,
  PlusCircle,
  LogOut,
  User,
  ArrowLeft,
  Search
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface Topic {
  id: number;
  title: string;
  author: string;
  authorId: string;
  replies: number;
  views: number;
  lastPost: string;
  isHot: boolean;
  content: string;
  createdAt: string;
}

const Forum = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, logout } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([
    {
      id: 1,
      title: language === 'th' ? 'แนะนำเมนูอร่อยที่ Plern Ping' : 'Recommended delicious menu at Plern Ping',
      author: language === 'th' ? 'คุณสมชาย' : 'Somchai',
      authorId: 'user1',
      replies: 15,
      views: 234,
      lastPost: language === 'th' ? '2 ชั่วโมงที่แล้ว' : '2 hours ago',
      isHot: true,
      content: language === 'th' 
        ? 'อยากแนะนำข้าวซอยที่นี่มากครับ รสชาติดีจริงๆ'
        : 'I highly recommend the Khao Soi here. The taste is really good.',
      createdAt: '2025-01-20'
    },
    {
      id: 2,
      title: language === 'th' ? 'ถ่ายรูปมุมไหนสวยที่สุด?' : 'Which angle is the most beautiful for photos?',
      author: language === 'th' ? 'คุณนิดา' : 'Nida',
      authorId: 'user2',
      replies: 8,
      views: 156,
      lastPost: language === 'th' ? '5 ชั่วโมงที่แล้ว' : '5 hours ago',
      isHot: false,
      content: language === 'th'
        ? 'ใครมีมุมถ่ายรูปสวยๆ แนะนำบ้างคะ?'
        : 'Does anyone have beautiful photo spots to recommend?',
      createdAt: '2025-01-19'
    },
    {
      id: 3,
      title: language === 'th' ? 'จองห้องพักแบบไหนดี?' : 'Which room should I book?',
      author: language === 'th' ? 'คุณปิยะ' : 'Piya',
      authorId: 'user3',
      replies: 12,
      views: 189,
      lastPost: language === 'th' ? 'เมื่อวาน' : 'Yesterday',
      isHot: false,
      content: language === 'th'
        ? 'กำลังจะจองห้องพัก มีคำแนะนำไหมครับ?'
        : 'Planning to book a room. Any recommendations?',
      createdAt: '2025-01-18'
    },
  ]);

  const popularTopics = [...topics].sort((a, b) => b.views - a.views);
  const latestTopics = [...topics].sort((a, b) => b.id - a.id);

  const filteredTopics = (topicList: Topic[]) => {
    if (!searchQuery) return topicList;
    return topicList.filter(topic =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated || !user) {
      toast.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : 'Please login first');
      return;
    }

    const newTopic: Topic = {
      id: Date.now(),
      title: newTopicTitle,
      author: user.name,
      authorId: user.id,
      replies: 0,
      views: 0,
      lastPost: language === 'th' ? 'เมื่อสักครู่' : 'Just now',
      isHot: false,
      content: newTopicContent,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTopics([newTopic, ...topics]);
    setNewTopicTitle("");
    setNewTopicContent("");
    setIsDialogOpen(false);
    toast.success(language === 'th' ? 'สร้างกระทู้สำเร็จ' : 'Topic created successfully');
  };

  const handleLogout = () => {
    logout();
    toast.success(language === 'th' ? 'ออกจากระบบสำเร็จ' : 'Logged out successfully');
    navigate("/");
  };

  const renderTopicList = (topicList: Topic[]) => {
    const filtered = filteredTopics(topicList);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {language === 'th' ? 'ไม่พบกระทู้' : 'No topics found'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filtered.map((topic, index) => (
          <Card
            key={topic.id}
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border-border/50 animate-fade-in cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                    {topic.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors flex-1">
                      {topic.title}
                    </h3>
                    {topic.isHot && (
                      <Badge variant="destructive" className="flex-shrink-0">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {topic.content}
                  </p>

                  <p className="text-sm text-muted-foreground mb-3">
                    {t.startedBy} <span className="font-medium">{topic.author}</span>
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === 'th' ? 'หน้าแรก' : 'Home'}
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <img src={logo} alt="Plern Ping Cafe" className="h-10" />
                <div>
                  <h1 className="font-serif font-bold text-lg text-foreground">
                    {t.forumTitle}
                  </h1>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {language === 'th' ? 'ออกจากระบบ' : 'Logout'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")}>
                  {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
            {t.forumTitle}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
            {t.forumSubtitle}
          </p>

          {/* Search & Create */}
          <div className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={language === 'th' ? 'ค้นหากระทู้...' : 'Search topics...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {isAuthenticated ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {language === 'th' ? 'สร้างกระทู้ใหม่' : 'Create Topic'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {language === 'th' ? 'สร้างกระทู้ใหม่' : 'Create New Topic'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTopic} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic-title">
                        {language === 'th' ? 'หัวข้อ' : 'Title'}
                      </Label>
                      <Input
                        id="topic-title"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        placeholder={language === 'th' ? 'ระบุหัวข้อกระทู้' : 'Enter topic title'}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-content">
                        {language === 'th' ? 'เนื้อหา' : 'Content'}
                      </Label>
                      <Textarea
                        id="topic-content"
                        value={newTopicContent}
                        onChange={(e) => setNewTopicContent(e.target.value)}
                        placeholder={language === 'th' ? 'เขียนเนื้อหากระทู้...' : 'Write your topic content...'}
                        rows={6}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {language === 'th' ? 'โพสต์' : 'Post'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Button onClick={() => navigate("/auth")} className="md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {language === 'th' ? 'เข้าสู่ระบบเพื่อโพสต์' : 'Login to Post'}
              </Button>
            )}
          </div>
        </div>

        {/* Topics */}
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
    </div>
  );
};

export default Forum;
