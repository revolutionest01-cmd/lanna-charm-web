import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import {
  TrendingUp, MessageSquare, Globe, Clock, RefreshCw,
  Loader2, Hash, Users, Zap, Calendar, MousePointerClick, MapPin, Smartphone, Bot, MessageCircleQuestion, Star, CalendarCheck,
} from "lucide-react";

interface ChatLog {
  id: string;
  session_id: string;
  user_message: string;
  ai_reply: string;
  intent: string | null;
  language: string | null;
  country_code: string | null;
  current_url: string | null;
  page_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  device_type: string | null;
  user_agent: string | null;
  visitor_fingerprint: string | null;
  created_at: string;
}

interface TopQuestionItem {
  question: string;
  count: number;
  entries: ChatLog[];
}

interface WebAnalyticsEvent {
  id: string;
  created_at: string;
  visitor_id: string;
  session_id: string;
  event_name: string;
  event_category: string | null;
  page_path: string | null;
  current_url: string | null;
  element_id: string | null;
  element_text: string | null;
  element_type: string | null;
  duration_seconds: number | null;
  scroll_depth: number | null;
  device_type: string | null;
  device_brand: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
}

interface ModuleStats {
  forumTopics: number;
  forumReplies: number;
  forumViews: number;
  reviewsCount: number;
  reviewLikes: number;
  reviewReplies: number;
  reviewAvgRating: number;
  bookingAbuseEvents: number;
}

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(160, 84%, 39%)",
  "hsl(271, 91%, 65%)",
  "hsl(346, 77%, 60%)",
  "hsl(200, 80%, 50%)",
];

const INTENT_LABELS: Record<string, { th: string; en: string }> = {
  general: { th: "ทั่วไป", en: "General" },
  pricing: { th: "ราคา", en: "Pricing" },
  rooms: { th: "ห้องพัก", en: "Rooms" },
  food: { th: "อาหาร", en: "Food" },
  events: { th: "อีเว้นท์", en: "Events" },
  contact: { th: "ติดต่อ", en: "Contact" },
  booking: { th: "จอง", en: "Booking" },
  location: { th: "สถานที่", en: "Location" },
};

const getMobileBrandFromUserAgent = (userAgent: string | null): string | null => {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "Apple";
  if (ua.includes("samsung") || ua.includes("sm-")) return "Samsung";
  if (ua.includes("pixel") || ua.includes("google")) return "Google";
  if (ua.includes("huawei") || ua.includes("honor")) return "Huawei/Honor";
  if (ua.includes("xiaomi") || ua.includes("redmi") || ua.includes("poco") || ua.includes("mi ")) return "Xiaomi";
  if (ua.includes("oppo") || ua.includes("cph")) return "OPPO";
  if (ua.includes("vivo")) return "vivo";
  if (ua.includes("realme") || ua.includes("rmx")) return "realme";
  if (ua.includes("oneplus") || ua.includes("kb200") || ua.includes("le2")) return "OnePlus";
  if (ua.includes("motorola") || ua.includes("moto")) return "Motorola";
  if (ua.includes("sony") || ua.includes("xperia")) return "Sony";
  if (ua.includes("asus") || ua.includes("zenfone")) return "ASUS";
  if (ua.includes("nokia")) return "Nokia";
  if (ua.includes("nothing")) return "Nothing";
  return "Other Android";
};

