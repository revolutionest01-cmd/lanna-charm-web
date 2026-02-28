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
    spamDetected: -30, // ตรวจพบ spam
    postRemoved: -40, // กระทู้ถูกลบ
    reported: -50, // ถูก report
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

export type RankPath = "chicken" | "dog" | "cat";

export interface RankTier {
  id: number;
  name: string;
  nameEn: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  nameColor: string;
  description: string;
  descriptionEn: string;
  nextRankBenefit?: string;
  nextRankBenefitEn?: string;
  unlock?: string;
  benefits?: string;
  benefitsEn?: string;
  canCustomTitle?: boolean;
  hasLegendAura?: boolean;
}

export const RANK_PATH_OPTIONS: Array<{
  id: RankPath;
  labelTh: string;
  labelEn: string;
  icon: string;
  teaserTh: string;
  teaserEn: string;
}> = [
  {
    id: "chicken",
    labelTh: "สายไก่",
    labelEn: "Chicken Path",
    icon: "🐔",
    teaserTh: "สายขยัน ถึก อึด วิ่งไล่ความเก่งทุกวัน",
    teaserEn: "Consistent grinder with unstoppable farm energy",
  },
  {
    id: "dog",
    labelTh: "สายหมา",
    labelEn: "Dog Path",
    icon: "🐶",
    teaserTh: "สายเพื่อนแท้ ช่วยเหลือชุมชนจนทุกคนรัก",
    teaserEn: "Loyal helper and community protector",
  },
  {
    id: "cat",
    labelTh: "สายแมว",
    labelEn: "Cat Path",
    icon: "🐱",
    teaserTh: "สายครีเอทีฟ น่ารักปนกวน ชนะใจด้วยสไตล์",
    teaserEn: "Creative chaos with elite cat charisma",
  },
];

export const RANK_PATH_UNLOCK_POINTS = 200;
export const RANK_PATH_UNLOCK_QUESTS = 2;
export const RANK_PATH_CHANGE_COOLDOWN_DAYS = 90;

