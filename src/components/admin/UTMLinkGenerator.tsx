import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, Copy, Check, RotateCcw, ExternalLink, Info, Sparkles } from "lucide-react";
import { toast } from "sonner";

const COMMON_SOURCES = ["google", "facebook", "instagram", "line", "twitter", "tiktok", "email", "newsletter"];
const COMMON_MEDIUMS = ["cpc", "social", "email", "banner", "referral", "organic", "video", "affiliate"];

export const UTMLinkGenerator = () => {
  const { language } = useLanguage();
  const isTh = language === "th";
  const [baseUrl, setBaseUrl] = useState("https://www.plernping.com");
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
      if (content.trim()) url.searchParams.set("utm_content", content.trim());
      if (term.trim()) url.searchParams.set("utm_term", term.trim());
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
    toast.success(isTh ? "คัดลอกลิงก์แล้ว" : "Link copied!");
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
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          {isTh ? "สร้างลิงก์ UTM" : "UTM Link Generator"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isTh
            ? "สร้างลิงก์พร้อม UTM parameters สำหรับติดตามแคมเปญการตลาดใน Web Analytics"
            : "Generate links with UTM parameters to track marketing campaigns in Web Analytics"}
        </p>
      </div>

      {/* Guide Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-foreground/80 space-y-1">
            <p className="font-medium text-foreground">
              {isTh ? "UTM คืออะไร?" : "What is UTM?"}
            </p>
            <p>
              {isTh
                ? "UTM (Urchin Tracking Module) คือ parameters ที่เพิ่มท้าย URL เพื่อติดตามว่าผู้เข้าชมมาจากแหล่งใด ช่องทางไหน และแคมเปญอะไร ข้อมูลเหล่านี้จะแสดงใน Web Analytics Dashboard"
                : "UTM parameters are added to URLs to track where visitors come from — which source, medium, and campaign. This data appears in the Web Analytics Dashboard."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Form ─── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {isTh ? "ตั้งค่าพารามิเตอร์" : "Configure Parameters"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                {isTh ? "URL ปลายทาง" : "Destination URL"} <span className="text-destructive">*</span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <p className="text-[11px] text-muted-foreground">
                {isTh ? "URL หน้าเว็บที่ต้องการให้ผู้ใช้ไปถึง" : "The web page URL you want users to land on"}
              </p>
            </div>

            <Separator className="bg-border/60" />

            {/* Source */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                utm_source <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {isTh ? "แหล่งที่มาของทราฟฟิก" : "Traffic source"}
                </span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder={isTh ? "เช่น google, facebook, line" : "e.g. google, facebook, line"}
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SOURCES.map((s) => (
                  <Badge
                    key={s}
                    variant={source === s ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 transition-all hover:scale-105"
                    onClick={() => setSource(s)}
                  >
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isTh ? "ระบุแพลตฟอร์มที่โพสต์ลิงก์ เช่น google, facebook, line" : "The platform where the link is posted, e.g. google, facebook, line"}
              </p>
            </div>

            {/* Medium */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                utm_medium <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {isTh ? "ประเภทช่องทาง" : "Marketing channel type"}
                </span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder={isTh ? "เช่น cpc, social, email" : "e.g. cpc, social, email"}
              />
              <div className="flex flex-wrap gap-1.5">
                {COMMON_MEDIUMS.map((m) => (
                  <Badge
                    key={m}
                    variant={medium === m ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 transition-all hover:scale-105"
                    onClick={() => setMedium(m)}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isTh ? "ระบุประเภทการตลาด เช่น cpc (โฆษณาจ่ายเงิน), social (โซเชียลมีเดีย), email" : "Marketing type, e.g. cpc (paid ads), social (social media), email"}
              </p>
            </div>

            {/* Campaign */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                utm_campaign <span className="text-destructive">*</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {isTh ? "ชื่อแคมเปญ" : "Campaign name"}
                </span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder={isTh ? "เช่น summer_sale, promo_march2026" : "e.g. summer_sale, promo_march2026"}
              />
              <p className="text-[11px] text-muted-foreground">
                {isTh ? "ตั้งชื่อแคมเปญให้จำง่าย ใช้ underscore แทนเว้นวรรค" : "Name your campaign clearly, use underscores instead of spaces"}
              </p>
            </div>

            <Separator className="bg-border/60" />

            <p className="text-xs font-medium text-muted-foreground">
              {isTh ? "ตัวเลือกเพิ่มเติม (ไม่บังคับ)" : "Additional options (optional)"}
            </p>

            {/* Content (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_content
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {isTh ? "ระบุตำแหน่งหรือรูปแบบโฆษณา" : "Ad placement or creative variant"}
                </span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isTh ? "เช่น banner_top, cta_button, sidebar_ad" : "e.g. banner_top, cta_button, sidebar_ad"}
              />
            </div>

            {/* Term (optional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                utm_term
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {isTh ? "คำค้นหาสำหรับโฆษณา" : "Search keywords for paid ads"}
                </span>
              </label>
              <Input
                className="bg-white dark:bg-background"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={isTh ? "เช่น coffee+chiangmai, lanna+resort" : "e.g. coffee+chiangmai, lanna+resort"}
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 border-border">
              <RotateCcw className="w-3.5 h-3.5" />
              {isTh ? "รีเซ็ตทั้งหมด" : "Reset All"}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Result ─── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isTh ? "ลิงก์ที่สร้างแล้ว" : "Generated Link"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedUrl ? (
                <>
                  <div className="p-3 rounded-lg bg-accent/50 border border-border break-all text-sm font-mono text-foreground select-all leading-relaxed">
                    {generatedUrl}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} className="gap-1.5 flex-1 shadow-sm">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? (isTh ? "คัดลอกแล้ว!" : "Copied!") : (isTh ? "คัดลอกลิงก์" : "Copy Link")}
                    </Button>
                    <Button variant="outline" size="icon" className="border-border" asChild>
                      <a href={generatedUrl} target="_blank" rel="noopener noreferrer" title={isTh ? "เปิดลิงก์" : "Open link"}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Link2 className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {isTh
                      ? "กรอก Source, Medium และ Campaign เพื่อสร้างลิงก์"
                      : "Fill in Source, Medium and Campaign to generate a link"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parameter Summary */}
          {isValid && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {isTh ? "สรุปพารามิเตอร์" : "Parameter Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { key: "utm_source", val: source, label: isTh ? "แหล่งที่มา" : "Source" },
                    { key: "utm_medium", val: medium, label: isTh ? "ช่องทาง" : "Medium" },
                    { key: "utm_campaign", val: campaign, label: isTh ? "แคมเปญ" : "Campaign" },
                    ...(content.trim() ? [{ key: "utm_content", val: content, label: isTh ? "เนื้อหา" : "Content" }] : []),
                    ...(term.trim() ? [{ key: "utm_term", val: term, label: isTh ? "คำค้นหา" : "Term" }] : []),
                  ].map((p) => (
                    <div key={p.key} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 shrink-0">{p.key}</Badge>
                      <span className="text-muted-foreground text-xs">=</span>
                      <span className="text-foreground font-medium">{p.val}</span>
                      <span className="text-muted-foreground text-[11px] ml-auto hidden sm:inline">({p.label})</span>
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
                  {isTh ? "ประวัติลิงก์ล่าสุด" : "Recent Links"}
                  <Badge variant="secondary" className="ml-2 text-[10px]">{history.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {history.map((url, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs group p-2 rounded-md hover:bg-accent/40 transition-colors">
                      <p className="flex-1 truncate font-mono text-muted-foreground">{url}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={async () => {
                          await navigator.clipboard.writeText(url);
                          toast.success(isTh ? "คัดลอกแล้ว" : "Copied");
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
