import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Star,
  Reply,
  Eye,
  Heart,
  Loader2,
  Calendar,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import RankingSystem from "@/components/RankingSystem";
import PointSystemVisualization from "@/components/PointSystemVisualization";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface UserEngagementStatsProps {
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

interface EngagementData {
  totalTopics: number;
  totalReplies: number;
  totalReviews: number;
  totalHelpful: number;
  totalViews: number;
  averageRating: number;
  totalPoints: number;
  activityByMonth: Array<{
    month: string;
    topics: number;
    replies: number;
    reviews: number;
  }>;
  contributionData: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

const UserEngagementStats = ({ userId, language }: UserEngagementStatsProps) => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReplyItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ranking");
  const [data, setData] = useState<EngagementData | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      setIsLoading(true);
      const [topicsRes, repliesRes, reviewsRes, profileRes] = await Promise.all([
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
          .select(
            "id, customer_name, review_text_th, review_text_en, rating, created_at, is_active, helpful_count, image_url"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("profiles")
          .select("reputation_points")
          .eq("id", userId)
          .single(),
      ]);

      const topicsData = (topicsRes.data as ForumTopic[]) || [];
      const repliesData = (repliesRes.data as unknown as ForumReplyItem[]) || [];
      const reviewsData = (reviewsRes.data as ReviewItem[]) || [];

      setTopics(topicsData);
      setReplies(repliesData);
      setReviews(reviewsData);

      // Calculate points using the point system
      const topics_points = topicsData.length * 10;
      const replies_points = repliesData.length * 5;
      const reviews_points = reviewsData.length * 8;
      const helpful_points = reviewsData.reduce((sum, r) => sum + (r.helpful_count || 0) * 2, 0);
      const actionPoints = topics_points + replies_points + reviews_points + helpful_points;
      
      // Get reputation points from profile (set by role-based auto-ranking)
      let reputationPoints = 0;
      if (profileRes.error === null && profileRes.data) {
        reputationPoints = (profileRes.data as unknown as Record<string, unknown>).reputation_points as number || 0;
      }
      const totalPoints = actionPoints + reputationPoints;

      const totalHelpful = reviewsData.reduce((sum, r) => sum + (r.helpful_count || 0), 0);
      const totalViews = topicsData.reduce((sum, t) => sum + (t.views || 0), 0);
      const averageRating =
        reviewsData.length > 0
          ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
          : 0;

      // Group activity by month
      const allActivities = [
        ...topicsData.map((t) => ({
          date: new Date(t.created_at),
          type: "topics",
        })),
        ...repliesData.map((r) => ({
          date: new Date(r.created_at),
          type: "replies",
        })),
        ...reviewsData.map((r) => ({
          date: new Date(r.created_at),
          type: "reviews",
        })),
      ];

      const monthMap: Record<
        string,
        { topics: number; replies: number; reviews: number }
      > = {};
      allActivities.forEach(({ date, type }) => {
        const key = date.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
          year: "numeric",
          month: "2-digit",
        });
        if (!monthMap[key]) {
          monthMap[key] = { topics: 0, replies: 0, reviews: 0 };
        }
        monthMap[key][type as "topics" | "replies" | "reviews"]++;
      });

      const activityByMonth = Object.entries(monthMap)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .slice(-12)
        .map(([month, data]) => ({
          month: new Date(month).toLocaleDateString(
            language === "th" ? "th-TH" : "en-US",
            {
              month: "short",
            }
          ),
          ...data,
        }));

      const total = topicsData.length + repliesData.length + reviewsData.length;
      const contributionData = [
        {
          name: language === "th" ? "กระทู้" : "Topics",
          value: topicsData.length,
          percentage: total > 0 ? Math.round((topicsData.length / total) * 100) : 0,
        },
        {
          name: language === "th" ? "ตอบกลับ" : "Replies",
          value: repliesData.length,
          percentage: total > 0 ? Math.round((repliesData.length / total) * 100) : 0,
        },
        {
          name: language === "th" ? "รีวิว" : "Reviews",
          value: reviewsData.length,
          percentage: total > 0 ? Math.round((reviewsData.length / total) * 100) : 0,
        },
      ].filter((item) => item.value > 0);

      setData({
        totalTopics: topicsData.length,
        totalReplies: repliesData.length,
        totalReviews: reviewsData.length,
        totalHelpful,
        totalViews,
        averageRating,
        totalPoints,
        activityByMonth,
        contributionData,
      });

      setIsLoading(false);
    };
    fetchAll();
  }, [userId, language]);

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

  if (!data) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">
            {language === "th" ? "ไม่มีข้อมูล" : "No data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalActivities = topics.length + replies.length + reviews.length;

  return (
    <div className="space-y-6">
      {/* Ranking System & Point System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-slate-200 dark:bg-slate-700 mb-4">
          <TabsTrigger value="ranking" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ยศ" : "Rank"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "คะแนน" : "Points"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "แนวโน้ม" : "Trend"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ประวัติ" : "History"}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-0">
          <RankingSystem points={data.totalPoints} language={language} />
        </TabsContent>

        {/* Points System Tab */}
        <TabsContent value="points" className="mt-0">
          <PointSystemVisualization language={language} />
        </TabsContent>

        {/* Activity Trend Tab */}
        <TabsContent value="activity" className="mt-0">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
            <CardHeader className="pb-3 -mt-12 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg text-slate-800 dark:text-white">
                {language === "th" ? "แนวโน้มกิจกรรม" : "Activity Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.activityByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.activityByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      style={{ fontSize: "0.75rem" }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      style={{ fontSize: "0.75rem" }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "var(--foreground)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                    <Line
                      type="monotone"
                      dataKey="topics"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name={language === "th" ? "กระทู้" : "Topics"}
                    />
                    <Line
                      type="monotone"
                      dataKey="replies"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      activeDot={{ r: 6 }}
                      name={language === "th" ? "ตอบกลับ" : "Replies"}
                    />
                    <Line
                      type="monotone"
                      dataKey="reviews"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4 }}
                      activeDot={{ r: 6 }}
                      name={language === "th" ? "รีวิว" : "Reviews"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {language === "th"
                    ? "ยังไม่มีข้อมูลกิจกรรม"
                    : "No activity data available"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0 space-y-4">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400"></div>
            <CardHeader className="pb-3 -mt-12 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg font-serif flex items-center gap-2 text-slate-800 dark:text-white">
                <Calendar className="h-5 w-5 text-blue-600" />
                {language === "th" ? "ประวัติกิจกรรม" : "Activity History"}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {totalActivities} {language === "th" ? "รายการ" : "items"}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="topics" className="w-full">
                <TabsList className="w-full grid grid-cols-3 mb-4 bg-slate-100 dark:bg-slate-800">
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

                {/* Topics */}
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
                        className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 active:scale-[0.98] group bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors">
                              {topic.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {categoryLabels[topic.category]?.[language === "th" ? "th" : "en"] ||
                                  topic.category}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Eye className="h-3 w-3" /> {topic.views}
                              </span>
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

                {/* Replies */}
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
                        className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 active:scale-[0.98] group bg-white dark:bg-slate-800"
                      >
                        <p className="text-xs text-muted-foreground mb-1 truncate">
                          <span className="font-medium text-foreground/70">
                            {language === "th" ? "ตอบใน:" : "Reply to:"}
                          </span>{" "}
                          <span className="group-hover:text-blue-600 transition-colors">
                            {(reply.forum_topics as any)?.title ||
                              (language === "th" ? "กระทู้ที่ถูกลบ" : "Deleted post")}
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

                {/* Reviews */}
                <TabsContent value="reviews" className="space-y-2 mt-0">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 bg-white dark:bg-slate-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < review.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                              {!review.is_active && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 h-4 ml-1"
                                >
                                  {language === "th" ? "รอตรวจสอบ" : "Pending"}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">
                              {language === "th"
                                ? review.review_text_th
                                : review.review_text_en}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserEngagementStats;