const CHICKEN_RANK_TIERS: RankTier[] = [
  {
    id: 1,
    name: "ไก่วัด",
    nameEn: "Temple Chicken",
    minPoints: 0,
    maxPoints: 199,
    icon: "🐣",
    color: "from-amber-700 to-amber-800",
    borderColor: "border-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    nameColor: "text-amber-900 dark:text-amber-200",
    description: "จุดเริ่มต้นของผู้น้อย ถือกำเนิดจากการจิกกินข้าวก้นบาตร ใช้ชีวิตแบบเจียมตัวในบอร์ด วันๆ นั่งอ่านกระทู้และพยักหน้าหงึกๆ ภาวนาไม่ให้โดนแบน",
    descriptionEn: "A humble beginning: quietly reading threads, nodding along, and praying not to get banned.",
    nextRankBenefit: "ครบ 200 คะแนน: ปลดล็อกเลือกสาย ไก่ / หมา / แมว",
    nextRankBenefitEn: "At 200 points: Unlock branch selection (Chicken / Dog / Cat)",
  },
  {
    id: 2,
    name: "ไก่จ่าฝูงผู้ดูแลเหล่าไก่ใหม่ๆ",
    nameEn: "Rookie Flock Sergeant",
    minPoints: 200,
    maxPoints: 699,
    icon: "🪶",
    color: "from-emerald-700 to-emerald-800",
    borderColor: "border-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    nameColor: "text-emerald-900 dark:text-emerald-200",
    description: "เริ่มมีปากมีเสียง หลังรอดพ้นจากการเป็นไก่ต้ม ก็ผันตัวเป็นรุ่นพี่ใจดี คอยกางปีกปกป้องและตอบคำถามพื้นฐานให้ไก่หน้าใหม่",
    descriptionEn: "No longer shy; now protects and guides new users like a kind flock leader.",
    nextRankBenefit: "ยศถัดไป: เปลี่ยนชื่อปีละ 1 ครั้ง",
    nextRankBenefitEn: "Next: Change display name once yearly",
  },
  {
    id: 3,
    name: "จอมยุทธไก่ผู้เคร่งขรึม",
    nameEn: "Stern Chicken Swordsman",
    minPoints: 700,
    maxPoints: 2000,
    icon: "⚔️",
    color: "from-teal-700 to-teal-800",
    borderColor: "border-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    nameColor: "text-teal-900 dark:text-teal-200",
    description: "ผ่านศึกดราม่ามานับไม่ถ้วน สลัดคราบไก่วัด ฝึกวิชา ‘คีย์บอร์ดสับแหลก’ ตอบกระทู้เฉียบคมจนคนต้องกดไลก์",
    descriptionEn: "Battle-tested through drama, this rank replies with sharp insight that earns consistent likes.",
    nextRankBenefit: "ยศถัดไป: เข้าถึง VIP Board ที่เป็นส่วนตัว",
    nextRankBenefitEn: "Next: Access exclusive VIP board",
  },
  {
    id: 4,
    name: "อาจารย์ไก่ผู้เชี่ยวชาญ",
    nameEn: "Master Chicken Instructor",
    minPoints: 2001,
    maxPoints: 5000,
    icon: "🎓",
    color: "from-orange-700 to-orange-800",
    borderColor: "border-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    nameColor: "text-orange-900 dark:text-orange-200",
    unlock: "unlock-vip-board,pin-posts",
    description: "ผู้บรรลุวิชาในสายงานของตน เปิดสำนักรับลูกศิษย์ในบอร์ด ใครตั้งกระทู้ถาม อาจารย์ไก่จะบินมาโฉบตอบให้กระจ่างไว",
    descriptionEn: "A specialist mentor who swoops in to answer questions with speed and clarity.",
    benefits: "🔒 เข้า VIP Board | 📌 ปักหมุดกระทู้สัปดาห์ละ 1 ครั้ง",
    benefitsEn: "🔒 VIP Board | 📌 Pin posts 1x weekly",
    nextRankBenefit: "ยศถัดไป: ตั้งฉายาติดชื่อและได้เอฟเฟกต์พิเศษ",
    nextRankBenefitEn: "Next: Custom title & special effects",
  },
  {
    id: 5,
    name: "ปรมาจารย์ไก่ผู้รอบรู้",
    nameEn: "Omniscient Chicken Grandmaster",
    minPoints: 5001,
    maxPoints: 10000,
    icon: "📚",
    color: "from-rose-700 to-rose-800",
    borderColor: "border-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/20",
    nameColor: "text-rose-900 dark:text-rose-200",
    canCustomTitle: true,
    unlock: "vip-board,custom-avatar-frame,custom-title",
    description: "ผู้หยั่งรู้ฟ้าดินแห่งเว็บบอร์ด เห็นหัวข้อกระทู้ก็รู้รากปัญหา เป็นที่เคารพรักของทุกสาย",
    descriptionEn: "Sees the root of issues at a glance and is respected across every path.",
    benefits: "🔒 VIP Board | ✨ กรอบรูปโปรไฟล์แบบปรับแต่ง | 📜 ฉายาสุดคูล",
    benefitsEn: "🔒 VIP Board | ✨ Custom avatar frame | 📜 Custom title",
    nextRankBenefit: "ยศถัดไป: ชื่อจะสีแดงส่องแสง มองเห็นในทุกหน้าบอร์ด",
    nextRankBenefitEn: "Next: Glowing red name throughout the site",
  },
  {
    id: 6,
    name: "เทพเจ้าไก่ไร้เทียมทาน",
    nameEn: "Invincible Chicken Deity",
    minPoints: 10001,
    maxPoints: 20000,
    icon: "🏆",
    color: "from-yellow-600 via-amber-700 to-amber-800",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-50/50 dark:bg-yellow-950/30",
    nameColor: "text-transparent bg-gradient-to-r from-yellow-700 to-amber-700 bg-clip-text",
    canCustomTitle: true,
    unlock: "vip-board,custom-avatar-frame,custom-title,premium-badge,aura-effect",
    description: "บรรลุขั้นสูงสุด ร่างกายเปล่งออร่าสีทอง ทรงพลังจนไม่มีใครกล้าเถียง ทุกคอมเมนต์กลายเป็นสัจธรรม",
    descriptionEn: "Radiates golden aura; every comment feels like an undeniable truth.",
    benefits: "🔒 VIP Board | ✨ กรอบรูปโปรไฟล์ | 📜 ฉายาสุดคูล | 🎖️ ป้ายพิเศษ | 💫 เอฟเฟกต์นิมนต์",
    benefitsEn: "🔒 VIP Board | ✨ Avatar frame | 📜 Custom title | 🎖️ Premium badge | 💫 Aura effect",
    hasLegendAura: true,
  },
  {
    id: 7,
    name: "เทพมารไก่แสวงพ่าย",
    nameEn: "Defeat-Seeking Chicken Demon God",
    minPoints: 20001,
    maxPoints: Infinity,
    icon: "🔥",
    color: "from-amber-500 via-orange-600 to-red-700",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-50/60 dark:bg-orange-950/35",
    nameColor: "text-transparent bg-gradient-to-r from-orange-700 to-red-700 bg-clip-text",
    canCustomTitle: true,
    unlock: "vip-board,custom-avatar-frame,custom-title,premium-badge,aura-effect",
    description: "ยืนบนจุดสูงสุดจนเหน็บหนาว ไร้คู่ต่อสู้ในเว็บบอร์ด โพสต์ด้วยความเบื่อหน่ายและเฝ้ารอผู้กล้าหน้าใหม่มาโค่นตน",
    descriptionEn: "At the frozen summit, waits for a worthy challenger to finally end the boredom.",
    benefits: "🔒 เข้าได้ทุกโซน | ✨ ออร่าสูงสุด | 👑 ศักดิ์ศรีระดับตำนาน",
    benefitsEn: "🔒 Full-zone access | ✨ Supreme aura | 👑 Legendary prestige",
    hasLegendAura: true,
  },
];

