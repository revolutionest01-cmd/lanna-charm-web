import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
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
  Shield
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { HeroManagement } from "@/components/admin/HeroManagement";
import { EventSpaceManagement } from "@/components/admin/EventSpaceManagement";
import { RoomsManagement } from "@/components/admin/RoomsManagement";

const Admin = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
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

    checkAdminStatus();
  }, [isAuthenticated, user]);

  // Redirect if not admin
  useEffect(() => {
    if (!checkingAdmin && !isLoading) {
      if (!isAuthenticated) {
        toast.error(language === 'th' ? 'กรุณาเข้าสู่ระบบก่อน' : 'Please login first');
        navigate('/auth');
      } else if (!isAdmin) {
        toast.error(language === 'th' ? 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้' : 'You do not have permission to access this page');
        navigate('/');
      }
    }
  }, [isAuthenticated, isAdmin, checkingAdmin, isLoading, navigate, language]);

  if (isLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {language === 'th' ? 'กำลังโหลด...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const stats = [
    { label: language === 'th' ? 'ห้องพัก' : 'Rooms', value: '0', icon: Home, color: 'text-blue-600' },
    { label: language === 'th' ? 'เมนู' : 'Menus', value: '0', icon: Coffee, color: 'text-green-600' },
    { label: language === 'th' ? 'แกลเลอรี่' : 'Gallery', value: '0', icon: ImageIcon, color: 'text-purple-600' },
    { label: language === 'th' ? 'รีวิว' : 'Reviews', value: '0', icon: MessageSquare, color: 'text-orange-600' },
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
          {stats.map((stat, index) => (
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
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
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
                <div className="text-center py-12 text-muted-foreground">
                  <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{language === 'th' ? 'จัดการเมนู' : 'Manage Menus'}</p>
                  <p className="text-sm mt-2">
                    {language === 'th' ? 'เร็วๆ นี้...' : 'Coming soon...'}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
