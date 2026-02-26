/**
 * Point System & Ranking Tier Configuration
 * ระบบคะแนนและยศสำหรับ Plernping Community
 * 
 * EXPLANATION:
 * - Action Points: ได้จากการกระทำของตัวเอง (สามารถทำเองได้ทั้งวัน)
 * - Quality Points (Reputation): ได้จากการที่คนอื่นชอบหรือโหวต (แสดง "บารมี" ที่แท้จริง)
 * 
 * EXP Bar: รวมทั้งสองประเภท
 */

export const POINT_CONFIG = {
  // Action Points (ทำเองได้) - ตัววัด "ความตั้งใจ"
  actions: {
    createTopic: 10, // ตั้งกระทู้ใหม่
    replyTopic: 5, // ตอบกระทู้
    dailyLoginStreak: 2, // เข้าต่อเนื่องทุกวัน
    createReview: 8, // เขียนรีวิว
  },

  // Reputation Points (Quality - คนอื่นมอบให้) - ตัววัด "บารมี"
  reputation: {
    receiveLike: 15, // ได้รับไลค์/ถูกใจจากคนอื่น
    pinnedPost: 50, // โพสต์ถูกปักหมุดโดยแอดมิน
    bestAnswer: 50, // ตอบคำถามถูก Flag เป็น Best Answer
    helpfulReview: 20, // รีวิวถูก Flag helpful
  },

  // Negative Points (ลงโทษ)
  penalties: {
    spamDetected: -20, // ตรวจพบ spam
    postRemoved: -20, // กระทู้ถูกลบ
    reported: -15, // ถูก report
  },

  // Daily Limits
  dailyLimits: {
    maxReplyPoints: 100, // ได้สูงสุด 100 คะแนนจากการตอบต่อวัน
    maxDailyPoints: 150, // ได้สูงสุด 150 คะแนนต่อวัน
  },

  // Spam Detection
  spamDetection: {
    minCharacters: 5, // ต้องพิมพ์อย่างน้อย 5 ตัวอักษร
    minWords: 2, // ต้องมีอย่างน้อย 2 คำ
    bannedKeywords: ["555", "ดัน", "อ่อ", "xxxx", "555555"], // คำเตือน
    bannedPatterns: [/^[\da-zA-Z]{1,3}$/, /^(.)\1+$/, /^[!?]{3,}$/], // regex pattern
  },
};