const inferMenuLabel = (log: ChatLog, language: "th" | "en"): string => {
  const pagePath = (log.page_path || "").toLowerCase();
  const currentUrl = (log.current_url || "").toLowerCase();

  const label = (th: string, en: string) => (language === "th" ? th : en);

  const mapByKeyword: Array<{ key: string; th: string; en: string }> = [
    { key: "rooms", th: "เมนูห้องพัก", en: "Rooms" },
    { key: "menu", th: "เมนูอาหาร", en: "Menu" },
    { key: "events", th: "เมนูอีเวนต์", en: "Events" },
    { key: "gallery", th: "เมนูแกลเลอรี", en: "Gallery" },
    { key: "reviews", th: "เมนูรีวิว", en: "Reviews" },
    { key: "contact", th: "เมนูติดต่อ", en: "Contact" },
    { key: "forum", th: "เมนูกระทู้", en: "Forum" },
    { key: "webboard", th: "เมนูกระทู้", en: "Forum" },
    { key: "booking", th: "เมนูจองห้อง", en: "Booking" },
  ];

  for (const item of mapByKeyword) {
    if (pagePath.includes(item.key) || currentUrl.includes(item.key)) {
      return label(item.th, item.en);
    }
  }

  const hashIndex = currentUrl.indexOf("#");
  if (hashIndex >= 0) {
    const hash = currentUrl.slice(hashIndex + 1);
    for (const item of mapByKeyword) {
      if (hash.includes(item.key)) return label(item.th, item.en);
    }
  }

  return label("หน้าอื่นๆ", "Other Pages");
};

