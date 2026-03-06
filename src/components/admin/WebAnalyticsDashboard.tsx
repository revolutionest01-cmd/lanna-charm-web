import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  PieChart, Pie, LineChart, Line, AreaChart, Area,
  ResponsiveContainer,
} from "recharts";
import {
  Globe, Users, Eye, Monitor, Smartphone, Tablet,
  TrendingUp, Clock, MousePointerClick, ArrowDown,
  Loader2, RefreshCw, Calendar, Tag, Megaphone, Link2, FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(271, 91%, 65%)",
  "hsl(346, 77%, 60%)", "hsl(160, 84%, 39%)", "hsl(24, 95%, 53%)",
  "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)",
];

type AnalyticsEvent = {
  id: string;
  visitor_id: string;
  session_id: string;
  event_name: string;
  event_category: string | null;
  page_path: string | null;
  device_type: string | null;
  device_brand: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  duration_seconds: number | null;
  scroll_depth: number | null;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

type DateRange = "today" | "7d" | "30d" | "90d";

const getDateFrom = (range: DateRange): string => {
  const now = new Date();
  switch (range) {
    case "today": return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case "7d": return new Date(now.getTime() - 7 * 86400000).toISOString();
    case "30d": return new Date(now.getTime() - 30 * 86400000).toISOString();
    case "90d": return new Date(now.getTime() - 90 * 86400000).toISOString();
  }
};

export const WebAnalyticsDashboard = () => {
  const { language } = useLanguage();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("7d");

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = getDateFrom(range);
      const { data, error } = await (supabase as any)
        .from("web_analytics_events")
        .select("id, visitor_id, session_id, event_name, event_category, page_path, device_type, device_brand, browser, os, referrer, duration_seconds, scroll_depth, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term")
        .gte("created_at", from)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [range]);

  const th = (t: string, e: string) => language === "th" ? t : e;

  const stats = useMemo(() => {
    const pageViews = events.filter(e => e.event_name === "page_view");
    const uniqueVisitors = new Set(events.map(e => e.visitor_id)).size;
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const clicks = events.filter(e => ["button_click", "link_click", "booking_cta_click"].includes(e.event_name));
    const leaveEvents = events.filter(e => e.event_name === "page_leave" && e.duration_seconds);
    const avgDuration = leaveEvents.length > 0
      ? Math.round(leaveEvents.reduce((a, e) => a + (e.duration_seconds || 0), 0) / leaveEvents.length)
      : 0;

    return { pageViews: pageViews.length, uniqueVisitors, uniqueSessions, clicks: clicks.length, avgDuration };
  }, [events]);

  // Page views by day
  const dailyViews = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view");
    const map = new Map<string, number>();
    pvs.forEach(e => {
      const day = new Date(e.created_at).toLocaleDateString("en-CA");
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({ date: date.slice(5), views }));
  }, [events]);

  // Top pages
  const topPages = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view");
    const map = new Map<string, number>();
    pvs.forEach(e => { const p = e.page_path || "/"; map.set(p, (map.get(p) || 0) + 1); });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([page, views]) => ({ page, views }));
  }, [events]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view");
    const map = new Map<string, number>();
    pvs.forEach(e => { const d = e.device_type || "unknown"; map.set(d, (map.get(d) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [events]);

  // Browser breakdown
  const browserData = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view");
    const map = new Map<string, number>();
    pvs.forEach(e => { const b = e.browser || "Other"; map.set(b, (map.get(b) || 0) + 1); });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  // OS breakdown
  const osData = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view");
    const map = new Map<string, number>();
    pvs.forEach(e => { const o = e.os || "Other"; map.set(o, (map.get(o) || 0) + 1); });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [events]);

  // Referrer sources
  const referrerData = useMemo(() => {
    const pvs = events.filter(e => e.event_name === "page_view" && e.referrer);
    const map = new Map<string, number>();
    pvs.forEach(e => {
      try {
        const host = new URL(e.referrer!).hostname.replace("www.", "") || "Direct";
        map.set(host, (map.get(host) || 0) + 1);
      } catch { map.set("Direct", (map.get("Direct") || 0) + 1); }
    });
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([source, views]) => ({ source, views }));
  }, [events]);

  // UTM Campaign data
  const utmEvents = useMemo(() => events.filter(e => e.event_name === "page_view" && (e.utm_source || e.utm_campaign)), [events]);

  const utmSourceData = useMemo(() => {
    const map = new Map<string, { visitors: Set<string>; sessions: Set<string>; views: number }>();
    utmEvents.forEach(e => {
      const src = e.utm_source || "(direct)";
      if (!map.has(src)) map.set(src, { visitors: new Set(), sessions: new Set(), views: 0 });
      const entry = map.get(src)!;
      entry.visitors.add(e.visitor_id);
      entry.sessions.add(e.session_id);
      entry.views++;
    });
    return Array.from(map.entries())
      .map(([source, d]) => ({ source, visitors: d.visitors.size, sessions: d.sessions.size, views: d.views }))
      .sort((a, b) => b.views - a.views);
  }, [utmEvents]);

  const utmMediumData = useMemo(() => {
    const map = new Map<string, number>();
    utmEvents.forEach(e => { const m = e.utm_medium || "(none)"; map.set(m, (map.get(m) || 0) + 1); });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [utmEvents]);

  const utmCampaignData = useMemo(() => {
    const map = new Map<string, { visitors: Set<string>; sessions: Set<string>; views: number; source: string; medium: string }>();
    utmEvents.forEach(e => {
      const campaign = e.utm_campaign || "(none)";
      if (!map.has(campaign)) map.set(campaign, { visitors: new Set(), sessions: new Set(), views: 0, source: e.utm_source || "", medium: e.utm_medium || "" });
      const entry = map.get(campaign)!;
      entry.visitors.add(e.visitor_id);
      entry.sessions.add(e.session_id);
      entry.views++;
    });
    return Array.from(map.entries())
      .map(([campaign, d]) => ({ campaign, visitors: d.visitors.size, sessions: d.sessions.size, views: d.views, source: d.source, medium: d.medium }))
      .sort((a, b) => b.views - a.views);
  }, [utmEvents]);

  const utmCampaignChartData = useMemo(() => utmCampaignData.slice(0, 8).map(c => ({ name: c.campaign.length > 20 ? c.campaign.slice(0, 20) + "…" : c.campaign, views: c.views })), [utmCampaignData]);

  const utmDailyData = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    utmEvents.forEach(e => {
      const day = new Date(e.created_at).toLocaleDateString("en-CA");
      const src = e.utm_source || "(direct)";
      if (!map.has(day)) map.set(day, new Map());
      const dayMap = map.get(day)!;
      dayMap.set(src, (dayMap.get(src) || 0) + 1);
    });
    const allSources = [...new Set(utmEvents.map(e => e.utm_source || "(direct)"))].slice(0, 5);
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sources]) => {
        const row: Record<string, string | number> = { date: date.slice(5) };
        allSources.forEach(s => { row[s] = sources.get(s) || 0; });
        return row;
      });
  }, [utmEvents]);

  const utmTopSources = useMemo(() => [...new Set(utmEvents.map(e => e.utm_source || "(direct)"))].slice(0, 5), [utmEvents]);

  const chartConfig: ChartConfig = { value: { label: th("จำนวน", "Count") }, views: { label: th("การเข้าชม", "Views") } };

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === "mobile") return <Smartphone className="w-4 h-4" />;
    if (type === "tablet") return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: th("การเข้าชมหน้า", "Page Views"), value: stats.pageViews, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: th("ผู้เข้าชมที่ไม่ซ้ำ", "Unique Visitors"), value: stats.uniqueVisitors, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: th("เซสชัน", "Sessions"), value: stats.uniqueSessions, icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: th("คลิก", "Clicks"), value: stats.clicks, icon: MousePointerClick, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: th("เวลาเฉลี่ย (วินาที)", "Avg. Duration (s)"), value: stats.avgDuration, icon: Clock, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            {th("วิเคราะห์ผู้เข้าชมเว็บ", "Web Analytics")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {th("ข้อมูลการเข้าถึงเว็บไซต์แบบเรียลไทม์", "Real-time website traffic analytics")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{th("วันนี้", "Today")}</SelectItem>
              <SelectItem value="7d">{th("7 วัน", "7 Days")}</SelectItem>
              <SelectItem value="30d">{th("30 วัน", "30 Days")}</SelectItem>
              <SelectItem value="90d">{th("90 วัน", "90 Days")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Views Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {th("การเข้าชมรายวัน", "Daily Page Views")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <AreaChart data={dailyViews} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="views" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.15} strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 2-col: Top Pages + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {th("หน้าที่เข้าชมมากสุด", "Top Pages")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPages.length === 0 && <p className="text-sm text-muted-foreground">{th("ยังไม่มีข้อมูล", "No data yet")}</p>}
              {topPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground font-mono truncate max-w-[200px]">{p.page}</span>
                  <Badge variant="secondary" className="text-xs">{p.views.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              {th("อุปกรณ์", "Devices")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {deviceData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <DeviceIcon type={d.name} />
                  <span className="capitalize">{d.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{d.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2-col: Browser + OS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{th("เบราว์เซอร์", "Browsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={browserData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {browserData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{th("ระบบปฏิบัติการ", "Operating Systems")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={osData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                  {osData.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Referrers */}
      {referrerData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-primary" />
              {th("แหล่งที่มา (Referrer)", "Traffic Sources (Referrer)")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrerData.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground truncate max-w-[250px]">{r.source}</span>
                  <Badge variant="secondary" className="text-xs">{r.views.toLocaleString()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total events info */}
      <p className="text-xs text-muted-foreground text-center">
        {th(`ข้อมูลทั้งหมด ${events.length.toLocaleString()} events`, `Total ${events.length.toLocaleString()} events`)}
      </p>
    </div>
  );
};
