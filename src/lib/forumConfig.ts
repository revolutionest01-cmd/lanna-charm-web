/**
 * Forum Configuration
 * Centralized configuration for forum categories, colors, and styling
 * Removes hardcoding and allows easy updates without code changes
 */

export interface ForumCategory {
  value: string;
  label: {
    th: string;
    en: string;
  };
  color: {
    bg: string;
    text: string;
    border: string;
  };
  icon?: string;
  description?: {
    th: string;
    en: string;
  };
}

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    value: "general",
    label: { th: "ทั่วไป", en: "General" },
    color: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-200 dark:border-blue-800",
    },
    icon: "💬",
    description: {
      th: "สนทนาทั่วไป",
      en: "General discussion",
    },
  },
  {
    value: "question",
    label: { th: "คำถาม", en: "Question" },
    color: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    icon: "❓",
    description: {
      th: "ถามคำถาม",
      en: "Ask questions",
    },
  },
  {
    value: "review",
    label: { th: "รีวิว", en: "Review" },
    color: {
      bg: "bg-rose-50 dark:bg-rose-950/30",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-200 dark:border-rose-800",
    },
    icon: "⭐",
    description: {
      th: "แบ่งปันรีวิว",
      en: "Share reviews",
    },
  },
  {
    value: "shopping",
    label: { th: "ของแนะนำ", en: "Shoppable" },
    color: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-200 dark:border-amber-800",
    },
    icon: "🛍️",
    description: {
      th: "ของแนะนำ",
      en: "Product recommendations",
    },
  },
];

export const getCategoryConfig = (categoryValue: string): ForumCategory | undefined => {
  return FORUM_CATEGORIES.find((cat) => cat.value === categoryValue);
};

export const getCategoryLabel = (categoryValue: string, language: "th" | "en"): string => {
  const config = getCategoryConfig(categoryValue);
  return config ? config.label[language] : categoryValue;
};

export const getCategoryColor = (categoryValue: string): { bg: string; text: string; border: string } => {
  const config = getCategoryConfig(categoryValue);
  return config
    ? config.color
    : { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
};

export const getCategoryBadgeColor = (categoryValue: string): string => {
  const colors = getCategoryColor(categoryValue);
  return `${colors.bg} ${colors.text} border ${colors.border}`;
};

/**
 * Forum Constants
 */
export const FORUM_CONFIG = {
  ITEMS_PER_PAGE: 10,
  POPULAR_TOPICS_LIMIT: 5,
  RECENT_TOPICS_LIMIT: 20,
  SEARCH_MIN_LENGTH: 2,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};

/**
 * Get all categories without "all" option
 */
export const getForumCategories = () => {
  return FORUM_CATEGORIES;
};

/**
 * Get categories with "all" option prefix
 */
export const getCategoriesWithAll = (language: "th" | "en") => {
  return [
    {
      value: "all",
      label: language === "th" ? "ทั้งหมด" : "All",
      icon: "📋",
    },
    ...FORUM_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label[language],
      icon: cat.icon,
    })),
  ];
};
