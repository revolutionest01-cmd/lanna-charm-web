import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import ReCaptcha from "@/components/ReCaptcha";
import { z } from "zod";
import { createAuthValidation } from "@/lib/validation";

const Auth = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  const { login, register, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [loginRecaptcha, setLoginRecaptcha] = useState<string | null>(null);
  const [registerRecaptcha, setRegisterRecaptcha] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // TEMPORARILY DISABLED - reCAPTCHA validation
    // if (!loginRecaptcha) {
    //   toast.error(language === 'th' ? 'โปรดยืนยันว่าไม่ใช่บอท' : 'Please verify that you are not a robot');
    //   return;
    // }

    setIsLoading(true);

    try {
      // Validate input
      const validation = createAuthValidation(language);
      const loginSchema = z.object({
        email: validation.email,
        password: validation.password,
      });
      
      loginSchema.parse(loginForm);

      // TEMPORARILY DISABLED - Verify reCAPTCHA with backend
      // const { supabase } = await import("@/integrations/supabase/client");
      // const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      //   body: { token: loginRecaptcha }
      // });

      // if (error || !data?.success) {
      //   toast.error(language === 'th' ? 'การยืนยัน reCAPTCHA ไม่สำเร็จ' : 'reCAPTCHA verification failed');
      //   setIsLoading(false);
      //   return;
      // }

      const result = await login(loginForm.email, loginForm.password);

      if (result.success) {
        toast.success(language === 'th' ? 'เข้าสู่ระบบสำเร็จ' : 'Login successful');
        // Add small delay to show success message before redirect
        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        toast.error(result.error || (language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' : 'Invalid email or password. Please check and try again.'));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'An error occurred. Please try again.');
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // TEMPORARILY DISABLED - reCAPTCHA validation
    // if (!registerRecaptcha) {
    //   toast.error(language === 'th' ? 'โปรดยืนยันว่าไม่ใช่บอท' : 'Please verify that you are not a robot');
    //   return;
    // }

    setIsLoading(true);

    try {
      // Validate input
      const validation = createAuthValidation(language);
      const registerSchema = z.object({
        name: validation.name,
        email: validation.email,
        password: validation.password,
      });
      
      registerSchema.parse(registerForm);

      // TEMPORARILY DISABLED - Verify reCAPTCHA with backend
      // const { supabase } = await import("@/integrations/supabase/client");
      // const { data, error } = await supabase.functions.invoke('verify-recaptcha', {
      //   body: { token: registerRecaptcha }
      // });

      // if (error || !data?.success) {
      //   toast.error(language === 'th' ? 'การยืนยัน reCAPTCHA ไม่สำเร็จ' : 'reCAPTCHA verification failed');
      //   setIsLoading(false);
      //   return;
      // }

      const result = await register(registerForm.name, registerForm.email, registerForm.password);

      if (result.success) {
        toast.success(language === 'th' ? 'สมัครสมาชิกสำเร็จ' : 'Registration successful');
        // Add small delay to show success message before redirect
        setTimeout(() => {
          navigate("/");
        }, 800);
      } else {
        toast.error(result.error || (language === 'th' ? 'สมัครสมาชิกไม่สำเร็จ' : 'Registration failed'));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'An error occurred. Please try again.');
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
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
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* TEMPORARILY DISABLED - reCAPTCHA */}
                  {/* <div className="pt-2">
                    <ReCaptcha 
                      onVerify={(token) => setLoginRecaptcha(token)}
                      onExpired={() => setLoginRecaptcha(null)}
                      onError={() => setLoginRecaptcha(null)}
                    />
                  </div> */}
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
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : 'Enter your password'}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* TEMPORARILY DISABLED - reCAPTCHA */}
                  {/* <div className="pt-2">
                    <ReCaptcha 
                      onVerify={(token) => setRegisterRecaptcha(token)}
                      onExpired={() => setRegisterRecaptcha(null)}
                      onError={() => setRegisterRecaptcha(null)}
                    />
                  </div> */}
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
