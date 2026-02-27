import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applySiteThemeClass,
  getLocalSiteTheme,
  resolveSiteThemeFromRows,
  SITE_THEME_FEATURE_KEYS,
} from "@/lib/siteTheme";

export const useWebsiteTheme = () => {
  useEffect(() => {
    let mounted = true;
    applySiteThemeClass(getLocalSiteTheme());

    const syncTheme = async () => {
      const { data, error } = await supabase
        .from("feature_toggles")
        .select("feature_key, is_enabled")
        .in("feature_key", SITE_THEME_FEATURE_KEYS);

      if (error) return;
      if (!mounted) return;

      applySiteThemeClass(resolveSiteThemeFromRows(data || []));
    };

    syncTheme();

    const channel = supabase
      .channel("website-theme-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_toggles" },
        (payload) => {
          const changedKey =
            (payload.new && "feature_key" in payload.new ? (payload.new as { feature_key?: string }).feature_key : undefined) ||
            (payload.old && "feature_key" in payload.old ? (payload.old as { feature_key?: string }).feature_key : undefined);

          if (changedKey?.startsWith("site_theme_")) {
            syncTheme();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);
};
