import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { login, register, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/forum");
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(loginForm.email, loginForm.password);
    
    setIsLoading(false);

    if (result.success) {
      toast.success(language === 'th' ? 'เข้าสู่ระบบสำเร็จ' : 'Login successful');
      navigate("/forum");
    } else {
      toast.error(result.error || (language === 'th' ? 'เข้าสู่ระบบไม่สำเร็จ' : 'Login failed'));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await register(registerForm.name, registerForm.email, registerForm.password);
    
    setIsLoading(false);

    if (result.success) {
      toast.success(language === 'th' ? 'สมัครสมาชิกสำเร็จ' : 'Registration successful');
      navigate("/forum");
    } else {
      toast.error(result.error || (language === 'th' ? 'สมัครสมาชิกไม่สำเร็จ' : 'Registration failed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {language === 'th' ? 'กลับหน้าแรก' : 'Back to Home'}
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <img src={logo} alt="Plern Ping Cafe" className="h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            {language === 'th' ? 'ยินดีต้อนรับ' : 'Welcome'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'th' ? 'เข้าสู่ระบบเพื่อใช้งานเว็บบอร์ด' : 'Login to access the forum'}
          </p>
        </div>

        <Card className="animate-fade-in border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {language === 'th' ? 'เข้าสู่ระบบ / สมัครสมาชิก' : 'Login / Register'}
            </CardTitle>
            <CardDescription className="text-center">
              {language === 'th' 
                ? 'เข้าร่วมชุมชนและแบ่งปันประสบการณ์ของคุณ' 
                : 'Join our community and share your experiences'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">
                  {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                </TabsTrigger>
                <TabsTrigger value="register">
                  {language === 'th' ? 'สมัครสมาชิก' : 'Register'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">
                      {language === 'th' ? 'อีเมล' : 'Email'}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={language === 'th' ? 'กรอกอีเมล' : 'Enter your email'}
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">
                      {language === 'th' ? 'รหัสผ่าน' : 'Password'}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">
                      {language === 'th' ? 'ชื่อ' : 'Name'}
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : 'Enter your name'}
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">
                      {language === 'th' ? 'อีเมล' : 'Email'}
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder={language === 'th' ? 'กรอกอีเมล' : 'Enter your email'}
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      {language === 'th' ? 'รหัสผ่าน' : 'Password'}
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {language === 'th' ? 'สมัครสมาชิก' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {language === 'th' 
            ? '* นี่คือระบบ mockup สำหรับทดสอบการใช้งาน' 
            : '* This is a mockup system for testing purposes'}
        </p>
      </div>
    </div>
  );
};

export default Auth;
