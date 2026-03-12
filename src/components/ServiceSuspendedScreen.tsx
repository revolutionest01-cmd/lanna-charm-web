import { AlertTriangle, DoorOpen, Clock, Trash2, CalendarX } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";

const SUSPENSION_START = new Date("2026-03-01T00:00:00+07:00"); // 1 มีนาคม 2569 BE
const DELETION_DEADLINE_DAYS = 15;
const DEADLINE_MS = DELETION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
const REDIRECT_URLS = [
  "https://12theresidence.com/th-th/",
  "https://www.radissonhotels.com/",
  "https://th.amari.com/donmuang",
];
const REDIRECT_COUNTDOWN_SECONDS = 10;

const ServiceSuspendedScreen = () => {
  const { language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);

  const [now, setNow] = useState(() => new Date());

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

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Only start redirect countdown when expired
  useEffect(() => {
    if (!isExpired) return;

    const randomRedirectUrl = REDIRECT_URLS[Math.floor(Math.random() * REDIRECT_URLS.length)];

    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      window.location.href = randomRedirectUrl;
    }, REDIRECT_COUNTDOWN_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isExpired]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // === EXPIRED: Black screen with redirect ===
  if (isExpired) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="w-full max-w-2xl text-center space-y-6">
          <div className="mx-auto inline-flex items-center justify-center rounded-full bg-red-900/30 p-3">
            <Trash2 className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-red-500 tracking-tight">
            {language === "th" ? "สัญญาสิ้นสุดแล้ว" : "CONTRACT TERMINATED"}
          </h1>

          <p className="text-base sm:text-lg text-red-400/90 leading-relaxed max-w-xl mx-auto">
            {language === "th"
              ? "ข้อตกลงและสัญญาจ้างฉบับนี้ระงับสิ้นสุดลงโดยทันที เนื่องจากการผิดนัดชำระเงินตามที่ตกลงกันไว้"
              : "This agreement and service contract has been immediately terminated due to breach of payment terms."}
          </p>

          <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
            {language === "th"
              ? "ผู้รับจ้างขอสงวนสิทธิ์ในทรัพย์สินทางปัญญา ซอร์สโค้ด และข้อมูลระบบทั้งหมดแต่เพียงผู้เดียว"
              : "The developer reserves sole ownership of all intellectual property, source code, and system data."}
          </p>

          <div className="pt-4 space-y-3">
            <p className="text-sm text-gray-600">
              {language === "th"
                ? "เราจะนำทางคุณไปยังโรงแรมที่ดีที่สุดและคู่ควรสำหรับคุณ"
                : "We are directing you to the best hotel experience you truly deserve."}
            </p>
            <p className="text-4xl sm:text-6xl font-black tabular-nums text-white font-mono">
              {redirectCountdown}
            </p>
            <p className="text-xs text-gray-600">
              {language === "th" ? "วินาที" : "seconds"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === NOT EXPIRED: Normal suspended screen with countdown ===
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-8 gap-4 sm:gap-6">
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

          {/* Progress bar */}
          <div className="w-full space-y-1.5">
            <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  progressPercent > 70 ? "bg-destructive/70" : "bg-destructive/40"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{language === "th" ? "1 มี.ค. 2569" : "1 Mar 2026"}</span>
              <span>{language === "th" ? "15 มี.ค. 2569" : "15 Mar 2026"}</span>
            </div>
          </div>

          {/* Warning note */}
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {language === "th"
              ? "หมายเหตุ: หากพ้นกำหนดเวลาดังกล่าว ให้ถือว่าข้อตกลงและสัญญาจ้างฉบับนี้ ระงับสิ้นสุดลงโดยทันที เนื่องจากการผิดนัดชำระเงินตามที่ตกลงกันไว้ โดยผู้รับจ้างขอสงวนสิทธิ์ในทรัพย์สินทางปัญญา ซอร์สโค้ด และข้อมูลระบบทั้งหมดแต่เพียงผู้เดียว และจะไม่มีพันธะผูกพันในการส่งมอบงานหรือดูแลระบบอีกต่อไป"
              : "Note: If the above deadline passes, this agreement and service contract shall be immediately terminated due to breach of payment terms as agreed. The developer reserves sole ownership of all intellectual property, source code, and system data, and shall have no further obligation to deliver work or maintain the system."}
          </p>
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
