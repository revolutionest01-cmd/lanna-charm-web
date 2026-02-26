# 🎮 Engagement System - Complete Implementation Guide

**Status**: ✅ Frontend Components Complete | ⏳ Backend Integration Pending

---

## 📋 System Overview

The Lanna Charm Web community platform now includes a **comprehensive gamification and engagement system** designed to boost member participation and community quality. This system includes:

✅ **Point & Ranking System** - Balanced scoring with 6-tier ranks  
✅ **Anti-Spam Protection** - Multiple validation layers  
✅ **Daily Quests** - Recurring tasks with rewards  
✅ **Achievements** - Milestone unlocks  
✅ **Leaderboards** - Weekly, monthly, all-time rankings  
✅ **Member of the Month** - Featured member spotlight  
✅ **Notifications** - Activity alerts and triggers  
✅ **Reward Shop** - Redemption marketplace  
✅ **Admin Settings** - Feature toggles and controls  

---

## 📦 Components Created

### 1. **QuestsAndAchievements.tsx**
- Location: `src/components/QuestsAndAchievements.tsx`
- **Purpose**: Display daily quests and achievements with progress tracking
- **Props**:
  ```typescript
  interface QuestsSystemProps {
    language: string;                    // "th" or "en"
    userProgress?: Record<string, number>; // questId -> progress
    completedQuests?: string[];          // array of quest IDs
    unlockedAchievements?: string[];     // array of achievement IDs
  }
  ```
- **Features**:
  - 4 Daily Quests with progress bars and claim buttons
  - 5 Achievement types with milestone tracking
  - Countdown timer to reset (24 hours)
  - Bilingual Thai/English support
  - Reward preview for each quest/achievement

### 2. **Leaderboards.tsx**
- Location: `src/components/Leaderboards.tsx`
- **Purpose**: Display competitive rankings and member of the month
- **Props**:
  ```typescript
  interface LeaderboardsProps {
    language: string;
    weeklyData?: LeaderboardUser[];
    monthlyData?: LeaderboardUser[];
    allTimeData?: LeaderboardUser[];
    currentUserId?: string;
    currentUserRank?: number;
    currentUserPoints?: number;
  }
  ```
