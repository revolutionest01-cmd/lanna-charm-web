import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useWebboard, ForumTopic } from "@/hooks/useWebboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Eye, Heart, PlusCircle, LogOut, User, ArrowLeft, Search, Loader2, Sparkles, TrendingUp, Flame, Users, Crown, Coffee } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { createTopicValidation } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { getCategoriesWithAll, getCategoryLabel, getCategoryColor, FORUM_CATEGORIES } from "@/lib/forumConfig";
import TopicCard from "@/components/TopicCard";
import { OnlineUsersPanel } from "@/components/OnlineUsersPanel";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Forum = () => {
  const navigate = useNavigate();
  const { language } = useLanguage() as { language: "th" | "en" | "zh" | "ja" };
  const { isFeatureEnabled } = useFeatureToggle();

  useEffect(() => {
    if (!isFeatureEnabled("forum")) {
      showFeatureDisabledAlert(language);
      navigate("/");
    }
  }, [isFeatureEnabled, navigate, language]);
  const { user, isAuthenticated, logout } = useAuth();
  const {
    topics,
    loading: topicsLoading,
    fetchTopics,
    createTopic,
    toggleTopicLike,
  } = useWebboard();

  // State management
  const [likedTopicIds, setLikedTopicIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<ForumTopic["category"]>("general");
  const [newTopicImage, setNewTopicImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const displayLanguage: "th" | "en" = language === "th" ? "th" : "en";
  const categories = getCategoriesWithAll(displayLanguage);

  useEffect(() => { fetchTopics(false); }, []);

  useEffect(() => {
    if (user && isAuthenticated) { loadUserLikedTopics(); }
  }, [user, isAuthenticated]);

  const loadUserLikedTopics = async () => { return; };

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!isAuthenticated || !user) {
        sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
        navigate("/auth");
        return;
      }

      const topicSchema = createTopicValidation(language);
      topicSchema.parse({ title: newTopicTitle, content: newTopicContent });

      setIsCreating(true);

      let imageUrl: string | undefined;
      if (newTopicImage) {
        const fileExt = newTopicImage.name.split(".").pop();
        const fileName = `topic-${Date.now()}.${fileExt}`;
        const filePath = `forum/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("forum")
          .upload(filePath, newTopicImage, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("forum").getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }

      await createTopic(user.id, newTopicTitle, newTopicContent, newTopicCategory, imageUrl);
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicCategory("general");
      setNewTopicImage(null);
      setImagePreview(null);
      setIsDialogOpen(false);
      sweetAlert.success(language === "th" ? "สร้างกระทู้สำเร็จ" : "Topic created successfully");
      await fetchTopics(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        sweetAlert.error(error.errors[0].message);
      } else {
        sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" : "An error occurred. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLikeTopic = async (e: React.MouseEvent, topic: ForumTopic) => {
    e.stopPropagation();
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
      navigate("/auth");
      return;
    }
    try {
      await toggleTopicLike(topic.id, user.id);
      const newLikedTopics = new Set(likedTopicIds);
      if (newLikedTopics.has(topic.id)) {
        newLikedTopics.delete(topic.id);
      } else {
        newLikedTopics.add(topic.id);
      }
      setLikedTopicIds(newLikedTopics);
      await fetchTopics(false);
    } catch {
      sweetAlert.error(language === "th" ? "ไม่สามารถไลค์กระทู้ได้" : "Failed to like topic");
    }
  };

  const popularTopics = [...topics]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  if (topicsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{language === "th" ? "กำลังโหลดกระทู้..." : "Loading topics..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 pt-12 sm:pt-[3.5rem]">
      {/* Premium Sticky Header */}
      <header className="sticky top-12 sm:top-[3.5rem] z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="hover:bg-primary/10 rounded-xl"
                title={language === "th" ? "กลับไปหน้าหลัก" : "Back to Home"}
              >
                <ArrowLeft className="h-5 w-5 text-primary" />
              </Button>
              <div className="flex items-center gap-2.5">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
                <div className="hidden sm:block">
                  <h1 className="font-serif font-bold text-lg text-foreground">
                    {language === "th" ? "ชุมชนเพลินพิง" : "Community"}
                  </h1>
                  <p className="text-[11px] text-muted-foreground -mt-0.5">{language === "th" ? "เว็บบอร์ด" : "Forum"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-primary/80 to-primary text-white">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => logout()}
                    className="hover:bg-destructive/10 hover:text-destructive rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
                  onClick={() => navigate("/auth")}
                >
                  {language === "th" ? "เข้าสู่ระบบ" : "Login"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Hero Banner - Profile style gradient */}
        <div className="mb-6 sm:mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 p-6 sm:p-8 lg:p-10 shadow-xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-600/10 rounded-full blur-3xl" />
            <Coffee className="absolute top-4 right-6 h-10 w-10 text-amber-400/20 animate-pulse" />
            <Sparkles className="absolute bottom-4 right-20 h-6 w-6 text-yellow-400/15" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 backdrop-blur-sm border border-amber-400/20">
                  <Users className="h-6 w-6 text-amber-200" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-amber-50">
                    {language === "th" ? "ชุมชนคนเพลินพิง" : "Plern Ping Community"}
                  </h2>
                </div>
              </div>
              <p className="text-amber-200/80 text-sm sm:text-base max-w-xl leading-relaxed">
                {language === "th"
                  ? "แลกเปลี่ยนประสบการณ์ แนะนำเมนู และแบ่งปันช่วงเวลาดีๆ กับชุมชนของเรา"
                  : "Share experiences, recommend dishes, and connect with our community"}
              </p>
              {/* Stats Row */}
              <div className="flex items-center gap-4 sm:gap-6 mt-5 pt-4 border-t border-amber-400/15">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-amber-100">{topics.length}</p>
                  <p className="text-[10px] sm:text-xs text-amber-300/60 uppercase tracking-wider font-medium">{language === "th" ? "กระทู้" : "Topics"}</p>
                </div>
                <div className="w-px h-8 bg-amber-400/20" />
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-amber-100">
                    {topics.reduce((sum, t) => sum + (t.replies_count || 0), 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-300/60 uppercase tracking-wider font-medium">{language === "th" ? "ตอบกลับ" : "Replies"}</p>
                </div>
                <div className="w-px h-8 bg-amber-400/20" />
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-amber-100">
                    {topics.reduce((sum, t) => sum + (t.likes_count || 0), 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-300/60 uppercase tracking-wider font-medium">{language === "th" ? "ถูกใจ" : "Likes"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Create Section */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === "th" ? "ค้นหากระทู้..." : "Search topics..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/50 bg-card/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:ring-primary"
            />
          </div>

          {isAuthenticated ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shadow-md hover:shadow-lg transition-all gap-2">
                  <PlusCircle className="h-4 w-4" />
                  {language === "th" ? "ตั้งกระทู้ใหม่" : "Create Topic"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {language === "th" ? "ตั้งกระทู้ใหม่" : "Create New Topic"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTopic} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="topic-category" className="font-semibold text-foreground">
                      {language === "th" ? "หมวดหมู่" : "Category"}
                    </Label>
                    <Select value={newTopicCategory} onValueChange={(value: any) => setNewTopicCategory(value)}>
                      <SelectTrigger className="h-10 rounded-xl bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORUM_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label[language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-title" className="font-semibold text-foreground">
                      {language === "th" ? "หัวข้อ" : "Title"}
                    </Label>
                    <Input
                      id="topic-title"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder={language === "th" ? "ระบุหัวข้อกระทู้" : "Enter topic title"}
                      className="h-10 rounded-xl bg-background border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-content" className="font-semibold text-foreground">
                      {language === "th" ? "เนื้อหา" : "Content"}
                    </Label>
                    <Textarea
                      id="topic-content"
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder={language === "th" ? "เขียนเนื้อหากระทู้..." : "Write your topic content..."}
                      className="rounded-xl bg-background border-border resize-none"
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-image" className="font-semibold text-foreground">
                      {language === "th" ? "อัพโหลดรูปภาพ (ไม่จำเป็น)" : "Upload Image (Optional)"}
                    </Label>
                    <Input
                      id="topic-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewTopicImage(file);
                          const reader = new FileReader();
                          reader.onload = (event) => { setImagePreview(event.target?.result as string); };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="h-10 rounded-xl cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32 mt-3 rounded-xl overflow-hidden border-2 border-primary/30 shadow-sm">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setNewTopicImage(null); setImagePreview(null); }}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{language === "th" ? "กำลังสร้าง..." : "Creating..."}</>
                    ) : (
                      language === "th" ? "โพสต์" : "Post"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              onClick={() => navigate("/auth")} 
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap shadow-md"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {language === "th" ? "เข้าสู่ระบบเพื่อโพสต์" : "Login to Post"}
            </Button>
          )}
        </div>

        {/* Category Tabs - Pill style */}
        <div className="mb-6 overflow-x-auto pb-1">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-1 shadow-sm inline-flex">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm text-sm px-3 sm:px-4 transition-all whitespace-nowrap"
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Grid - Profile-style layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Topics */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {language === "th" ? "กระทู้ล่าสุด" : "Latest Topics"}
              </h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {filteredTopics.length} {language === "th" ? "กระทู้" : "topics"}
              </Badge>
            </div>

            {filteredTopics.length === 0 ? (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {language === "th" ? "ยังไม่มีกระทู้ ลองสร้างกระทู้ใหม่!" : "No topics yet. Create one to get started!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    language={displayLanguage}
                    isLiked={likedTopicIds.has(topic.id)}
                    onLike={(e) => handleLikeTopic(e, topic)}
                    onClick={() => navigate(`/forum/${topic.id}`)}
                    variant="list"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-[calc(3rem+5rem)] space-y-4">
              {/* Online Users */}
              <OnlineUsersPanel />

              {/* Trending Topics - Profile card style */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-yellow-800 px-4 py-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-200" />
                  <h3 className="text-sm font-bold text-amber-50">
                    {language === "th" ? "กระทู้ยอดนิยม" : "Trending"}
                  </h3>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {popularTopics.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        {language === "th" ? "ไม่มีกระทู้นิยม" : "No popular topics"}
                      </div>
                    ) : (
                      popularTopics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className="p-3.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                          onClick={() => navigate(`/forum/${topic.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <span className={cn(
                              "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                              index === 0 ? "bg-yellow-500 text-white" :
                              index === 1 ? "bg-slate-400 text-white" :
                              index === 2 ? "bg-amber-700 text-white" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                {topic.title}
                              </h5>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />{topic.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />{topic.likes_count || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Categories Card - Profile style */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-amber-900/90 via-amber-800/80 to-yellow-900/80 px-4 py-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-200" />
                  <h4 className="text-sm font-bold text-amber-50">
                    {language === "th" ? "หมวดหมู่" : "Categories"}
                  </h4>
                </div>
                <CardContent className="p-3">
                  <div className="space-y-1">
                    {FORUM_CATEGORIES.map((cat) => {
                      const colors = getCategoryColor(cat.value);
                      return (
                        <button
                          key={cat.value}
                          onClick={() => setSelectedCategory(cat.value)}
                          className={cn(
                            "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                            selectedCategory === cat.value
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label[language]}</span>
                          {cat.description && (
                            <span className={cn(
                              "ml-auto text-[10px]",
                              selectedCategory === cat.value ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {cat.description[displayLanguage]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