export const ChatAnalyticsDashboard = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [webEvents, setWebEvents] = useState<WebAnalyticsEvent[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStats>({
    forumTopics: 0,
    forumReplies: 0,
    forumViews: 0,
    reviewsCount: 0,
    reviewLikes: 0,
    reviewReplies: 0,
    reviewAvgRating: 0,
    bookingAbuseEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<TopQuestionItem | null>(null);
  const [activeTab, setActiveTab] = useState("web");
  const gradientCardClass = "relative overflow-hidden border border-border/70 bg-gradient-to-br from-white via-white to-accent/30 shadow-md transition-all duration-300 hover:-translate-y-[1px] hover:shadow-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-primary/50 before:via-highlight/40 before:to-primary/50";
  const tabsListClass = "h-auto w-full grid grid-cols-2 md:grid-cols-5 gap-1.5 rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-muted/30 p-1.5 shadow-sm";
  const tabTriggerClass = "rounded-xl gap-1.5 border border-transparent text-foreground/80 hover:bg-white hover:text-foreground hover:border-slate-200 hover:shadow-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-highlight/15 data-[state=active]:text-foreground data-[state=active]:border-primary/30 data-[state=active]:shadow-md";

  const isThai = language === "th";

  const localizeAnalyticsLabel = useCallback((label: string) => {
    if (!isThai) return label;

    const normalized = label.trim().toLowerCase();
    if (normalized === "unknown") return "ไม่ทราบ";
    if (normalized === "direct") return "เข้าเว็บโดยตรง";
    if (normalized === "organic") return "ออร์แกนิก";
    if (normalized === "mobile") return "มือถือ";
    if (normalized === "desktop") return "คอมพิวเตอร์";
    if (normalized === "tablet") return "แท็บเล็ต";
    if (normalized === "other android") return "แอนดรอยด์อื่นๆ";
    return label;
  }, [isThai]);

  const fetchLogs = async () => {
    setLoading(true);
    const [chatRes, eventRes, forumTopicsCountRes, forumRepliesCountRes, forumViewsRes, reviewsRes, reviewLikesCountRes, reviewRepliesCountRes, bookingAbuseCountRes] = await Promise.all([
      supabase
        .from("chat_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000),
      (supabase as any)
        .from("web_analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3000),
      supabase.from("forum_topics").select("id", { count: "exact", head: true }),
      supabase.from("forum_replies").select("id", { count: "exact", head: true }),
      supabase.from("forum_topics").select("views"),
      supabase.from("reviews").select("id,rating").eq("is_active", true),
      supabase.from("review_likes").select("id", { count: "exact", head: true }),
      supabase.from("review_replies").select("id", { count: "exact", head: true }),
      supabase.from("booking_abuse_events").select("id", { count: "exact", head: true }),
    ]);

    setLogs((chatRes.data as unknown as ChatLog[]) || []);
    setWebEvents((eventRes.data as unknown as WebAnalyticsEvent[]) || []);
    const reviewRows = reviewsRes.data || [];
    const reviewAvgRating = reviewRows.length
      ? reviewRows.reduce((sum, row) => sum + (row.rating || 0), 0) / reviewRows.length
      : 0;

    setModuleStats({
      forumTopics: forumTopicsCountRes.count || 0,
      forumReplies: forumRepliesCountRes.count || 0,
      forumViews: (forumViewsRes.data || []).reduce((sum, row) => sum + (row.views || 0), 0),
      reviewsCount: reviewRows.length,
      reviewLikes: reviewLikesCountRes.count || 0,
      reviewReplies: reviewRepliesCountRes.count || 0,
      reviewAvgRating,
      bookingAbuseEvents: bookingAbuseCountRes.count || 0,
    });
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const analytics = useMemo(() => {
    if (!logs.length && !webEvents.length) return null;

    // Unique sessions
    const sessions = new Set(logs.map(l => l.session_id));
    const visitors = new Set(logs.map(l => l.visitor_fingerprint || l.session_id));
    const eventSessions = new Set(webEvents.map((e) => e.session_id));
    const eventVisitors = new Set(webEvents.map((e) => e.visitor_id));

    const visitorFrequency: Record<string, number> = {};
    logs.forEach((l) => {
      const key = l.visitor_fingerprint || l.session_id;
      visitorFrequency[key] = (visitorFrequency[key] || 0) + 1;
    });
    webEvents.forEach((event) => {
      const key = event.visitor_id;
      visitorFrequency[key] = (visitorFrequency[key] || 0) + 1;
    });
    const returningVisitorCount = Object.values(visitorFrequency).filter((count) => count > 1).length;
    const returningRate = visitors.size > 0 ? Math.round((returningVisitorCount / visitors.size) * 100) : 0;

    // Intent distribution
    const intentMap: Record<string, number> = {};
    logs.forEach(l => {
      const intent = l.intent || "general";
      intentMap[intent] = (intentMap[intent] || 0) + 1;
    });
    const intentData = Object.entries(intentMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name: INTENT_LABELS[name]?.[language === "th" ? "th" : "en"] || name,
        value,
        key: name,
      }));

    // Language distribution
    const langMap: Record<string, number> = {};
    logs.forEach(l => {
      const lang = l.language || "th";
      langMap[lang] = (langMap[lang] || 0) + 1;
    });
    webEvents.forEach((event) => {
      const lang = event.language || "th";
      langMap[lang] = (langMap[lang] || 0) + 1;
    });
    const langLabels: Record<string, string> = { th: "🇹🇭 ไทย", en: "🇬🇧 English", zh: "🇨🇳 中文", ja: "🇯🇵 日本語" };
    const langData = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: langLabels[name] || name, value }));

    // Daily message count (last 14 days)
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    logs.forEach(l => {
      const day = l.created_at.slice(0, 10);
      if (day in dailyMap) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    webEvents.forEach((event) => {
      const day = event.created_at.slice(0, 10);
      if (day in dailyMap) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" }),
      count,
    }));

    // Popular questions (group by normalized message)
    const questionMap: Record<string, TopQuestionItem> = {};
    logs.forEach(l => {
      const normalizedQuestion = l.user_message
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (!normalizedQuestion) return;

      if (!questionMap[normalizedQuestion]) {
        questionMap[normalizedQuestion] = {
          question: l.user_message.trim(),
          count: 0,
          entries: [],
        };
      }

      questionMap[normalizedQuestion].count += 1;

      if (questionMap[normalizedQuestion].entries.length < 50) {
        questionMap[normalizedQuestion].entries.push(l);
      }
    });
    const topQuestions = Object.values(questionMap).sort((a, b) => b.count - a.count);

    const topBy = (map: Record<string, number>, limit = 5) =>
      Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label, value }));

    const pageMap: Record<string, number> = {};
    const menuMap: Record<string, number> = {};
    const referrerMap: Record<string, number> = {};
    const countryMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};
    const mobileBrandMap: Record<string, number> = {};
    const campaignMap: Record<string, number> = {};
    const buttonMap: Record<string, number> = {};
    const pageViewMap: Record<string, number> = {};
    const pageDurationMap: Record<string, { total: number; count: number }> = {};

    logs.forEach((l) => {
      const page = (l.page_path || 'unknown').trim();
      const menuLabel = inferMenuLabel(l, language === "th" ? "th" : "en");
      const referrer = (l.referrer || 'direct').trim();
      const country = (l.country_code || 'unknown').trim();
      const device = (l.device_type || 'desktop').trim();
      const mobileBrand = device === 'mobile' ? getMobileBrandFromUserAgent(l.user_agent) : null;
      const campaign = [l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(' / ') || 'organic';

      pageMap[page] = (pageMap[page] || 0) + 1;
      menuMap[menuLabel] = (menuMap[menuLabel] || 0) + 1;
      referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;
      countryMap[country] = (countryMap[country] || 0) + 1;
      deviceMap[device] = (deviceMap[device] || 0) + 1;
      if (mobileBrand) mobileBrandMap[mobileBrand] = (mobileBrandMap[mobileBrand] || 0) + 1;
      campaignMap[campaign] = (campaignMap[campaign] || 0) + 1;
    });

    webEvents.forEach((event) => {
      const page = (event.page_path || "unknown").trim();
      const campaign = [event.utm_source, event.utm_medium, event.utm_campaign].filter(Boolean).join(" / ") || "organic";
      const device = (event.device_type || "desktop").trim();
      const mobileBrand = device === "mobile" ? (event.device_brand || "Other") : null;

      pageMap[page] = (pageMap[page] || 0) + 1;
      campaignMap[campaign] = (campaignMap[campaign] || 0) + 1;
      deviceMap[device] = (deviceMap[device] || 0) + 1;
      if (mobileBrand) mobileBrandMap[mobileBrand] = (mobileBrandMap[mobileBrand] || 0) + 1;

      if (event.event_name === "page_view") {
        pageViewMap[page] = (pageViewMap[page] || 0) + 1;
      }

      if (event.event_name === "page_leave" && typeof event.duration_seconds === "number") {
        if (!pageDurationMap[page]) pageDurationMap[page] = { total: 0, count: 0 };
        pageDurationMap[page].total += event.duration_seconds;
        pageDurationMap[page].count += 1;
      }

      const clickableEvent = ["button_click", "link_click", "booking_cta_click", "menu_click", "cta_click"].includes(event.event_name);
      if (clickableEvent) {
        const key = event.element_text || event.element_id || event.page_path || "(unknown element)";
        buttonMap[key] = (buttonMap[key] || 0) + 1;
      }
    });

    // Hourly distribution
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    logs.forEach(l => {
      const h = new Date(l.created_at).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
    webEvents.forEach((event) => {
      const h = new Date(event.created_at).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
    const hourlyData = Object.entries(hourMap).map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));

    // Avg messages per session
    const totalInteractionEvents = logs.length + webEvents.length;
    const totalSessions = sessions.size + eventSessions.size;
    const uniqueVisitors = visitors.size + eventVisitors.size;
    const avgPerSession = totalInteractionEvents / Math.max(totalSessions, 1);

    const avgTimeOnPage = (() => {
      const stats = Object.values(pageDurationMap);
      if (!stats.length) return 0;
      const total = stats.reduce((sum, item) => sum + item.total, 0);
      const count = stats.reduce((sum, item) => sum + item.count, 0);
      return Math.round(total / Math.max(count, 1));
    })();

    const topPageEngagement = Object.entries(pageDurationMap)
      .map(([label, value]) => ({ label, value: Math.round(value.total / Math.max(value.count, 1)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const webboardEvents = webEvents.filter((event) => {
      const page = `${event.page_path || ""} ${event.current_url || ""}`.toLowerCase();
      return page.includes("forum") || page.includes("webboard");
    });
    const reviewEvents = webEvents.filter((event) => {
      const page = `${event.page_path || ""} ${event.current_url || ""}`.toLowerCase();
      return page.includes("review");
    });
    const bookingEvents = webEvents.filter((event) => {
      const page = `${event.page_path || ""} ${event.current_url || ""}`.toLowerCase();
      return page.includes("booking") || event.event_name.includes("booking");
    });

    const eventTopBy = (events: WebAnalyticsEvent[], keyGetter: (event: WebAnalyticsEvent) => string | null, limit = 6) => {
      const map: Record<string, number> = {};
      events.forEach((event) => {
        const key = keyGetter(event) || "unknown";
        map[key] = (map[key] || 0) + 1;
      });
      return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([label, value]) => ({ label: localizeAnalyticsLabel(label), value }));
    };

    return {
      totalMessages: totalInteractionEvents,
      totalSessions,
      uniqueVisitors,
      returningRate,
      avgPerSession: avgPerSession.toFixed(1),
      avgTimeOnPage,
      intentData,
      langData,
      dailyData,
      topQuestions,
      hourlyData,
      topPages: topBy(pageMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topPagesByViews: topBy(pageViewMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topButtons: topBy(buttonMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topPageEngagement: topPageEngagement.map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topMenus: topBy(menuMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topReferrers: topBy(referrerMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topCountries: topBy(countryMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      deviceSplit: topBy(deviceMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topMobileBrands: topBy(mobileBrandMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      topCampaigns: topBy(campaignMap).map((item) => ({ ...item, label: localizeAnalyticsLabel(item.label) })),
      webOverview: {
        totalEvents: webEvents.length,
        pageViews: webEvents.filter((event) => event.event_name === "page_view").length,
      },
      aiOverview: {
        totalChats: logs.length,
        bookingIntentCount: logs.filter((log) => (log.intent || "").toLowerCase().includes("booking")).length,
      },
      webboardOverview: {
        eventCount: webboardEvents.length,
        topPages: eventTopBy(webboardEvents, (event) => event.page_path),
        topActions: eventTopBy(webboardEvents, (event) => event.element_text || event.event_name),
      },
      reviewsOverview: {
        eventCount: reviewEvents.length,
        topPages: eventTopBy(reviewEvents, (event) => event.page_path),
        topActions: eventTopBy(reviewEvents, (event) => event.element_text || event.event_name),
      },
      bookingOverview: {
        eventCount: bookingEvents.length,
        ctaClicks: bookingEvents.filter((event) => event.event_name === "booking_cta_click").length,
        topPages: eventTopBy(bookingEvents, (event) => event.page_path),
        topActions: eventTopBy(bookingEvents, (event) => event.element_text || event.event_name),
      },
    };
  }, [logs, webEvents, language, localizeAnalyticsLabel]);

  const dailyChartConfig: ChartConfig = { count: { label: language === "th" ? "ข้อความ" : "Messages", color: "hsl(217, 91%, 60%)" } };
  const hourlyChartConfig: ChartConfig = { count: { label: language === "th" ? "ข้อความ" : "Messages", color: "hsl(160, 84%, 39%)" } };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className={gradientCardClass}>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          {language === "th" ? "ยังไม่มีข้อมูล Chat Logs" : "No chat log data yet"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {language === "th" ? "AI Analytics Center" : "AI Analytics Center"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "th" ? "วิเคราะห์การใช้งานเว็บทั้งหมดด้วย AI แยกตามหมวดธุรกิจอย่างชัดเจน" : "AI-powered analytics across all website modules"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={tabsListClass}>
          <TabsTrigger value="web" className={tabTriggerClass}><TrendingUp className="h-4 w-4" />{language === "th" ? "การใช้งานเว็บ" : "Web Usage"}</TabsTrigger>
          <TabsTrigger value="ai" className={tabTriggerClass}><Bot className="h-4 w-4" />{language === "th" ? "Plernping AI" : "Plernping AI"}</TabsTrigger>
          <TabsTrigger value="webboard" className={tabTriggerClass}><MessageCircleQuestion className="h-4 w-4" />{language === "th" ? "เว็บบอร์ด" : "Webboard"}</TabsTrigger>
          <TabsTrigger value="reviews" className={tabTriggerClass}><Star className="h-4 w-4" />{language === "th" ? "รีวิว" : "Reviews"}</TabsTrigger>
          <TabsTrigger value="booking" className={tabTriggerClass}><CalendarCheck className="h-4 w-4" />{language === "th" ? "ระบบจอง" : "Booking"}</TabsTrigger>
        </TabsList>

        <TabsContent value="web" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              {
                title: language === "th" ? "ภาพรวมการใช้งาน" : "Overview",
                subtitle: language === "th" ? "สรุปปริมาณการใช้งานหลักของเว็บไซต์" : "Core website traffic volume",
                items: [
                  { icon: MessageSquare, label: language === "th" ? "เหตุการณ์ทั้งหมด" : "Total Events", value: analytics.totalMessages },
                  { icon: Users, label: language === "th" ? "เซสชัน" : "Sessions", value: analytics.totalSessions },
                ],
              },
              {
                title: language === "th" ? "กลุ่มผู้ใช้งาน" : "Audience",
                subtitle: language === "th" ? "ภาพรวมผู้เยี่ยมชมและการกลับมาใช้งาน" : "Visitor quality and retention",
                items: [
                  { icon: Users, label: language === "th" ? "ผู้ใช้ไม่ซ้ำ" : "Unique Visitors", value: analytics.uniqueVisitors },
                  { icon: MousePointerClick, label: language === "th" ? "ผู้ใช้ที่กลับมา" : "Returning Users", value: `${analytics.returningRate}%` },
                  { icon: Globe, label: language === "th" ? "ภาษาที่ใช้" : "Languages", value: analytics.langData.length },
                ],
              },
              {
                title: language === "th" ? "พฤติกรรมการใช้งาน" : "Engagement",
                subtitle: language === "th" ? "ประเมินความลึกและคุณภาพการใช้งาน" : "Depth and quality of interactions",
                items: [
                  { icon: Zap, label: language === "th" ? "เฉลี่ย/เซสชัน" : "Avg/Session", value: analytics.avgPerSession },
                  { icon: Clock, label: language === "th" ? "เวลาเฉลี่ย/หน้า" : "Avg Time/Page", value: `${analytics.avgTimeOnPage}s` },
                ],
              },
            ].map((group, groupIndex) => (
              <Card key={groupIndex} className={gradientCardClass}>
                <CardHeader className="pb-2 p-3 sm:p-4">
                  <CardTitle className="text-sm">{group.title}</CardTitle>
                  <p className="text-[11px] text-muted-foreground">{group.subtitle}</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((s, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border border-border/60 p-3 shadow-sm transition-all duration-200 hover:shadow-md ${i === 0 ? "sm:col-span-2 bg-gradient-to-r from-primary/10 to-highlight/10" : "bg-white"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <s.icon className="h-4 w-4 text-primary" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
                        </div>
                        <p className={`${i === 0 ? "text-2xl sm:text-3xl" : "text-lg sm:text-2xl"} font-bold text-foreground`}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className={gradientCardClass}>
              <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-primary" />{language === "th" ? "ปุ่มที่ถูกกดมากที่สุด" : "Most Clicked Buttons"}</CardTitle></CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.topButtons.length > 0 ? analytics.topButtons.slice(0, 8).map((item, idx) => <Badge key={idx} variant="secondary" className="text-[11px]">{item.label} ({item.value})</Badge>) : <Badge variant="outline" className="text-[11px]">{language === "th" ? "ยังไม่มีข้อมูลการคลิก" : "No click data yet"}</Badge>}</div></CardContent>
            </Card>
            <Card className={gradientCardClass}>
              <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{language === "th" ? "หน้าที่ถูกเข้าบ่อยที่สุด" : "Most Visited Pages"}</CardTitle></CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.topPagesByViews.length > 0 ? analytics.topPagesByViews.slice(0, 8).map((item, idx) => <Badge key={idx} variant="outline" className="text-[11px]">{item.label} ({item.value})</Badge>) : <Badge variant="outline" className="text-[11px]">{language === "th" ? "ยังไม่มีข้อมูลการเข้าหน้า" : "No page view data yet"}</Badge>}</div></CardContent>
            </Card>
            <Card className={gradientCardClass}>
              <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{language === "th" ? "หน้าที่อยู่เวลานานที่สุด" : "Longest Engagement Pages"}</CardTitle></CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.topPageEngagement.length > 0 ? analytics.topPageEngagement.slice(0, 8).map((item, idx) => <Badge key={idx} variant="secondary" className="text-[11px]">{item.label} ({item.value}s)</Badge>) : <Badge variant="outline" className="text-[11px]">{language === "th" ? "ยังไม่มีข้อมูลเวลาใช้งาน" : "No engagement time data yet"}</Badge>}</div></CardContent>
            </Card>
          </div>

          <Card className={gradientCardClass}>
            <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{language === "th" ? "แนวโน้มรายวัน (14 วัน)" : "Daily Trend (14 days)"}</CardTitle></CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0">
              <ChartContainer config={dailyChartConfig} className="h-[200px] w-full">
                <BarChart data={analytics.dailyData}><CartesianGrid strokeDasharray="3 3" className="stroke-border/50" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} /></BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "ข้อความแชท AI" : "AI Messages"}</p><p className="text-xl font-semibold">{analytics.aiOverview.totalChats}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "คำถามหมวดจอง" : "Booking Intent Questions"}</p><p className="text-xl font-semibold">{analytics.aiOverview.bookingIntentCount}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "ผู้ใช้ไม่ซ้ำ" : "Unique Visitors"}</p><p className="text-xl font-semibold">{analytics.uniqueVisitors}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "ภาษาที่ใช้" : "Languages"}</p><p className="text-xl font-semibold">{analytics.langData.length}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className={gradientCardClass}>
              <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4 text-primary" />{language === "th" ? "หมวดคำถาม" : "Question Categories"}</CardTitle></CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0"><div className="flex flex-wrap gap-2">{analytics.intentData.map((item, i) => <Badge key={i} variant="outline" className="text-xs gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{item.name} ({item.value})</Badge>)}</div></CardContent>
            </Card>
            <Card className={gradientCardClass}>
              <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{language === "th" ? "ช่วงเวลาที่ใช้งานมากที่สุด" : "Peak Usage Hours"}</CardTitle></CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0"><ChartContainer config={hourlyChartConfig} className="h-[180px] w-full"><BarChart data={analytics.hourlyData}><CartesianGrid strokeDasharray="3 3" className="stroke-border/50" /><XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} /></BarChart></ChartContainer></CardContent>
            </Card>
          </div>

          <Card className={gradientCardClass}>
            <CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{language === "th" ? "คำถามยอดนิยม (ทั้งหมด)" : "Popular Questions (All)"}</CardTitle></CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0">
              <ScrollArea className="max-h-[350px]"><div className="space-y-2">{analytics.topQuestions.map((q, i) => <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"><Badge variant={i < 3 ? "default" : "secondary"} className="text-xs shrink-0 mt-0.5">#{i + 1}</Badge><p className="text-sm text-foreground flex-1 break-words">{q.question}</p><Button variant="outline" size="sm" className="h-7 text-xs px-2 shrink-0" onClick={() => setSelectedQuestion(q)}>{language === "th" ? "ดูรายละเอียด" : "View details"}</Button><Badge variant="outline" className="text-xs shrink-0">{q.count} {language === "th" ? "ครั้ง" : "times"}</Badge></div>)}</div></ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webboard" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "จำนวนกระทู้" : "Topics"}</p><p className="text-xl font-semibold">{moduleStats.forumTopics}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "จำนวนความคิดเห็น" : "Replies"}</p><p className="text-xl font-semibold">{moduleStats.forumReplies}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "ยอดวิวรวม" : "Total Views"}</p><p className="text-xl font-semibold">{moduleStats.forumViews}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "เหตุการณ์การใช้งาน" : "Usage Events"}</p><p className="text-xl font-semibold">{analytics.webboardOverview.eventCount}</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "หน้าเว็บบอร์ดยอดนิยม" : "Top Webboard Pages"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.webboardOverview.topPages.map((item, idx) => <Badge key={idx} variant="outline" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "การกระทำที่เกิดบ่อย" : "Top Actions"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.webboardOverview.topActions.map((item, idx) => <Badge key={idx} variant="secondary" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "รีวิวทั้งหมด" : "Total Reviews"}</p><p className="text-xl font-semibold">{moduleStats.reviewsCount}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "คะแนนเฉลี่ย" : "Avg Rating"}</p><p className="text-xl font-semibold">{moduleStats.reviewAvgRating.toFixed(1)}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "จำนวนไลก์" : "Likes"}</p><p className="text-xl font-semibold">{moduleStats.reviewLikes}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "การตอบกลับ" : "Replies"}</p><p className="text-xl font-semibold">{moduleStats.reviewReplies}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "เหตุการณ์การใช้งาน" : "Usage Events"}</p><p className="text-xl font-semibold">{analytics.reviewsOverview.eventCount}</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "หน้ารีวิวยอดนิยม" : "Top Review Pages"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.reviewsOverview.topPages.map((item, idx) => <Badge key={idx} variant="outline" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "การกระทำที่เกิดบ่อย" : "Top Actions"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.reviewsOverview.topActions.map((item, idx) => <Badge key={idx} variant="secondary" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "คลิกปุ่มจอง" : "Booking CTA Clicks"}</p><p className="text-xl font-semibold">{analytics.bookingOverview.ctaClicks}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "เหตุการณ์จองทั้งหมด" : "Booking Events"}</p><p className="text-xl font-semibold">{analytics.bookingOverview.eventCount}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "คำถามจองใน AI" : "AI Booking Questions"}</p><p className="text-xl font-semibold">{analytics.aiOverview.bookingIntentCount}</p></CardContent></Card>
            <Card className={gradientCardClass}><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">{language === "th" ? "Abuse Events" : "Abuse Events"}</p><p className="text-xl font-semibold">{moduleStats.bookingAbuseEvents}</p></CardContent></Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "หน้าจองที่ใช้งานบ่อย" : "Top Booking Pages"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.bookingOverview.topPages.map((item, idx) => <Badge key={idx} variant="outline" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
            <Card className={gradientCardClass}><CardHeader className="pb-2 p-3 sm:p-4"><CardTitle className="text-sm">{language === "th" ? "การกระทำที่เกิดบ่อย" : "Top Actions"}</CardTitle></CardHeader><CardContent className="p-3 sm:p-4 pt-0"><div className="flex flex-wrap gap-1.5">{analytics.bookingOverview.topActions.map((item, idx) => <Badge key={idx} variant="secondary" className="text-[11px]">{item.label} ({item.value})</Badge>)}</div></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-4 py-3 border-b border-border">
            <DialogTitle className="text-sm sm:text-base">
              {language === "th" ? "รายละเอียดการคุยของคำถาม" : "Conversation details for question"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground break-words">
              {selectedQuestion?.question}
            </p>
          </DialogHeader>

          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {selectedQuestion?.count ?? 0} {language === "th" ? "ครั้ง" : "times"}
            </Badge>
            <p className="text-[11px] text-muted-foreground">
              {language === "th" ? "แสดงสูงสุด 50 รายการล่าสุด" : "Showing up to 50 latest entries"}
            </p>
          </div>

          <ScrollArea className="h-[60vh] px-4 py-3">
            <div className="space-y-3">
              {(selectedQuestion?.entries || []).map((entry, index) => (
                <div key={entry.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">
                      {language === "th" ? `บทสนทนา #${index + 1} • เซสชัน ${entry.session_id}` : `Conversation #${index + 1} • session ${entry.session_id}`}
                    </span>
                    <span className="shrink-0">
                      {new Date(entry.created_at).toLocaleString(language === "th" ? "th-TH" : "en-US")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.country_code && <Badge variant="outline" className="text-[10px]">{entry.country_code}</Badge>}
                    {entry.device_type && <Badge variant="outline" className="text-[10px]">{entry.device_type}</Badge>}
                    {entry.page_path && <Badge variant="outline" className="text-[10px]">{entry.page_path}</Badge>}
                    {entry.utm_source && <Badge variant="secondary" className="text-[10px]">utm:{entry.utm_source}</Badge>}
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">{language === "th" ? "ผู้ใช้" : "User"}</p>
                    <div className="text-sm bg-muted/40 rounded-md p-2 max-h-36 overflow-y-auto whitespace-pre-wrap break-words">
                      {entry.user_message}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">AI</p>
                    <div className="text-sm bg-muted/40 rounded-md p-2 max-h-44 overflow-y-auto whitespace-pre-wrap break-words">
                      {entry.ai_reply}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