export const RANK_TIERS = [
  {
    id: 1,
    name: "ไก่",
    nameEn: "Chick",
    minPoints: 0,
    maxPoints: 100,
    icon: "🐣",
    color: "from-amber-700 to-amber-800",
    borderColor: "border-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    nameColor: "text-amber-900 dark:text-amber-200",
    description: "ลูกเจี๊ยบน้อยที่พึ่งลืมตามาดูโลกของ Plernping",
    descriptionEn: "Baby chick just hatched, confused about PlernPing 🐣",
    nextRankBenefit: "ยศถัดไป: สามารถตั้งรูปโปรไฟล์เป็น GIF ได้",
    nextRankBenefitEn: "Next: Unlock GIF profile pictures",
  },
  {
    id: 2,
    name: "ไก่ยอดฝีมือ",
    nameEn: "Skilled Chick",
    minPoints: 101,
    maxPoints: 500,
    icon: "🐔",
    color: "from-emerald-700 to-emerald-800",
    borderColor: "border-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    nameColor: "text-emerald-900 dark:text-emerald-200",
    description: "ไก่ผู้ฝึกวิทยายุทธ ตี รันฟันแทง มาพอประมาณ",
    descriptionEn: "Chick learning to walk and peck, getting followers! 😄",
    nextRankBenefit: "ยศถัดไป: เปลี่ยนชื่อปีละ 1 ครั้ง",
    nextRankBenefitEn: "Next: Change display name once yearly",
  },
  {
    id: 3,
    name: "ไก่ยอดขุนพล",
    nameEn: "Champion Chick",
    minPoints: 501,
    maxPoints: 2000,
    icon: "🦅",
    color: "from-teal-700 to-teal-800",
    borderColor: "border-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    nameColor: "text-teal-900 dark:text-teal-200",
    description: "ไก่ผู้ยอดยุทธ ฝีมือเป็นเลิศในหมู่ไก่ด้วยกัน ตบไก่ด้วยกันหลับมาแล้วนับไม่ถ้วน",
    descriptionEn: "Chick soaring higher, showing off skills to followers! 🦅",
    nextRankBenefit: "ยศถัดไป: เข้าถึง VIP Board ที่เป็นส่วนตัว",
    nextRankBenefitEn: "Next: Access exclusive VIP board",
  },
  {
    id: 4,
    name: "ไก่นักปราชญ์",
    nameEn: "Instructor",
    minPoints: 2001,
    maxPoints: 5000,
    icon: "🎓",
    color: "from-orange-700 to-orange-800",
    borderColor: "border-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    nameColor: "text-orange-900 dark:text-orange-200",
    unlock: "unlock-vip-board,pin-posts",
    description: "บรรลุพลังขั้นสูง อยู่เหนือวิชาใดๆของเหล่าไก่ กระบี่อยู่ที่ใจ แม้ไม้ไผ่ก็ไร้เทียมทาน",
    descriptionEn: "Chick is now a Teacher, patiently teaching rookies! 🎓",
    benefits: "🔒 เข้า VIP Board | 📌 ปักหมุดกระทู้สัปดาห์ละ 1 ครั้ง",
    benefitsEn: "🔒 VIP Board | 📌 Pin posts 1x weekly",
    nextRankBenefit: "ยศถัดไป: ตั้งฉายาติดชื่อและได้เอฟเฟกต์พิเศษ",
    nextRankBenefitEn: "Next: Custom title & special effects",
  },
  {
    id: 5,
    name: "ปรมาจารย์ไก่",
    nameEn: "Grand Master",
    minPoints: 5001,
    maxPoints: 10000,
    icon: "⭐",
    color: "from-rose-700 to-rose-800",
    borderColor: "border-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    nameColor: "text-rose-900 dark:text-rose-200",
    canCustomTitle: true,
    unlock: "vip-board,custom-avatar-frame,custom-title",
    description: "ไก่ผู้หยั่งรู้ทุกสรรพสิ่ง ตำนานผู้ที่ยังมีลมหายใจ",
    descriptionEn: "Chick flies high! You're the know-it-all of the flock! ⭐",
    benefits: "🔒 VIP Board | ✨ กรอบรูปโปรไฟล์แบบปรับแต่ง | 📜 ฉายาสุดคูล",
    benefitsEn: "🔒 VIP Board | ✨ Custom avatar frame | 📜 Custom title",
    nextRankBenefit: "ยศถัดไป: ชื่อจะสีแดงส่องแสง มองเห็นในทุกหน้าบอร์ด",
    nextRankBenefitEn: "Next: Glowing red name throughout the site",
  },
  {
    id: 6,
    name: "ไก่มารแสวงพ่าย",
    nameEn: "Legendary Sage",
    minPoints: 10001,
    maxPoints: Infinity,
    icon: "👑",
    color: "from-yellow-600 via-amber-700 to-amber-800",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-50/50 dark:bg-yellow-950/30",
    nameColor: "text-transparent bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text",
    canCustomTitle: true,
    unlock: "vip-board,custom-avatar-frame,custom-title,premium-badge,aura-effect",
    description: "เมื่อหยั่งรู้ทุกสรรพสิ่ง จึงขึ้นเป็นเทพเจ้าไก่ ผู้สร้างดาวไก่ดวงใหม่ต่อไป",
    descriptionEn: "Chick is now a LEGEND! Flying higher than eagles! 👑",
    benefits: "🔒 VIP Board | ✨ กรอบรูปโปรไฟล์ | 📜 ฉายาสุดคูล | 🎖️ ป้ายพิเศษ | 💫 เอฟเฟกต์นิมนต์",
    benefitsEn: "🔒 VIP Board | ✨ Avatar frame | 📜 Custom title | 🎖️ Premium badge | 💫 Aura effect",
    hasLegendAura: true,
  },
];

