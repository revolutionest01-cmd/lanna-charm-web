import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { t4 } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Copy, Check, RotateCcw, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";

const COMMON_SOURCES = ["google", "facebook", "instagram", "line", "twitter", "tiktok", "email", "newsletter"];
const COMMON_MEDIUMS = ["cpc", "social", "email", "banner", "referral", "organic", "video", "affiliate"];

export const UTMLinkGenerator = () => {
  const { language } = useLanguage();
  const [baseUrl, setBaseUrl] = useState("https://lanna-charm-web.lovable.app");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generatedUrl = useMemo(() => {
    if (!baseUrl || !source || !medium || !campaign) return "";
    try {
      const url = new URL(baseUrl);
      url.searchParams.set("utm_source", source);
      url.searchParams.set("utm_medium", medium);
      url.searchParams.set("utm_campaign", campaign);
      if (content) url.searchParams.set("utm_content", content);
      if (term) url.searchParams.set("utm_term", term);
      return url.toString();
    } catch {
      return "";
    }
  }, [baseUrl, source, medium, campaign, content, term]);

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    if (!history.includes(generatedUrl)) {
      setHistory((prev) => [generatedUrl, ...prev].slice(0, 10));
    }
    toast.success(t4(language, "คัดลอกลิงก์แล้ว", "Link copied!", "链接已复制", "リンクをコピーしました"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSource("");
    setMedium("");
    setCampaign("");
    setContent("");
    setTerm("");
  };

  const isValid = baseUrl && source && medium && campaign;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          {t4(language, "สร้างลิงก์ UTM", "UTM Link Generator", "UTM 链接生成器", "UTMリンク生成")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t4(language,
            "สร้างลิงก์พร้อม UTM parameters สำหรับติดตามแคมเปญการตลาด",
            "Generate links with UTM parameters to track marketing campaigns",
            "生成带有UTM参数的链接以跟踪营销活动",
            "マーケティングキャンペーンを追跡するためのUTMパラメータ付きリンクを生成"
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t4(language, "ตั้งค่าพารามิเตอร์", "Configure Parameters", "配置参数", "パラメータ設定")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t4(language, "* จำเป็น", "* Required", "* 必填", "* 必須")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                URL *
              </label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_source * <span className="text-xs text-muted-foreground font-normal">({t4(language, "แหล่งที่มา", "Source", "来源", "ソース")})</span>
              </label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. google, facebook, newsletter"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SOURCES.map((s) => (
                  <Badge
                    key={s}
                    variant={source === s ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5"
                    onClick={() => setSource(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_medium * <span className="text-xs text-muted-foreground font-normal">({t4(language, "ช่องทาง", "Medium", "媒介", "メディア")})</span>
              </label>
              <Input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. cpc, social, email"
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MEDIUMS.map((m) => (
                  <Badge
                    key={m}
                    variant={medium === m ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5"
                    onClick={() => setMedium(m)}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Campaign */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_campaign * <span className="text-xs text-muted-foreground font-normal">({t4(language, "แคมเปญ", "Campaign", "活动", "キャンペーン")})</span>
              </label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="e.g. summer_sale, launch_2026"
              />
            </div>

            {/* Content (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_content <span className="text-xs text-muted-foreground font-normal">({t4(language, "เนื้อหา", "Content", "内容", "コンテンツ")})</span>
              </label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. banner_top, cta_button"
              />
            </div>

            {/* Term (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_term <span className="text-xs text-muted-foreground font-normal">({t4(language, "คำค้นหา", "Term", "关键词", "キーワード")})</span>
              </label>
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g. coffee+shop, lanna+hotel"
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              {t4(language, "รีเซ็ต", "Reset", "重置", "リセット")}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t4(language, "ลิงก์ที่สร้างแล้ว", "Generated Link", "生成的链接", "生成されたリンク")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedUrl ? (
                <>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border break-all text-sm font-mono text-foreground select-all">
                    {generatedUrl}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} className="gap-1.5 flex-1">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied
                        ? t4(language, "คัดลอกแล้ว!", "Copied!", "已复制!", "コピー済み!")
                        : t4(language, "คัดลอก", "Copy Link", "复制链接", "コピー")}
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {t4(language,
                    "กรอก URL, Source, Medium และ Campaign เพื่อสร้างลิงก์",
                    "Fill in URL, Source, Medium and Campaign to generate a link",
                    "填写URL、来源、媒介和活动以生成链接",
                    "URL、ソース、メディア、キャンペーンを入力してリンクを生成"
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Parameter Preview */}
          {isValid && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t4(language, "สรุปพารามิเตอร์", "Parameter Summary", "参数摘要", "パラメータ概要")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  {[
                    { key: "utm_source", val: source },
                    { key: "utm_medium", val: medium },
                    { key: "utm_campaign", val: campaign },
                    ...(content ? [{ key: "utm_content", val: content }] : []),
                    ...(term ? [{ key: "utm_term", val: term }] : []),
                  ].map((p) => (
                    <div key={p.key} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5">{p.key}</Badge>
                      <span className="text-foreground">{p.val}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t4(language, "ประวัติลิงก์ล่าสุด", "Recent Links", "最近的链接", "最近のリンク")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs group">
                      <p className="flex-1 truncate font-mono text-muted-foreground">{url}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          await navigator.clipboard.writeText(url);
                          toast.success(t4(language, "คัดลอกแล้ว", "Copied", "已复制", "コピー済み"));
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