const DOG_RANK_TIERS: RankTier[] = [
  {
    ...CHICKEN_RANK_TIERS[0],
    name: "โบ้เองนักเลงวัด",
    nameEn: "Aibo the Temple Dog",
    icon: "🐶",
    color: "from-slate-700 to-zinc-800",
    borderColor: "border-slate-600",
    bgColor: "bg-slate-50 dark:bg-slate-950/20",
    nameColor: "text-slate-900 dark:text-slate-200",
    description: "ผู้ต่ำต้อยที่น่าเอ็นดู เข้าบอร์ดมาแบบงงๆ ทำอะไรไม่ค่อยเป็นนอกจากกระดิกหางรอคนมาแจกแต้ม เป็นมิตรกับทุกคน",
    descriptionEn: "A lovable underdog, confused but friendly, wagging for points and kindness.",
  },
  {
    ...CHICKEN_RANK_TIERS[1],
    name: "ดำเจ้าถิ่นประจำซอย",
    nameEn: "Ai-Dum the Alley Dog",
    icon: "🌑",
    color: "from-cyan-700 to-blue-800",
    borderColor: "border-cyan-600",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    nameColor: "text-cyan-900 dark:text-cyan-200",
    description: "ผ่านดราม่ามาบ้างจนเริ่มมีภูมิคุ้มกัน ซุ่มเงียบในมุมมืดของบอร์ด นานๆ จะเห่าที แต่เห่าทีสะดุ้งทั้งซอย",
    descriptionEn: "A quiet survivor of drama—rarely barks, but when it does, everyone notices.",
  },
  {
    ...CHICKEN_RANK_TIERS[2],
    name: "แดงซีเคียวริตี้หน้าเซเว่น",
    nameEn: "Ai-Daeng the 7-Eleven Dog",
    icon: "🏪",
    color: "from-sky-700 to-indigo-800",
    borderColor: "border-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    nameColor: "text-sky-900 dark:text-sky-200",
    description: "ผู้ครอบครองทำเลทอง รู้ทริคดึงดูดความสนใจ ตั้งกระทู้ดักยอดเอ็นเกจให้คนเข้ามากดใจเหมือนเดินเข้าเซเว่น",
    descriptionEn: "Masters prime engagement spots and draws attention like a convenience-store magnet.",
  },
  {
    ...CHICKEN_RANK_TIERS[3],
    name: "ไฮโซตูบพ่อบ้านใหญ่",
    nameEn: "Ai-Dang the Pack Sergeant",
    icon: "🛡️",
    color: "from-blue-700 to-indigo-800",
    borderColor: "border-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    nameColor: "text-blue-900 dark:text-blue-200",
    description: "ผ่านศึกกับแก๊งซอยข้างๆ มานับไม่ถ้วน ได้รับการยอมรับเป็นหัวหน้าแก๊ง มีลูกน้องคอยโควตหนุนหลังทุกไฟต์",
    descriptionEn: "A proven leader with loyal supporters always ready to back every debate.",
  },
  {
    ...CHICKEN_RANK_TIERS[4],
    name: "อัลฟ่าโบ้ จ่าฝูงแบบลิมิเต็ด",
    nameEn: "Alpha Bo: Limited Pack Leader",
    icon: "⭐",
    color: "from-indigo-700 to-slate-800",
    borderColor: "border-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
    nameColor: "text-indigo-900 dark:text-indigo-200",
    description: "ร่างอีโวลูชันระดับ SSR ของไอโบ้ ไม่ได้มีดีแค่พลัง แต่มีความเท่ระดับซุปตาร์ พิมพ์อะไรคนก็ตามกรี๊ด",
    descriptionEn: "An SSR evolution with both power and star charisma—every post gets hype.",
  },
  {
    ...CHICKEN_RANK_TIERS[5],
    name: "เทพเจ้าโบ้ผู้ไร้เทียมทาน",
    nameEn: "Invincible Bo Deity",
    icon: "⚡",
    color: "from-blue-600 via-indigo-700 to-slate-800",
    borderColor: "border-indigo-500",
    bgColor: "bg-blue-50/50 dark:bg-blue-950/30",
    nameColor: "text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text",
    description: "ผู้คุมกฎแห่งเว็บบอร์ดที่แอดมินยังต้องเกรงใจ มีพลังเห่าทะลุหน้าจอ แค่มองตาก็ดึงสติคนหัวร้อนให้สงบได้",
    descriptionEn: "A rule-keeper so strong even admins respect it; can calm heated threads instantly.",
  },
  {
    ...CHICKEN_RANK_TIERS[6],
    name: "เทพมารโบ้ผู้แสวงพ่าย",
    nameEn: "Defeat-Seeking Bo Demon God",
    icon: "🦴",
    color: "from-indigo-600 via-slate-700 to-black",
    borderColor: "border-slate-500",
    bgColor: "bg-slate-50/60 dark:bg-slate-950/40",
    nameColor: "text-transparent bg-gradient-to-r from-slate-700 to-zinc-900 bg-clip-text",
    description: "สุดยอดสิ่งมีชีวิตที่กัดขาดทุกตรรกะ ครอบครองกระดูกทองคำแห่งจักรวาล นั่งหาวบนบัลลังก์รอคนใจกล้ามาลูบหัว",
    descriptionEn: "A cosmic apex beast guarding the golden bone, waiting for someone brave enough to challenge it.",
  },
];

