/**
 * Utility for inline 4-language translations.
 * Usage: t4(language, "ไทย", "English", "中文", "日本語")
 */
export const t4 = (
  language: string,
  th: string,
  en: string,
  zh?: string,
  ja?: string
): string => {
  switch (language) {
    case "th": return th;
    case "zh": return zh || en;
    case "ja": return ja || en;
    default: return en;
  }
};
