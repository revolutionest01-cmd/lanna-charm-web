import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {t4(language, "ไม่พบหน้าที่คุณต้องการ", "Oops! Page not found", "页面未找到", "ページが見つかりません")}
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t4(language, "กลับสู่หน้าแรก", "Return to Home", "返回首页", "ホームに戻る")}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
