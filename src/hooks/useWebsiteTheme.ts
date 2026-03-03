import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  applySiteThemeClass,
  getLocalSiteTheme,
  resolveSiteThemeFromRows,
  setLocalSiteTheme,
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

      const resolvedTheme = resolveSiteThemeFromRows(data || []);
      applySiteThemeClass(resolvedTheme);
      setLocalSiteTheme(resolvedTheme);
    };

    syncTheme();

    const handleVisibilityOrFocus = () => {
      if (!mounted) return;
      syncTheme();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    const channel = supabase
      .channel("website-theme-global-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feature_toggles" },
        () => {
          syncTheme();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      supabase.removeChannel(channel);
    };
  }, []);
};
