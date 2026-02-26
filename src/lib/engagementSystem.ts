/**
 * Gamification & Engagement Triggers System
 * ระบบการกระตุ้นการมีส่วนร่วม (Quests, Events, Leaderboards, Rewards)
 */

// ==================== QUESTS SYSTEM ====================

export const DAILY_QUESTS = [
  {
    id: "login-streak-3",
    name: "นักเดินทาง",
    nameEn: "Wanderer",
    description: "เข้าสู่ระบบต่อเนื่อง 3 วัน",
    descriptionEn: "Log in consecutively for 3 days",
    icon: "🔥",
    requirement: 3,
    reward: 10,
    category: "daily",
    progress: 0,
    isCompleted: false,
  },
  {
    id: "reply-general-2",
    name: "นักสนทนา",
    nameEn: "Conversationalist",
    description: "ตอบ 2 กระทู้ในหมวด 'ทั่วไป'",
    descriptionEn: "Reply to 2 topics in 'General' category",
    icon: "💬",
    requirement: 2,
    reward: 10,
    category: "daily",
    progress: 0,
    isCompleted: false,
  },
  {
    id: "like-friends-5",
    name: "ผู้อาทร",
    nameEn: "Supporter",
    description: "กดถูกใจให้เพื่อน 5 คน",
    descriptionEn: "Give likes to 5 people",
    icon: "👍",
    requirement: 5,
    reward: 10,
    category: "daily",
    progress: 0,
    isCompleted: false,
  },
  {
    id: "read-forum-10",
    name: "ผู้รักษา",
    nameEn: "Guardian",
    description: "อ่านกระทู้ 10 เรื่อง",
    descriptionEn: "Read 10 threads",
    icon: "📖",
    requirement: 10,
    reward: 5,
    category: "daily",
    progress: 0,
    isCompleted: false,
  },
];

export const ACHIEVEMENTS = [
  {
    id: "first-topic",
    name: "ผู้บอกเล่าคนแรก",
    nameEn: "First Post",
    description: "ตั้งกระทู้แรกของตัวเอง",
    descriptionEn: "Create your first topic",
    icon: "🎉",
    reward: 25,
    badge: "first-poster",
    category: "achievement",
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "best-answer",
    name: "ผู้ช่วยเหลือ",
    nameEn: "Helper",
    description: "ได้ 'Best Answer' ครั้งแรก",
    descriptionEn: "Get your first 'Best Answer'",
    icon: "🏆",
    reward: 50,
    badge: "helper",
    category: "achievement",
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "viral-topic",
    name: "ผู้นำโลก",
    nameEn: "Trendsetter",
    description: "ตั้งกระทู้ที่มีคนเข้าชมเกิน 1,000 ครั้ง",
    descriptionEn: "Create a topic with 1,000+ views",
    icon: "🚀",
    reward: 100,
    badge: "trendsetter",
    category: "achievement",
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "helpful-reviewer",
    name: "นักวิจารณ์",
    nameEn: "Reviewer",
    description: "เขียนรีวิว 5 เรื่องที่ได้ 'Helpful' มากกว่า 10 ครั้ง",
    descriptionEn: "Write 5 helpful reviews (10+ marks each)",
    icon: "⭐",
    reward: 75,
    badge: "reviewer",
    category: "achievement",
    isUnlocked: false,
    progress: 0,
  },
  {
    id: "social-butterfly",
    name: "ผีเสื้อสังคม",
    nameEn: "Social Butterfly",
    description: "ได้รับ 50 ไลค์ในโพสต์ของตัวเอง",
    descriptionEn: "Receive 50 likes on your posts",
    icon: "🦋",
    reward: 60,
    badge: "social-butterfly",
    category: "achievement",
    isUnlocked: false,
    progress: 0,
  },
];

// ==================== TIME-LIMITED EVENTS ====================

