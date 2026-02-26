import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserRankBadge } from "@/components/UserRankBadge";
import {
  MessageCircle,
  Eye,
  Heart,
  ArrowLeft,
  Send,
  Clock,
  User,
  Loader2,
  Share2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  X,
  ZoomIn,
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getCategoryColor } from "@/lib/forumConfig";
import { ForumTopic } from "@/hooks/useWebboard";

interface ForumReply {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

const TopicDetail = () => {
  const navigate = useNavigate();
  const { topicId: id } = useParams();
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();

  // State
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const [isTopicLiked, setIsTopicLiked] = useState(false);
  const [previousTopicId, setPreviousTopicId] = useState<string | null>(null);
  const [nextTopicId, setNextTopicId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });

  // Load topic and replies
  useEffect(() => {
    if (id) {
      loadTopicAndReplies();
      loadNavigationTopics();
    }
  }, [id]);

  // Handle Escape key to close image modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImageModalOpen) {
        console.log('[TopicDetail] Escape key pressed, closing modal');
        setIsImageModalOpen(false);
      }
    };

    if (isImageModalOpen) {
      window.addEventListener('keydown', handleEscapeKey);
      return () => window.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isImageModalOpen]);

  // Reset zoom and pan when modal is closed
  useEffect(() => {
    if (!isImageModalOpen) {
      setImageZoom(1);
      setImagePan({ x: 0, y: 0 });
    }
  }, [isImageModalOpen]);

  // Handle wheel zoom for image
  const handleImageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!isImageModalOpen) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(1, Math.min(imageZoom + delta, 5));
    setImageZoom(newZoom);
  };

  // Reset zoom
  const resetImageZoom = () => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
  };

  // Check if user has liked the topic
  useEffect(() => {
    if (user && topic) {
      checkIfTopicLiked();
    }
  }, [user, topic?.id]);

  const loadTopicAndReplies = async () => {
    try {
      setLoading(true);

      // Fetch topic
      const { data: topicData, error: topicError } = await (supabase as any)
        .from("forum_topics")
        .select("*")
        .eq("id", id)
        .single();

      if (topicError) throw topicError;

      if (topicData) {
        // Fetch author_name from profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", topicData.user_id)
          .maybeSingle();

        const enrichedTopic = {
          ...topicData,
          author_name: profileData?.display_name || "Anonymous",
        };

        setTopic(enrichedTopic as unknown as ForumTopic);

        // Increment views
        await (supabase as any)
          .from("forum_topics")
          .update({ views: ((topicData as any).views || 0) + 1 })
          .eq("id", id);
      }

      // Fetch replies
      const { data: repliesData, error: repliesError } = await (supabase as any)
        .from("forum_replies")
        .select("*")
        .eq("topic_id", id)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      if (repliesData) {
        // Enrich replies with author_name from profiles
        const enrichedReplies = await Promise.all(
          (repliesData || []).map(async (reply: any) => {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", reply.user_id)
                .maybeSingle();

              return {
                ...reply,
                author_name: profile?.display_name || "Anonymous",
              };
            } catch (err) {
              console.warn("[TopicDetail] Error fetching profile for reply:", err);
              return {
                ...reply,
                author_name: "Anonymous",
              };
            }
          })
        );
        setReplies(enrichedReplies as ForumReply[]);
      }
    } catch (error) {
      console.error("Error loading topic:", error);
      sweetAlert.error(language === "th" ? "ไม่สามารถโหลดกระทู้ได้" : "Failed to load topic");
    } finally {
      setLoading(false);
    }
  };

  const checkIfTopicLiked = async () => {
    if (!user || !topic) return;

    const { data } = await (supabase as any)
      .from("forum_likes")
      .select("*")
      .eq("topic_id", topic.id)
      .eq("user_id", user.id)
      .single();

    if (data) {
      setIsTopicLiked(true);
    }
  };

  const loadNavigationTopics = async () => {
    try {
      // Fetch all active topics ordered by most recent activity
      const { data: allTopics, error } = await (supabase as any)
        .from("forum_topics")
        .select("id, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error || !allTopics) {
        console.error("[TopicDetail] Error loading navigation topics:", error);
        return;
      }

      // Find current topic index
      const currentIndex = allTopics.findIndex((t: any) => t.id === id);

      if (currentIndex !== -1) {
        // Set next topic (more recent)
        if (currentIndex > 0) {
          setNextTopicId(allTopics[currentIndex - 1].id);
        } else {
          setNextTopicId(null);
        }

        // Set previous topic (older)
        if (currentIndex < allTopics.length - 1) {
          setPreviousTopicId(allTopics[currentIndex + 1].id);
        } else {
          setPreviousTopicId(null);
        }
      }
    } catch (error) {
      console.error("[TopicDetail] Error in loadNavigationTopics:", error);
    }
  };

  const handleToggleLike = async () => {
    if (!isAuthenticated || !user || !topic) {
      sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
      navigate("/auth");
      return;
    }

    try {
      if (isTopicLiked) {
        // Remove like
        await (supabase as any)
          .from("forum_likes")
          .delete()
          .eq("topic_id", topic.id)
          .eq("user_id", user.id);

        setTopic({ ...topic, likes_count: (topic.likes_count || 0) - 1 });
        setIsTopicLiked(false);
      } else {
        // Add like
        await (supabase as any).from("forum_likes").insert({
          topic_id: topic.id,
          user_id: user.id,
        });

        setTopic({ ...topic, likes_count: (topic.likes_count || 0) + 1 });
        setIsTopicLiked(true);
      }
    } catch (error) {
      sweetAlert.error(language === "th" ? "ไม่สามารถไลค์ได้" : "Failed to like");
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[TopicDetail] Submit reply clicked - isAuthenticated:', isAuthenticated, 'user:', user?.id, 'replyContent:', replyContent.trim());

    if (!isAuthenticated || !user) {
      console.error('[TopicDetail] Not authenticated');
      sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
      navigate("/auth");
      return;
    }

    if (!replyContent.trim()) {
      console.error('[TopicDetail] Empty reply content');
      sweetAlert.error(language === "th" ? "กรุณาใส่ข้อความ" : "Please enter a message");
      return;
    }

    if (!id) {
      console.error('[TopicDetail] Missing topic ID');
      sweetAlert.error(language === "th" ? "ไม่พบ ID ของกระทู้" : "Topic ID not found");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[TopicDetail] Submitting reply...', { topic_id: id, user_id: user.id, content: replyContent });

      // First check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn('[TopicDetail] Profile check error (may not exist yet):', profileError.message);
      }

      // Insert the reply
      const { data, error } = await (supabase as any)
        .from("forum_replies")
        .insert({
          topic_id: id,
          user_id: user.id,
          content: replyContent.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[TopicDetail] Insert error:', error.message, error.code, error.details);
        
        // Provide specific error messages
        if (error.message?.includes('duplicate')) {
          throw new Error(language === "th" ? "ความคิดเห็นนี้ซ้ำกับที่มีอยู่" : "This comment already exists");
        } else if (error.message?.includes('foreign key')) {
          throw new Error(language === "th" ? "กระทู้นี้ไม่มีอยู่แล้ว" : "Topic no longer exists");
        } else if (error.message?.includes('RLS')) {
          throw new Error(language === "th" ? "คุณไม่มีสิทธิ์แสดงความคิดเห็น" : "Permission denied");
        }
        throw error;
      }

      if (data) {
        console.log('[TopicDetail] Reply inserted successfully:', data);
        
        // Update topic's updated_at to bump it to top of forum
        await (supabase as any)
          .from("forum_topics")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", id)
          .catch((err: any) => console.warn('[TopicDetail] Error updating topic timestamp:', err));
        
        setReplies([...replies, data as ForumReply]);
        setReplyContent("");
        
        // Update topic reply count
        if (topic) {
          setTopic({ ...topic, replies_count: (topic.replies_count || 0) + 1 });
        }

        sweetAlert.success(language === "th" ? "ส่งความคิดเห็นสำเร็จ" : "Reply submitted successfully");
      }
    } catch (error) {
      console.error("[TopicDetail] Error submitting reply:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit reply";
      sweetAlert.error(language === "th" ? `เกิดข้อผิดพลาด: ${errorMessage}` : `Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareTopic = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: topic?.title,
          text: topic?.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      sweetAlert.success(language === "th" ? "คัดลอกลิงก์สำเร็จ" : "Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{language === "th" ? "กำลังโหลด..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:to-slate-900">
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-blue-100/20 dark:border-blue-900/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/forum")}
              className="hover:bg-blue-100 dark:hover:bg-blue-900/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "th" ? "กลับไปเว็บบอร์ด" : "Back to Forum"}
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-blue-100/50 dark:border-blue-800/50 rounded-2xl shadow-sm bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-900/20 dark:to-orange-900/20">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {language === "th" ? "ไม่พบกระทู้" : "Topic not found"}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {language === "th"
                  ? "กระทู้ที่คุณค้นหาไม่มีอยู่ หรืออาจถูกลบไปแล้ว"
                  : "The topic you are looking for does not exist or has been deleted"}
              </p>
              <Button
                onClick={() => navigate("/forum")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {language === "th" ? "กลับไปหน้าเว็บบอร์ด" : "Back to Forum"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const categoryColor = getCategoryColor(topic.category);
  const categoryLabel = getCategoryLabel(topic.category, language === 'th' ? 'th' : 'en');

  const formattedDate = new Date(topic.created_at).toLocaleDateString(
    language === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-blue-100/20 dark:border-blue-900/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/forum")}
            className="hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "th" ? "กลับไปเว็บบอร์ด" : "Back to Forum"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Card */}
        <Card className="border-blue-100/50 dark:border-blue-800/50 rounded-2xl shadow-sm overflow-hidden mb-8">
          <CardContent className="p-6 sm:p-8">
            {/* Category Badge */}
            <div className="mb-4">
              <Badge
                variant="outline"
                className={`${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} text-sm px-3 py-1.5`}
              >
                {categoryLabel}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {topic.title}
            </h1>

            {/* Author & Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-blue-100/50 dark:border-blue-800/50">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {topic.author_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <UserRankBadge
                    userId={topic.user_id}
                    userName={topic.author_name || "Anonymous"}
                    size="md"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {formattedDate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                {/* Views */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/50">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {topic.views || 0}
                  </span>
                </div>

                {/* Likes */}
                <button
                  onClick={handleToggleLike}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50/50 dark:bg-red-900/20 border border-red-100/50 dark:border-red-800/50 hover:bg-red-100/50 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Heart
                    className="w-4 h-4"
                    fill={isTopicLiked ? "currentColor" : "none"}
                    color={isTopicLiked ? "#ef4444" : "currentColor"}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {topic.likes_count || 0}
                  </span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShareTopic}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50/50 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/50 hover:bg-green-100/50 dark:hover:bg-green-900/40 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                </button>
              </div>
            </div>

            {/* Image */}
            {topic.image_url && (
              <div 
                className="my-8 rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-sm hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => {
                  console.log('[TopicDetail] Image clicked:', topic.image_url);
                  setSelectedImage(topic.image_url || null);
                  setIsImageModalOpen(true);
                }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={topic.image_url}
                    alt={topic.title}
                    className="w-full h-auto object-cover max-h-96 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-full">
                      <ZoomIn className="w-6 h-6 text-slate-900 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {topic.content}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-blue-100/50 dark:border-blue-800/50">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Previous Topic Button */}
                <Button
                  onClick={() => previousTopicId && navigate(`/forum/${previousTopicId}`)}
                  disabled={!previousTopicId}
                  className={`flex-1 ${
                    previousTopicId
                      ? "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {language === "th" ? "ก่อนหน้า" : "Previous"}
                  </span>
                  <span className="sm:hidden text-xs">
                    {language === "th" ? "ก่อน" : "Prev"}
                  </span>
                </Button>

                {/* Back to Forum Button */}
                <Button
                  onClick={() => navigate("/forum")}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  <Home className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {language === "th" ? "กลับไป Forum" : "Back to Forum"}
                  </span>
                  <span className="sm:hidden text-xs">
                    {language === "th" ? "Forum" : "Back"}
                  </span>
                </Button>

                {/* Next Topic Button */}
                <Button
                  onClick={() => nextTopicId && navigate(`/forum/${nextTopicId}`)}
                  disabled={!nextTopicId}
                  className={`flex-1 ${
                    nextTopicId
                      ? "bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  <span className="hidden sm:inline">
                    {language === "th" ? "ถัดไป" : "Next"}
                  </span>
                  <span className="sm:hidden text-xs">
                    {language === "th" ? "ถัด" : "Next"}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === "th" ? "ความคิดเห็น" : "Replies"}
            </h2>
            <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400">
              {replies.length} {language === "th" ? "รายการ" : "comments"}
            </span>
          </div>

          {replies.length === 0 ? (
            <Card className="border-blue-100/50 dark:border-blue-800/50 rounded-xl shadow-sm">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === "th" ? "ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็นได้" : "No comments yet. Be the first!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => (
                <Card
                  key={reply.id}
                  className="border-blue-100/50 dark:border-blue-800/50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-blue-200 dark:border-blue-800">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-500 text-white text-sm font-semibold">
                          {reply.author_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <UserRankBadge
                            userId={reply.user_id}
                            userName={reply.author_name || "Anonymous"}
                            size="sm"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(reply.created_at).toLocaleDateString(
                              language === "th" ? "th-TH" : "en-US",
                              { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <Card className="border-blue-100/50 dark:border-blue-800/50 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {language === "th" ? "แสดงความคิดเห็น" : "Leave a Reply"}
            </h3>
            {isAuthenticated ? (
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name}
                  </label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={language === "th" ? "เขียนความคิดเห็น..." : "Write your reply..."}
                    rows={4}
                    className="resize-none rounded-lg bg-white text-gray-900 border-blue-200 dark:border-blue-800 focus:ring-blue-500 dark:focus:ring-blue-400"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {language === "th"
                      ? "ความคิดเห็นของคุณจะปรากฏทันทีหลังจากการตรวจสอบ"
                      : "Your comment will appear after moderation"}
                  </p>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !replyContent.trim()}
                    className={`px-6 py-2.5 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      isSubmitting || !replyContent.trim()
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-lg active:scale-95 cursor-pointer shadow-md'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                        <span>{language === "th" ? "กำลังส่ง..." : "Submitting..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 flex-shrink-0" />
                        <span>{language === "th" ? "ส่งความคิดเห็น" : "Submit Reply"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12">
                <User className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {language === "th"
                    ? "กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น"
                    : "Please login to leave a reply"}
                </p>
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg"
                >
                  {language === "th" ? "เข้าสู่ระบบ" : "Login"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox Modal */}
      {isImageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={() => {
            console.log('[TopicDetail] Background clicked, closing modal');
            setIsImageModalOpen(false);
          }}
          onWheel={handleImageWheel}
        >
          {/* Image Container with Controls */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => {
              console.log('[TopicDetail] Image container clicked');
              e.stopPropagation();
            }}
          >
            {/* Close Button - Positioned at top-right */}
            <button
              onClick={(e) => {
                console.log('[TopicDetail] Close button clicked');
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
              className="absolute top-20 right-6 sm:top-24 sm:right-8 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all duration-200 z-[9999] shadow-lg hover:shadow-xl"
              aria-label="Close image"
              title="ปิด (กด Esc หรือคลิก X)"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image with Zoom */}
            <img
              src={selectedImage}
              alt="Fullscreen view"
              className="w-full h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePan.x}px, ${imagePan.y}px)`,
                cursor: imageZoom > 1 ? 'grab' : 'default',
              }}
            />

            {/* Zoom Controls - Bottom Left */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/10 backdrop-blur-sm p-3 rounded-full shadow-lg">
              {/* Zoom Out */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageZoom(Math.max(1, imageZoom - 0.5));
                }}
                disabled={imageZoom <= 1}
                className="bg-white/20 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
                title="ย่อ (Zoom Out)"
              >
                <span className="text-xl font-bold">−</span>
              </button>

              {/* Zoom Level Display */}
              <div className="text-white text-xs font-semibold min-w-[40px] text-center">
                {Math.round(imageZoom * 100)}%
              </div>

              {/* Zoom In */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageZoom(Math.min(5, imageZoom + 0.5));
                }}
                disabled={imageZoom >= 5}
                className="bg-white/20 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
                title="ขยาย (Zoom In)"
              >
                <span className="text-xl font-bold">+</span>
              </button>

              {/* Reset */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetImageZoom();
                }}
                disabled={imageZoom === 1}
                className="bg-white/20 hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-full transition-all"
                title="รีเซต (Reset)"
              >
                <span className="text-xs font-bold">↺</span>
              </button>
            </div>

            {/* Hint Text - Bottom Right (Mobile) / Bottom Center (Desktop) */}
            <div className="absolute bottom-6 right-6 sm:right-auto sm:left-1/2 sm:transform sm:-translate-x-1/2 text-white/60 text-xs sm:text-sm text-center pointer-events-none">
              <div className="hidden sm:block">
                {language === "th" ? "หมุนเมาส์เพื่อขยาย/ย่อ, คลิก X หรือกด Esc เพื่อปิด" : "Scroll to zoom, click X or press Esc to close"}
              </div>
              <div className="sm:hidden">
                {language === "th" ? "ใช้ปุ่มควบคุมหรือคลิก X เพื่อปิด" : "Use controls or click X to close"}
              </div>
            </div>
          </div>

          {/* Hint Text */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center pointer-events-none hidden sm:block">
            {language === "th" ? "คลิกนอกภาพ, กดปุ่ม X, หรือกด Esc เพื่อปิด" : "Click outside, X button, or press Esc to close"}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicDetail;
