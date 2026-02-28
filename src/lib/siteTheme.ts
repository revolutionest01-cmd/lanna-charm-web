export type SiteThemeId = "original" | "ocean" | "sunset" | "forest" | "royal" | "mono";

export const SITE_THEME_OPTIONS: Array<{
  id: Exclude<SiteThemeId, "original">;
  labelTh: string;
  labelEn: string;
  preview: string;
}> = [
  { id: "ocean", labelTh: "Ocean Blue", labelEn: "Ocean Blue", preview: "from-blue-500 via-cyan-400 to-sky-400" },
  { id: "sunset", labelTh: "Sunset Gold", labelEn: "Sunset Gold", preview: "from-orange-500 via-amber-400 to-rose-400" },
  { id: "forest", labelTh: "Forest Mint", labelEn: "Forest Mint", preview: "from-emerald-600 via-green-500 to-teal-400" },
  { id: "royal", labelTh: "Royal Purple", labelEn: "Royal Purple", preview: "from-violet-600 via-purple-500 to-indigo-500" },
  { id: "mono", labelTh: "Mono Graphite", labelEn: "Mono Graphite", preview: "from-slate-700 via-zinc-600 to-gray-600" },
];

export const getSiteThemeFeatureKey = (themeId: SiteThemeId) => `site_theme_${themeId}`;

export const SITE_THEME_FEATURE_KEYS = SITE_THEME_OPTIONS.map((theme) => getSiteThemeFeatureKey(theme.id));

export const SITE_THEME_SELECT_OPTIONS: Array<{
  id: SiteThemeId;
  labelTh: string;
  labelEn: string;
  preview: string;
}> = [
  { id: "original", labelTh: "Original", labelEn: "Original", preview: "from-neutral-700 via-stone-500 to-zinc-400" },
  ...SITE_THEME_OPTIONS,
];

const LOCAL_THEME_KEY = "site-theme-local";

export const resolveSiteThemeFromRows = (
  rows: Array<{ feature_key: string; is_enabled: boolean }> | null | undefined
): SiteThemeId => {
  if (!rows?.length) return "original";

  const enabledMap = new Map(rows.map((row) => [row.feature_key, row.is_enabled]));
  const matched = SITE_THEME_OPTIONS.find((theme) => enabledMap.get(getSiteThemeFeatureKey(theme.id)) === true);
  return matched?.id || "original";
};

export const applySiteThemeClass = (themeId: SiteThemeId) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  SITE_THEME_OPTIONS.forEach((theme) => root.classList.remove(`site-theme-${theme.id}`));
  if (themeId !== "original") {
    root.classList.add(`site-theme-${themeId}`);
  }
  root.setAttribute("data-site-theme", themeId);
  if (themeId === "original") {
    root.removeAttribute("data-site-theme");
  }
};

export const getLocalSiteTheme = (): SiteThemeId => {
  if (typeof localStorage === "undefined") return "original";
  const stored = localStorage.getItem(LOCAL_THEME_KEY);
  const matched = SITE_THEME_SELECT_OPTIONS.find((theme) => theme.id === stored);
  return matched?.id || "original";
};

export const setLocalSiteTheme = (themeId: SiteThemeId) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LOCAL_THEME_KEY, themeId);
};
