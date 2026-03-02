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
import { UserStatusAvatar } from "@/components/UserStatusAvatar";
import {
  MessageCircle,
  Eye,
  Heart,
  ThumbsUp,
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
  Crown,
  UserPlus,
  X,
  ZoomIn,
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryLabel, getCategoryColor } from "@/lib/forumConfig";
import { ForumTopic } from "@/hooks/useWebboard";
import { useUserRank } from "@/hooks/useUserRank";
import { getRankFromPoints } from "@/lib/pointSystem";

interface ForumReply {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface UserSignature {
  signature_text: string | null;
  signature_image_url: string | null;
  is_enabled: boolean;
}

const TopicDetail = () => {
  const navigate = useNavigate();
  const { topicId: id } = useParams();
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { data: currentUserRank } = useUserRank(user?.id);

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
  const [replyLikeCounts, setReplyLikeCounts] = useState<Record<string, number>>({});
  const [topContributor, setTopContributor] = useState<{ userId: string; name: string; likeCount: number } | null>(null);
  const [replyUserPoints, setReplyUserPoints] = useState<Record<string, number>>({});
  const [replySignatures, setReplySignatures] = useState<Record<string, UserSignature>>({});
  const [endorsedMentees, setEndorsedMentees] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!user?.id) return;

    const loadEndorsements = async () => {
      const { data, error } = await (supabase as any)
        .from("mentor_endorsements")
        .select("mentee_user_id")
        .eq("mentor_user_id", user.id)
        .eq("is_active", true);

      if (error || !data) {
        setEndorsedMentees(new Set());
        return;
      }

      setEndorsedMentees(new Set((data || []).map((row: any) => row.mentee_user_id)));
    };

