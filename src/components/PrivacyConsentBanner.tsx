import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { getPrivacyConsentState, savePrivacyConsentLog, setPrivacyConsentState } from "@/lib/privacyConsent";

export default function PrivacyConsentBanner() {
  const { language } = useLanguage();
  const { toggles, isLoading: featureLoading } = useFeatureToggle();
  const [visible, setVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const labels = useMemo(() => {
    if (language === "th") {
      return {
        title: "ประกาศความเป็นส่วนตัวและคุกกี้",
        short:
          "เพื่อยกระดับคุณภาพบริการ เราขอความยินยอมในการใช้คุกกี้และข้อมูลการใช้งานที่จำเป็น เพื่อนำไปพัฒนาเว็บไซต์ให้ตอบโจทย์ความต้องการของลูกค้าได้ดียิ่งขึ้น",
        details: "ดูรายละเอียด",
        accept: "ยินยอมรับ Cookie",
        reject: "ไม่ยินยอม",
        essential: "จำเป็น",
      };
    }
    return {
      title: "Privacy & Cookie Notice",
      short:
        "We process essential data for service delivery and request your consent before collecting analytics data.",
      details: "View details",
      accept: "Consent to Cookies",
      reject: "Do Not Consent",
      essential: "Essential",
    };
  }, [language]);

  useEffect(() => {
    const analyticsFeatureEnabled = !featureLoading && toggles["analytics"] === true;
    if (!analyticsFeatureEnabled) {
      setVisible(false);
      setDetailOpen(false);
      return;
    }

    const consent = getPrivacyConsentState();
    if (consent.status === "pending") {
      setVisible(true);
    } else {
      setVisible(false);
      setDetailOpen(false);
    }
  }, [featureLoading, toggles]);

  const onChoose = async (allowAnalytics: boolean) => {
    const status = allowAnalytics ? "accepted" : "rejected";
    setPrivacyConsentState(status, allowAnalytics);
    await savePrivacyConsentLog(status, allowAnalytics, language, "auto_entry");
    setVisible(false);
    setDetailOpen(false);

    if (!allowAnalytics) {
      window.location.replace("https://www.google.com");
    }
  };

  return (
    <>
      {visible && (
        <div className="fixed bottom-4 right-3 z-[120] w-[calc(100vw-1.5rem)] sm:w-[430px] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-sm shadow-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{labels.title}</p>
            <Badge variant="outline" className="text-[10px]">{labels.essential}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{labels.short}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(true)}>{labels.details}</Button>
            <Button variant="outline" size="sm" onClick={() => void onChoose(false)}>{labels.reject}</Button>
            <Button size="sm" onClick={() => void onChoose(true)}>{labels.accept}</Button>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-foreground">
            <div>
              <p className="font-medium">{language === "th" ? "เราเก็บข้อมูลอะไร" : "What we collect"}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {language === "th"
                  ? "เราเก็บเฉพาะข้อมูลที่จำเป็นต่อการให้บริการ การดูแลความปลอดภัย และข้อมูลการใช้งานโดยภาพรวม เพื่อช่วยให้เว็บไซต์ทำงานได้อย่างราบรื่นและมีประสิทธิภาพ"
                  : "Essential service/security data, chat messages submitted to the system, and analytics data such as visited pages, clicks, usage time, device/browser, and acquisition source (UTM/referrer)."}
              </p>
            </div>
            <div>
              <p className="font-medium">{language === "th" ? "เราเก็บเพื่ออะไร" : "Why we process"}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {language === "th"
                  ? "เราใช้ข้อมูลดังกล่าวเพื่อพัฒนาและยกระดับประสบการณ์ใช้งานของลูกค้า ปรับปรุงบริการให้ตอบโจทย์มากขึ้น และดูแลระบบให้ปลอดภัยอย่างต่อเนื่อง"
                  : "To provide chat services, prevent abuse, analyze usage, and improve service quality."}
              </p>
            </div>
            <div>
              <p className="font-medium">{language === "th" ? "การดูแลความปลอดภัยของข้อมูล" : "Data Security"}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {language === "th"
                  ? "เราให้ความสำคัญกับความปลอดภัยของข้อมูลลูกค้าอย่างสูงสุด มีมาตรการป้องกันที่เหมาะสมทั้งด้านเทคนิคและการบริหารจัดการ"
                  : "We apply appropriate technical and organizational safeguards, restrict access to authorized personnel, and continuously monitor system usage."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => void onChoose(false)}>{labels.reject}</Button>
              <Button size="sm" onClick={() => void onChoose(true)}>{labels.accept}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}