import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { UserRankBadge } from "@/components/UserRankBadge";
import { Loader2, Star, Send, ThumbsUp, ImagePlus, X, RefreshCw, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import sweetAlert from "@/lib/sweetAlert";
import { z } from "zod";
import { format } from "date-fns";
import { useFeatureToggle, showFeatureDisabledAlert } from "@/hooks/useFeatureToggle";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  image_url: string | null;
  created_at: string;
  user_id: string | null;
  helpful_count: number;
  user_name?: string;
  user_avatar?: string | null;
};

type ReviewReply = {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
};

type ReviewLike = {
  review_id: string;
  user_id: string;
};

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  review_text: z.string().trim().min(10, "รีวิวต้องมีอย่างน้อย 10 ตัวอักษร").max(500, "รีวิวต้องมีไม่เกิน 500 ตัวอักษร"),
});

// ---- Extracted RepliesSection component to prevent re-mount on parent re-render ----
const RepliesSection = ({
  reviewId,
  language,
  isAuthenticated,
  user,
  navigate,
}: {
  reviewId: string;
  language: string;
  isAuthenticated: boolean;
  user: any;
  navigate: (path: string) => void;
}) => {
  const queryClient = useQueryClient();
  const [localReply, setLocalReply] = useState("");

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["review-replies", reviewId],
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("review_replies")
          .select("*")
          .eq("review_id", reviewId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))];
        
        let profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", userIds as string[]);
          
          (profiles || []).forEach((p: any) => {
            profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
          });
        }

        return data.map((reply: any) => ({
          id: reply.id,
          review_id: reply.review_id,
          user_id: reply.user_id,
          content: reply.content,
          created_at: reply.created_at,
          user_name: profileMap.get(reply.user_id)?.display_name,
          user_avatar: profileMap.get(reply.user_id)?.avatar_url || null,
        })) as ReviewReply[];
      } catch (err) {
        console.error("[ReviewReplies] Error:", err);
        return [];
      }
    },
    staleTime: 15 * 1000,
    retry: 1,
    enabled: !!reviewId,
  });

  const submitReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("Must be logged in");
      const trimmed = content.trim();
      if (trimmed.length < 2) throw new Error(language === "th" ? "ความเห็นต้องมีอย่างน้อย 2 ตัวอักษร" : "Reply must be at least 2 characters");

      const { error } = await (supabase as any)
        .from("review_replies")
        .insert({ review_id: reviewId, user_id: user.id, content: trimmed });
      if (error) throw error;
    },
    onSuccess: () => {
      setLocalReply("");
      queryClient.invalidateQueries({ queryKey: ["review-replies", reviewId], exact: true });
      queryClient.invalidateQueries({ queryKey: ["review-reply-counts"] });
      sweetAlert.success(language === "th" ? "ส่งความเห็นสำเร็จ!" : language === "zh" ? "评论已提交！" : "Reply submitted!");
    },
    onError: (error: any) => {
      sweetAlert.error(error.message || "Error");
    },
  });

  const handleSubmit = () => {
    if (!localReply.trim()) {
      sweetAlert.error(language === "th" ? "กรุณากรอกความเห็น" : "Please enter a reply");
      return;
    }
    submitReplyMutation.mutate(localReply);
  };

  return (
    <div className="mt-6 pt-4 border-t border-border/50 space-y-4">
      <h4 className="font-semibold text-sm">
        {language === "th" ? "ความเห็น" : language === "zh" ? "评论" : "Comments"} ({replies.length})
      </h4>

      {repliesLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : replies.length > 0 ? (
        <div className="space-y-3 bg-muted/20 rounded-lg p-3">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 text-sm">
              {/* Reply Avatar */}
              {reply.user_avatar ? (
                <img
                  src={reply.user_avatar}
                  alt={reply.user_name || "User"}
                  className="w-8 h-8 rounded-full object-cover border border-border/50 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {reply.user_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1">
                <UserRankBadge
                  userId={reply.user_id}
                  userName={reply.user_name || "Anonymous"}
                  size="sm"
                  className="text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(reply.created_at), "MMM dd, yyyy HH:mm")}
                </p>
                <p className="text-sm mt-1 text-foreground">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          {language === "th" ? "ยังไม่มีความเห็น" : language === "zh" ? "暂无评论" : "No comments yet"}
        </p>
      )}

      {isAuthenticated ? (
        <div className="flex gap-2">
          <Textarea
            value={localReply}
            onChange={(e) => setLocalReply(e.target.value)}
            placeholder={language === "th" ? "เพิ่มความเห็น..." : language === "zh" ? "添加评论..." : "Add a comment..."}
            rows={2}
            maxLength={300}
            className="border-2 text-sm"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitReplyMutation.isPending}
            size="sm"
            className="gap-2 self-end"
          >
            {submitReplyMutation.isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {language === "th" ? "ส่ง..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                {language === "th" ? "ส่ง" : "Send"}
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {language === "th" ? "เข้าสู่ระบบเพื่อเพิ่มความเห็น" : language === "zh" ? "登录后评论" : "Login to comment"}
        </Button>
      )}
    </div>
  );
};

// ---- Main Reviews Component ----
const Reviews = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { isFeatureEnabled } = useFeatureToggle();

  useEffect(() => {
    if (!isFeatureEnabled("reviews")) {
      showFeatureDisabledAlert(language);
      navigate("/");
    }
  }, [isFeatureEnabled, navigate, language]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      sweetAlert.fire({
        title: language === "th" ? "ต้องเข้าสู่ระบบ" : "Login Required",
        html: `<div style="font-size: 1rem; line-height: 1.6;">
          <p style="color: #666;">${language === "th" ? "โปรดเข้าสู่ระบบหรือสมัครสมาชิกเพื่อดูและแชร์รีวิว" : "Please login or sign up to view and share reviews"}</p>
        </div>`,
        icon: 'warning',
        confirmButtonText: language === "th" ? "เข้าสู่ระบบ" : "Login",
        confirmButtonColor: '#3b82f6',
        allowOutsideClick: false,
        didClose: () => {
          navigate("/auth");
        }
      });
    }
  }, [isAuthenticated, authLoading, language, navigate]);
  
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    rating: 5,
    review_text: "",
  });

  // Manual refresh handler
  const handleRefreshReviews = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["reviews-all"], exact: true });
    setIsRefreshing(false);
  };

  // Share handler
  const handleShareReview = (review: Review) => {
    const reviewText = language === "th" ? review.review_text_th : review.review_text_en;
    const shareText = `${review.customer_name} (⭐ ${review.rating}/5): ${reviewText}`;
    const shareUrl = `${window.location.origin}/reviews#review-${review.id}`;

    if (navigator.share) {
      navigator.share({
        title: `Review - ${review.customer_name}`,
        text: shareText,
        url: shareUrl,
      }).catch((err) => console.log("Share cancelled:", err));
    } else {
      // Fallback: Show social media share options
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(shareUrl);

      const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        line: `https://line.me/R/msg/text/${encodedText}%20${encodedUrl}`,
      };

      const platform = window.innerWidth < 640 ? "whatsapp" : "facebook";
      window.open(shareLinks[platform as keyof typeof shareLinks], "_blank");
      sweetAlert.success(language === "th" ? "แชร์รีวิวสำเร็จ" : "Review shared successfully");
    }
  };

  const { data: reviews = [], isLoading, error: reviewsError } = useQuery({
    queryKey: ["reviews-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Get unique user IDs to batch fetch profiles
      const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
      
      let profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds as string[]);
        
        (profiles || []).forEach((p: any) => {
          profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
        });
      }
      
      return (data || []).map(review => ({
        ...review,
        helpful_count: review.helpful_count || 0,
        user_name: review.user_id ? profileMap.get(review.user_id)?.display_name : undefined,
        user_avatar: review.user_id ? profileMap.get(review.user_id)?.avatar_url || null : null,
      })) as Review[];
    },
    staleTime: 30 * 1000,
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Set up real-time subscription for review updates
  useEffect(() => {
    const channel = supabase
      .channel("reviews:is_active=true")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reviews-all"], exact: true });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch reply counts for all reviews
  const { data: replyCounts = {} } = useQuery({
    queryKey: ["review-reply-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("review_replies")
        .select("review_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        counts[r.review_id] = (counts[r.review_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 30 * 1000,
  });

  // Fetch user's likes
  const { data: userLikes = [] } = useQuery({
    queryKey: ["user-review-likes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("review_likes")
        .select("review_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map(like => like.review_id) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ reviewId, isLiked }: { reviewId: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error("Must be logged in");
      if (isLiked) {
        const { error } = await supabase.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("review_likes").insert({ review_id: reviewId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews-all"], exact: true });
      queryClient.invalidateQueries({ queryKey: ["user-review-likes"], exact: false });
    },
    onError: (error: any) => {
      if (error.message === "Must be logged in") {
        sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบเพื่อกดถูกใจ" : "Please login to like reviews");
      } else {
        sweetAlert.error(error.message || "An error occurred");
      }
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: typeof formData) => {
      const validated = reviewSchema.parse(reviewData);
      const userName = user?.name || user?.email?.split('@')[0] || 'User';
      
      let imageUrl: string | null = null;
      if (reviewImage) {
        setUploadingImage(true);
        const fileExt = reviewImage.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('reviews').upload(fileName, reviewImage, { upsert: true });
        if (uploadError) throw new Error(language === 'th' ? 'อัพโหลดรูปภาพไม่สำเร็จ' : 'Failed to upload image');
        const { data: publicUrlData } = supabase.storage.from('reviews').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from("reviews").insert({
        customer_name: userName,
        rating: validated.rating,
        review_text_en: validated.review_text,
        review_text_th: validated.review_text,
        user_id: user?.id || null,
        image_url: imageUrl,
        is_active: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      sweetAlert.success(language === "th" ? "ส่งรีวิวสำเร็จ! รอการอนุมัติจากผู้ดูแล" : "Review submitted! Pending admin approval");
      setFormData({ rating: 5, review_text: "" });
      setReviewImage(null);
      setReviewImagePreview(null);
      setUploadingImage(false);
      queryClient.invalidateQueries({ queryKey: ["reviews-all"] });
    },
    onError: (error: any) => {
      setUploadingImage(false);
      if (error instanceof z.ZodError) {
        sweetAlert.error(error.errors[0].message);
      } else {
        sweetAlert.error(error?.message || (language === "th" ? "เกิดข้อผิดพลาดในการส่งรีวิว" : "Failed to submit review"));
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      sweetAlert.error(language === 'th' ? 'กรุณาเลือกไฟล์รูปภาพเท่านั้น' : 'Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      sweetAlert.error(language === 'th' ? 'รูปภาพต้องมีขนาดไม่เกิน 5MB' : 'Image must be less than 5MB');
      return;
    }
    setReviewImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setReviewImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setReviewImage(null);
    setReviewImagePreview(null);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    submitReviewMutation.mutate(formData);
  };

  const toggleExpandReview = (reviewId: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) newSet.delete(reviewId);
      else newSet.add(reviewId);
      return newSet;
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onRate?: (rating: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate && onRate(star)}
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
        >
          <Star className={`w-5 h-5 ${star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const topReviews = reviews.sort((a, b) => b.helpful_count - a.helpful_count).slice(0, 3);
  const reviewsByRating = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const filteredReviews = filterRating 
    ? reviews.filter(review => review.rating === filterRating)
    : reviews;

  // Helper to render user avatar
  const renderUserAvatar = (avatarUrl?: string | null, name?: string, size: "sm" | "md" = "sm") => {
    const sizeClasses = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name || "User"}
          className={`${sizeClasses} rounded-full object-cover border border-border/50 flex-shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClasses} rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header with Stats */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black text-foreground mb-4 font-serif tracking-tight">
              {language === "th" ? "รีวิวจากลูกค้า" : language === "zh" ? "客户评价" : "Customer Reviews"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {language === "th" 
                ? "ความคิดเห็นและประสบการณ์จากลูกค้าของเรา" 
                : language === "zh"
                ? "来自尊贵客户的反馈和体验"
                : "Feedback and experiences from our valued customers"}
            </p>
            
            {/* Refresh Button */}
            <div className="mb-6 flex justify-center">
              <Button
                onClick={handleRefreshReviews}
                disabled={isRefreshing || isLoading}
                variant="default"
                size="sm"
                className="gap-2 bg-primary/30 hover:bg-primary/40 text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {language === "th" ? "รีโหลด" : language === "zh" ? "刷新" : "Refresh"}
              </Button>
            </div>
            
            {/* Review Stats */}
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto bg-card rounded-2xl p-8 mb-8 border border-border shadow-lg">
                <div className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-3xl font-bold text-foreground">{averageRating}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "คะแนนเฉลี่ย" : language === "zh" ? "平均评分" : "Average"}
                  </p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-3xl font-bold text-foreground">{reviews.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "รวมรีวิว" : language === "zh" ? "评价总数" : "Total Reviews"}
                  </p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{reviewsByRating[5]}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "5 ดาว" : language === "zh" ? "5星" : "5 Stars"}
                  </p>
                </div>
                <div className="text-center border-l border-border">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{topReviews[0]?.helpful_count || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "th" ? "ไลค์มากที่สุด" : language === "zh" ? "最受欢迎" : "Most Liked"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Write Review Form (Authenticated Users Only) */}
          {isAuthenticated ? (
            <Card className="mb-12 max-w-2xl mx-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/40 border-2 border-amber-200 dark:border-amber-800/70 shadow-lg">
              <CardContent className="pt-8">
                <div className="flex items-center gap-3 mb-6">
                  <Send className="w-6 h-6 text-orange-700 dark:text-orange-400" />
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-amber-600 dark:from-yellow-300 dark:to-orange-300">
                    {language === "th" ? "เขียนรีวิวของคุณ" : language === "zh" ? "撰写您的评价" : "Share Your Review"}
                  </h2>
                </div>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-center gap-4">
                    {user?.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {language === "th" ? "ชื่อของคุณ" : language === "zh" ? "您的姓名" : "Your Name"}
                      </p>
                      <p className="text-lg font-bold text-primary">{user?.name}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold mb-3 block">
                      {language === "th" ? "ให้คะแนน" : language === "zh" ? "给予评分" : "Rate Your Experience"}
                    </Label>
                    <div className="flex gap-2">
                      {renderStars(formData.rating, true, (rating) => 
                        setFormData({ ...formData, rating })
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="review_text" className="font-semibold">
                      {language === "th" ? "เขียนรีวิวที่คุณรู้สึกได้ที่นี่" : language === "zh" ? "在这里写下你的感受" : "Write your review here"}
                    </Label>
                    <Textarea
                      id="review_text"
                      value={formData.review_text}
                      onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                      placeholder={language === "th" ? "เขียนรีวิวที่คุณรู้สึกได้ที่นี่..." : language === "zh" ? "在这里写下你的感受..." : "Write your review here..."}
                      rows={5}
                      maxLength={500}
                      required
                      className="border-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">{formData.review_text.length}/500</p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label className="font-semibold mb-2 block">
                      {language === "th" ? "แนบรูปภาพ (ไม่บังคับ)" : language === "zh" ? "附加图片（可选）" : "Attach Image (Optional)"}
                    </Label>
                    {reviewImagePreview ? (
                      <div className="relative inline-block">
                        <img src={reviewImagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-border" />
                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {language === "th" ? "คลิกเพื่อเลือกรูปภาพ (สูงสุด 5MB)" : "Click to select image (max 5MB)"}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>

                  <Button
                    size="lg" 
                    disabled={submitReviewMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg"
                  >
                    {submitReviewMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {language === "th" ? "กำลังส่ง..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {language === "th" ? "ส่งรีวิว" : language === "zh" ? "提交评价" : "Submit Review"}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center italic">
                    {language === "th" 
                      ? "รีวิวของคุณจะแสดงหลังจากได้รับการอนุมัติ" 
                      : language === "zh"
                      ? "您的评价将在审核后显示"
                      : "Your review will be displayed after approval"}
                  </p>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-12 max-w-2xl mx-auto bg-gradient-to-br from-orange-100/50 to-amber-100/50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-dashed border-orange-200 dark:border-orange-800/50">
              <CardContent className="pt-8 text-center">
                <Send className="w-12 h-12 text-orange-400 dark:text-orange-300 mx-auto mb-4 opacity-70" />
                <p className="text-lg font-semibold text-foreground mb-4">
                  {language === "th" ? "ต้องการแชร์ประสบการณ์ของคุณ?" : "Want to share your experience?"}
                </p>
                <p className="text-muted-foreground mb-6">
                  {language === "th" ? "กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว" : "Please login to write a review"}
                </p>
                <Button onClick={() => navigate("/auth")} size="lg" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold">
                  {language === "th" ? "เข้าสู่ระบบ" : "Login Now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Top Rated Reviews Section */}
          {!isLoading && topReviews.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-700 to-amber-600 dark:from-yellow-300 dark:to-orange-300">
                  {language === "th" ? "รีวิวยอดนิยม" : language === "zh" ? "热门评价" : "Most Popular Reviews"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topReviews.map((review, index) => (
                  <Card 
                    id={`review-${review.id}`}
                    key={review.id}
                    className="relative overflow-hidden border-2 border-amber-200 dark:border-amber-800/70 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-yellow-950/40 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-orange-500 text-white px-4 py-2 rounded-bl-lg font-semibold text-sm shadow-md">
                      #{index + 1}
                    </div>
                    
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-4">
                        {renderUserAvatar(review.user_avatar, review.user_name || review.customer_name, "md")}
                        <div className="flex-1">
                          {review.user_id && review.user_name ? (
                            <>
                              <div className="mb-1">
                                <UserRankBadge
                                  userId={review.user_id}
                                  userName={review.user_name}
                                  size="sm"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">{review.customer_name}</p>
                            </>
                          ) : (
                            <h3 className="font-bold text-lg text-foreground">{review.customer_name}</h3>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(review.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      
                      {review.image_url && (
                        <div className="mb-4 rounded-lg overflow-hidden border border-border">
                          <img src={review.image_url} alt={review.customer_name} className="w-full h-40 object-cover" />
                        </div>
                      )}

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {language === "th" ? review.review_text_th : review.review_text_en}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-amber-200 dark:border-amber-800/50">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{review.helpful_count}</span>
                          <span className="text-xs text-muted-foreground">
                            {language === "th" ? "คนกดไลค์" : "likes"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={userLikes.includes(review.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleLikeMutation.mutate({ reviewId: review.id, isLiked: userLikes.includes(review.id) })}
                            disabled={toggleLikeMutation.isPending || !isAuthenticated}
                            className="gap-1"
                          >
                            <ThumbsUp className={`w-3 h-3 ${userLikes.includes(review.id) ? "fill-current" : ""}`} />
                            {language === "th" ? "ไลค์" : "Like"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShareReview(review)}
                            className="gap-1"
                          >
                            <Share2 className="w-3 h-3" />
                            {language === "th" ? "แชร์" : "Share"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="mb-12 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-yellow-950/40 rounded-2xl p-8 border-2 border-amber-100 dark:border-amber-900/50 shadow-lg">
            <h3 className="text-3xl md:text-4xl font-black mb-8 tracking-tight text-foreground">
              {language === "th" ? "🔍 ค้นหารีวิวตามคะแนน" : "🔍 Filter by Rating"}
            </h3>
            <Tabs 
              value={filterRating?.toString() || "all"} 
              onValueChange={(value) => setFilterRating(value === "all" ? null : parseInt(value))}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="all"
                  className="text-sm md:text-base font-bold py-3 px-4 rounded-lg border-2 border-orange-200 dark:border-orange-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 transition-all"
                >
                  {language === "th" ? "ทั้งหมด" : "All"}
                </TabsTrigger>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <TabsTrigger 
                    key={rating} 
                    value={rating.toString()}
                    className="flex items-center justify-center gap-2 text-sm md:text-base font-bold py-3 px-3 rounded-lg border-2 border-amber-200 dark:border-amber-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-500 data-[state=active]:text-white data-[state=active]:border-amber-500 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
                  >
                    <span>{rating}</span>
                    <Star className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            {reviews.length > 0 && (
              <div className="mt-8 space-y-3 bg-white dark:bg-amber-950/20 rounded-xl p-6 border-2 border-orange-100 dark:border-orange-900/50 shadow-md">
                <p className="text-sm font-semibold text-foreground mb-4">
                  {language === "th" ? "📊 การกระจายของคะแนน" : "📊 Rating Distribution"}
                </p>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsByRating[rating as keyof typeof reviewsByRating];
                  const percentage = (count / reviews.length) * 100;
                  const colors = {
                    5: 'from-emerald-500 to-teal-500',
                    4: 'from-orange-500 to-amber-500',
                    3: 'from-amber-400 to-yellow-500',
                    2: 'from-orange-400 to-red-400',
                    1: 'from-red-500 to-red-600',
                  };
                  return (
                    <div key={rating} className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 w-20 shrink-0">
                        <span className="font-bold text-lg text-foreground">{rating}</span>
                        <div className="flex gap-0.5">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="relative bg-orange-100 dark:bg-orange-900/30 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`bg-gradient-to-r ${colors[rating as keyof typeof colors]} h-full transition-all duration-500 rounded-full shadow-md`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right w-16 shrink-0">
                        <span className="font-bold text-foreground text-lg">{count}</span>
                        <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews Grid */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">
              {language === "th" 
                ? filterRating ? `รีวิว ${filterRating} ดาว` : "ทั้งหมด"
                : filterRating ? `${filterRating} Star Reviews` : "All Reviews"}
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  {language === "th" 
                    ? filterRating ? `ไม่มีรีวิว ${filterRating} ดาว` : "ยังไม่มีรีวิว"
                    : filterRating ? `No ${filterRating}-star reviews` : "No reviews yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((review, index) => {
                  const isLiked = userLikes.includes(review.id);
                  const isPopular = review.helpful_count >= Math.max(...reviews.map(r => r.helpful_count)) && review.helpful_count > 0;
                  
                  return (
                    <Card 
                      id={`review-${review.id}`}
                      key={review.id}
                      className={`animate-scale-in hover:shadow-lg transition-all ${
                        isPopular 
                          ? "border-2 border-orange-300 dark:border-orange-700/70 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30" 
                          : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="pt-6">
                        {isPopular && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
                            <ThumbsUp className="w-3 h-3 fill-current" />
                            {language === "th" ? "ยอดนิยม" : "Popular"}
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3 mb-4">
                          {renderUserAvatar(review.user_avatar, review.user_name || review.customer_name, "md")}
                          <div className="flex-1">
                            {review.user_id && review.user_name ? (
                              <>
                                <UserRankBadge
                                  userId={review.user_id}
                                  userName={review.user_name}
                                  size="sm"
                                  className="block mb-1"
                                />
                                <p className="text-xs text-muted-foreground">{review.customer_name}</p>
                              </>
                            ) : (
                              <h3 className="font-semibold text-lg text-foreground">{review.customer_name}</h3>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(review.created_at), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                            {review.rating}.0
                          </span>
                        </div>
                        
                        {review.image_url && (
                          <div className="mb-4 rounded-lg overflow-hidden border border-border">
                            <img src={review.image_url} alt={review.customer_name} className="w-full h-40 object-cover hover:scale-105 transition-transform" />
                          </div>
                        )}

                        <p className="text-muted-foreground line-clamp-4 mb-4 text-sm leading-relaxed">
                          {language === "th" ? review.review_text_th : review.review_text_en}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className={`w-4 h-4 ${review.helpful_count > 0 ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                            <span className={`text-sm font-semibold ${review.helpful_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                              {review.helpful_count}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isLiked ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleLikeMutation.mutate({ reviewId: review.id, isLiked })}
                              disabled={toggleLikeMutation.isPending || !isAuthenticated}
                              className="gap-2"
                            >
                              <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                              {language === "th" ? "เป็นประโยชน์" : "Helpful"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShareReview(review)}
                              className="gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              {language === "th" ? "แชร์" : "Share"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleExpandReview(review.id)}
                              className="gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              {language === "th" ? "ความเห็น" : "Comments"}
                              {(replyCounts[review.id] || 0) > 0 && (
                                <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5 py-0.5 font-bold">
                                  {replyCounts[review.id]}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {!isAuthenticated && (
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            {language === "th" ? "เข้าสู่ระบบเพื่อกดถูกใจ" : "Login to like"}
                          </p>
                        )}

                        {/* Replies Section - extracted component */}
                        {expandedReviews.has(review.id) && (
                          <RepliesSection
                            reviewId={review.id}
                            language={language}
                            isAuthenticated={isAuthenticated}
                            user={user}
                            navigate={navigate}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
};

export default Reviews;
