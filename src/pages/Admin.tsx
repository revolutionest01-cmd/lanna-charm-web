import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { invalidateContentCache } from "@/hooks/useContentData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LogOut
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";
import logo from "@/assets/logo.png";
import { HeroManagement } from "@/components/admin/HeroManagement";
import { EventSpaceManagement } from "@/components/admin/EventSpaceManagement";
import { RoomsManagement } from "@/components/admin/RoomsManagement";
import { MenusManagement } from "@/components/admin/MenusManagement";
import { GalleryManagement } from "@/components/admin/GalleryManagement";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";
import BusinessInfoManagement from "@/components/admin/BusinessInfoManagement";
import { UserRolesManagement } from "@/components/admin/UserRolesManagement";

const Admin = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState({
    rooms: 0,
    menus: 0,
    gallery: 0,
    reviews: 0,
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!isLoading) {
      checkAdminStatus();
    }
  }, [isAuthenticated, user, isLoading]);

  // Fetch stats (run after page is visible to reduce initial load)
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchStats = async () => {
        if (!isAdmin) return;

        try {
          const [roomsRes, menusRes, galleryRes, reviewsRes] = await Promise.all([
            supabase.from('rooms').select('id', { count: 'exact', head: true }),
            supabase.from('menus').select('id', { count: 'exact', head: true }),
            supabase.from('gallery_images').select('id', { count: 'exact', head: true }),
            supabase.from('reviews').select('id', { count: 'exact', head: true }),
          ]);

          setStats({
            rooms: roomsRes.count || 0,
            menus: menusRes.count || 0,
            gallery: galleryRes.count || 0,
            reviews: reviewsRes.count || 0,
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      };

      fetchStats();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAdmin]);

  // Redirect if not admin
  useEffect(() => {
    if (!checkingAdmin && !isLoading) {
      if (!isAuthenticated) {
        sweetAlert.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : 'Please login first');
        navigate('/auth');
      } else if (!isAdmin) {
        sweetAlert.error(language === 'th' ? 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้' : 'You do not have permission to access this page');
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, checkingAdmin, isLoading, navigate, language]);

  // Cleanup and invalidate cache when leaving Admin page
  useEffect(() => {
    return () => {
      // When unmounting Admin component, refresh content cache for home page
      invalidateContentCache();
      console.log('[Admin] Cleaning up - invalidated content cache');
    };
  }, []);

  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 animate-spin text-amber-500" />
            <Shield className="absolute inset-0 m-auto w-8 h-8 text-amber-600 opacity-50" />
          </div>
          <p className="text-slate-300 font-medium">
            {language === 'th' ? 'กำลังตรวจสอบสิทธิ์...' : 'Verifying access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const statsDisplay = [
    { label: language === 'th' ? 'ห้องพัก' : 'Rooms', value: stats.rooms, icon: Home, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { label: language === 'th' ? 'เมนู' : 'Menus', value: stats.menus, icon: Coffee, color: 'text-amber-500', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    { label: language === 'th' ? 'แกลเลอรี่' : 'Gallery', value: stats.gallery, icon: ImageIcon, color: 'text-purple-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    { label: language === 'th' ? 'รีวิว' : 'Reviews', value: stats.reviews, icon: MessageSquare, color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {language === 'th' ? 'กลับหน้าแรก' : 'Back to Home'}
              </Button>
              <div className="flex items-center gap-3">
                <img src={logo} alt="Plern Ping Cafe" className="h-10" />
                <div>
                  <h1 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {language === 'th' ? 'แผงควบคุมผู้ดูแล' : 'Admin Panel'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {language === 'th' ? 'ยินดีต้อนรับ' : 'Welcome'}, {user?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
            {language === 'th' ? 'ภาพรวมระบบ' : 'System Overview'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'th' 
              ? 'จัดการเนื้อหาและข้อมูลของเว็บไซต์' 
              : 'Manage website content and data'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {language === 'th' ? 'จัดการเนื้อหา' : 'Content Management'}
            </CardTitle>
            <CardDescription>
              {language === 'th' 
                ? 'เลือกส่วนที่ต้องการจัดการ' 
                : 'Select a section to manage'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hero" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-6">
                <TabsTrigger value="hero" className="gap-2">
                  <Image className="w-4 h-4" />
                  {language === 'th' ? 'Hero' : 'Hero'}
                </TabsTrigger>
                <TabsTrigger value="events" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {language === 'th' ? 'งานอีเว้นท์' : 'Events'}
                </TabsTrigger>
                <TabsTrigger value="rooms" className="gap-2">
                  <Home className="w-4 h-4" />
                  {language === 'th' ? 'ห้องพัก' : 'Rooms'}
                </TabsTrigger>
                <TabsTrigger value="menus" className="gap-2">
                  <Coffee className="w-4 h-4" />
                  {language === 'th' ? 'เมนู' : 'Menus'}
                </TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {language === 'th' ? 'แกลเลอรี่' : 'Gallery'}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {language === 'th' ? 'รีวิว' : 'Reviews'}
                </TabsTrigger>
                <TabsTrigger value="business" className="gap-2">
                  <Phone className="w-4 h-4" />
                  {language === 'th' ? 'ข้อมูลธุรกิจ' : 'Business Info'}
                </TabsTrigger>
                <TabsTrigger value="roles" className="gap-2">
                  <UserCog className="w-4 h-4" />
                  {language === 'th' ? 'บทบาท' : 'Roles'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hero" className="space-y-4">
                <HeroManagement />
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <EventSpaceManagement />
              </TabsContent>

              <TabsContent value="rooms" className="space-y-4">
                <RoomsManagement />
              </TabsContent>

              <TabsContent value="menus" className="space-y-4">
                <MenusManagement />
              </TabsContent>

              <TabsContent value="gallery" className="space-y-4">
                <GalleryManagement />
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <ReviewsManagement />
              </TabsContent>

              <TabsContent value="business" className="space-y-4">
                <BusinessInfoManagement />
              </TabsContent>

              <TabsContent value="roles" className="space-y-4">
                <UserRolesManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