    loadEndorsements();
  }, [user?.id]);

  const recomputeTopContributor = (
    repliesList: ForumReply[],
    likeMap: Record<string, number>
  ) => {
    const byUser: Record<string, { name: string; likes: number }> = {};

    repliesList.forEach((reply) => {
      const likes = likeMap[reply.id] || 0;
      if (!byUser[reply.user_id]) {
        byUser[reply.user_id] = {
          name: reply.author_name || "Anonymous",
          likes,
        };
      } else {
        byUser[reply.user_id].likes += likes;
      }
    });

    const ranked = Object.entries(byUser)
      .map(([userId, info]) => ({ userId, name: info.name, likeCount: info.likes }))
      .sort((a, b) => b.likeCount - a.likeCount);

    if (!ranked.length || ranked[0].likeCount <= 0) {
      setTopContributor(null);
      return;
    }

    setTopContributor(ranked[0]);
  };

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

        const normalizedReplies = enrichedReplies as ForumReply[];
        setReplies(normalizedReplies);

        const replyIds = normalizedReplies.map((r) => r.id);
        const replyUserIds = Array.from(new Set(normalizedReplies.map((r) => r.user_id)));

        if (replyIds.length > 0) {
          const { data: likesData } = await (supabase as any)
            .from("forum_reply_likes")
            .select("reply_id, user_id")
            .in("reply_id", replyIds);

          const counts: Record<string, number> = {};
          const likedByCurrentUser = new Set<string>();

          (likesData || []).forEach((row: any) => {
            counts[row.reply_id] = (counts[row.reply_id] || 0) + 1;
            if (user?.id && row.user_id === user.id) {
              likedByCurrentUser.add(row.reply_id);
            }
          });

          setReplyLikeCounts(counts);
          setLikedReplies(likedByCurrentUser);
          recomputeTopContributor(normalizedReplies, counts);
        } else {
          setReplyLikeCounts({});
          setLikedReplies(new Set());
          setTopContributor(null);
        }

        if (replyUserIds.length > 0) {
          const { data: profileRows } = await supabase
            .from("profiles")
            .select("id, reputation_points")
            .in("id", replyUserIds as any);

          const pointsMap: Record<string, number> = {};
          (profileRows || []).forEach((row: any) => {
            pointsMap[row.id] = row.reputation_points || 0;
          });
          setReplyUserPoints(pointsMap);

          const { data: signatureRows } = await (supabase as any)
            .from("user_signature_settings")
            .select("user_id, signature_text, signature_image_url, is_enabled")
            .in("user_id", replyUserIds)
            .eq("is_enabled", true);

          const signatureMap: Record<string, UserSignature> = {};
          (signatureRows || []).forEach((row: any) => {
            signatureMap[row.user_id] = {
              signature_text: row.signature_text,
              signature_image_url: row.signature_image_url,
              is_enabled: row.is_enabled,
            };
          });

          setReplySignatures(signatureMap);
        }
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

  const handleToggleReplyLike = async (replyId: string) => {
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
      navigate("/auth");
      return;
    }

    const currentlyLiked = likedReplies.has(replyId);

    try {
      if (currentlyLiked) {
        const { error } = await (supabase as any)
          .from("forum_reply_likes")
          .delete()
          .eq("reply_id", replyId)
          .eq("user_id", user.id);

        if (error) throw error;

        const nextLiked = new Set(likedReplies);
        nextLiked.delete(replyId);
        setLikedReplies(nextLiked);

        const nextCounts = {
          ...replyLikeCounts,
          [replyId]: Math.max(0, (replyLikeCounts[replyId] || 0) - 1),
        };
        setReplyLikeCounts(nextCounts);
        recomputeTopContributor(replies, nextCounts);
      } else {
        const { error } = await (supabase as any)
          .from("forum_reply_likes")
          .insert({ reply_id: replyId, user_id: user.id });

        if (error) throw error;

        const nextLiked = new Set(likedReplies);
        nextLiked.add(replyId);
        setLikedReplies(nextLiked);

        const nextCounts = {
          ...replyLikeCounts,
          [replyId]: (replyLikeCounts[replyId] || 0) + 1,
        };
        setReplyLikeCounts(nextCounts);
        recomputeTopContributor(replies, nextCounts);
      }
    } catch (error: any) {
      if (error?.code === "42P01" || error?.message?.includes("forum_reply_likes")) {
        sweetAlert.error(
          language === "th"
            ? "ระบบไลก์คอมเมนต์ยังไม่พร้อม (ยังไม่ได้รัน migration)"
            : "Reply-like system is not ready yet (migration pending)"
        );
      } else {
        sweetAlert.error(language === "th" ? "ไม่สามารถกดถูกใจคอมเมนต์ได้" : "Failed to like reply");
      }
    }
  };

  const handleEndorseMentee = async (menteeUserId: string) => {
    if (!isAuthenticated || !user) {
      sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
      return;
    }

    try {
      const { data, error } = await (supabase as any).rpc("endorse_newcomer", {
        p_mentee_user_id: menteeUserId,
      });

      if (error) throw error;

      switch (data?.status) {
        case "success": {
          setEndorsedMentees((prev) => new Set([...prev, menteeUserId]));
          sweetAlert.success(language === "th" ? "รับรองศิษย์สำเร็จ" : "Mentee endorsed successfully");
          break;
        }
        case "mentor_rank_too_low":
          sweetAlert.warning(language === "th" ? "ต้องมียศอาจารย์ขึ้นไปจึงรับรองได้" : "Instructor rank or higher required");
          break;
        case "mentee_not_newcomer":
          sweetAlert.warning(language === "th" ? "ผู้ใช้นี้ไม่ใช่ผู้เล่นใหม่แล้ว" : "This user is no longer a newcomer");
          break;
        case "already_endorsed":
          sweetAlert.warning(language === "th" ? "ผู้ใช้นี้มีอาจารย์แล้ว" : "This user is already endorsed");
          break;
        default:
          sweetAlert.error(language === "th" ? "ไม่สามารถรับรองได้" : "Unable to endorse");
      }
    } catch (error: any) {
      if (error?.code === "42P01" || error?.message?.includes("mentor_endorsements")) {
        sweetAlert.error(
          language === "th"
            ? "ระบบศิษย์-อาจารย์ยังไม่พร้อม (ยังไม่ได้รัน migration)"
            : "Mentorship system is not ready yet (migration pending)"
        );
      } else {
        sweetAlert.error(language === "th" ? "เกิดข้อผิดพลาดในการรับรองศิษย์" : "Failed to endorse mentee");
      }
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
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-violet-100 dark:from-slate-950 dark:to-slate-900">
        <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-sky-200/40 dark:border-slate-700/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/forum")}
              className="hover:bg-sky-100 dark:hover:bg-sky-900/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === "th" ? "กลับไปเว็บบอร์ด" : "Back to Forum"}
            </Button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-orange-200/70 dark:border-orange-800/60 rounded-2xl shadow-sm bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20">
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
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-violet-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-sky-200/40 dark:border-slate-700/60 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/forum")}
            className="hover:bg-sky-100 dark:hover:bg-sky-900/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === "th" ? "กลับไปเว็บบอร์ด" : "Back to Forum"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Topic Card */}
        <Card className="border-sky-200/60 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden mb-8 bg-white/95 dark:bg-slate-900/85">
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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-sky-200/50 dark:border-slate-700/70">
              <div className="flex items-center gap-3">
                <UserStatusAvatar
                  userId={topic.user_id}
                  userName={topic.author_name || "Anonymous"}
                  size="md"
                  bubblePlacement="bottom"
                  avatarClassName="border-2 border-sky-200 dark:border-slate-700"
                  fallbackClassName="bg-gradient-to-br from-sky-500 via-cyan-500 to-violet-500 text-white font-semibold"
                />
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50/70 dark:bg-sky-900/20 border border-sky-200/60 dark:border-sky-800/50">
                  <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {topic.views || 0}
                  </span>
                </div>

                {/* Likes */}
                <button
                  onClick={handleToggleLike}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50/70 dark:bg-orange-900/20 border border-orange-200/60 dark:border-orange-800/50 hover:bg-orange-100/70 dark:hover:bg-orange-900/40 transition-colors"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Image */}
            {topic.image_url && (
              <div 
                className="my-8 rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-100 to-violet-100 dark:from-sky-900/30 dark:via-cyan-900/20 dark:to-violet-900/30 shadow-sm hover:shadow-lg transition-shadow cursor-pointer group relative"
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
            <div className="mt-8 pt-6 border-t border-sky-200/50 dark:border-slate-700/70">
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
            <MessageCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === "th" ? "ความคิดเห็น" : "Replies"}
            </h2>
            <span className="ml-auto text-sm font-medium text-gray-500 dark:text-gray-400">
              {replies.length} {language === "th" ? "รายการ" : "comments"}
            </span>
          </div>

          {topContributor && (
            <Card className="mb-4 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {language === "th" ? "Top Contributor of this Thread" : "Top Contributor of this Thread"}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {topContributor.name}
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 bg-white/70">
                  <ThumbsUp className="inline w-3 h-3 mr-1" />{topContributor.likeCount}
                </div>
              </CardContent>
            </Card>
          )}

          {replies.length === 0 ? (
            <Card className="border-sky-200/60 dark:border-slate-700 rounded-xl shadow-sm bg-white/95 dark:bg-slate-900/85">
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
                  className="border-sky-200/60 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white/95 dark:bg-slate-900/85"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <UserStatusAvatar
                        userId={reply.user_id}
                        userName={reply.author_name || "Anonymous"}
                        size="md"
                        bubblePlacement="bottom"
                        className="flex-shrink-0"
                        avatarClassName="border-2 border-sky-200 dark:border-slate-700"
                        fallbackClassName="bg-gradient-to-br from-emerald-500 via-cyan-500 to-violet-500 text-white text-sm font-semibold"
                      />
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

                          <button
                            onClick={() => handleToggleReplyLike(reply.id)}
                            className="ml-auto flex items-center gap-1 rounded-full border border-sky-200 px-2 py-1 text-xs text-sky-700 hover:bg-sky-50"
                          >
                            <ThumbsUp
                              className="w-3.5 h-3.5"
                              fill={likedReplies.has(reply.id) ? "currentColor" : "none"}
                            />
                            {replyLikeCounts[reply.id] || 0}
                          </button>

                          {isAuthenticated && user?.id !== reply.user_id && (currentUserRank?.rank?.id || 0) >= 4 && (replyUserPoints[reply.user_id] || 0) <= 100 && !endorsedMentees.has(reply.user_id) && (
                            <button
                              onClick={() => handleEndorseMentee(reply.user_id)}
                              className="flex items-center gap-1 rounded-full border border-emerald-200 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              {language === "th" ? "รับรองศิษย์" : "Endorse"}
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {reply.content}
                        </p>

                        {(() => {
                          const signature = replySignatures[reply.user_id];
                          const points = replyUserPoints[reply.user_id] || 0;
                          const rank = getRankFromPoints(points);
                          const canShowSignature = rank.id >= 6 && signature?.is_enabled && (!!signature.signature_text || !!signature.signature_image_url);

                          if (!canShowSignature) return null;

                          return (
                            <div className="mt-3 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-2">
                              {signature.signature_text && (
                                <p className="text-xs italic font-medium text-amber-800 mb-1">“{signature.signature_text}”</p>
                              )}
                              {signature.signature_image_url && (
                                <img
                                  src={signature.signature_image_url}
                                  alt="signature"
                                  className="max-h-20 rounded border border-amber-300"
                                  loading="lazy"
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        <Card className="border-violet-200/60 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden bg-white/95 dark:bg-slate-900/85">
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
                    className="resize-none rounded-lg bg-white text-gray-900 border-sky-200 dark:border-slate-700 focus:ring-sky-500 dark:focus:ring-sky-400"
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
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:shadow-lg active:scale-95 cursor-pointer shadow-md'
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
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg"
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
