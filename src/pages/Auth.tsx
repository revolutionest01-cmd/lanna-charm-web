import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage, translations } from "@/hooks/useLanguage";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { DEVELOPER_ID } from "@/hooks/useAdminStatus";
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
  const { toggles, isLoading: featureLoading } = useFeatureToggle();
  const isAuthSuspendedMode = !featureLoading && toggles["service_suspended"] === true;
  const authContainerClass = isAuthSuspendedMode
    ? "relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-zinc-950 to-black font-mono text-emerald-200 flex items-center justify-center p-4 pt-12 sm:pt-[3.5rem]"
    : "min-h-screen bg-gradient-to-b from-background via-secondary/10 to-primary/5 flex items-center justify-center p-4 pt-12 sm:pt-[3.5rem]";
  const authCardClass = isAuthSuspendedMode
    ? "animate-fade-in border-emerald-400/45 bg-black/75 text-emerald-200 shadow-[0_16px_55px_rgba(16,185,129,0.28)] backdrop-blur-sm"
    : "animate-fade-in border-border/50 shadow-xl";

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
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [authDeniedPulse, setAuthDeniedPulse] = useState(false);
  const loginAlertShownRef = useRef(false);
  const STORAGE_KEY = 'plernping_login_data';
  const suspendedConsoleLines = [
    "[AUTH-GATE] restricted mode: enabled",
    "[POLICY] role constraint: developer_only",
    "[CHECK] realtime toggle sync: healthy",
    "[TRACE] attempts are monitored",
    "[SECURITY] elevated verification active",
  ];

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

  useEffect(() => {
    if (isAuthSuspendedMode && isForgotPasswordMode) {
      setIsForgotPasswordMode(false);
    }
  }, [isAuthSuspendedMode, isForgotPasswordMode]);

  // Redirect if already authenticated (but not if we're showing a login alert)
  useEffect(() => {
    if (isAuthenticated && !loginAlertShownRef.current) {
      // Check if this is from OAuth redirect by looking at URL params
      const isOAuthCallback = window.location.hash.includes('access_token') || window.location.search.includes('code');
      
      if (isOAuthCallback) {
        // Show welcome message for OAuth flows
        const messages = {
          th: {
            title: 'สวัสดีค่ะ',
            welcome: 'Plernping Cafe ยินดีต้อนรับ',
          },
          zh: {
            title: '欢迎',
            welcome: 'Plernping Cafe 欢迎您',
          },
          ja: {
            title: 'ようこそ',
            welcome: 'Plernping Cafe へようこそ',
          },
          en: {
            title: 'Welcome',
            welcome: 'to Plernping Cafe',
          }
        };

        const msg = messages[language as keyof typeof messages] || messages.en;
        
        sweetAlert.fire({
          title: msg.title,
          html: `<div style="font-size: 1.1rem; line-height: 1.6;">
            <p style="color: #666; margin-bottom: 0.5rem;">${msg.welcome}</p>
            <p style="color: #999; font-size: 0.9rem;">เข้าสู่ระบบสำเร็จ / Login successful</p>
          </div>`,
          icon: 'success',
          confirmButtonText: language === 'th' ? 'ดำเนิน' : language === 'zh' ? '继续' : language === 'ja' ? '続行' : 'Continue',
          confirmButtonColor: '#d97706',
          allowOutsideClick: false,
          didClose: () => {
            navigate("/profile");
          }
        });
      } else {
        // Auto-redirect if already authenticated and not from form submission
        navigate("/profile");
      }
    }
  }, [isAuthenticated, navigate, language]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let alertShown = false;

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
        if (isAuthSuspendedMode) {
          const { data: { session } } = await supabase.auth.getSession();
          const loggedInUserId = session?.user?.id;
          const isDeveloperAccount = loggedInUserId === DEVELOPER_ID;

          if (!isDeveloperAccount) {
            loginAlertShownRef.current = true;
            await supabase.auth.signOut();
            setIsLoading(false);
            loginAlertShownRef.current = false;
            setAuthDeniedPulse(true);
            window.setTimeout(() => setAuthDeniedPulse(false), 700);
            sweetAlert.error(
              'You do not have permission to access this system. (ERR-SUSP-403)'
            );
            return;
          }
        }

        alertShown = true;
        loginAlertShownRef.current = true;
        setIsLoading(false);
        
        const messages = {
          th: {
            title: 'สวัสดีค่ะ',
            welcome: 'Plernping Cafe ยินดีต้อนรับ',
          },
          zh: {
            title: '欢迎',
            welcome: 'Plernping Cafe 欢迎您',
          },
          ja: {
            title: 'ようこそ',
            welcome: 'Plernping Cafe へようこそ',
          },
          en: {
            title: 'Welcome',
            welcome: 'to Plernping Cafe',
          }
        };

        const msg = messages[language as keyof typeof messages] || messages.en;
        
        sweetAlert.fire({
          title: msg.title,
          html: `<div style="font-size: 1.1rem; line-height: 1.6;">
            <p style="color: #666; margin-bottom: 0.5rem;">${msg.welcome}</p>
            <p style="color: #999; font-size: 0.9rem;">เข้าสู่ระบบสำเร็จ / Login successful</p>
          </div>`,
          icon: 'success',
          confirmButtonText: language === 'th' ? 'ดำเนิน' : language === 'zh' ? '继续' : language === 'ja' ? '続行' : 'Continue',
          confirmButtonColor: '#d97706',
          allowOutsideClick: false,
          didClose: () => {
            loginAlertShownRef.current = false;
            navigate("/profile");
          }
        });
      } else {
        setIsLoading(false);
        sweetAlert.error(result.error || (language === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง' : language === 'zh' ? '电子邮件或密码无效。请检查并重试' : language === 'ja' ? 'メールアドレスまたはパスワードが無効です' : 'Invalid email or password. Please check and try again.'));
      }
    } catch (error) {
      if (!alertShown) {
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          sweetAlert.error(firstError.message);
        } else {
          console.error('[Login] Error:', error);
          sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : language === 'zh' ? '发生错误，请重试' : language === 'ja' ? 'エラーが発生しました。もう一度お試しください' : 'An error occurred. Please try again.');
        }
      }
    } finally {
      if (!alertShown) {
        setIsLoading(false);
      }
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
        // Show email confirmation screen
        setOtpEmail(registerForm.email);
        setIsOtpMode(true);
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
        setTimeout(() => navigate("/profile"), 1000);
      }
    } catch (error) {
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Always use Lovable managed OAuth - it handles Google credentials
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (error) {
        console.error('[Auth] Google sign-in error:', error);
        sweetAlert.error(error.message || (language === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' : 'Error signing in with Google'));
      }
    } catch (error) {
      console.error('[Auth] Google sign-in exception:', error);
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' : language === 'zh' ? '使用Google登录时出错' : language === 'ja' ? 'Googleでのログイン中にエラーが発生しました' : 'Error signing in with Google');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      sweetAlert.error(language === 'th' ? 'กรุณากรอกรหัส OTP 6 หลัก' : 'Please enter the 6-digit OTP code');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpValue,
        type: 'signup',
      });
      if (error) {
        sweetAlert.error(error.message || (language === 'th' ? 'รหัส OTP ไม่ถูกต้อง' : 'Invalid OTP code'));
      } else {
        const messages = {
          th: {
            title: 'สวัสดีค่ะ',
            welcome: 'Plernping Cafe ยินดีต้อนรับ',
          },
          zh: {
            title: '欢迎',
            welcome: 'Plernping Cafe 欢迎您',
          },
          ja: {
            title: 'ようこそ',
            welcome: 'Plernping Cafe へようこそ',
          },
          en: {
            title: 'Welcome',
            welcome: 'to Plernping Cafe',
          }
        };

        const msg = messages[language as keyof typeof messages] || messages.en;
        
        sweetAlert.fire({
          title: msg.title,
          html: `<div style="font-size: 1.1rem; line-height: 1.6;">
            <p style="color: #666; margin-bottom: 0.5rem;">${msg.welcome}</p>
            <p style="color: #999; font-size: 0.9rem;">ยืนยันตัวตนสำเร็จ / Verification successful</p>
          </div>`,
          icon: 'success',
          confirmButtonText: language === 'th' ? 'ดำเนิน' : language === 'zh' ? '继续' : language === 'ja' ? '続行' : 'Continue',
          confirmButtonColor: '#d97706',
          allowOutsideClick: false,
          didClose: () => {
            navigate("/profile");
          }
        });
      }
    } catch (error) {
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: otpEmail,
      });
      if (error) {
        sweetAlert.error(error.message);
      } else {
        sweetAlert.success(language === 'th' ? 'ส่งรหัส OTP ใหม่แล้ว' : 'New OTP sent');
      }
    } catch {
      sweetAlert.error(language === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // If in OTP verification mode
  if (isOtpMode) {
    return (
      <div className={authContainerClass}>
        <div className="w-full max-w-md my-auto">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <img src={logo} alt="Plern Ping Cafe" className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
              {language === 'th' ? 'ตรวจสอบอีเมลของคุณ' : 'Check Your Email'}
            </h1>
          </div>
          <Card className={authCardClass}>
            <CardContent className="pt-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-muted-foreground">
                {language === 'th'
                  ? `เราได้ส่งลิงค์ยืนยันตัวตนไปที่`
                  : `We sent a verification link to`}
              </p>
              <p className="font-medium text-foreground">{otpEmail}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'th'
                  ? 'กรุณาเปิดอีเมลและกดลิงค์ยืนยันเพื่อเปิดใช้งานบัญชีของคุณ'
                  : 'Please open the email and click the verification link to activate your account.'}
              </p>
              <div className="pt-2 space-y-2">
                <Button type="button" variant="outline" className="w-full" onClick={handleResendOtp} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {language === 'th' ? 'ส่งอีเมลยืนยันอีกครั้ง' : 'Resend Verification Email'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setIsOtpMode(false); setOtpValue(""); }}>
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  {language === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If in reset password mode, show the new password form
  if (isResetPasswordMode) {
    return (
      <div className={authContainerClass}>
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
          <Card className={authCardClass}>
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
    <div className={authContainerClass}>
      {isAuthSuspendedMode && (
        <style>{`
          @keyframes suspended-deny-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(3px); }
          }

          @keyframes suspended-console-rise {
            0% { transform: translateY(12px); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(-12px); opacity: 0; }
          }

          .suspended-console-line {
            animation: suspended-console-rise 5.8s linear infinite;
          }
        `}</style>
      )}
      {isAuthSuspendedMode && (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-20 [background:repeating-linear-gradient(180deg,rgba(16,185,129,0.12)_0px,rgba(16,185,129,0.12)_1px,transparent_1px,transparent_4px)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.1),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden px-6 text-[10px] sm:text-xs leading-5 text-emerald-400/45 font-mono">
            {suspendedConsoleLines.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className="suspended-console-line"
                style={{ animationDelay: `${index * 0.75}s` }}
              >
                {line}
              </p>
            ))}
          </div>
        </>
      )}
      <div className="w-full max-w-md my-auto">
        {!isAuthSuspendedMode && (
          <Button
            onClick={() => navigate("/")}
            className="mb-4 gap-2 font-semibold text-sm px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 active:scale-95 shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'th' ? 'กลับหน้าแรก' : language === 'zh' ? '返回首页' : language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
          </Button>
        )}

        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          {!isAuthSuspendedMode && (
            <>
              <img src={logo} alt="Plern Ping Cafe" className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" />
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
                {language === 'th' ? 'ยินดีต้อนรับ' : language === 'zh' ? '欢迎' : language === 'ja' ? 'ようこそ' : 'Welcome'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'th' ? 'เข้าสู่ระบบเพื่อใช้งานเว็บบอร์ด' : language === 'zh' ? '登录以访问论坛' : language === 'ja' ? 'フォーラムにアクセスするにはログインしてください' : 'Login to access the forum'}
              </p>
            </>
          )}
          {isAuthSuspendedMode && (
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-400/40 bg-black/35 px-4 py-3 text-left shadow-[0_0_0_1px_rgba(16,185,129,0.1)]">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-emerald-300/80">
                  {language === 'th' ? 'SYSTEM STATUS' : 'SYSTEM STATUS'}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] sm:text-xs text-emerald-200/85">
                  <span>Mode</span>
                  <span className="text-right font-semibold text-emerald-300">SUSPENDED</span>
                  <span>Access</span>
                  <span className="text-right font-semibold text-emerald-300">DEV ONLY</span>
                  <span>Auth Gate</span>
                  <span className="text-right font-semibold text-emerald-300">ACTIVE</span>
                </div>
              </div>

              <div className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-emerald-300">
                SUSPENDED LOCKDOWN: DEV ONLY ACCESS
              </div>
            </div>
          )}
        </div>

        <Card
          className={authCardClass}
          style={authDeniedPulse ? { animation: "suspended-deny-shake 0.45s ease-in-out" } : undefined}
        >
          <CardHeader>
            {isForgotPasswordMode && !isAuthSuspendedMode ? (
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
                  {isAuthSuspendedMode
                    ? 'Login'
                    : (language === 'th' ? 'เข้าสู่ระบบ / สมัครสมาชิก' : language === 'zh' ? '登录 / 注册' : language === 'ja' ? 'ログイン / 登録' : 'Login / Register')}
                </CardTitle>
                <CardDescription className="text-center">
                  {isAuthSuspendedMode
                    ? 'Please log in to continue'
                    : (language === 'th'
                      ? 'เข้าร่วมชุมชนและแบ่งปันประสบการณ์ของคุณ'
                      : language === 'zh'
                        ? '加入我们的社区，分享您的体验'
                        : language === 'ja'
                          ? 'コミュニティに参加して体験を共有してください'
                          : 'Join our community and share your experiences')}
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPasswordMode && !isAuthSuspendedMode ? (
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
            ) : isAuthSuspendedMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email-suspended" className="text-emerald-300">
                    Email
                  </Label>
                  <Input
                    id="login-email-suspended"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                    className="border-emerald-500/40 bg-zinc-950/80 text-emerald-200 placeholder:text-emerald-700 focus-visible:ring-emerald-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password-suspended" className="text-emerald-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password-suspended"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                      className="pr-10 border-emerald-500/40 bg-zinc-950/80 text-emerald-200 placeholder:text-emerald-700 focus-visible:ring-emerald-400/50"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-emerald-500/10"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Eye className="h-4 w-4 text-emerald-300" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="remember-password-suspended"
                    checked={rememberPassword}
                    onChange={(e) => {
                      setRememberPassword(e.target.checked);
                      if (!e.target.checked) {
                        localStorage.removeItem(STORAGE_KEY);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer accent-primary"
                  />
                  <label htmlFor="remember-password-suspended" className="text-sm text-emerald-300 cursor-pointer select-none">
                    Remember password
                  </label>
                  <span className="text-xs text-emerald-500 ml-auto">
                    (not recommended on shared devices)
                  </span>
                </div>

                <Button
                  type="submit"
                  className={isAuthSuspendedMode ? "w-full border border-emerald-400/60 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" : "w-full"}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>

                {/* Google Sign-In hidden temporarily */}
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

                    {/* Google Sign-In hidden temporarily */}
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

                    {/* Google Sign-In hidden temporarily */}
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
