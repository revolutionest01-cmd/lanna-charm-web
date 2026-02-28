import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { UserRankBadge } from "@/components/UserRankBadge";
import { UserStatusAvatar } from "@/components/UserStatusAvatar";
import { getCategoryLabel } from "@/lib/forumConfig";
import { getRankById, getRankFromPoints, getUnlockedPerks, normalizeRankPath, RANK_PERKS } from "@/lib/pointSystem";
import { ArrowLeft, Loader2, CalendarDays, MessageCircle, Reply, Star, Heart, Link2, Eye, Trophy, Clock3, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";

type MemberProfileData = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  custom_title: string | null;
  status_message?: string | null;
  active_perks: string[];
  bio_short: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  reputation_points?: number;
  rank_path?: string;
  rank_display_tier_id?: number | null;
  profile_theme?: string;
  created_at: string;
};

type MemberTopic = {
  id: string;
  title: string;
  category: string;
  views: number;
  created_at: string;
};

type MemberReply = {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
  topic_title?: string;
};

type MemberReview = {
  id: string;
  rating: number;
  helpful_count: number;
  review_text_th?: string;
  review_text_en?: string;
  created_at: string;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type MemberProfileRouteState = {
  memberName?: string;
};

const normalizeProfile = (row: any): MemberProfileData => ({
  id: row?.id || "",
  display_name: row?.display_name || "",
  avatar_url: row?.avatar_url || null,
  custom_title: row?.custom_title || null,
  status_message: row?.status_message || null,
  active_perks: Array.isArray(row?.active_perks) ? row.active_perks : [],
  bio_short: row?.bio_short || null,
  social_facebook: row?.social_facebook || null,
  social_instagram: row?.social_instagram || null,
  social_tiktok: row?.social_tiktok || null,
  reputation_points: typeof row?.reputation_points === "number" ? row.reputation_points : 0,
  rank_path: normalizeRankPath(row?.rank_path),
  rank_display_tier_id: typeof row?.rank_display_tier_id === "number" ? row.rank_display_tier_id : null,
  profile_theme: row?.profile_theme || null,
  created_at: row?.created_at || new Date().toISOString(),
});

const CHART_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e"];

const MemberProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { userId } = useParams();
  const routeState = (location.state as MemberProfileRouteState | null) || null;
  const fallbackMemberName = routeState?.memberName?.trim();

  const [profile, setProfile] = useState<MemberProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ topics: 0, replies: 0, reviews: 0, likesReceived: 0 });
  const [detailStats, setDetailStats] = useState({
    totalTopicViews: 0,
    totalReviewHelpful: 0,
    averageReviewRating: 0,
    firstActiveAt: "",
    lastActiveAt: "",
  });
  const [recentTopics, setRecentTopics] = useState<MemberTopic[]>([]);
  const [recentReplies, setRecentReplies] = useState<MemberReply[]>([]);
  const [recentReviews, setRecentReviews] = useState<MemberReview[]>([]);
  const [allTopics, setAllTopics] = useState<MemberTopic[]>([]);
  const [allReplies, setAllReplies] = useState<MemberReply[]>([]);
  const [allReviews, setAllReviews] = useState<MemberReview[]>([]);

  useEffect(() => {
    if (!userId) return;

    const normalizedUserId = decodeURIComponent(userId).trim();
    if (!normalizedUserId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const getLikeCountFromIds = async (tableName: string, idColumn: string, ids: string[]) => {
      if (!ids.length) return 0;
      const { count, error } = await (supabase as any)
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .in(idColumn, ids);

      if (error) {
        return 0;
      }

      return count || 0;
    };

    const loadMemberProfile = async () => {
      setIsLoading(true);
      try {
        let resolvedUserId = normalizedUserId;
        let resolvedProfile: MemberProfileData | null = null;
        const buildFallbackProfile = (id: string) => ({
          id,
          display_name: fallbackMemberName || (!uuidRegex.test(normalizedUserId) ? normalizedUserId : (language === "th" ? "สมาชิก" : "Member")),
          avatar_url: null,
          custom_title: null,
          status_message: null,
          active_perks: [],
          bio_short: null,
          social_facebook: null,
          social_instagram: null,
          social_tiktok: null,
          reputation_points: 0,
          rank_path: "chicken",
          rank_display_tier_id: null,
          profile_theme: null,
          created_at: new Date().toISOString(),
        });

        setProfile(buildFallbackProfile(resolvedUserId));

        if (uuidRegex.test(normalizedUserId)) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", normalizedUserId)
            .maybeSingle();

          if (!error && data) {
            resolvedProfile = normalizeProfile(data);
          }
        } else {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("display_name", normalizedUserId)
            .maybeSingle();

          if (!error && data) {
            resolvedProfile = normalizeProfile(data);
            resolvedUserId = data.id;
          }
        }

        if (resolvedProfile) {
          setProfile(resolvedProfile);
        } else {
          setProfile(buildFallbackProfile(resolvedUserId));
        }

        const [topicResult, replyResult, reviewResult] = await Promise.all([
          (supabase as any).from("forum_topics").select("id, title, category, views, created_at").eq("user_id", resolvedUserId).order("created_at", { ascending: false }),
          (supabase as any).from("forum_replies").select("id, topic_id, content, created_at").eq("user_id", resolvedUserId).order("created_at", { ascending: false }),
          supabase.from("reviews").select("id, rating, helpful_count, review_text_th, review_text_en, created_at").eq("user_id", resolvedUserId).order("created_at", { ascending: false }),
        ]);

        const topicRows = topicResult.error ? [] : (topicResult.data || []);
        const replyRows = replyResult.error ? [] : (replyResult.data || []);
        const reviewRows = reviewResult.error ? [] : (reviewResult.data || []);

        const topicMap = new Map<string, MemberTopic>();
        (topicRows as MemberTopic[]).forEach((topic) => {
          topicMap.set(topic.id, topic);
        });

        const topicIds = (topicRows || []).map((row: any) => row.id);
        const replyIds = (replyRows || []).map((row: any) => row.id);
        const reviewIds = (reviewRows || []).map((row: any) => row.id);

        const [topicLikes, replyLikes, reviewLikes] = await Promise.all([
          getLikeCountFromIds("forum_likes", "topic_id", topicIds),
          getLikeCountFromIds("forum_reply_likes", "reply_id", replyIds),
          getLikeCountFromIds("review_likes", "review_id", reviewIds),
        ]);

        if (!resolvedProfile && (topicIds.length || replyIds.length || reviewIds.length)) {
          setProfile(buildFallbackProfile(resolvedUserId));
        }

        setStats({
          topics: topicIds.length,
          replies: replyIds.length,
          reviews: reviewIds.length,
          likesReceived: topicLikes + replyLikes + reviewLikes,
        });

        const topicViews = (topicRows as MemberTopic[]).reduce((sum, row) => sum + (row.views || 0), 0);
        const reviewHelpful = (reviewRows as MemberReview[]).reduce((sum, row) => sum + (row.helpful_count || 0), 0);
        const reviewAvg = reviewRows.length
          ? (reviewRows as MemberReview[]).reduce((sum, row) => sum + (row.rating || 0), 0) / reviewRows.length
          : 0;

        const activityDates = [
          ...((topicRows as MemberTopic[]).map((row) => row.created_at)),
          ...((replyRows as MemberReply[]).map((row) => row.created_at)),
          ...((reviewRows as MemberReview[]).map((row) => row.created_at)),
        ].filter(Boolean);

        const sortedDates = activityDates.slice().sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        setDetailStats({
          totalTopicViews: topicViews,
          totalReviewHelpful: reviewHelpful,
          averageReviewRating: Number(reviewAvg.toFixed(2)),
          firstActiveAt: sortedDates[0] || profile?.created_at || "",
          lastActiveAt: sortedDates[sortedDates.length - 1] || profile?.created_at || "",
        });

        setRecentTopics((topicRows as MemberTopic[]).slice(0, 5));
        setRecentReplies(
          (replyRows as MemberReply[])
            .slice(0, 5)
            .map((reply) => ({
              ...reply,
              topic_title: topicMap.get(reply.topic_id)?.title,
            }))
        );
        setRecentReviews((reviewRows as MemberReview[]).slice(0, 5));
        setAllTopics(topicRows as MemberTopic[]);
        setAllReplies(replyRows as MemberReply[]);
        setAllReviews(reviewRows as MemberReview[]);
      } catch {
        setProfile({
          id: normalizedUserId,
          display_name: fallbackMemberName || (!uuidRegex.test(normalizedUserId) ? normalizedUserId : (language === "th" ? "สมาชิก" : "Member")),
          avatar_url: null,
          custom_title: null,
          active_perks: [],
          bio_short: null,
          social_facebook: null,
          social_instagram: null,
          social_tiktok: null,
          reputation_points: 0,
          profile_theme: null,
          created_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMemberProfile();
  }, [userId, language, fallbackMemberName]);

  const socialLinks = useMemo(
    () => [
      { label: "Facebook", value: profile?.social_facebook },
      { label: "Instagram", value: profile?.social_instagram },
      { label: "TikTok", value: profile?.social_tiktok },
    ],
    [profile?.social_facebook, profile?.social_instagram, profile?.social_tiktok]
  );

  const weeklyActivityData = useMemo(() => {
    const dayKeys: string[] = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() - offset);
      dayKeys.push(date.toISOString().slice(0, 10));
    }

    const map = new Map<string, { topics: number; replies: number; reviews: number }>();
    dayKeys.forEach((key) => map.set(key, { topics: 0, replies: 0, reviews: 0 }));

    allTopics.forEach((item) => {
      const key = new Date(item.created_at).toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.topics += 1;
    });

    allReplies.forEach((item) => {
      const key = new Date(item.created_at).toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.replies += 1;
    });

    allReviews.forEach((item) => {
      const key = new Date(item.created_at).toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) bucket.reviews += 1;
    });

    return dayKeys.map((key) => {
      const value = map.get(key) || { topics: 0, replies: 0, reviews: 0 };
      const date = new Date(key);
      return {
        label: date.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { weekday: "short" }),
        ...value,
      };
    });
  }, [allTopics, allReplies, allReviews, language]);

  const monthlyActivityData = useMemo(() => {
    const monthKeys: string[] = [];
    const baseDate = new Date();
    baseDate.setDate(1);
    baseDate.setHours(0, 0, 0, 0);

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(baseDate);
      date.setMonth(baseDate.getMonth() - offset);
      monthKeys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }

    const map = new Map<string, { topics: number; replies: number; reviews: number }>();
    monthKeys.forEach((key) => map.set(key, { topics: 0, replies: 0, reviews: 0 }));

    allTopics.forEach((item) => {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = map.get(key);
      if (bucket) bucket.topics += 1;
    });

    allReplies.forEach((item) => {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = map.get(key);
      if (bucket) bucket.replies += 1;
    });

    allReviews.forEach((item) => {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const bucket = map.get(key);
      if (bucket) bucket.reviews += 1;
    });

    return monthKeys.map((key) => {
      const [year, month] = key.split("-").map(Number);
      const labelDate = new Date(year, month - 1, 1);
      return {
        label: labelDate.toLocaleDateString(language === "th" ? "th-TH" : "en-US", { month: "short" }),
        ...(map.get(key) || { topics: 0, replies: 0, reviews: 0 }),
      };
    });
  }, [allTopics, allReplies, allReviews, language]);

  const activityMixData = useMemo(
    () => [
      { name: language === "th" ? "กระทู้" : "Topics", value: stats.topics },
      { name: language === "th" ? "ตอบกลับ" : "Replies", value: stats.replies },
      { name: language === "th" ? "รีวิว" : "Reviews", value: stats.reviews },
    ].filter((item) => item.value > 0),
    [stats, language]
  );

  const reviewRatingData = useMemo(() => {
    const counters = [0, 0, 0, 0, 0];
    allReviews.forEach((review) => {
      const value = Math.min(5, Math.max(1, Math.round(review.rating || 0)));
      if (value >= 1 && value <= 5) counters[value - 1] += 1;
    });

    return [1, 2, 3, 4, 5].map((rating) => ({
      rating: `${rating}★`,
      count: counters[rating - 1],
    }));
  }, [allReviews]);

  const currentRank = useMemo(() => {
    const points = profile?.reputation_points || 0;
    const rankPath = normalizeRankPath(profile?.rank_path);
    const highestRank = getRankFromPoints(points, rankPath);
    const selectedTierId = Number(profile?.rank_display_tier_id);
    const effectiveTierId = Number.isFinite(selectedTierId) && selectedTierId >= 1
      ? Math.min(Math.floor(selectedTierId), highestRank.id)
      : highestRank.id;
    return getRankById(effectiveTierId, rankPath);
  }, [profile?.reputation_points, profile?.rank_path, profile?.rank_display_tier_id]);

  const unlockedHonorMedals = useMemo(() => {
    const perkKeys = getUnlockedPerks(currentRank.id);
    return perkKeys
      .map((key) => ({ key, perk: RANK_PERKS[key as keyof typeof RANK_PERKS] }))
      .filter((item) => !!item.perk)
      .slice(-4)
      .reverse();
  }, [currentRank.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-violet-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-violet-100 dark:from-slate-950 dark:to-slate-900 p-4 pt-20 sm:pt-28">
        <div className="max-w-3xl mx-auto">
          <Card className="border-sky-200/70 bg-white/95">
            <CardContent className="p-6 text-center">
              <p className="text-slate-700">{language === "th" ? "ไม่พบโปรไฟล์สมาชิก" : "Member profile not found"}</p>
              <Button
                variant="outline"
                className="mt-4 border-2 border-violet-500 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "th" ? "ย้อนกลับ" : "Go Back"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-cyan-50 to-violet-100 dark:from-slate-950 dark:to-slate-900 p-4 pt-20 sm:pt-28">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-2 border-violet-500 bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-800 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "th" ? "ย้อนกลับ" : "Back"}
        </Button>

        <Card className="border-sky-200/70 bg-white/95 shadow-md overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
              <UserStatusAvatar
                userId={profile.id}
                userName={profile.display_name || "User"}
                avatarUrl={profile.avatar_url || undefined}
                statusMessage={profile.status_message || undefined}
                size="lg"
                avatarClassName="h-20 w-20 border-4 border-white shadow-md"
                fallbackClassName="bg-gradient-to-br from-sky-500 to-violet-500 text-white text-2xl font-semibold"
              />

              <div className="flex-1 min-w-0">
                <UserRankBadge userId={profile.id} userName={profile.display_name || "User"} size="lg" disableProfileLink />
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {language === "th" ? "เข้าร่วมเมื่อ" : "Joined"} {new Date(profile.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                </div>
                {profile.active_perks?.includes("custom-title") && profile.custom_title && (
                  <p className="text-sm text-blue-700 mt-1">「{profile.custom_title}」</p>
                )}
                <p className="text-sm text-slate-600 mt-3">
                  {profile.bio_short || (language === "th" ? "ยังไม่ได้เพิ่ม Bio" : "No bio yet")}
                </p>
              </div>

              <div className="min-w-[260px] space-y-2">
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="text-[11px] text-slate-500 mb-1">{language === "th" ? "Ranking ปัจจุบัน" : "Current Ranking"}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-violet-700 line-clamp-1">
                      {currentRank.icon} {language === "th" ? currentRank.name : currentRank.nameEn}
                    </p>
                    <Badge variant="outline" className="border-violet-300 bg-white text-violet-700">
                      {profile.reputation_points || 0} pts
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {language === "th" ? currentRank.description : currentRank.descriptionEn}
                  </p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[11px] text-slate-500 mb-1">{language === "th" ? "เหรียญเกียรติยศที่ได้รับ" : "Honor Medals"}</p>
                  {unlockedHonorMedals.length === 0 ? (
                    <p className="text-xs text-slate-500">{language === "th" ? "ยังไม่มีเหรียญที่ปลดล็อก" : "No medals unlocked yet"}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {unlockedHonorMedals.map((item) => (
                        <Badge key={item.key} variant="outline" className="border-amber-300 bg-white text-amber-700 text-[11px]">
                          {item.perk.icon} {language === "th" ? item.perk.name : item.perk.nameEn}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle>{language === "th" ? "สถิติสมาชิก" : "Member Stats"}</CardTitle>
            <CardDescription>{language === "th" ? "ภาพรวมกิจกรรมและการได้รับ Like" : "Activity and likes overview"}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-center">
              <MessageCircle className="h-4 w-4 mx-auto mb-1 text-sky-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "กระทู้" : "Topics"}</p>
              <p className="font-bold text-slate-800">{stats.topics}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <Reply className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "ตอบกลับ" : "Replies"}</p>
              <p className="font-bold text-slate-800">{stats.replies}</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "รีวิว" : "Reviews"}</p>
              <p className="font-bold text-slate-800">{stats.reviews}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-rose-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "Like ที่ได้รับ" : "Likes Received"}</p>
              <p className="font-bold text-slate-800">{stats.likesReceived}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle>{language === "th" ? "ข้อมูลเชิงลึก" : "Deep Insights"}</CardTitle>
            <CardDescription>{language === "th" ? "คะแนนยศ, ยอดวิว, ความน่าเชื่อถือ และช่วงกิจกรรม" : "Rank points, views, review quality, and activity period"}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center">
              <Trophy className="h-4 w-4 mx-auto mb-1 text-violet-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "คะแนนยศ" : "Rank Points"}</p>
              <p className="font-bold text-slate-800">{profile.reputation_points || 0}</p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-center">
              <Eye className="h-4 w-4 mx-auto mb-1 text-sky-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "ยอดวิวรวม" : "Total Views"}</p>
              <p className="font-bold text-slate-800">{detailStats.totalTopicViews}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "Helpful รวม" : "Total Helpful"}</p>
              <p className="font-bold text-slate-800">{detailStats.totalReviewHelpful}</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
              <Star className="h-4 w-4 mx-auto mb-1 text-orange-600" />
              <p className="text-xs text-slate-500">{language === "th" ? "คะแนนรีวิวเฉลี่ย" : "Avg Review"}</p>
              <p className="font-bold text-slate-800">{detailStats.averageReviewRating}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle>{language === "th" ? "ช่วงเวลากิจกรรม" : "Activity Timeline"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500 text-xs mb-1">{language === "th" ? "กิจกรรมแรก" : "First Activity"}</p>
              <p className="font-medium text-slate-800 inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {detailStats.firstActiveAt ? new Date(detailStats.firstActiveAt).toLocaleString(language === "th" ? "th-TH" : "en-US") : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500 text-xs mb-1">{language === "th" ? "กิจกรรมล่าสุด" : "Last Activity"}</p>
              <p className="font-medium text-slate-800 inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {detailStats.lastActiveAt ? new Date(detailStats.lastActiveAt).toLocaleString(language === "th" ? "th-TH" : "en-US") : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle>{language === "th" ? "กิจกรรมล่าสุด" : "Recent Activities"}</CardTitle>
            <CardDescription>{language === "th" ? "กระทู้ คอมเมนต์ และรีวิวล่าสุดของสมาชิก" : "Latest topics, replies, and reviews"}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-sky-700">{language === "th" ? "กระทู้ล่าสุด" : "Recent Topics"}</p>
              {recentTopics.length === 0 ? (
                <p className="text-xs text-slate-500">{language === "th" ? "ยังไม่มีกระทู้" : "No topics yet"}</p>
              ) : (
                recentTopics.map((topic) => (
                  <button key={topic.id} type="button" onClick={() => navigate(`/forum/${topic.id}`)} className="w-full text-left rounded-md border border-sky-200 bg-white p-2 hover:bg-sky-50">
                    <p className="text-xs font-medium text-slate-800 line-clamp-1">{topic.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {getCategoryLabel(topic.category, language === "th" ? "th" : "en")} • {new Date(topic.created_at).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-700">{language === "th" ? "คอมเมนต์ล่าสุด" : "Recent Replies"}</p>
              {recentReplies.length === 0 ? (
                <p className="text-xs text-slate-500">{language === "th" ? "ยังไม่มีคอมเมนต์" : "No replies yet"}</p>
              ) : (
                recentReplies.map((reply) => (
                  <button key={reply.id} type="button" onClick={() => navigate(`/forum/${reply.topic_id}`)} className="w-full text-left rounded-md border border-emerald-200 bg-white p-2 hover:bg-emerald-50">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">{reply.content}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{reply.topic_title || (language === "th" ? "หัวข้อไม่ระบุ" : "Untitled topic")}</p>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-orange-700">{language === "th" ? "รีวิวล่าสุด" : "Recent Reviews"}</p>
              {recentReviews.length === 0 ? (
                <p className="text-xs text-slate-500">{language === "th" ? "ยังไม่มีรีวิว" : "No reviews yet"}</p>
              ) : (
                recentReviews.map((review) => (
                  <button key={review.id} type="button" onClick={() => navigate(`/reviews#review-${review.id}`)} className="w-full text-left rounded-md border border-orange-200 bg-white p-2 hover:bg-orange-50">
                    <p className="text-xs font-medium text-slate-800 line-clamp-2">{(language === "th" ? review.review_text_th : review.review_text_en) || "-"}</p>
                    <p className="text-[11px] text-slate-500 mt-1">⭐ {review.rating || 0} • 👍 {review.helpful_count || 0}</p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Activity className="h-5 w-5 text-violet-600" />
              {language === "th" ? "กราฟการใช้งานเชิงลึก" : "Detailed Activity Charts"}
            </CardTitle>
            <CardDescription>{language === "th" ? "สรุปแนวโน้มกิจกรรมและคุณภาพคอนเทนต์" : "Trend of member actions and content quality"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-lg border border-sky-200 bg-sky-50/30 p-3">
                <p className="text-sm font-medium text-slate-700 mb-2">{language === "th" ? "กิจกรรม 7 วันล่าสุด" : "Last 7 Days Activity"}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyActivityData}>
                      <defs>
                        <linearGradient id="topicGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="replyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="reviewGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="topics" stroke="#0ea5e9" fill="url(#topicGradient)" name={language === "th" ? "กระทู้" : "Topics"} />
                      <Area type="monotone" dataKey="replies" stroke="#10b981" fill="url(#replyGradient)" name={language === "th" ? "ตอบกลับ" : "Replies"} />
                      <Area type="monotone" dataKey="reviews" stroke="#f59e0b" fill="url(#reviewGradient)" name={language === "th" ? "รีวิว" : "Reviews"} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-lg border border-violet-200 bg-violet-50/30 p-3">
                <p className="text-sm font-medium text-slate-700 mb-2">{language === "th" ? "กิจกรรมย้อนหลัง 6 เดือน" : "6-Month Activity"}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="topics" fill="#0ea5e9" name={language === "th" ? "กระทู้" : "Topics"} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="replies" fill="#10b981" name={language === "th" ? "ตอบกลับ" : "Replies"} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reviews" fill="#f59e0b" name={language === "th" ? "รีวิว" : "Reviews"} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
                <p className="text-sm font-medium text-slate-700 mb-2">{language === "th" ? "สัดส่วนประเภทกิจกรรม" : "Activity Mix"}</p>
                <div className="h-64">
                  {activityMixData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-500">
                      {language === "th" ? "ยังไม่มีกิจกรรมเพียงพอสำหรับกราฟ" : "Not enough activity for chart"}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={activityMixData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                          {activityMixData.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-3">
                <p className="text-sm font-medium text-slate-700 mb-2">{language === "th" ? "การกระจายคะแนนรีวิว" : "Review Rating Distribution"}</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reviewRatingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" name={language === "th" ? "จำนวนรีวิว" : "Reviews"} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 bg-white/95 shadow-md">
          <CardHeader>
            <CardTitle>{language === "th" ? "โซเชียล" : "Social"}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {socialLinks.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                {item.value ? (
                  <a href={item.value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    <Link2 className="h-3.5 w-3.5" />
                    {language === "th" ? "เปิดลิงก์" : "Open"}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">{language === "th" ? "ไม่มีข้อมูล" : "No link"}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberProfile;
