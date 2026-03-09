import { AlertTriangle, DoorOpen, Clock, Trash2, CalendarX } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";

const SUSPENSION_START = new Date("2026-03-01T00:00:00+07:00"); // 1 มีนาคม 2569 BE
const DELETION_DEADLINE_DAYS = 15;
const DEADLINE_MS = DELETION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;

const ServiceSuspendedScreen = () => {
  const { language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = now.getTime() - SUSPENSION_START.getTime();
  const totalHoursPassed = Math.max(0, diffMs / (1000 * 60 * 60));
  const daysPassed = Math.floor(totalHoursPassed / 24);
  const daysRemaining = Math.max(0, DELETION_DEADLINE_DAYS - daysPassed);
  const isExpired = daysPassed >= DELETION_DEADLINE_DAYS;
  const progressPercent = Math.min(100, (diffMs / DEADLINE_MS) * 100);

  // Remaining time breakdown
  const remainingMs = Math.max(0, DEADLINE_MS - diffMs);
  const remDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  // Overdue hours (total)
  const totalOverdueHours = Math.floor(totalHoursPassed);
  const overdueMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const overdueSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

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
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl border border-destructive/40 bg-card p-6 sm:p-8 text-center shadow-sm space-y-5">
        {/* Header badge */}
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

        {/* Countdown Section */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-destructive">
            <Clock className="w-4 h-4" />
            {language === "th" ? "เวลาที่เหลือก่อนข้อมูลจะถูกลบถาวร" : "Time remaining before permanent data deletion"}
          </div>

          {/* Countdown timer */}
          {!isExpired ? (
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              {[
                { value: remDays, label: language === "th" ? "วัน" : "Days" },
                { value: remHours, label: language === "th" ? "ชั่วโมง" : "Hours" },
                { value: remMinutes, label: language === "th" ? "นาที" : "Min" },
                { value: remSeconds, label: language === "th" ? "วินาที" : "Sec" },
              ].map((unit, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-4xl sm:text-6xl font-extrabold tabular-nums text-destructive leading-none font-mono min-w-[2.5rem] sm:min-w-[4rem] text-center">
                    {String(unit.value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">{unit.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span className="text-4xl sm:text-6xl font-extrabold text-destructive animate-pulse">00 : 00 : 00 : 00</span>
              <p className="text-xs text-muted-foreground mt-1">{language === "th" ? "หมดเวลาแล้ว" : "Time's up"}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isExpired ? "bg-destructive animate-pulse" : progressPercent > 70 ? "bg-destructive/70" : "bg-destructive/40"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{language === "th" ? "1 มี.ค. 2569" : "1 Mar 2026"}</span>
              <span>{language === "th" ? "15 มี.ค. 2569" : "15 Mar 2026"}</span>
            </div>
          </div>

          {/* Warning or expired message */}
          {!isExpired ? (
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {language === "th"
                ? "หมายเหตุ: หากพ้นกำหนดเวลาดังกล่าว ให้ถือว่าข้อตกลงและสัญญาจ้างฉบับนี้ ระงับสิ้นสุดลงโดยทันที เนื่องจากการผิดนัดชำระเงินตามที่ตกลงกันไว้ โดยผู้รับจ้างขอสงวนสิทธิ์ในทรัพย์สินทางปัญญา ซอร์สโค้ด และข้อมูลระบบทั้งหมดแต่เพียงผู้เดียว และจะไม่มีพันธะผูกพันในการส่งมอบงานหรือดูแลระบบอีกต่อไป"
                : "Note: Once the countdown expires, the original quotation and contract shall be considered terminated. If the client wishes to access the system thereafter, it will be treated as a new project at the current market rate, and the developer shall not be liable for any damages or previously deleted data."}
            </p>
          ) : (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-3 space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-destructive">
                <Trash2 className="w-4 h-4" />
                {language === "th"
                  ? "เกินกำหนดแล้ว — ข้อมูลทั้งหมดจะถูกลบทิ้ง"
                  : "DEADLINE EXCEEDED — All data will be permanently deleted"}
              </div>
              <p className="text-xs text-destructive/80 leading-relaxed">
                {language === "th"
                  ? "ตามนโยบายการทำงานของทีมผู้พัฒนา ข้อมูลทั้งหมดรวมถึงบัญชีผู้ใช้ ไฟล์ และฐานข้อมูลจะถูกลบออกจากระบบอย่างถาวร โดยไม่สามารถกู้คืนได้"
                  : "Per the development team's policy, all data including user accounts, files, and databases will be permanently removed from the system and cannot be recovered."}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
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
