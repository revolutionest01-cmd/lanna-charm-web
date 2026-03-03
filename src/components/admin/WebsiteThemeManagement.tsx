import { useEffect, useRef, useState } from "react";
import { Palette, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import sweetAlert from "@/lib/sweetAlert";
import { clearFeatureToggleCache } from "@/hooks/useFeatureToggle";
import {
  applySiteThemeClass,
  getSiteThemeFeatureKey,
  resolveSiteThemeFromRows,
  setLocalSiteTheme,
  SITE_THEME_FEATURE_KEYS,
  SITE_THEME_OPTIONS,
  SITE_THEME_SELECT_OPTIONS,
  type SiteThemeId,
} from "@/lib/siteTheme";

const REQUIRED_THEME_TOGGLES: Array<{
  feature_key: string;
  feature_name_th: string;
  feature_name_en: string;
  description_th: string;
  description_en: string;
  is_enabled: boolean;
}> = [
  {
    feature_key: "site_theme_ocean",
    feature_name_th: "ธีมเว็บไซต์: Ocean Blue",
    feature_name_en: "Website Theme: Ocean Blue",
    description_th: "ธีมหลักสีฟ้า Ocean สำหรับทั้งเว็บไซต์",
    description_en: "Ocean Blue global website theme",
    is_enabled: true,
  },
  {
    feature_key: "site_theme_sunset",
    feature_name_th: "ธีมเว็บไซต์: Sunset Gold",
    feature_name_en: "Website Theme: Sunset Gold",
    description_th: "ธีมสีทองส้ม Sunset สำหรับทั้งเว็บไซต์",
    description_en: "Sunset Gold global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_forest",
    feature_name_th: "ธีมเว็บไซต์: Forest Mint",
    feature_name_en: "Website Theme: Forest Mint",
    description_th: "ธีมสีเขียว Forest สำหรับทั้งเว็บไซต์",
    description_en: "Forest Mint global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_royal",
    feature_name_th: "ธีมเว็บไซต์: Royal Purple",
    feature_name_en: "Website Theme: Royal Purple",
    description_th: "ธีมสีม่วง Royal สำหรับทั้งเว็บไซต์",
    description_en: "Royal Purple global website theme",
    is_enabled: false,
  },
  {
    feature_key: "site_theme_mono",
    feature_name_th: "ธีมเว็บไซต์: Mono Graphite",
    feature_name_en: "Website Theme: Mono Graphite",
    description_th: "ธีมโมโนโทน Mono สำหรับทั้งเว็บไซต์",
    description_en: "Mono Graphite global website theme",
    is_enabled: false,
  },
];

export const WebsiteThemeManagement = () => {
  const { language } = useLanguage();
  const [activeTheme, setActiveTheme] = useState<SiteThemeId>("original");
  const [pendingTheme, setPendingTheme] = useState<SiteThemeId>("original");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeThemeRef = useRef<SiteThemeId>("original");

  useEffect(() => {
    activeThemeRef.current = activeTheme;
  }, [activeTheme]);

  const loadTheme = async () => {
    setLoading(true);

    const { data: existingRows } = await supabase
      .from("feature_toggles")
      .select("feature_key")
      .in("feature_key", SITE_THEME_FEATURE_KEYS);

    const existingKeys = new Set((existingRows || []).map((row) => row.feature_key));
    const missingThemeRows = REQUIRED_THEME_TOGGLES.filter((feature) => !existingKeys.has(feature.feature_key));

    if (missingThemeRows.length > 0) {
      await supabase
        .from("feature_toggles")
        .upsert(missingThemeRows, { onConflict: "feature_key" });
    }

    const { data, error } = await supabase
      .from("feature_toggles")
      .select("feature_key, is_enabled, updated_at")
      .in("feature_key", SITE_THEME_FEATURE_KEYS);

    if (!error && data) {
      const resolvedTheme = resolveSiteThemeFromRows(data);
      setActiveTheme(resolvedTheme);
      setPendingTheme((currentPending) =>
        currentPending === activeThemeRef.current ? resolvedTheme : currentPending
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const handleThemeChange = async () => {
    if (updating || pendingTheme === activeTheme) return;

    const themeId = pendingTheme;

    const targetThemeLabel =
      language === "th"
        ? SITE_THEME_SELECT_OPTIONS.find((theme) => theme.id === themeId)?.labelTh || themeId
        : SITE_THEME_SELECT_OPTIONS.find((theme) => theme.id === themeId)?.labelEn || themeId;

    const confirmed = await sweetAlert.modal.confirm(
      language === "th"
        ? `ยืนยันเปลี่ยนธีมเว็บไซต์เป็น ${targetThemeLabel}?`
        : `Confirm changing website theme to ${targetThemeLabel}?`,
      language === "th"
        ? "การเปลี่ยนแปลงนี้จะมีผลกับหน้าเว็บทั้งระบบ"
        : "This will update the color scheme across the entire website"
    );

    if (!confirmed) return;

    setUpdating(true);

    const updates = await Promise.all(
      SITE_THEME_OPTIONS.map((theme) =>
        supabase
          .from("feature_toggles")
          .update({ is_enabled: theme.id === themeId })
          .eq("feature_key", getSiteThemeFeatureKey(theme.id))
      )
    );

    const hasError = updates.some((result) => result.error);

    if (hasError) {
      sweetAlert.warning(
        language === "th"
          ? "ไม่สามารถอัปเดตธีมทั้งระบบได้ในตอนนี้"
          : "Unable to update the global website theme right now"
      );
      setUpdating(false);
      return;
    }

    clearFeatureToggleCache();
    setActiveTheme(themeId);
    setPendingTheme(themeId);
    applySiteThemeClass(themeId);
    setLocalSiteTheme(themeId);
    await loadTheme();
    sweetAlert.success(language === "th" ? "เปลี่ยนธีมเว็บไซต์สำเร็จ" : "Website theme updated successfully");
    setUpdating(false);
  };

  const hasPendingChange = pendingTheme !== activeTheme;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Palette className="w-5 h-5 text-primary" />
            {language === "th" ? "ธีมเว็บไซต์" : "Website Theme"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {language === "th"
              ? "เลือกธีมสีหลักของเว็บไซต์ (มีการยืนยันก่อนเปลี่ยนทุกครั้ง)"
              : "Select the website color theme (confirmation is required before each change)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {SITE_THEME_SELECT_OPTIONS.map((theme) => {
              const isActive = activeTheme === theme.id;
              const isSelected = pendingTheme === theme.id;
              return (
                <Button
                  key={theme.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  disabled={updating}
                  onClick={() => setPendingTheme(theme.id)}
                  className="h-auto py-2.5 px-3 flex flex-col items-start gap-2"
                >
                  <span className={`w-full h-2.5 rounded-full bg-gradient-to-r ${theme.preview}`} />
                  <span className="text-xs font-semibold leading-none">
                    {language === "th" ? theme.labelTh : theme.labelEn}
                  </span>
                  {isActive && (
                    <span className="text-[10px] leading-none opacity-90">
                      {language === "th" ? "ใช้งานอยู่" : "Active"}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={updating || !hasPendingChange}
              onClick={() => setPendingTheme(activeTheme)}
            >
              {language === "th" ? "ยกเลิกการเลือก" : "Discard Selection"}
            </Button>
            <Button
              type="button"
              disabled={updating || !hasPendingChange}
              onClick={handleThemeChange}
            >
              {language === "th" ? "ยืนยันการเปลี่ยนธีม" : "Confirm Theme Change"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