- **Features**:
  - 3 Leaderboard types (weekly, monthly, all-time)
  - Member of the Month spotlight with crown badge
  - Position badges (🏆 #1, 🥈 #2, 🥉 #3)
  - User rank highlighting
  - Paged view for top 10 + current user rank

### 3. **NotificationCenter.tsx**
- Location: `src/components/NotificationCenter.tsx`
- **Purpose**: Central hub for all activity notifications
- **Props**:
  ```typescript
  interface NotificationCenterProps {
    language: string;
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onDismiss?: (id: string) => void;
    onAction?: (notification: Notification) => void;
  }
  ```
- **Features**:
  - 6 Notification types (likes, mentions, trending, best answer, quests, events)
  - Mark as read / dismiss functionality
  - Time formatting (1w ago, 2h ago, etc.)
  - Action buttons for each notification
  - Unread counter badge
  - Scrollable notification list

### 4. **RewardShop.tsx**
- Location: `src/components/RewardShop.tsx`
- **Purpose**: Marketplace for redeeming rewards with points
- **Props**:
  ```typescript
  interface RewardShopProps {
    language: string;
    userPoints?: number;
    userRewards?: UserReward[];
    onRedeem?: (rewardId: string) => void;
  }
  ```
- **Features**:
  - 5 Available rewards (phone credit, stickers, vouchers, merchandise)
  - Available vs redeemed tabs
  - Stock indicators and cost display
  - Redemption animation (1.5s processing)
  - User points tracking (spent/remaining)
  - Redemption policy alert

### 5. **EngagementSettingsPanel.tsx**
- Location: `src/components/EngagementSettingsPanel.tsx`
- **Purpose**: Admin control panel for system features
- **Props**:
  ```typescript
  interface EngagementSettingsProps {
    language: string;
    currentSettings?: Record<string, EngagementSettingValue>;
    onSettingChange?: (category: string, key: string, enabled: boolean) => void;
    isAdmin?: boolean;
  }
  ```
- **Features**:
  - 6 Feature categories (Quests, Events, Leaderboards, Notifications, Rewards, Achievements)
  - Per-feature toggle switches
  - System status overview
  - Admin-only danger zone for disabling all
  - Settings change notifications

### 6. **GamificationDashboard.tsx**
- Location: `src/components/GamificationDashboard.tsx`
- **Purpose**: Unified hub integrating all engagement features
- **Props**:
  ```typescript
  interface GamificationDashboardProps {
    language: string;
    userPoints?: number;
    userRank?: number;
    completedQuests?: string[];
    unlockedAchievements?: string[];
    unreadNotifications?: number;
    claimedRewards?: string[];
  }
  ```
- **Features**:
  - 4-tab interface (Quests, Rankings, Alerts, Rewards)
  - Quick stats cards (Points, Rank, Quests, Alerts)
  - Unified navigation
  - Quick tips section
  - System status indicator

---

## 🎯 Utility Functions & Configuration

### **src/lib/pointSystem.ts**
Core configuration for point calculations and ranking:

```typescript
// Point Configuration
POINT_CONFIG: {
  actions: {
    createTopic: 10,        // Points for creating topic
    replyTopic: 5,          // Points per reply
    dailyLoginStreak: 2,    // Points per day logged in
    createReview: 8         // Points for review
  },
  quality: {
    receiveLike: 15,        // Points per like received
    pinnedPost: 50,         // Points for pinned post
    bestAnswer: 50,         // Points for best answer
    helpfulReview: 20       // Points for helpful review
  },
  penalties: {
    spamDetected: -20,      // Penalty for spam
    postRemoved: -20,       // Penalty for removed post
    reported: -15           // Penalty for reported content
  },
  dailyLimits: {
    maxReplyPoints: 100,    // Max points from replies/day
    maxDailyPoints: 150     // Absolute daily max
  }
}

// 6-Tier Ranking System
RANK_TIERS: [
  { level: 1, name: "นักศึกษา", icon: "📚", color: "blue", minPoints: 0 },
  { level: 2, name: "นักเรียน", icon: "🎓", color: "green", minPoints: 500 },
  { level: 3, name: "นักวิจัย", icon: "🔬", color: "purple", minPoints: 1500 },
  { level: 4, name: "ศาสตราจารย์", icon: "👨‍🏫", color: "orange", minPoints: 3500 },
  { level: 5, name: "มหาวิทยาลัย", icon: "🏛️", color: "red", minPoints: 7000 },
  { level: 6, name: "บารมี", icon: "👑", color: "gold", minPoints: 15000 }
]

// Unlockable Perks by Rank
RANK_PERKS: {
  unlock_vip_board: { rank: 2, name: "VIP Board Access" },
  custom_avatar_frame: { rank: 2, name: "Custom Avatar Frame" },
  custom_title: { rank: 3, name: "Custom User Title" },
  premium_badge: { rank: 4, name: "Premium Badge" },
  aura_effect: { rank: 5, name: "Rare Aura Effect" },
  auto_post_approval: { rank: 6, name: "Auto Post Approval" }
}

// Helper Functions
isSpam(content: string): boolean
calculatePoints(action: string, factors?: object): number
getRankFromPoints(points: number): RankTier
getProgressToNextRank(currentPoints: number): {current, next, percentage}
hasPermission(rank: number, permission: string): boolean
getUnlockedPerks(rank: number): string[]
```

### **src/lib/engagementSystem.ts**
Configuration for quests, events, leaderboards, notifications, and rewards:

```typescript
// Daily Quests
DAILY_QUESTS: [
  { id: "login", name: "เข้าสู่ระบบ", requirement: 1, reward: 10 },
  { id: "reply", name: "ตอบกระทู้", requirement: 3, reward: 25 },
  { id: "like", name: "ให้ไลค์", requirement: 5, reward: 15 },
  { id: "read", name: "อ่านหัวข้อ", requirement: 5, reward: 10 }
]

// Achievements
ACHIEVEMENTS: [
  { id: "first_post", name: "โพสต์แรก", reward: 50, icon: "🚀" },
  { id: "best_answer", name: "ตอบยอดเยี่ยม", reward: 100, icon: "✨" },
  // ... more achievements
]

// Time-Limited Events
EVENTS: [
  { id: "double_points", name: "คะแนนสองเท่า", endsAt: Date },
  { id: "halloween", name: "Halloween Challenge", endsAt: Date },
  { id: "newyear", name: "ชิงชัยปีใหม่", endsAt: Date }
]

// Leaderboard Types
LEADERBOARD_TYPES: {
  weekly: { name: "Weekly Top 10", resetDay: "Sunday" },
  monthly: { name: "Monthly Top 10", resetDay: "Last day" },
  alltime: { name: "Hall of Fame", name: "Never" }
}

// Member of the Month
MEMBER_OF_THE_MONTH: {
  name: "สมาชิกประจำเดือน",
  reward: 500,
  banner: "featured-member-banner"
}

// Notification Triggers
NOTIFICATION_TRIGGERS: {
  like: { name: "โพสต์ของคุณได้รับไลค์", color: "red" },
  mention: { name: "มีคนหยิบยกชื่อคุณ", color: "blue" },
  trending: { name: "หัวข้อเทรนด์", color: "orange" },
  // ... more triggers
}

// Reward Shop
REWARD_SHOP: {
  phone_credit: { name: "Phone Credit", cost: 500, icon: "📱" },
  stickers: { name: "Exclusive Stickers", cost: 200, icon: "🎫" },
  // ... more rewards
}

// Admin Control Settings
ENGAGEMENT_SETTINGS: {
  quests: { enabled: true, dailyResets: true },
  events: { enabled: true },
  leaderboards: { enabled: true, memberOfMonth: true },
  notifications: { enabled: true },
  rewards: { enabled: true },
  achievements: { enabled: true }
}

// Helper Functions
checkQuestCompletion(questId, userProgress): boolean
isEventActive(eventId): boolean
getDaysRemaining(eventEndDate): number
calculateLeaderboardRank(userPoints): number
isRewardAvailable(rewardId): boolean
getTimeUntilQuestReset(): number (milliseconds)
```

---

## 🔗 Integration Points

### **For Profile Page Integration**

Add to `src/pages/Profile.tsx`:

```typescript
import GamificationDashboard from "@/components/GamificationDashboard";

/// In component render:
<GamificationDashboard
  language={language}
  userPoints={userPoints}
  userRank={userRank}
  completedQuests={completedQuests}
  unlockedAchievements={unlockedAchievements}
  unreadNotifications={unreadNotifications}
  claimedRewards={claimedRewards}
/>
```

### **For Standalone Engagement Page**

Create `src/pages/Engagement.tsx`:

```typescript
import { useState } from "react";
import GamificationDashboard from "@/components/GamificationDashboard";

export default function EngagementPage() {
  const [language] = useLanguage(); // Your language hook
  
  // Load user engagement data from Supabase
  const [userData, setUserData] = useState({...});
  
  return (
    <div className="container mx-auto py-6">
      <GamificationDashboard 
        language={language}
        {...userData}
      />
    </div>
  );
}
```

---

## 💾 Backend Integration Required

### **Database Tables Needed**

```sql
-- User Points History
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  points INT NOT NULL,
  action VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Rank Tracking
CREATE TABLE user_ranks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  rank_level INT DEFAULT 1,
  total_points INT DEFAULT 0,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Quest Progress
CREATE TABLE quest_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id VARCHAR(50),
  progress INT DEFAULT 0,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, quest_id)
);

-- Achievement Unlocks
CREATE TABLE achievements_unlocked (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id VARCHAR(50),
  unlocked_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Leaderboard Rankings
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  rank_type VARCHAR(20), -- 'weekly', 'monthly', 'alltime'
  position INT,
  points INT,
  period_start DATE,
  period_end DATE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reward Redemptions
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id VARCHAR(50),
  points_spent INT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed
  claimed_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Supabase Functions/Triggers Needed**

1. **Auto-calculate points on action** - Trigger when topic/reply/review created
2. **Auto-rank users** - Update rank based on points achieved
3. **Reset daily quests** - Scheduled function at 00:00 Bangkok time
4. **Update leaderboards** - Cache leaderboard positions daily
5. **Send notifications** - After each trigger event

---

## 🎨 Styling & Customization

### **Color Scheme**
- Quests: Blue (#3B82F6)
- Achievements: Purple (#A855F7)
- Leaderboards: Green (#10B981)
- Notifications: Orange (#F97316)
- Rewards: Amber (#F59E0B)
- Rankings: Various (Blue, Green, Purple, Orange, Red, Gold)

### **Component Variants**
- All components support both Thai (th) and English (en)
- Fully responsive (mobile, tablet, desktop)
- Dark mode compatible
- Tailwind CSS + Radix UI components

---

## 📊 Mock Data Included

All components come with built-in mock data generators for testing:

- Mock users with realistic Thai names
- Sample quest progress
- Achievement unlocks
- Notifications with timestamps
- Leaderboard rankings
- Reward redemptions

---

## ✅ Checklist for Deployment

- [ ] Backend tables created in Supabase
- [ ] Supabase functions/triggers deployed
- [ ] User data queries implemented
- [ ] Point calculation logic tested
- [ ] Leaderboard calculation verified
- [ ] Notification system configured
- [ ] Reward redemption workflow tested
- [ ] Admin settings connected to backend
- [ ] Mobile responsive testing completed
- [ ] Thai/English language support verified
- [ ] Dark mode styling tested
- [ ] Performance optimization done

---

## 📱 Component Usage Examples

### **Basic Usage**
```typescript
import GamificationDashboard from "@/components/GamificationDashboard";

<GamificationDashboard 
  language="th"
  userPoints={2500}
  userRank={3}
/>
```

### **With Real Data**
```typescript
<GamificationDashboard
  language={language}
  userPoints={userData.points}
  userRank={userData.rank}
  completedQuests={userData.completed_quests}
  unlockedAchievements={userData.achievements}
  unreadNotifications={userData.notification_count}
  claimedRewards={userData.redeemed_rewards}
/>
```

### **Individual Components**
```typescript
import QuestsAndAchievements from "@/components/QuestsAndAchievements";
import Leaderboards from "@/components/Leaderboards";
import NotificationCenter from "@/components/NotificationCenter";
import RewardShop from "@/components/RewardShop";
import EngagementSettingsPanel from "@/components/EngagementSettingsPanel";

// Use individually for modular layouts
```

---

## 🔐 Security Considerations

1. **Anti-Spam Protection**: Multi-layer validation (punctuation, banned keywords, pattern detection)
2. **Daily Limits**: Hard caps on points earned (100 from replies, 150 total)
3. **Audit Trail**: All transactions logged with timestamps and user IDs
4. **Admin Verification**: Settings changes tracked and logged
5. **User Permissions**: RBAC for quest completion and reward eligibility

---

## 📈 Success Metrics

Track these KPIs to measure engagement system effectiveness:

- **Daily Active Users** - Increase via quest engagement
- **Average Session Duration** - Extended by engagement mechanics
- **Community Quality** - Higher with quality-based points
- **Content Creation** - More topics/replies via incentives
- **User Retention** - Improved by achievement unlocks
- **Leaderboard Competition** - Weekly ranking participation

---

**Version**: 1.0  
**Last Updated**: 2024-01-24  
**Components**: 6 main + 2 utility files  
**Status**: ✅ Frontend Ready | ⏳ Backend Integration Pending
