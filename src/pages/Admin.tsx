import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Image,
  Calendar,
  Home,
  Coffee,
  ImageIcon,
  MessageSquare,
  Loader2,
  Shield,
  Phone,
  UserCog,
  TrendingUp,
  BarChart3,
  Activity,
  Bot,
  Headphones,
  PieChart as PieChartIcon,
  Zap,
  Sparkles,
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { HeroManagement } from "@/components/admin/HeroManagement";
import { FeaturesManagement } from "@/components/admin/FeaturesManagement";
import { EventSpaceManagement } from "@/components/admin/EventSpaceManagement";
import { RoomsManagement } from "@/components/admin/RoomsManagement";
import { MenusManagement } from "@/components/admin/MenusManagement";
import { GalleryManagement } from "@/components/admin/GalleryManagement";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";
import { WebboardManagement } from "@/components/admin/WebboardManagement";
import BusinessInfoManagement from "@/components/admin/BusinessInfoManagement";
import { UserRolesManagement } from "@/components/admin/UserRolesManagement";
import { ChatLogsManagement } from "@/components/admin/ChatLogsManagement";
import { LiveChatManagement } from "@/components/admin/LiveChatManagement";
import { ChatAnalyticsDashboard } from "@/components/admin/ChatAnalyticsDashboard";
import { DevGodMode } from "@/components/admin/DevGodMode";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const BASE_TABS = [
  { id: "dashboard", icon: BarChart3, labelTh: "แดชบอร์ด", labelEn: "Dashboard", minRole: "staff" },
  { id: "hero", icon: Image, labelTh: "Hero", labelEn: "Hero", minRole: "admin" },
  { id: "features", icon: Sparkles, labelTh: "Features", labelEn: "Features", minRole: "admin" },
  { id: "events", icon: Calendar, labelTh: "อีเว้นท์", labelEn: "Events", minRole: "admin" },
  { id: "rooms", icon: Home, labelTh: "ห้องพัก", labelEn: "Rooms", minRole: "admin" },
  { id: "menus", icon: Coffee, labelTh: "เมนู", labelEn: "Menus", minRole: "staff" },
  { id: "gallery", icon: ImageIcon, labelTh: "แกลเลอรี่", labelEn: "Gallery", minRole: "staff" },
  { id: "reviews", icon: MessageSquare, labelTh: "รีวิว", labelEn: "Reviews", minRole: "staff" },
  { id: "webboard", icon: MessageSquare, labelTh: "กระทู้", labelEn: "Webboard", minRole: "staff" },
  { id: "business", icon: Phone, labelTh: "ข้อมูลธุรกิจ", labelEn: "Business", minRole: "staff" },
  { id: "livechat", icon: Headphones, labelTh: "Live Chat", labelEn: "Live Chat", minRole: "staff" },
  { id: "chatlog", icon: Bot, labelTh: "แชท AI", labelEn: "AI Chat", minRole: "admin" },
  { id: "chatanalytics", icon: PieChartIcon, labelTh: "AI Analytics", labelEn: "AI Analytics", minRole: "admin" },
  { id: "roles", icon: UserCog, labelTh: "บทบาท", labelEn: "Roles", minRole: "admin" },
  { id: "devmode", icon: Zap, labelTh: "Dev God Mode", labelEn: "Dev God Mode", minRole: "developer" },
];

const PIE_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(38, 92%, 50%)",
  "hsl(271, 91%, 65%)",
  "hsl(346, 77%, 60%)",
];