export const EVENTS = [
  {
    id: "double-points-weekend",
    name: "วันสองเท่าคะแนน",
    nameEn: "Double Points Weekend",
    description: "ทุกการตั้งกระทู้หรือตอบคำถาม จะได้คะแนนยศ x2",
    descriptionEn: "Every post or reply gets 2x points",
    icon: "2️⃣",
    startDate: "2026-02-27",
    endDate: "2026-02-28",
    multiplier: 2,
    pointMultiplier: true,
    badge: "double-points",
    status: "upcoming", // upcoming, active, completed
  },
  {
    id: "halloween-frames",
    name: "ฮาโลวีนเฟสติวัล",
    nameEn: "Halloween Festival",
    description: "ตั้งกระทู้เล่าเรื่องผีในเดือนตุลาคม จะได้กรอบรูปพิเศษ",
    descriptionEn: "Share spooky stories and get exclusive frame",
    icon: "🎃",
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    badge: "halloween-frame",
    limitedReward: "avatar-frame-pumpkin",
    status: "upcoming",
  },
  {
    id: "new-year-challenge",
    name: "ท้าทายปีใหม่",
    nameEn: "New Year Challenge",
    description: "สะสมคะแนน 1,000 แต้มในเดือนถัดไป",
    descriptionEn: "Accumulate 1,000 points this month",
    icon: "🎊",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    status: "completed",
    requirement: 1000,
  },
];

// ==================== LEADERBOARDS ====================

export const LEADERBOARD_TYPES = [
  {
    id: "weekly-top-10",
    name: "Top 10 ประจำสัปดาห์",
    nameEn: "Weekly Top 10",
    description: "ผู้ที่ได้คะแนนสูงสุดในสัปดาห์นี้",
    descriptionEn: "Top scorers this week",
    icon: "🏅",
    period: "week",
    limit: 10,
  },
  {
    id: "monthly-top-10",
    name: "Top 10 ประจำเดือน",
    nameEn: "Monthly Top 10",
    description: "ผู้ที่ได้คะแนนสูงสุดในเดือนนี้",
    descriptionEn: "Top scorers this month",
    icon: "🎖️",
    period: "month",
    limit: 10,
  },
  {
    id: "all-time-top",
    name: "ห้องเกียรติยศ",
    nameEn: "Hall of Fame",
    description: "ผู้หลีกษรขึ้นม้าเสนห์สูงสุด",
    descriptionEn: "All-time top contributors",
    icon: "👑",
    period: "all-time",
    limit: 100,
  },
];

// ==================== MEMBER OF THE MONTH ====================

export const MEMBER_OF_THE_MONTH = {
  id: "motm",
  name: "สมาชิกดีเด่นประจำเดือน",
  nameEn: "Member of the Month",
  description: "ผู้ที่คัดเลือกโดยแอดมิน เนื่องจากการตั้งกระทู้มีสาระ",
  descriptionEn: "Selected by admins for quality contributions",
  icon: "🌟",
  reward: 200,
  badge: "motm-current",
  spotlightBanner: true,
  current: null, // { userId, name, avatar, reason }
  previousWinners: [],
};

// ==================== NOTIFICATIONS SYSTEM ====================

export const NOTIFICATION_TRIGGERS = [
  {
    id: "like-comment",
    name: "มีคนถูกใจความเห็นของคุณ",
    nameEn: "Someone liked your comment",
    icon: "👍",
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "mention",
    name: "มีคนแท็กชื่อคุณ",
    nameEn: "Someone mentioned you",
    icon: "✉️",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "trending-alert",
    name: "โพสต์ของคุณกำลังมาแรง",
    nameEn: "Your post is trending",
    icon: "🔥",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "best-answer-alert",
    name: "คำตอบของคุณถูกเลือก",
    nameEn: "Your answer was selected",
    icon: "🏆",
    color: "from-yellow-500 to-yellow-600",
  },
  {
    id: "quest-complete",
    name: "ภารกิจสำเร็จ!",
    nameEn: "Quest completed!",
    icon: "🎯",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "event-reminder",
    name: "เหลือ 1 วันสำหรับกิจกรรม",
    nameEn: "1 day left for event",
    icon: "⏰",
    color: "from-red-500 to-red-600",
  },
];

// ==================== REWARDS & REDEMPTION ====================

