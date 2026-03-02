import { useState, useEffect, useRef } from "react";
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
import { MessageCircle, Eye, Heart, PlusCircle, LogOut, User, ArrowLeft, Search, Loader2, Sparkles, TrendingUp, Flame, Users, Upload } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { z } from "zod";
import { createTopicValidation } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";
import { getCategoriesWithAll, getCategoryLabel, FORUM_CATEGORIES } from "@/lib/forumConfig";
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
  const [forumHeroImageUrl, setForumHeroImageUrl] = useState<string | null>(null);
  const [forumHeroRowId, setForumHeroRowId] = useState<string | null>(null);
  const [isUploadingForumHero, setIsUploadingForumHero] = useState(false);
  const forumHeroInputRef = useRef<HTMLInputElement>(null);

  const displayLanguage: "th" | "en" = language === "th" ? "th" : "en";
  const categories = getCategoriesWithAll(displayLanguage);
  const isAdmin = user?.role === "admin";

  useEffect(() => { fetchTopics(false); }, []);

  useEffect(() => {
    loadForumHeroImage();
  }, []);

  useEffect(() => {
    if (user && isAuthenticated) { loadUserLikedTopics(); }
  }, [user, isAuthenticated]);

  const loadUserLikedTopics = async () => { return; };

  const loadForumHeroImage = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_content")
        .select("id, image_url")
        .eq("title_en", "forum_hero")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setForumHeroRowId(data?.id || null);
      setForumHeroImageUrl(data?.image_url || null);
    } catch (error) {
      console.error("Error loading forum hero image:", error);
    }
  };

  const handleForumHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    if (!file.type.startsWith("image/")) {
      sweetAlert.error(language === "th" ? "กรุณาเลือกไฟล์รูปภาพ" : "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      sweetAlert.error(language === "th" ? "ไฟล์ต้องมีขนาดไม่เกิน 5MB" : "File size must not exceed 5MB");
      return;
    }

    try {
      setIsUploadingForumHero(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `forum-hero-${Date.now()}.${fileExt}`;
      const filePath = `forum/hero/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("forum")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("forum").getPublicUrl(filePath);
      const imageUrl = publicUrlData.publicUrl;

      if (forumHeroRowId) {
        const { error: updateError } = await supabase
          .from("hero_content")
          .update({ image_url: imageUrl })
          .eq("id", forumHeroRowId);

        if (updateError) throw updateError;
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from("hero_content")
          .insert({
            title_th: "รูป Hero เว็บบอร์ด",
            title_en: "forum_hero",
            subtitle_th: null,
            subtitle_en: null,
            image_url: imageUrl,
            is_active: false,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        setForumHeroRowId(insertedData.id);
      }

      setForumHeroImageUrl(imageUrl);
      sweetAlert.success(language === "th" ? "อัปโหลดรูป Hero สำเร็จ" : "Hero image uploaded successfully");
    } catch (error) {
      console.error("Error uploading forum hero image:", error);
      sweetAlert.error(language === "th" ? "อัปโหลดรูปไม่สำเร็จ" : "Failed to upload hero image");
    } finally {
      setIsUploadingForumHero(false);
      e.target.value = "";
    }
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
        {/* Community Card */}
        <div className="mb-6 sm:mb-8">
          <Card className="border-border/60 bg-white dark:bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white truncate">
                  {language === "th" ? "ชุมชนคนเพลินพิง" : "Plern Ping Community"}
                </h2>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isAdmin && (
                  <>
                    <input
                      ref={forumHeroInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleForumHeroImageUpload}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isUploadingForumHero}
                      className="h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      onClick={() => forumHeroInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {isUploadingForumHero
                        ? language === "th" ? "กำลังอัปโหลด..." : "Uploading..."
                        : language === "th" ? "อัปโหลดรูป" : "Upload Image"}
                    </Button>
                  </>
                )}
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/70" />
              </div>
            </div>

            {forumHeroImageUrl && (
              <div className="px-6 sm:px-8 pt-5">
                <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm">
                  <img
                    src={forumHeroImageUrl}
                    alt={language === "th" ? "รูป Hero ชุมชน" : "Community hero image"}
                    className="w-full h-44 sm:h-56 object-cover"
                  />
                </div>
              </div>
            )}

            <CardContent className={cn("p-6 sm:p-8", forumHeroImageUrl && "pt-5 sm:pt-6")}>
              <p className="text-muted-foreground text-sm sm:text-base max-w-3xl leading-relaxed">
                {language === "th"
                  ? "แลกเปลี่ยนประสบการณ์ แนะนำเมนู และแบ่งปันช่วงเวลาดีๆ กับชุมชนของเรา"
                  : "Share experiences, recommend dishes, and connect with our community"}
              </p>

              <div className="flex items-center gap-4 sm:gap-6 mt-5 pt-5 border-t border-border/60">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{topics.length}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{language === "th" ? "กระทู้" : "Topics"}</p>
                </div>
                <div className="w-px h-8 bg-border/70" />
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {topics.reduce((sum, t) => sum + (t.replies_count || 0), 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{language === "th" ? "ตอบกลับ" : "Replies"}</p>
                </div>
                <div className="w-px h-8 bg-border/70" />
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {topics.reduce((sum, t) => sum + (t.likes_count || 0), 0)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{language === "th" ? "ถูกใจ" : "Likes"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <Card className="border-border/60 bg-white dark:bg-card rounded-2xl shadow-md">
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
              <Card className="border-border/60 bg-white dark:bg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-white" />
                  <h3 className="text-sm font-bold text-white">
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
