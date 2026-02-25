import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import {
  TrendingUp, MessageSquare, Globe, Clock, RefreshCw,
  Loader2, Hash, Users, Zap, Calendar,
} from "lucide-react";

interface ChatLog {
  id: string;
  session_id: string;
  user_message: string;
  ai_reply: string;
  intent: string | null;
  language: string | null;
  created_at: string;
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

export const ChatAnalyticsDashboard = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("chat_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setLogs((data as ChatLog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const analytics = useMemo(() => {
    if (!logs.length) return null;

    // Unique sessions
    const sessions = new Set(logs.map(l => l.session_id));

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
    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(language === "th" ? "th-TH" : "en-US", { day: "numeric", month: "short" }),
      count,
    }));

    // Top questions (by frequency of similar messages)
    const questionMap: Record<string, number> = {};
    logs.forEach(l => {
      const q = l.user_message.trim().toLowerCase().slice(0, 80);
      questionMap[q] = (questionMap[q] || 0) + 1;
    });
    const topQuestions = Object.entries(questionMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    // Hourly distribution
    const hourMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourMap[h] = 0;
    logs.forEach(l => {
      const h = new Date(l.created_at).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });
    const hourlyData = Object.entries(hourMap).map(([hour, count]) => ({
      hour: `${String(hour).padStart(2, "0")}:00`,
      count,
    }));

    // Avg messages per session
    const avgPerSession = logs.length / Math.max(sessions.size, 1);

    return {
      totalMessages: logs.length,
      totalSessions: sessions.size,
      avgPerSession: avgPerSession.toFixed(1),
      intentData,
      langData,
      dailyData,
      topQuestions,
      hourlyData,
    };
  }, [logs, language]);

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
      <Card>
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
            {language === "th" ? "AI Chat Analytics" : "AI Chat Analytics"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "th" ? "วิเคราะห์คำถามยอดนิยมและพฤติกรรมผู้ใช้" : "Analyze popular questions and user behavior"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: MessageSquare, label: language === "th" ? "ข้อความทั้งหมด" : "Total Messages", value: analytics.totalMessages },
          { icon: Users, label: language === "th" ? "บทสนทนา" : "Conversations", value: analytics.totalSessions },
          { icon: Zap, label: language === "th" ? "เฉลี่ย/บทสนทนา" : "Avg/Conversation", value: analytics.avgPerSession },
          { icon: Globe, label: language === "th" ? "ภาษาที่ใช้" : "Languages", value: analytics.langData.length },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            {language === "th" ? "ข้อความรายวัน (14 วัน)" : "Daily Messages (14 days)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <ChartContainer config={dailyChartConfig} className="h-[200px] w-full">
            <BarChart data={analytics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intent Pie Chart */}
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              {language === "th" ? "หมวดคำถาม" : "Question Categories"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ChartContainer config={{}} className="h-[180px] w-[180px]">
                <PieChart>
                  <Pie data={analytics.intentData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" nameKey="name">
                    {analytics.intentData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-2">
                {analytics.intentData.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {item.name} ({item.value})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Pie Chart */}
        <Card>
          <CardHeader className="pb-2 p-3 sm:p-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              {language === "th" ? "ภาษาที่ใช้" : "Languages Used"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ChartContainer config={{}} className="h-[180px] w-[180px]">
                <PieChart>
                  <Pie data={analytics.langData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" nameKey="name">
                    {analytics.langData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap gap-2">
                {analytics.langData.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {item.name} ({item.value})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {language === "th" ? "ช่วงเวลาที่ใช้งานมากที่สุด" : "Peak Usage Hours"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <ChartContainer config={hourlyChartConfig} className="h-[180px] w-full">
            <BarChart data={analytics.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Questions */}
      <Card>
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {language === "th" ? "คำถามยอดนิยม Top 10" : "Top 10 Popular Questions"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 pt-0">
          <ScrollArea className="max-h-[350px]">
            <div className="space-y-2">
              {analytics.topQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <Badge variant={i < 3 ? "default" : "secondary"} className="text-xs shrink-0 mt-0.5">
                    #{i + 1}
                  </Badge>
                  <p className="text-sm text-foreground flex-1 break-words">{q.question}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {q.count} {language === "th" ? "ครั้ง" : "times"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
