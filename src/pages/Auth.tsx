import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import sweetAlert from "@/lib/sweetAlert";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const STORAGE_KEY = 'plernping_login_data';

  // Load saved credentials from localStorage on component mount
  useEffect(() => {
    const loadSavedCredentials = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        console.log('Checking localStorage:', STORAGE_KEY, savedData);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log('Loaded credentials:', parsed);
          setLoginForm({ email: parsed.email || "", password: parsed.password || "" });
          setRememberPassword(true);
        }
      } catch (error) {
        console.error('Failed to load saved credentials:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
      setCredentialsLoaded(true);
    };
    loadSavedCredentials();
  }, []);

  // Save credentials only after initial load is complete
  useEffect(() => {
    if (!credentialsLoaded) return;
    if (rememberPassword && loginForm.email && loginForm.password) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }));
      } catch (error) {
        console.error('Failed to save credentials:', error);
      }
    }
  }, [credentialsLoaded, rememberPassword, loginForm.email, loginForm.password]);

  // Detect password reset flow from URL (after clicking reset link in email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      // Listen for PASSWORD_RECOVERY event from Supabase
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsResetPasswordMode(true);
        }
      });
      // Also check if we already have a session (user clicked link and session was set)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsResetPasswordMode(true);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      const validation = createAuthValidation(language);
      const loginSchema = z.object({
        email: validation.email,
        password: validation.password,
      });

      loginSchema.parse(loginForm);

      const result = await login(loginForm.email, loginForm.password);

      if (result.success) {
        // Credentials will be automatically saved by the useEffect hook
        sweetAlert.success(language === 'th' ? 'เข้าสู่ระบบสำเร็จ' : language === 'zh' ? '登录成功' : language === 'ja' ? 'ログイン成功' : 'Login successful');
        // Show quick success feedback then navigate
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        sweetAlert.error(result.error || (language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' : language === 'zh' ? '电子邮件或密码无效。请检查并重试' : language === 'ja' ? 'メールアドレスまたはパスワードが無効です' : 'Invalid email or password. Please check and try again.'));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        sweetAlert.error(firstError.message);
      } else {
        sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : language === 'ja' ? 'エラーが発生しました。もう一度お試しください' : 'An error occurred. Please try again.');
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const result = await register(registerForm.name, registerForm.email, registerForm.password);

      if (result.success) {
        sweetAlert.success(language === 'th' ? 'ยินดีต้อนรับ' : language === 'zh' ? '欢迎' : language === 'ja' ? 'ようこそ' : 'Welcome');
        // Navigate immediately
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        sweetAlert.error(result.error || (language === 'th' ? 'สมัครสมาชิกไม่สำเร็จ' : language === 'zh' ? '注册失败' : language === 'ja' ? '登録に失敗しました' : 'Registration failed'));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        sweetAlert.error(firstError.message);
      } else {
        sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : language === 'ja' ? 'エラーが発生しました。もう一度お試しください' : 'An error occurred. Please try again.');
      }
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate email
      const validation = createAuthValidation(language);
      const emailSchema = z.object({
        email: validation.email,
      });

      emailSchema.parse({ email: forgotPasswordEmail });

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        sweetAlert.error(
          language === 'th'
            ? 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ โปรดลองใหม่'
            : language === 'zh'
              ? '无法发送密码重置电子邮件，请重试'
              : 'Unable to send password reset email. Please try again.'
        );
      } else {
        sweetAlert.success(
          language === 'th'
            ? 'ลิงก์รีเซ็ตรหัสผ่านส่งไปแล้ว กรุณาตรวจสอบอีเมล'
            : language === 'zh'
              ? '密码重置链接已发送。请检查您的电子邮件'
              : 'Password reset link sent! Please check your email.'
        );
        setForgotPasswordEmail("");
        setIsForgotPasswordMode(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        sweetAlert.error(firstError.message);
      } else {
        sweetAlert.error(
          language === 'th'
            ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
            : language === 'zh'
              ? '发生错误，请重试'
              : 'An error occurred. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (newPassword.length < 6) {
        sweetAlert.error(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        sweetAlert.error(language === 'th' ? 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่' : 'Unable to change password. Please try again.');
      } else {
        sweetAlert.success(language === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จแล้ว!' : 'Password changed successfully!');
        setIsResetPasswordMode(false);
        setNewPassword("");
        // Clear reset param from URL
        window.history.replaceState({}, '', '/auth');
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error) {
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        sweetAlert.error(error.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' : 'Error signing in with Google'));
      }
    } catch (error) {
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' : language === 'zh' ? '使用Google登录时出错' : language === 'ja' ? 'Googleでのログイン中にエラーが発生しました' : 'Error signing in with Google');
    }
  };

  // If in reset password mode, show the new password form
  if (isResetPasswordMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 flex items-center justify-center p-4 pt-12 sm:pt-[3.5rem]">
        <div className="w-full max-w-md my-auto">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <img src={logo} alt="Plern Ping Cafe" className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
              {language === 'th' ? 'ตั้งรหัสผ่านใหม่' : 'Set New Password'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'th' ? 'กรุณากรอกรหัสผ่านใหม่ของคุณ' : 'Please enter your new password'}
            </p>
          </div>
          <Card className="animate-fade-in border-border/50 shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {language === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder={language === 'th' ? 'กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)' : 'Enter new password (min 6 characters)'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 flex items-center justify-center p-4 pt-12 sm:pt-[3.5rem]">
      <div className="w-full max-w-md my-auto">
        <Button
          onClick={() => navigate("/")}
          className="mb-4 gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === 'th' ? 'กลับหน้าแรก' : language === 'zh' ? '返回首页' : language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
        </Button>

        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <img src={logo} alt="Plern Ping Cafe" className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            {language === 'th' ? 'ยินดีต้อนรับ' : language === 'zh' ? '欢迎' : language === 'ja' ? 'ようこそ' : 'Welcome'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'th' ? 'เข้าสู่ระบบเพื่อใช้งานเว็บบอร์ด' : language === 'zh' ? '登录以访问论坛' : language === 'ja' ? 'フォーラムにアクセスするにはログインしてください' : 'Login to access the forum'}
          </p>
        </div>

        <Card className="animate-fade-in border-border/50 shadow-xl">
          <CardHeader>
            {isForgotPasswordMode ? (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="-ml-2 p-2"
                    onClick={() => setIsForgotPasswordMode(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>
                    {language === 'th' ? 'รีเซ็ตหัสผ่าน' : language === 'zh' ? '重置密码' : 'Reset Password'}
                  </CardTitle>
                </div>
                <CardDescription>
                  {language === 'th' ? 'กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ต' : language === 'zh' ? '输入您的电子邮件以接收重置链接' : 'Enter your email to receive reset link'}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-center">
                  {language === 'th' ? 'เข้าสู่ระบบ / สมัครสมาชิก' : language === 'zh' ? '登录 / 注册' : language === 'ja' ? 'ログイン / 登録' : 'Login / Register'}
                </CardTitle>
                <CardDescription className="text-center">
                  {language === 'th'
                    ? 'เข้าร่วมชุมชนและแบ่งปันประสบการณ์ของคุณ'
                    : language === 'zh'
                      ? '加入我们的社区，分享您的体验'
                      : language === 'ja'
                        ? 'コミュニティに参加して体験を共有してください'
                        : 'Join our community and share your experiences'}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPasswordMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">
                    {language === 'th' ? 'อีเมล' : language === 'zh' ? '电子邮件' : 'Email'}
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder={language === 'th' ? 'กรอกอีเมล' : language === 'zh' ? '请输入电子邮件' : 'Enter your email'}
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'th' ? 'ส่งลิงก์รีเซ็ต' : language === 'zh' ? '发送重置链接' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full md:grid-cols-2 grid-cols-1 md:w-auto overflow-x-auto inline-flex md:inline-grid">
                  <TabsTrigger value="login">
                    {language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : 'Login'}
                  </TabsTrigger>
                  <TabsTrigger value="register">
                    {language === 'th' ? 'สมัครสมาชิก' : language === 'zh' ? '注册' : 'Register'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">
                        {language === 'th' ? 'อีเมล' : language === 'zh' ? '电子邮件' : 'Email'}
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={language === 'th' ? 'กรอกอีเมล' : language === 'zh' ? '请输入电子邮件' : 'Enter your email'}
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">
                        {language === 'th' ? 'รหัสผ่าน' : language === 'zh' ? '密码' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : language === 'zh' ? '请输入密码' : 'Enter your password'}
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

                    <div className="flex items-center gap-2 py-2">
                      <input
                        type="checkbox"
                        id="remember-password"
                        checked={rememberPassword}
                        onChange={(e) => {
                          setRememberPassword(e.target.checked);
                          if (!e.target.checked) {
                            localStorage.removeItem(STORAGE_KEY);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer accent-primary"
                      />
                      <label htmlFor="remember-password" className="text-sm text-muted-foreground cursor-pointer select-none">
                        {language === 'th' ? 'จดจำรหัสผ่าน' : language === 'zh' ? '记住密码' : 'Remember password'}
                      </label>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {language === 'th' ? '(ไม่แนะนำบนคอมพิวเตอร์ของคนอื่น)' : language === 'zh' ? '(不建议在公用电脑上使用)' : '(not recommended on shared devices)'}
                      </span>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {language === 'th' ? 'เข้าสู่ระบบ' : language === 'zh' ? '登录' : 'Login'}
                    </Button>

                    <div className="text-right">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => setIsForgotPasswordMode(true)}
                      >
                        {language === 'th' ? 'ลืมรหัสผ่าน?' : language === 'zh' ? '忘记密码?' : 'Forgot password?'}
                      </Button>
                    </div>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {language === 'th' ? 'หรือ' : language === 'zh' ? '或者' : 'or'}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-foreground text-background hover:bg-foreground/90 hover:text-background border-foreground"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {language === 'th' ? 'ดำเนินการต่อด้วย Google' : language === 'zh' ? '使用Google继续' : 'Continue with Google'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">
                        {language === 'th' ? 'ชื่อ' : language === 'zh' ? '姓名' : 'Name'}
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder={language === 'th' ? 'กรอกชื่อของคุณ' : language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">
                        {language === 'th' ? 'อีเมล' : language === 'zh' ? '电子邮件' : 'Email'}
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder={language === 'th' ? 'กรอกอีเมล' : language === 'zh' ? '请输入电子邮件' : 'Enter your email'}
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">
                        {language === 'th' ? 'รหัสผ่าน' : language === 'zh' ? '密码' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder={language === 'th' ? 'กรอกรหัสผ่าน' : language === 'zh' ? '请输入密码' : 'Enter your password'}
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
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {language === 'th' ? 'สมัครสมาชิก' : language === 'zh' ? '注册' : 'Register'}
                    </Button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          {language === 'th' ? 'หรือ' : language === 'zh' ? '或者' : 'or'}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-foreground text-background hover:bg-foreground/90 hover:text-background border-foreground"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {language === 'th' ? 'ดำเนินการต่อด้วย Google' : language === 'zh' ? '使用Google继续' : 'Continue with Google'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
