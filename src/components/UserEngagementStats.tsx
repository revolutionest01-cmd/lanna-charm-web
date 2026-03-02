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
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { th, enUS } from "date-fns/locale";
import RankingSystem from "@/components/RankingSystem";
import PointSystemVisualization from "@/components/PointSystemVisualization";
import PerkEquipPanel from "@/components/PerkEquipPanel";
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
  activityByWeek: Array<{
    day: string;
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
  const [trendViewMode, setTrendViewMode] = useState<"weekly" | "monthly">("weekly");
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
          .limit(300),
        supabase
          .from("forum_replies")
          .select("id, content, created_at, topic_id, forum_topics(title, id)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("reviews")
          .select(
            "id, customer_name, review_text_th, review_text_en, rating, created_at, is_active, helpful_count, image_url"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(300),
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

      // Group activity by month and by latest 7 days
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

      const toDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const monthMap: Record<
        string,
        { topics: number; replies: number; reviews: number }
      > = {};
      allActivities.forEach(({ date, type }) => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) {
          monthMap[key] = { topics: 0, replies: 0, reviews: 0 };
        }
        monthMap[key][type as "topics" | "replies" | "reviews"]++;
      });

      const activityByMonth = Object.entries(monthMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([monthKey, monthData]) => {
          const [year, month] = monthKey.split("-").map(Number);
          const monthDate = new Date(year, month - 1, 1);
          return {
            month: monthDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
              month: "short",
            }),
            ...monthData,
          };
        });

      const weekMap: Record<string, { topics: number; replies: number; reviews: number }> = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let offset = 6; offset >= 0; offset -= 1) {
        const day = new Date(today);
        day.setDate(today.getDate() - offset);
        weekMap[toDateKey(day)] = { topics: 0, replies: 0, reviews: 0 };
      }

      allActivities.forEach(({ date, type }) => {
        const key = toDateKey(date);
        if (!weekMap[key]) return;
        weekMap[key][type as "topics" | "replies" | "reviews"]++;
      });

      const activityByWeek = Object.entries(weekMap).map(([dayKey, dayData]) => {
        const [year, month, day] = dayKey.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        return {
          day: date.toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
            weekday: "short",
          }),
          ...dayData,
        };
      });

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
        activityByWeek,
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
  const trendData = trendViewMode === "weekly" ? data.activityByWeek : data.activityByMonth;
  const periodLabelKey = trendViewMode === "weekly" ? "day" : "month";
  const averageUnitLabel = trendViewMode === "weekly"
    ? (language === "th" ? "วันละ" : "/day")
    : (language === "th" ? "เดือนละ" : "/month");

  const peakPeriod = trendData.length
    ? trendData.reduce((peak, current) => {
        const peakTotal = peak.topics + peak.replies + peak.reviews;
        const currentTotal = current.topics + current.replies + current.reviews;
        return currentTotal > peakTotal ? current : peak;
      }, trendData[0])
    : null;

  return (
    <div className="space-y-6">
      {/* Ranking System & Point System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto p-0 bg-transparent rounded-none justify-start gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-300/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger
            value="ranking"
            className="gap-1 text-xs sm:text-sm rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-3.5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
          >
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ยศ" : "Rank"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="ranking-guide"
            className="gap-1 text-xs sm:text-sm rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-3.5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "คำอธิบายระบบ Ranking System" : "Ranking System Guide"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="points"
            className="gap-1 text-xs sm:text-sm rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-3.5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "คะแนน" : "Points"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-1 text-xs sm:text-sm rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-3.5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "แนวโน้ม" : "Trend"}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="gap-1 text-xs sm:text-sm rounded-t-[12px] rounded-b-none border border-slate-300 border-b-0 bg-white/70 px-3.5 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:-mb-px"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === "th" ? "ประวัติ" : "History"}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="rounded-b-xl rounded-tr-xl border border-slate-300 border-t-0 bg-white p-4 sm:p-5 shadow-md">

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-0 space-y-6">
          <RankingSystem points={data.totalPoints} language={language} userId={userId} />
          <PerkEquipPanel userId={userId} language={language} />
        </TabsContent>

        {/* Ranking Guide Tab */}
        <TabsContent value="ranking-guide" className="mt-0 space-y-4">
          <Card className="border-0 shadow-lg overflow-hidden bg-white dark:bg-slate-900">
            <div className="h-16 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"></div>
            <CardHeader className="pb-3 -mt-12 relative z-10 bg-white dark:bg-slate-900">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <Info className="h-5 w-5 text-blue-600" />
                {language === "th" ? "คำอธิบายระบบ Ranking System" : "Ranking System Guide"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 bg-white dark:bg-slate-900">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {language === "th" ? "ระบบ Ranking คืออะไร และดียังไง" : "What Ranking is and why it matters"}
                </h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {language === "th"
                    ? "ระบบ Ranking ของเว็บบอร์ดคือระบบที่ออกแบบมาเพื่อวัดทั้งปริมาณการมีส่วนร่วมและคุณภาพการมีส่วนร่วมของสมาชิกอย่างต่อเนื่อง โดยเน้นให้ผู้ใช้เห็นพัฒนาการของตัวเองแบบชัดเจน มีเป้าหมายในการใช้งานระยะสั้น-ระยะยาว และรู้สึกว่าการมีส่วนร่วมทุกครั้งมีคุณค่า ยศที่ได้ไม่ใช่เพียงภาพลักษณ์ แต่สะท้อนประสบการณ์ ความสม่ำเสมอ วินัย และสไตล์การเล่นของแต่ละคน"
                    : "Ranking is designed to track both engagement volume and contribution quality over time. It gives users visible progress, clear short/long-term goals, and a stronger sense that every contribution matters. Rank is not only visual identity—it reflects experience, consistency, discipline, and play style."}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {language === "th" ? "ผู้ใช้งานได้อะไรจากระบบนี้" : "What users get from this system"}
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <li>{language === "th" ? "เห็นการเติบโตของตัวเองอย่างเป็นรูปธรรม ตั้งแต่สมาชิกใหม่จนถึงระดับสูง" : "Concrete personal progression from newcomer to advanced tiers."}</li>
                  <li>{language === "th" ? "มีแรงจูงใจในการกลับมาใช้งาน เพราะมีเป้าหมายการอัปยศที่ชัดเจน" : "Stronger return motivation with clear rank-up goals."}</li>
                  <li>{language === "th" ? "เลือกสายยศให้ตรงบุคลิกการเล่นและแนวทางการมีส่วนร่วมของตัวเองได้" : "Freedom to choose a rank path that fits personal play style."}</li>
                  <li>{language === "th" ? "มีความยืดหยุ่นในการแสดงตัวตน ด้วยการเลือกยศที่ใช้งานได้ต่ำกว่ายศสูงสุด" : "Flexible identity via active-rank display selection below highest unlocked rank."}</li>
                  <li>{language === "th" ? "สร้างสมดุลระหว่างความท้าทาย ความแฟร์ และความสนุกของระบบระยะยาว" : "Balanced long-term challenge, fairness, and enjoyment."}</li>
                  <li>{language === "th" ? "ช่วยยกระดับคุณภาพชุมชน เพราะระบบให้รางวัลกับการมีส่วนร่วมที่ต่อเนื่อง" : "Improves community quality by rewarding sustained engagement."}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {language === "th" ? "หลักการทำงานของระบบ Ranking" : "How the Ranking system works"}
                </h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <li>
                    <span className="font-medium">{language === "th" ? "จุดเริ่มต้นมาตรฐานเดียวกัน" : "Unified starting point"}:</span>{" "}
                    {language === "th"
                      ? "สมาชิกใหม่ทุกคนเริ่มจากยศลูกเจี๊ยบมือใหม่ (0-199 คะแนน) เพื่อให้ทุกคนเริ่มต้นในฐานเดียวกัน เรียนรู้วัฒนธรรมชุมชน และสะสมประสบการณ์ก่อนเข้าสู่สายเฉพาะ"
                      : "All new members start at Newbie Chick (0-199 points) for a fair baseline and onboarding period."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "เงื่อนไขปลดล็อกสาย" : "Path unlock condition"}:</span>{" "}
                    {language === "th"
                      ? "เมื่อครบ 200 คะแนน ระบบจะปลดล็อกปุ่มเลือกสายอัตโนมัติ โดยเลือกได้ 3 สาย: ไก่ / หมา / แมว"
                      : "At 200 points, path selection is unlocked automatically: Chicken / Dog / Cat."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "การรีเซ็ตคะแนนครั้งแรก (ครั้งเดียว)" : "One-time first reset"}:</span>{" "}
                    {language === "th"
                      ? "เมื่อเลือกสายครั้งแรก คะแนนยศจะรีเซ็ตเป็น 0 เพื่อเริ่มเส้นทางเฉพาะสายอย่างยุติธรรม และแยกช่วงฝึกจากช่วงเล่นจริง"
                      : "When selecting a path for the first time, rank points reset to 0 for a fair path-specific progression start."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "การสะสมหลังเลือกสาย" : "Post-selection accumulation"}:</span>{" "}
                    {language === "th"
                      ? "หลังเลือกสายครั้งแรก คะแนนจะสะสมต่อภายในสายนั้นและใช้เลื่อนยศตามเกณฑ์ของระบบเดิม"
                      : "After first selection, points continue accumulating in that path and drive rank progression normally."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "การเปลี่ยนสายในครั้งถัดไป" : "Subsequent path changes"}:</span>{" "}
                    {language === "th"
                      ? "เปลี่ยนสายได้ทุก 90 วัน (3 เดือน) เพื่อป้องกันการสลับสายบ่อยเกินไป และหลังจากนี้คะแนนจะไม่รีเซ็ตอีก"
                      : "Path change is available every 90 days (3 months), and points will not reset again."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "ข้อยกเว้นระดับสูง" : "High-tier exception"}:</span>{" "}
                    {language === "th"
                      ? "สมาชิกที่มี Rank ถึง Lv.7 สามารถเปลี่ยนสายได้ตามต้องการทันที โดยไม่ติดคูลดาวน์ 3 เดือน"
                      : "Members at Lv.7 can switch paths freely without the 3-month cooldown."}
                  </li>
                  <li>
                    <span className="font-medium">{language === "th" ? "การเลือกยศที่ใช้งาน" : "Active-rank display"}:</span>{" "}
                    {language === "th"
                      ? "ผู้ใช้สามารถเลือกยศที่ใช้งานให้ต่ำกว่ายศสูงสุดที่ปลดล็อกแล้วได้ โดยไม่กระทบความคืบหน้าจริงของบัญชี"
                      : "Users can set an active display rank lower than the highest unlocked rank without losing progression."}
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {language === "th" ? "ข้อกำหนดสำคัญในการอัปยศและเปลี่ยนสาย (สรุปเงื่อนไข)" : "Key requirements summary"}
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  <li>{language === "th" ? "ช่วงเริ่มต้น: 0-199 คะแนน = ลูกเจี๊ยบมือใหม่" : "Starter range: 0-199 points = Newbie Chick."}</li>
                  <li>{language === "th" ? "ปลดล็อกเลือกสาย: 200 คะแนนขึ้นไป" : "Path unlock: 200+ points."}</li>
                  <li>{language === "th" ? "เลือกสายครั้งแรก: รีเซ็ตคะแนนเป็น 0" : "First path selection: points reset to 0."}</li>
                  <li>{language === "th" ? "เปลี่ยนสายรอบถัดไป: ทุก 90 วัน" : "Later path changes: every 90 days."}</li>
                  <li>{language === "th" ? "Lv.7 ขึ้นไป: เปลี่ยนสายได้ทันที ไม่ติดคูลดาวน์" : "Lv.7+: immediate path switch, no cooldown."}</li>
                  <li>{language === "th" ? "เปลี่ยนสายหลังครั้งแรก: คะแนนไม่รีเซ็ตอีก" : "After first switch: no more point resets."}</li>
                </ul>
              </div>

              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {language === "th"
                  ? "สรุป: ระบบนี้ทำให้ผู้ใช้เห็นความก้าวหน้าแบบจับต้องได้ มีเป้าหมายชัดเจนในการมีส่วนร่วมระยะยาว เลือกสไตล์การเติบโตของตัวเองได้ และช่วยผลักดันให้ชุมชนมีคุณภาพและคึกคักมากขึ้นอย่างยั่งยืน"
                  : "In short: this system provides visible progress, long-term purpose, style-driven growth, and stronger sustainable community quality."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points System Tab */}
        <TabsContent value="points" className="mt-0">
          <PointSystemVisualization language={language} />
        </TabsContent>

        {/* Activity Trend Tab */}
        <TabsContent value="activity" className="mt-0 space-y-4">
          {/* Summary Stats */}
          {trendData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {language === "th" ? "กระทู้" : "Topics"}
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {data.totalTopics}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        💬 {Math.round(data.totalTopics / trendData.length)} {averageUnitLabel}
                      </p>
                    </div>
                    <div className="text-4xl">💭</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {language === "th" ? "ตอบกลับ" : "Replies"}
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {data.totalReplies}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ✓ {Math.round(data.totalReplies / trendData.length)} {averageUnitLabel}
                      </p>
                    </div>
                    <div className="text-4xl">💬</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {language === "th" ? "รีวิว" : "Reviews"}
                      </p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {data.totalReviews}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ⭐ {Math.round(data.totalReviews / trendData.length)} {averageUnitLabel}
                      </p>
                    </div>
                    <div className="text-4xl">⭐</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Chart */}
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <CardHeader className="pb-3 -mt-12 relative z-10 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  {language === "th"
                    ? trendViewMode === "weekly"
                      ? "แนวโน้มกิจกรรม (7 วันล่าสุด)"
                      : "แนวโน้มกิจกรรม (ย้อนหลังสูงสุด 6 เดือน)"
                    : trendViewMode === "weekly"
                      ? "Activity Trend (Last 7 Days)"
                      : "Activity Trend (Last 6 Months Max)"}
                </CardTitle>
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTrendViewMode("weekly")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      trendViewMode === "weekly"
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {language === "th" ? "7 วัน" : "7 Days"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendViewMode("monthly")}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      trendViewMode === "monthly"
                        ? "bg-blue-500 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {language === "th" ? "รายเดือน" : "Monthly"}
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {trendData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={trendData}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorTopics" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="var(--border)"
                        vertical={false}
                        opacity={0.3}
                      />
                      <XAxis
                        dataKey={periodLabelKey}
                        stroke="var(--muted-foreground)"
                        style={{ fontSize: "0.875rem", fontWeight: "500" }}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        style={{ fontSize: "0.875rem" }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          border: "2px solid rgba(100, 116, 139, 0.5)",
                          borderRadius: "0.75rem",
                          padding: "0.75rem",
                        }}
                        labelStyle={{ color: "#fff", fontWeight: "bold" }}
                        formatter={(value: number) => [value, ""]}
                        cursor={{ stroke: "var(--border)", strokeWidth: 2 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "0.875rem", paddingTop: "1rem" }}
                        verticalAlign="top"
                        height={36}
                      />
                      <Line
                        type="natural"
                        dataKey="topics"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        name={language === "th" ? "📝 กระทู้" : "📝 Topics"}
                        isAnimationActive={true}
                      />
                      <Line
                        type="natural"
                        dataKey="replies"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", r: 5, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        name={language === "th" ? "💬 ตอบกลับ" : "💬 Replies"}
                        isAnimationActive={true}
                      />
                      <Line
                        type="natural"
                        dataKey="reviews"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", r: 5, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 2 }}
                        name={language === "th" ? "⭐ รีวิว" : "⭐ Reviews"}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        {language === "th" ? "กิจกรรมทั้งหมด" : "Total Activity"}
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {totalActivities}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        {trendViewMode === "weekly"
                          ? (language === "th" ? "ค่าเฉลี่ย/วัน" : "Avg/Day")
                          : (language === "th" ? "ค่าเฉลี่ย/เดือน" : "Avg/Month")}
                      </p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(totalActivities / trendData.length)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        {language === "th" ? "ช่วงพีค" : "Peak Period"}
                      </p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {(peakPeriod?.[periodLabelKey as "day" | "month"] as string) || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-muted-foreground">
                    {language === "th"
                      ? "ยังไม่มีข้อมูลกิจกรรม เริ่มมีส่วนร่วมในชุมชนเพื่อดูแนวโน้มของคุณ"
                      : "No activity data yet. Start participating to see your trends!"}
                  </p>
                </div>
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
        </div>
      </Tabs>
    </div>
  );
};

export default UserEngagementStats;
