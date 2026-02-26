/**
 * Badges & Achievements System
 * ระบบเข็มกลัดและความสำเร็จ
 */

export interface Badge {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  color: string;
  category: 'writer' | 'helper' | 'engagement' | 'special';
  condition: (userStats: UserStats) => boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  totalPosts: number;
  totalLikesReceived: number;
  totalViewsOnPosts: number;
  totalAnswersGiven: number;
  consecutiveLoginDays: number;
  totalReputationPoints: number;
  helpfulAnswers: number;
  createdAt: Date;
}

/**
 * Badge Definitions
 * ระบบเข็มกลัดพิเศษ
 */
export const BADGES: Record<string, Badge> = {
  // Writer Badges
  "golden-writer": {
    id: "golden-writer",
    name: "นักเขียนมือทอง",
    nameEn: "Golden Writer",
    description: "โพสต์ที่ได้อ่านกว่า 10,000 ครั้ง",
    descriptionEn: "Create a post viewed over 10,000 times",
    icon: "✍️",
    color: "from-amber-500 to-yellow-500",
    category: "writer",
    rarity: "epic",
    condition: (stats) => stats.totalViewsOnPosts >= 10000,
  },
  "prolific-author": {
    id: "prolific-author",
    name: "ผู้แต่งมากมาย",
    nameEn: "Prolific Author",
    description: "สร้างโพสต์มากกว่า 50 รายการ",
    descriptionEn: "Create more than 50 posts",
    icon: "📚",
    color: "from-blue-500 to-cyan-500",
    category: "writer",
    rarity: "rare",
    condition: (stats) => stats.totalPosts >= 50,
  },

  // Helper Badges
  "rescue-unit": {
    id: "rescue-unit",
    name: "หน่วยกู้ภัย",
    nameEn: "Rescue Unit",
    description: "ตอบคำถามได้ สำเร็จ 25 ครั้ง",
    descriptionEn: "Answer helpful questions 25 times",
    icon: "🚨",
    color: "from-red-500 to-pink-500",
    category: "helper",
    rarity: "rare",
    condition: (stats) => stats.helpfulAnswers >= 25,
  },
  "community-hero": {
    id: "community-hero",
    name: "วีรชนชุมชน",
    nameEn: "Community Hero",
    description: "ได้คะแนน Reputation มากกว่า 1,000",
    descriptionEn: "Earn over 1,000 reputation points",
    icon: "🦸",
    color: "from-purple-500 to-pink-500",
    category: "helper",
    rarity: "epic",
    condition: (stats) => stats.totalReputationPoints >= 1000,
  },

  // Engagement Badges
  "true-fan": {
    id: "true-fan",
    name: "แฟนพันธุ์แท้",
    nameEn: "True Fan",
    description: "ล็อกอินติดต่อกัน 30 วัน",
    descriptionEn: "Log in for 30 consecutive days",
    icon: "❤️",
    color: "from-red-500 to-rose-500",
    category: "engagement",
    rarity: "rare",
    condition: (stats) => stats.consecutiveLoginDays >= 30,
  },
  "superfan": {
    id: "superfan",
    name: "แฟนยิ่งใหญ่",
    nameEn: "Superfan",
    description: "ล็อกอินติดต่อกัน 100 วัน",
    descriptionEn: "Log in for 100 consecutive days",
    icon: "🔥",
    color: "from-orange-500 to-red-500",
    category: "engagement",
    rarity: "legendary",
    condition: (stats) => stats.consecutiveLoginDays >= 100,
  },
  "popular-choice": {
    id: "popular-choice",
    name: "ตัวเลือกที่นิยม",
    nameEn: "Popular Choice",
    description: "ได้ Like มากกว่า 500 ครั้ง",
    descriptionEn: "Receive over 500 likes",
    icon: "👍",
    color: "from-blue-500 to-cyan-500",
    category: "engagement",
    rarity: "rare",
    condition: (stats) => stats.totalLikesReceived >= 500,
  },

  // Special Badges
  "founding-member": {
    id: "founding-member",
    name: "สมาชิกก่อตั้ง",
    nameEn: "Founding Member",
    description: "สมาชิกตั้งแต่เปิดตัว",
    descriptionEn: "Member since launch day",
    icon: "🏆",
    color: "from-yellow-500 to-amber-500",
    category: "special",
    rarity: "legendary",
    condition: (stats) => {
      const days = (new Date().getTime() - stats.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 365; // 1+ year member
    },
  },
  "verified-expert": {
    id: "verified-expert",
    name: "ผู้เชี่ยวชาญยืนยัน",
    nameEn: "Verified Expert",
    description: "ตัวแทนจากแอดมิน",
    descriptionEn: "Verified by administrators",
    icon: "✓",
    color: "from-green-500 to-emerald-500",
    category: "special",
    rarity: "legendary",
    condition: () => false, // Manual award only
  },
};

/**
 * Get badges earned by user based on stats
 */
export const getEarnedBadges = (userStats: UserStats): Badge[] => {
  return Object.values(BADGES).filter((badge) => badge.condition(userStats));
};

/**
 * Get next achievable badge
 */
export const getNextBadge = (userStats: UserStats): Badge | null => {
  const earned = getEarnedBadges(userStats);
  const earnedIds = new Set(earned.map((b) => b.id));

  const unearned = Object.values(BADGES).filter((badge) => !earnedIds.has(badge.id));

  if (unearned.length === 0) return null;

  // Sort by rarity to show most valuable next
  const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
  return unearned.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])[0];
};

/**
 * Get badge progress (0-100)
 */
export const getBadgeProgress = (badge: Badge, userStats: UserStats): number => {
  const progresses: Record<string, number> = {
    "golden-writer": (userStats.totalViewsOnPosts / 10000) * 100,
    "prolific-author": (userStats.totalPosts / 50) * 100,
    "rescue-unit": (userStats.helpfulAnswers / 25) * 100,
    "community-hero": (userStats.totalReputationPoints / 1000) * 100,
    "true-fan": (userStats.consecutiveLoginDays / 30) * 100,
    "superfan": (userStats.consecutiveLoginDays / 100) * 100,
    "popular-choice": (userStats.totalLikesReceived / 500) * 100,
  };

  return Math.min(100, progresses[badge.id] || 0);
};