const Admin = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isAdmin, isDeveloper, isStaff, userRole, isChecking } = useAdminStatus();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    rooms: 0,
    menus: 0,
    gallery: 0,
    reviews: 0,
  });

  // Filter tabs based on user role
  const TABS = useMemo(() => {
    return BASE_TABS.filter((tab) => {
      if (tab.minRole === "developer") return isDeveloper;
      if (tab.minRole === "admin") return isAdmin;
      if (tab.minRole === "staff") return isStaff;
      return true;
    });
  }, [isDeveloper, isAdmin, isStaff]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isStaff) return;
      try {
        const [roomsRes, menusRes, galleryRes, reviewsRes] = await Promise.all([
          supabase.from("rooms").select("id", { count: "exact", head: true }),
          supabase.from("menus").select("id", { count: "exact", head: true }),
          supabase.from("gallery_images").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
        ]);
        setStats({
          rooms: roomsRes.count || 0,
          menus: menusRes.count || 0,
          gallery: galleryRes.count || 0,
          reviews: reviewsRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isStaff]);

  useEffect(() => {
    if (!isChecking && !isLoading) {
      if (!isAuthenticated) {
        sweetAlert.error(language === "th" ? "กรุณาเข้าสู่ระบบก่อน" : "Please login first");
        navigate("/auth");
      } else if (!isStaff) {
        sweetAlert.error(language === "th" ? "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" : "You do not have permission");
        navigate("/");
      }
    }
  }, [isAuthenticated, isStaff, isChecking, isLoading, navigate, language]);

  useEffect(() => {
    return () => {
      invalidateContentCache();
    };
  }, []);

  const barChartData = useMemo(() => [
    { name: language === "th" ? "ห้องพัก" : "Rooms", value: stats.rooms, fill: PIE_COLORS[0] },
    { name: language === "th" ? "เมนู" : "Menus", value: stats.menus, fill: PIE_COLORS[1] },
    { name: language === "th" ? "แกลเลอรี่" : "Gallery", value: stats.gallery, fill: PIE_COLORS[2] },
    { name: language === "th" ? "รีวิว" : "Reviews", value: stats.reviews, fill: PIE_COLORS[3] },
  ], [stats, language]);

  const totalItems = stats.rooms + stats.menus + stats.gallery + stats.reviews;

  const chartConfig: ChartConfig = {
    value: { label: language === "th" ? "จำนวน" : "Count" },
  };

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <Shield className="absolute inset-0 m-auto w-8 h-8 text-primary/50" />
          </div>
          <p className="text-muted-foreground font-medium">
            {language === "th" ? "กำลังตรวจสอบสิทธิ์..." : "Verifying access..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) return null;

  const roleLabel = isDeveloper ? "Developer" : isAdmin ? "Admin" : "Staff";

  const statsDisplay = [
    { label: language === "th" ? "ห้องพัก" : "Rooms", value: stats.rooms, icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: language === "th" ? "เมนู" : "Menus", value: stats.menus, icon: Coffee, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: language === "th" ? "แกลเลอรี่" : "Gallery", value: stats.gallery, icon: ImageIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: language === "th" ? "รีวิว" : "Reviews", value: stats.reviews, icon: MessageSquare, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardContent
            stats={statsDisplay}
            barChartData={barChartData}
            totalItems={totalItems}
            chartConfig={chartConfig}
            language={language}
          />
        );
      case "hero": return <HeroManagement />;
      case "features": return <FeaturesManagement />;
      case "events": return <EventSpaceManagement />;
      case "rooms": return <RoomsManagement />;
      case "menus": return <MenusManagement />;
      case "gallery": return <GalleryManagement />;
      case "reviews": return <ReviewsManagement />;
      case "webboard": return <WebboardManagement />;
      case "business": return <BusinessInfoManagement />;
      case "livechat": return <LiveChatManagement />;
      case "chatlog": return <ChatLogsManagement />;
      case "chatanalytics": return <ChatAnalyticsDashboard />;
      case "roles": return <UserRolesManagement />;
      case "devmode": return isDeveloper ? <DevGodMode /> : null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-[56px] sm:top-[60px] lg:top-[60px] z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate("/")} 
                className="shrink-0 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
              >
                <ArrowLeft className="h-4 w-4 text-primary font-bold" />
              </Button>
              {user?.avatar ? (
                <img src={user.avatar} alt="Admin" className="h-8 w-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <img src={logo} alt="Logo" className="h-8 hidden sm:block" />
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2 truncate">
                  {isDeveloper ? <Zap className="w-4 h-4 text-yellow-500 shrink-0" /> : <Shield className="w-4 h-4 text-primary shrink-0" />}
                  {language === "th" ? "แผงควบคุม" : "Admin Panel"}
                  <Badge variant={isDeveloper ? "outline" : "secondary"} className="text-[10px] ml-1">
                    {roleLabel}
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {language === "th" ? "สวัสดี" : "Hi"}, {user?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <nav className="lg:w-56 lg:min-h-[calc(100vh-180px)] lg:border-r border-b lg:border-b-0 border-border bg-card/50 shrink-0 sticky top-[140px] sm:top-[148px] lg:top-[148px] z-30 lg:pt-[70px]">
          {/* Mobile */}
          <div className="lg:hidden">
            <div
              className="flex p-2 gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const label = language === "th" ? tab.labelTh : tab.labelEn;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 snap-start
                      ${isActive
                        ? tab.id === "devmode" ? "bg-yellow-500/20 text-yellow-500 shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
            <style>{`.lg\\:hidden > div::-webkit-scrollbar { display: none; }`}</style>
          </div>
          {/* Desktop */}
          <ScrollArea className="hidden lg:block h-[calc(100vh-180px)]">
            <div className="flex flex-col p-2 gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const label = language === "th" ? tab.labelTh : tab.labelEn;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${isActive
                        ? tab.id === "devmode" ? "bg-yellow-500/20 text-yellow-500 shadow-sm" : "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:text-primary hover:bg-accent"
                      }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 pt-24 sm:p-6 sm:pt-28 lg:p-8 lg:pt-20">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

/* ─── Dashboard Section ─── */
interface DashboardContentProps {
  stats: Array<{ label: string; value: number; icon: any; color: string; bg: string }>;
  barChartData: Array<{ name: string; value: number; fill: string }>;
  totalItems: number;
  chartConfig: ChartConfig;
  language: string;
}

const DashboardContent = ({
  stats,
  barChartData,
  totalItems,
  chartConfig,
  language,
}: DashboardContentProps) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" />
        {language === "th" ? "ภาพรวมระบบ" : "System Overview"}
      </h2>
      <p className="text-muted-foreground text-sm mt-1">
        {language === "th" ? "สรุปข้อมูลเนื้อหาทั้งหมดของเว็บไซต์" : "Summary of all website content"}
      </p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/50" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            {language === "th" ? "จำนวนเนื้อหาตามหมวดหมู่" : "Content by Category"}
          </CardTitle>
          <CardDescription className="text-xs">
            {language === "th" ? `ทั้งหมด ${totalItems} รายการ` : `${totalItems} total items`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] sm:h-[260px] w-full">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                {barChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {language === "th" ? "สัดส่วนเนื้อหา" : "Content Distribution"}
          </CardTitle>
          <CardDescription className="text-xs">
            {language === "th" ? "แสดงสัดส่วนเนื้อหาแต่ละประเภท" : "Proportion of each content type"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] sm:h-[260px] w-full">
            <PieChart>
              <Pie
                data={barChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {barChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {barChartData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                <span>{item.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{item.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default Admin;