export const RANK_PERKS = {
  "unlock-vip-board": {
    name: "ห้องลับ VIP",
    nameEn: "VIP Board",
    description: "เข้าถึงบอร์ดลับที่มี discussions ระดับสูง สำหรับสมาชิกพิเศษเท่านั้น",
    descriptionEn: "Access to exclusive VIP discussions for elite members",
    icon: "🔒",
    minRank: 4,
  },
  "pin-posts": {
    name: "ปักหมุดกระทู้",
    nameEn: "Pin Posts",
    description: "ปักหมุดกระทู้ตัวเองได้สัปดาห์ละ 1 ครั้ง เพื่อให้คนอื่นเห็น",
    descriptionEn: "Pin your own posts (1x weekly) for visibility",
    icon: "📌",
    minRank: 4,
  },
  "custom-avatar-frame": {
    name: "กรอบรูปโปรไฟล์",
    nameEn: "Avatar Frame",
    description: "เปลี่ยนกรอบรูปโปรไฟล์ให้หรูหรา มีสไตล์แตกต่างจากคนอื่น",
    descriptionEn: "Customize your avatar frame with exclusive styles",
    icon: "✨",
    minRank: 5,
  },
  "custom-title": {
    name: "ฉายาสุดคูล",
    nameEn: "Custom Title",
    description: "ตั้งฉายาของตัวเองแสดงต่อท้ายชื่อ เช่น 'จอมวิชาการ' หรือ 'สุดยอดผู้ช่วย'",
    descriptionEn: "Set your own custom title/motto below your name",
    icon: "📜",
    minRank: 5,
  },
  "premium-badge": {
    name: "ป้ายเลื่องชื่อ",
    nameEn: "Premium Badge",
    description: "ป้ายพิเศษ ⭐ ที่แสดงในโปรไฟล์และโพสต์ทั้งหมด",
    descriptionEn: "Exclusive ⭐ badge displayed on all posts",
    icon: "🎖️",
    minRank: 6,
  },
  "aura-effect": {
    name: "เอฟเฟกต์นิมนต์",
    nameEn: "Aura Effect",
    description: "ชื่อผู้ใช้จะมีเอฟเฟกต์ส่องแสงสีทอง โดดเด่นในทุกหน้าเว็บบอร์ด",
    descriptionEn: "Glowing golden aura around your name throughout the site",
    icon: "💫",
    minRank: 6,
  },
  "increased-storage": {
    name: "พื้นที่เก็บไฟล์เพิ่ม",
    nameEn: "Extra Storage",
    description: "อัปโหลดไฟล์ขนาดใหญ่ได้มากขึ้น สูงสุด 100MB ต่อไฟล์",
    descriptionEn: "Upload larger files (up to 100MB) and more storage",
    icon: "💾",
    minRank: 4,
  },
  "name-change": {
    name: "เปลี่ยนชื่อปีละครั้ง",
    nameEn: "Name Change",
    description: "เปลี่ยน Display Name ได้ปีละ 1 ครั้ง เพื่อให้เหมาะสมกับตัวตนใหม่",
    descriptionEn: "Change your display name once per year",
    icon: "🏷️",
    minRank: 3,
  },
};

/**
 * ฟังก์ชันตรวจสอบ Spam
 */
export const isSpam = (text: string): boolean => {
  const { minCharacters, minWords, bannedKeywords, bannedPatterns } = POINT_CONFIG.spamDetection;

  if (text.length < minCharacters) return true;
  if (text.trim().split(/\s+/).length < minWords) return true;

  // ตรวจสอบคำที่ถูกแบน
  if (bannedKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))) {
    return true;
  }

  // ตรวจสอบ pattern ที่ถูกแบน
  if (bannedPatterns.some((pattern) => pattern.test(text.trim()))) {
    return true;
  }

  return false;
};

/**
 * ฟังก์ชันคำนวณคะแนน
 */
export const calculatePoints = (
  actionType: keyof typeof POINT_CONFIG.actions | keyof typeof POINT_CONFIG.reputation,
  config = POINT_CONFIG
): number => {
  return (config.actions[actionType as keyof typeof config.actions] ||
    config.reputation[actionType as keyof typeof config.reputation] ||
    0) as number;
};

/**
 * ฟังก์ชันหาระดับยศจากคะแนน
 */
export const getRankFromPoints = (points: number): (typeof RANK_TIERS)[number] => {
  return RANK_TIERS.find((tier) => points >= tier.minPoints && points <= tier.maxPoints) || RANK_TIERS[0];
};

/**
 * ฟังก์ชันหาระดับยศตามไอดี
 */
export const getRankById = (rankId: number): (typeof RANK_TIERS)[number] => {
  return RANK_TIERS.find((tier) => tier.id === rankId) || RANK_TIERS[0];
};

/**
 * ฟังก์ชันหาเปอร์เซ็นต์ความคืบหน้าไปยังยศถัดไป
 */
export const getProgressToNextRank = (points: number): { current: number; next: number; percentage: number } => {
  const currentRank = getRankFromPoints(points);
  const nextRankId = currentRank.id + 1;
  const nextRank = getRankById(nextRankId);

  if (!nextRank) {
    return { current: 100, next: 100, percentage: 100 };
  }

  const pointsInCurrentRank = points - currentRank.minPoints;
  const pointsNeededForNextRank = nextRank.minPoints - currentRank.minPoints;
  const percentage = Math.min(100, Math.round((pointsInCurrentRank / pointsNeededForNextRank) * 100));

  return {
    current: points,
    next: nextRank.minPoints,
    percentage,
  };
};

/**
 * ฟังก์ชันตรวจสอบสิทธิพิเศษ
 */
export const hasPermission = (rankId: number, permissionKey: string): boolean => {
  const rank = getRankById(rankId);
  if (!rank.unlock) return false;
  return rank.unlock.split(",").includes(permissionKey);
};

/**
 * ฟังก์ชันได้รับสิทธิพิเศษทั้งหมด
 */
export const getUnlockedPerks = (rankId: number): string[] => {
  const allPerks = new Set<string>();
  // Cumulative: collect perks from all ranks up to current
  RANK_TIERS.forEach((tier) => {
    if (tier.id <= rankId && tier.unlock) {
      tier.unlock.split(",").forEach((key) => allPerks.add(key));
    }
  });
  return Array.from(allPerks);
};
