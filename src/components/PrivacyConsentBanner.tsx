import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useFeatureToggle } from "@/hooks/useFeatureToggle";
import { getPrivacyConsentState, savePrivacyConsentLog, setPrivacyConsentState } from "@/lib/privacyConsent";
import { t4 } from "@/lib/i18n";

export default function PrivacyConsentBanner() {
  const { language } = useLanguage();
  const { toggles, isLoading: featureLoading } = useFeatureToggle();
  const [visible, setVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const labels = useMemo(() => ({
    title: t4(language, "ประกาศความเป็นส่วนตัวและคุกกี้", "Privacy & Cookie Notice", "隐私和Cookie通知", "プライバシーとCookie通知"),
    short: t4(language,
      "เพื่อยกระดับคุณภาพบริการ เราขอความยินยอมในการใช้คุกกี้และข้อมูลการใช้งานที่จำเป็น เพื่อนำไปพัฒนาเว็บไซต์ให้ตอบโจทย์ความต้องการของลูกค้าได้ดียิ่งขึ้น",
      "We process essential data for service delivery and request your consent before collecting analytics data.",
      "我们处理必要的数据以提供服务，并在收集分析数据之前征求您的同意。",
      "サービス提供に必要なデータを処理し、分析データの収集前に同意をお願いしています。"
    ),
    details: t4(language, "ดูรายละเอียด", "View details", "查看详情", "詳細を見る"),
    accept: t4(language, "ยินยอมรับ Cookie", "Consent to Cookies", "同意Cookie", "Cookieに同意"),
    reject: t4(language, "ไม่ยินยอม", "Do Not Consent", "不同意", "同意しない"),
    essential: t4(language, "จำเป็น", "Essential", "必需", "必須"),
  }), [language]);

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
              <p className="font-medium">{t4(language, "เราเก็บข้อมูลอะไร", "What we collect", "我们收集什么", "収集するデータ")}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t4(language,
                  "เราเก็บเฉพาะข้อมูลที่จำเป็นต่อการให้บริการ การดูแลความปลอดภัย และข้อมูลการใช้งานโดยภาพรวม เพื่อช่วยให้เว็บไซต์ทำงานได้อย่างราบรื่นและมีประสิทธิภาพ",
                  "Essential service/security data, chat messages submitted to the system, and analytics data such as visited pages, clicks, usage time, device/browser, and acquisition source (UTM/referrer).",
                  "必要的服务/安全数据、提交的聊天消息以及分析数据，如访问页面、点击次数、使用时间、设备/浏览器和来源（UTM/推荐人）。",
                  "サービス/セキュリティに必要なデータ、チャットメッセージ、訪問ページ・クリック数・使用時間・デバイス/ブラウザ・流入元などの分析データ。"
                )}
              </p>
            </div>
            <div>
              <p className="font-medium">{t4(language, "เราเก็บเพื่ออะไร", "Why we process", "为什么处理", "処理の目的")}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t4(language,
                  "เราใช้ข้อมูลดังกล่าวเพื่อพัฒนาและยกระดับประสบการณ์ใช้งานของลูกค้า ปรับปรุงบริการให้ตอบโจทย์มากขึ้น และดูแลระบบให้ปลอดภัยอย่างต่อเนื่อง",
                  "To provide chat services, prevent abuse, analyze usage, and improve service quality.",
                  "提供聊天服务、防止滥用、分析使用情况并提高服务质量。",
                  "チャットサービスの提供、不正防止、利用分析、サービス品質の向上のため。"
                )}
              </p>
            </div>
            <div>
              <p className="font-medium">{t4(language, "การดูแลความปลอดภัยของข้อมูล", "Data Security", "数据安全", "データセキュリティ")}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t4(language,
                  "เราให้ความสำคัญกับความปลอดภัยของข้อมูลลูกค้าอย่างสูงสุด มีมาตรการป้องกันที่เหมาะสมทั้งด้านเทคนิคและการบริหารจัดการ",
                  "We apply appropriate technical and organizational safeguards, restrict access to authorized personnel, and continuously monitor system usage.",
                  "我们采用适当的技术和组织保障措施，限制授权人员访问，并持续监控系统使用情况。",
                  "適切な技術的・組織的な安全管理措置を実施し、権限のある担当者のみにアクセスを制限し、システムの使用を継続的に監視しています。"
                )}
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