export const REWARD_SHOP = {
  "coin-50": {
    id: "coin-50",
    name: "บัตรเติมเงิน 50 บาท",
    nameEn: "50 Baht Top-up",
    description: "บัตรเติมเงินสำหรับมือถือ",
    descriptionEn: "Mobile top-up card",
    cost: 1000,
    icon: "📱",
    category: "digital",
    stock: 100,
  },
  "line-sticker": {
    id: "line-sticker",
    name: "สติกเกอร์ LINE exclusive",
    nameEn: "LINE Sticker Pack",
    description: "ชุดสติกเกอร์เฉพาะสำหรับชุมชน",
    descriptionEn: "Exclusive sticker pack",
    cost: 500,
    icon: "🎨",
    category: "digital",
    stock: 200,
  },
  "shopee-voucher": {
    id: "shopee-voucher",
    name: "โค้ดส่วนลด Shopee 100 บาท",
    nameEn: "Shopee Voucher 100B",
    description: "ใช้ได้กับสินค้าทั่วไป",
    descriptionEn: "Can be used on general items",
    cost: 1500,
    icon: "🛍️",
    category: "voucher",
    stock: 50,
  },
  "lanna-tshirt": {
    id: "lanna-tshirt",
    name: "เสื้อ Plernping Premium",
    nameEn: "Plernping T-shirt",
    description: "เสื้อสีดำ โลโก้ปักอก",
    descriptionEn: "Black t-shirt with embroidery logo",
    cost: 2500,
    icon: "👕",
    category: "merchandise",
    stock: 30,
  },
  "lanna-mug": {
    id: "lanna-mug",
    name: "แก้วน้ำ Plernping",
    nameEn: "Plernping Mug",
    description: "แก้วเซรามิก 350ml",
    descriptionEn: "350ml ceramic mug",
    cost: 1800,
    icon: "☕",
    category: "merchandise",
    stock: 45,
  },
} as const;

// ==================== ADMIN SETTINGS ====================

export const ENGAGEMENT_SETTINGS = {
  quests: {
    enabled: true,
    daily_reset_time: "00:00", // Bangkok Time
    reset_timezone: "Asia/Bangkok",
  },
  events: {
    enabled: true,
    allow_custom_events: true,
    auto_announce: true,
  },
  leaderboards: {
    enabled: true,
    show_on_homepage: true,
    weekly_enabled: true,
    monthly_enabled: true,
    alltime_enabled: true,
  },
  notifications: {
    enabled: true,
    social_triggers: true,
    trending_alerts: true,
    email_notifications: false,
    push_notifications: true,
  },
  rewards: {
    enabled: true,
    point_redemption: true,
    daily_limit_per_user: 1,
    reset_inventory_monthly: false,
  },
  member_of_month: {
    enabled: true,
    show_on_banner: true,
    auto_select: false, // if true, based on algo; if false, admin select
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * ตรวจสอบว่าภารกิจรายวันสำเร็จหรือไม่
 */
export const checkQuestCompletion = (questId: string, progress: number): boolean => {
  const quest = DAILY_QUESTS.find((q) => q.id === questId);
  return quest ? progress >= quest.requirement : false;
};

/**
 * ตรวจสอบว่ากิจกรรมกำลังเป็นไปตามกำหนด
 */
export const isEventActive = (event: (typeof EVENTS)[0], currentDate = new Date()): boolean => {
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  return currentDate >= eventStart && currentDate <= eventEnd;
};

/**
 * นับจำนวนวันที่เหลือของกิจกรรม
 */
export const getDaysRemaining = (endDate: string, currentDate = new Date()): number => {
  const end = new Date(endDate);
  const diff = end.getTime() - currentDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * คำนวณตำแหน่งในลีดเดอร์บอร์ด
 */
export const calculateLeaderboardRank = (
  userId: string,
  rankings: Array<{ userId: string; points: number }>
): number => {
  const sorted = [...rankings].sort((a, b) => b.points - a.points);
  return sorted.findIndex((r) => r.userId === userId) + 1;
};

/**
 * ตรวจสอบสต็อกสินค้า
 */
export const isRewardAvailable = (rewardId: string): boolean => {
  const reward = REWARD_SHOP[rewardId as keyof typeof REWARD_SHOP];
  return reward ? reward.stock > 0 : false;
};

/**
 * คำนวณระยะเวลาจนถึงการรีเซ็ตภารกิจรายวัน
 */
export const getTimeUntilQuestReset = (
  resetTime = ENGAGEMENT_SETTINGS.quests.daily_reset_time
): number => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [hours, minutes] = resetTime.split(":").map(Number);
  tomorrow.setHours(hours, minutes, 0, 0);

  return Math.max(0, tomorrow.getTime() - now.getTime());
};
