import { AlertTriangle, DoorOpen } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const ServiceSuspendedScreen = () => {
  const { language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-destructive/40 bg-card p-6 sm:p-8 text-center shadow-sm space-y-5">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive">
          <span>ACCOUNT HOLD</span>
          <span>•</span>
          <span>SERVICE SUSPENDED</span>
        </div>

        <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-destructive">
          {language === "th" ? "ขณะนี้ระบบถูกระงับการให้บริการชั่วคราว" : "SERVICE SUSPENDED IMMEDIATELY"}
        </h1>

        <div className="space-y-2">
          <p className="text-base sm:text-lg font-semibold text-foreground leading-relaxed">
            {language === "th"
              ? "กรุณาติดต่อผู้พัฒนา"
              : "This system has been disabled due to unpaid service fees."}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {language === "th"
              ? "ผู้ใช้งานทุกบัญชีรวมถึงผู้ดูแลระบบจะไม่สามารถเข้าถึงระบบได้"
              : "All accounts are blocked from access until payment is cleared and the service is unlocked by the developer."}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          {!isAuthenticated && (
            <Button asChild variant="outline">
              <Link to="/auth">
                {language === "th" ? "เข้าสู่ระบบสำหรับผู้พัฒนา" : "Developer Sign In"}
              </Link>
            </Button>
          )}

          {isAuthenticated && (
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              <DoorOpen className="w-4 h-4 mr-1.5" />
              {language === "th" ? "ออกจากระบบ" : "Logout"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceSuspendedScreen;
