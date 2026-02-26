import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Star, Reply, Eye, Heart, Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";

interface UserActivityProps {
  userId: string;
  language: string;
}

interface ForumTopic {
  id: string;
  title: string;
  category: string;
  views: number;
  created_at: string;
  is_active: boolean;
}

interface ForumReplyItem {
  id: string;
  content: string;
  created_at: string;
  topic_id: string;
  forum_topics?: { title: string; id: string } | null;
}

interface ReviewItem {
  id: string;
  customer_name: string;
  review_text_th: string;
  review_text_en: string;
  rating: number;
  created_at: string;
  is_active: boolean | null;
  helpful_count: number;
  image_url: string | null;
}

const UserActivity = ({ userId, language }: UserActivityProps) => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReplyItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("topics");

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      setIsLoading(true);
      const [topicsRes, repliesRes, reviewsRes] = await Promise.all([
        supabase
          .from("forum_topics")
          .select("id, title, category, views, created_at, is_active")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("forum_replies")
          .select("id, content, created_at, topic_id, forum_topics(title, id)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("reviews")
          .select("id, customer_name, review_text_th, review_text_en, rating, created_at, is_active, helpful_count, image_url")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      setTopics((topicsRes.data as ForumTopic[]) || []);
      setReplies((repliesRes.data as unknown as ForumReplyItem[]) || []);
      setReviews((reviewsRes.data as ReviewItem[]) || []);
      setIsLoading(false);
    };
    fetchAll();
  }, [userId]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d MMM yyyy HH:mm", {
        locale: language === "th" ? th : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  const categoryLabels: Record<string, Record<string, string>> = {
    general: { th: "ทั่วไป", en: "General" },
    food: { th: "อาหาร", en: "Food" },
    stay: { th: "ที่พัก", en: "Stay" },
    review: { th: "รีวิว", en: "Review" },
    question: { th: "คำถาม", en: "Question" },
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalActivities = topics.length + replies.length + reviews.length;

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
      {/* Blue Header */}
      <div className="h-12 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
      
      <CardHeader className="pb-3 -mt-8 relative z-10 bg-white dark:bg-slate-900">
        <CardTitle className="text-lg font-serif flex items-center gap-2 text-slate-800 dark:text-white">
          <Calendar className="h-5 w-5 text-blue-600" />
          {language === "th" ? "ประวัติกิจกรรม" : "Activity History"}
          <Badge className="ml-auto text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {totalActivities} {language === "th" ? "รายการ" : "items"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="bg-white dark:bg-slate-900">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="topics" className="gap-1.5 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" />
              {language === "th" ? "กระทู้" : "Posts"}
              {topics.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  {topics.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="replies" className="gap-1.5 text-xs sm:text-sm">
              <Reply className="h-3.5 w-3.5" />
              {language === "th" ? "ตอบกลับ" : "Replies"}
              {replies.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  {replies.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5 text-xs sm:text-sm">
              <Star className="h-3.5 w-3.5" />
              {language === "th" ? "รีวิว" : "Reviews"}
              {reviews.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                  {reviews.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-2 mt-0">
            {topics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {language === "th" ? "ยังไม่มีกระทู้ที่โพสต์" : "No posts yet"}
              </p>
            ) : (
              topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => navigate(`/forum/${topic.id}`)}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all duration-200 active:scale-[0.98] group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {topic.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {categoryLabels[topic.category]?.[language === "th" ? "th" : "en"] || topic.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Eye className="h-3 w-3" /> {topic.views}
                        </span>
                        {!topic.is_active && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            {language === "th" ? "ซ่อน" : "Hidden"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(topic.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          {/* Replies Tab */}
          <TabsContent value="replies" className="space-y-2 mt-0">
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {language === "th" ? "ยังไม่มีการตอบกลับ" : "No replies yet"}
              </p>
            ) : (
              replies.map((reply) => (
                <button
                  key={reply.id}
                  onClick={() => navigate(`/forum/${reply.topic_id}`)}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all duration-200 active:scale-[0.98] group"
                >
                  <p className="text-xs text-muted-foreground mb-1 truncate">
                    <span className="font-medium text-foreground/70">
                      {language === "th" ? "ตอบใน:" : "Reply to:"}
                    </span>{" "}
                    <span className="group-hover:text-primary transition-colors">
                      {(reply.forum_topics as any)?.title || (language === "th" ? "กระทู้ที่ถูกลบ" : "Deleted post")}
                    </span>
                  </p>
                  <p className="text-sm line-clamp-2">{reply.content}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatDate(reply.created_at)}
                  </span>
                </button>
              ))
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-2 mt-0">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}`}
                          />
                        ))}
                        {!review.is_active && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                            {language === "th" ? "รอตรวจสอบ" : "Pending"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">
                        {language === "th" ? review.review_text_th : review.review_text_en}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {review.helpful_count > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Heart className="h-3 w-3" /> {review.helpful_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default UserActivity;