const CAT_RANK_TIERS: RankTier[] = [
  {
    ...CHICKEN_RANK_TIERS[0],
    name: "หริดแมววัด",
    nameEn: "Temple Alley Cat",
    icon: "🐱",
    color: "from-zinc-700 to-slate-800",
    borderColor: "border-zinc-600",
    bgColor: "bg-zinc-50 dark:bg-zinc-950/20",
    nameColor: "text-zinc-900 dark:text-zinc-200",
    description: "แมวผอมโซจอมขโมยซีน แอบซุ่มเงียบตามกระทู้ รอจังหวะปาดคอมเมนต์แรก ว่องไวแต่ยังไร้เดียงสา",
    descriptionEn: "A skinny scene-stealer lurking for the perfect first-comment strike.",
  },
  {
    ...CHICKEN_RANK_TIERS[1],
    name: "แมวส้มท้ายซอย",
    nameEn: "Orange Target Cat",
    icon: "🐈",
    color: "from-fuchsia-700 to-pink-800",
    borderColor: "border-fuchsia-600",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/20",
    nameColor: "text-fuchsia-900 dark:text-fuchsia-200",
    description: "ตัวตึงประจำซอย เริ่มซ่าและกวนประสาท ชอบตั้งกระทู้ปั่นหรือคอมเมนต์กวนให้คนอื่นหัวหมุน",
    descriptionEn: "A chaotic local legend posting spicy threads and mischievous comments.",
  },
  {
    ...CHICKEN_RANK_TIERS[2],
    name: "อัลฟ่าหริดผู้ว่องไว",
    nameEn: "Alpha Hrid the Swift",
    icon: "💨",
    color: "from-violet-700 to-purple-800",
    borderColor: "border-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    nameColor: "text-violet-900 dark:text-violet-200",
    description: "พิมพ์ตอบกระทู้ด้วยความเร็วแสง ข้อมูลเป๊ะ ปาดหน้าทุกคนจนคู่แข่งได้แต่มองฝุ่น",
    descriptionEn: "Replies at lightspeed with precise information that leaves rivals in the dust.",
  },
  {
    ...CHICKEN_RANK_TIERS[3],
    name: "อัลฟ่าส้มผู้เยี่ยมยุทธ",
    nameEn: "Alpha Orange Grand Fighter",
    icon: "🗡️",
    color: "from-purple-700 to-indigo-800",
    borderColor: "border-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    nameColor: "text-purple-900 dark:text-purple-200",
    description: "ส้มแมวเป้าที่ฝึกวิชาเก้ากรงเล็บสำเร็จ ไม่ได้มีดีแค่ปั่น แต่บวกด้วยเหตุผลคมกริบ ตบเกรียนคีย์บอร์ดร่วง",
    descriptionEn: "A nine-claw tactician combining chaos with razor-sharp logic.",
  },
  {
    ...CHICKEN_RANK_TIERS[4],
    name: "ปรมาจารย์แมวเป้า",
    nameEn: "Target Cat Grandmaster",
    icon: "🧠",
    color: "from-pink-700 to-rose-800",
    borderColor: "border-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    nameColor: "text-pink-900 dark:text-pink-200",
    description: "ผู้ผ่านโลกมามาก นิ่ง สงบ แต่แผ่รังสีอำมหิต พิมพ์ทีเดียวจบทุกปัญหา ดับดราม่าด้วยอุ้งเท้าเดียว",
    descriptionEn: "Calm and deadly precise—one comment can end both problems and drama.",
  },
  {
    ...CHICKEN_RANK_TIERS[5],
    name: "เทพเจ้าแมวผู้ไร้เทียมทาน",
    nameEn: "Invincible Cat Deity",
    icon: "👑",
    color: "from-fuchsia-600 via-purple-700 to-indigo-800",
    borderColor: "border-fuchsia-500",
    bgColor: "bg-fuchsia-50/50 dark:bg-fuchsia-950/30",
    nameColor: "text-transparent bg-gradient-to-r from-fuchsia-700 to-indigo-700 bg-clip-text",
    description: "ตัวตนระดับตำนานที่มองผู้ใช้คนอื่นเป็นเพียงทาส สถิตบนกล่องกระดาษทองคำ ใครมาขอความช่วยเหลือต้องถวายความเคารพ",
    descriptionEn: "A legendary overlord on a golden cardboard throne, respected before assistance is granted.",
  },
  {
    ...CHICKEN_RANK_TIERS[6],
    name: "เทพมารส้มแสวงพ่าย",
    nameEn: "Defeat-Seeking Orange Demon",
    icon: "😼",
    color: "from-orange-500 via-amber-600 to-fuchsia-700",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-50/60 dark:bg-orange-950/35",
    nameColor: "text-transparent bg-gradient-to-r from-orange-700 to-fuchsia-700 bg-clip-text",
    description: "จอมมารสีส้มผู้เบื่อหน่ายในความสมบูรณ์แบบ เดินเหยียบคีย์บอร์ดก็ทำเซิร์ฟเวอร์สั่น รอผู้กล้ามาเกาพุงโดยไม่โดนสวบ",
    descriptionEn: "An orange chaos emperor so perfect and bored that even keyboard steps can shake servers.",
  },
];

