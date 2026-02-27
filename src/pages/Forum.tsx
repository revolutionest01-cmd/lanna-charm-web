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
import { MessageCircle, Eye, Heart, PlusCircle, LogOut, User, ArrowLeft, Search, Loader2, Sparkles, TrendingUp } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { createTopicValidation } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { getCategoriesWithAll, getCategoryLabel, getCategoryColor, FORUM_CATEGORIES } from "@/lib/forumConfig";
import TopicCard from "@/components/TopicCard";
import { OnlineUsersPanel } from "@/components/OnlineUsersPanel";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";

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

  // Use dynamic categories from configuration - cast language to allowed types
  const displayLanguage: "th" | "en" = language === "th" ? "th" : "en";
  const categories = getCategoriesWithAll(displayLanguage);

  // Load topics on mount
  useEffect(() => {
    fetchTopics(false);
  }, []);

  // Load user's liked topics
  useEffect(() => {
    if (user && isAuthenticated) {
      loadUserLikedTopics();
    }
  }, [user, isAuthenticated]);

  const loadUserLikedTopics = async () => {
    // Note: forum_likes table may not be created yet
    // This functionality will work once database is created
    // For now, we gracefully skip this
    return;
  };

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
      topicSchema.parse({
        title: newTopicTitle,
        content: newTopicContent,
      });

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

        const { data: publicUrlData } = supabase.storage
          .from("forum")
          .getPublicUrl(filePath);

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
      
      // Reload topics
      await fetchTopics(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        sweetAlert.error(firstError.message);
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{language === "th" ? "กำลังโหลดกระทู้..." : "Loading topics..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-12 sm:pt-[3.5rem]">
      {/* Premium Header */}
      <header className="sticky top-12 sm:top-[3.5rem] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 dark:border-primary/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="hover:bg-primary/10 dark:hover:bg-primary/20"
                title={language === "th" ? "กลับไปหน้าหลัก" : "Back to Home"}
              >
                <ArrowLeft className="h-5 w-5 text-primary" />
              </Button>
              <div className="flex items-center gap-2">
                <img src={logo} alt="Logo" className="h-8 w-auto" />
                <div className="hidden sm:block">
                  <h1 className="font-serif font-bold text-lg bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
                    {language === "th" ? "ชุมชนเพลินพิง" : "Community"}
                  </h1>
                  <p className="text-xs text-gray-500">{language === "th" ? "เว็บบอร์ด" : "Forum"}</p>
                </div>
              </div>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => logout()}
                    className="hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
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
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 rounded-2xl border border-primary/20 dark:border-primary/30 p-4 sm:p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-3">
                  {language === "th" ? "ชุมชนคนเพลินพิง" : "Plern Ping Community"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {language === "th"
                    ? "แลกเปลี่ยนประสบการณ์ แนะนำเมนู และแบ่งปันช่วงเวลาที่ดีกับชุมชนของเรา"
                    : "Share experiences, recommend dishes, and connect with our community"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Create Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === "th" ? "ค้นหากระทู้..." : "Search topics..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-primary dark:focus:ring-primary"
            />
          </div>

          {isAuthenticated ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white whitespace-nowrap shadow-sm hover:shadow-md transition-all">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {language === "th" ? "ตั้งกระทู้ใหม่" : "Create Topic"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-2 border-primary/20">
                <DialogHeader>
                  <DialogTitle className="text-xl text-gray-900 dark:text-white">
                    {language === "th" ? "ตั้งกระทู้ใหม่" : "Create New Topic"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTopic} className="space-y-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-category" className="font-semibold text-gray-900 dark:text-white">
                      {language === "th" ? "หมวดหมู่" : "Category"}
                    </Label>
                    <Select value={newTopicCategory} onValueChange={(value: any) => setNewTopicCategory(value)}>
                      <SelectTrigger className="h-10 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
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

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-title" className="font-semibold text-gray-900 dark:text-white">
                      {language === "th" ? "หัวข้อ" : "Title"}
                    </Label>
                    <Input
                      id="topic-title"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder={language === "th" ? "ระบุหัวข้อกระทู้" : "Enter topic title"}
                      className="h-10 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-300 dark:border-gray-600"
                      required
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-content" className="font-semibold text-gray-900 dark:text-white">
                      {language === "th" ? "เนื้อหา" : "Content"}
                    </Label>
                    <Textarea
                      id="topic-content"
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder={language === "th" ? "เขียนเนื้อหากระทู้..." : "Write your topic content..."}
                      className="rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-300 dark:border-gray-600 resize-none"
                      rows={5}
                      required
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="topic-image" className="font-semibold text-gray-900 dark:text-white">
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
                          reader.onload = (event) => {
                            setImagePreview(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="h-10 rounded-lg cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="relative w-32 h-32 mt-3 rounded-xl overflow-hidden border-2 border-primary/30 dark:border-primary/20 shadow-sm">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicImage(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === "th" ? "กำลังสร้าง..." : "Creating..."}
                      </>
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
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              {language === "th" ? "เข้าสู่ระบบเพื่อโพสต์" : "Login to Post"}
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-white dark:bg-slate-800 border border-primary/10 dark:border-primary/20 rounded-xl p-1 shadow-sm">
              {categories.map((cat) => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
                >
                  {cat.icon} {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Topics Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary dark:text-primary/80" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === "th" ? "กระทู้ล่าสุด" : "Latest Topics"}
              </h3>
              <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400">
                {filteredTopics.length} {language === "th" ? "กระทู้" : "topics"}
              </span>
            </div>

            {filteredTopics.length === 0 ? (
              <Card className="border-primary/10 dark:border-primary/20 rounded-xl shadow-sm">
                <CardContent className="p-12 text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {language === "th" ? "ยังไม่มีกระทู้ ลองสร้างกระทู้ใหม่!" : "No topics yet. Create one to get started!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
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

          {/* Sidebar - Popular Topics */}
          <div className="lg:col-span-1">
            <div className="sticky top-[calc(3rem+5rem)] space-y-4">
              {/* Online Users */}
              <OnlineUsersPanel />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary dark:text-primary/80" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {language === "th" ? "กระทู้ยอดนิยม" : "Trending"}
                </h3>
              </div>

              <Card className="border-primary/10 dark:border-primary/20 rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="divide-y divide-primary/10 dark:divide-primary/20">
                    {popularTopics.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        {language === "th" ? "ไม่มีกระทู้นิยม" : "No popular topics"}
                      </div>
                    ) : (
                      popularTopics.map((topic, index) => (
                        <div
                          key={topic.id}
                          className="p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer"
                          onClick={() => navigate(`/forum/${topic.id}`)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/90 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">
                                {topic.title}
                              </h5>
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  {topic.views || 0}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLikeTopic(e, topic);
                                  }}
                                  className="flex items-center gap-1 transition-colors hover:text-red-500 dark:hover:text-red-400"
                                >
                                  <Heart
                                    className="w-3.5 h-3.5"
                                    fill={likedTopicIds.has(topic.id) ? "currentColor" : "none"}
                                    color={likedTopicIds.has(topic.id) ? "#ef4444" : "currentColor"}
                                  />
                                  {topic.likes_count || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Category Info */}
              <Card className="border-primary/10 dark:border-primary/20 rounded-xl shadow-sm bg-gradient-to-br from-primary/5 to-primary/5 dark:from-primary/10 dark:to-primary/5">
                <CardContent className="p-5">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                    {language === "th" ? "หมวดหมู่" : "Categories"}
                  </h4>
                  <div className="space-y-2">
                    {FORUM_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.value
                            ? "bg-primary hover:bg-primary/90 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20"
                        }`}
                      >
                        {cat.icon} {cat.label[language]}
                      </button>
                    ))}
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