const RANK_TIERS_BY_PATH: Record<RankPath, RankTier[]> = {
  chicken: CHICKEN_RANK_TIERS,
  dog: DOG_RANK_TIERS,
  cat: CAT_RANK_TIERS,
};

export const RANK_TIERS = CHICKEN_RANK_TIERS;

export const normalizeRankPath = (path: string | null | undefined): RankPath => {
  if (path === "dog" || path === "cat" || path === "chicken") return path;
  return "chicken";
};

export const getRankTiersByPath = (path: RankPath): RankTier[] => {
  return RANK_TIERS_BY_PATH[path] || RANK_TIERS_BY_PATH.chicken;
};

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
export const getRankFromPoints = (points: number, path: RankPath = "chicken"): RankTier => {
  const effectivePath = points < RANK_PATH_UNLOCK_POINTS ? "chicken" : path;
  const tiers = getRankTiersByPath(effectivePath);
  return tiers.find((tier) => points >= tier.minPoints && points <= tier.maxPoints) || tiers[0];
};

/**
 * ฟังก์ชันหาระดับยศตามไอดี
 */
export const getRankById = (rankId: number, path: RankPath = "chicken"): RankTier => {
  const tiers = getRankTiersByPath(path);
  return tiers.find((tier) => tier.id === rankId) || tiers[0];
};

/**
 * ฟังก์ชันหาเปอร์เซ็นต์ความคืบหน้าไปยังยศถัดไป
 */
export const getProgressToNextRank = (points: number, path: RankPath = "chicken"): { current: number; next: number; percentage: number } => {
  const currentRank = getRankFromPoints(points, path);
  const tiers = getRankTiersByPath(path);
  const nextRankId = currentRank.id + 1;
  const nextRank = tiers.find((tier) => tier.id === nextRankId);

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
export const hasPermission = (rankId: number, permissionKey: string, path: RankPath = "chicken"): boolean => {
  const rank = getRankById(rankId, path);
  if (!rank.unlock) return false;
  return rank.unlock.split(",").includes(permissionKey);
};

/**
 * ฟังก์ชันได้รับสิทธิพิเศษทั้งหมด
 */
export const getUnlockedPerks = (rankId: number, path: RankPath = "chicken"): string[] => {
  const allPerks = new Set<string>();
  const tiers = getRankTiersByPath(path);
  // Cumulative: collect perks from all ranks up to current
  tiers.forEach((tier) => {
    if (tier.id <= rankId && tier.unlock) {
      tier.unlock.split(",").forEach((key) => allPerks.add(key));
    }
  });
  return Array.from(allPerks);
};
