# 🔧 Integration Guide - Gamification Components

## Current Status

✅ **Created & Validated** (0 errors):
1. `/src/lib/badgesSystem.ts` - Badge definitions and logic
2. `/src/components/Leaderboard.tsx` - Top 100 rankings
3. `/src/components/BadgesDisplay.tsx` - Badge showcase
4. `/src/components/ThreadUserCard.tsx` - Enhanced user card
5. `/src/lib/pointSystem.ts` - Enhanced with reputation system

---

## Integration Checklist

### Phase 1: Thread/Post Display 🧵
**Goal**: Make user rank visible and impressive in forum threads

#### Step 1.1: Update `TopicDetail.tsx`
- **Location**: Lines 664-677 (current reply author display)
- **Replace**: Simple author name with `ThreadUserCard` component
- **Mode**: Full mode (shows rank, reputation, progress, perks)
- **Impact**: Each reply now shows rank prominently

**Code Pattern**:
```tsx
// OLD: Simple reply author display
{reply.author_name}

// NEW: Enhanced ThreadUserCard
<ThreadUserCard 
  userId={reply.author_id}
  userName={reply.author_name}
  userAvatar={reply.author_avatar}
  mode="full"
  className="mb-4"
/>
```

#### Step 1.2: Update `Reviews.tsx`  
- **Location**: Review author section
- **Replace**: Simple author display with `ThreadUserCard`
- **Mode**: Compact mode (single line - doesn't take much space)
- **Impact**: Reviews show author's credibility via rank

**Code Pattern**:
```tsx
// In review header
<ThreadUserCard 
  userId={review.author_id}
  userName={review.author_name}
  userAvatar={review.author_avatar}
  mode="compact"
/>
```

#### Why This Works
- 👀 Users see author credibility immediately
- 🏆 Motivates contribution (want own rank to show)
- 🎯 Addresses user request #4: "ยศสะดุดตา"

---

### Phase 2: Profile Page Integration 📱
**Goal**: Show user achievements and progress

#### Step 2.1: Update User Profile
- **Location**: Profile component (likely `/src/pages/Profile.tsx`)
- **Add**: `BadgesDisplay` component in achievements section
- **Add**: `ThreadUserCard` in "full mode" summary
- **Add**: User statistics display

**Layout Pattern**:
```
[Cover Image]
[Username] [◆◆ Rank] [✨ Legend indicator]

[Statistics Cards]
├─ Total Points: 5,250
├─ Posts: 145  
├─ Likes Received: 890
└─ From Community: 567

[Progress to Next Rank]
████████░░░░░░░░░░ 60% (850/1500 points)

[Perks Unlocked]
🔒 VIP Board | 📌 Pin Weekly | ✨ Custom Avatar

[Earned Badges]
[Badge Grid from BadgesDisplay component]

[Next Badge Target]
📚 "Prolific Author" - 45/50 posts
```

---

### Phase 3: Leaderboard Page Integration 🏆
**Goal**: Show global rankings

#### Step 3.1: Create/Update Home or Forum Page
- **Location**: Dashboard or new `/pages/Leaderboard.tsx`
- **Add**: `Leaderboard` component
- **Connect**: Backend data (TODO: Implement Supabase query)

**Code Pattern**:
```tsx
import { Leaderboard } from '@/components/Leaderboard';

export default function ForumDashboard() {
  return (
    <div>
      <h1>Lanna Charm Community Rankings</h1>
      <Leaderboard />
    </div>
  );
}
```

#### Backend Integration (Supabase TODO)
```sql
-- Query needed in Leaderboard.tsx ~line 25
SELECT 
  u.id,
  u.name,
  u.avatar_url,
  COALESCE(up.action_points, 0) as action_points,
  COALESCE(up.reputation_points, 0) as reputation_points,
  COALESCE(up.action_points, 0) + COALESCE(up.reputation_points, 0) as total_points,
  ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank_position
FROM auth.users u
LEFT JOIN user_points up ON u.id = up.user_id
ORDER BY total_points DESC
LIMIT 100;
```

---

## Component Usage Reference

### ThreadUserCard
```tsx
import { ThreadUserCard } from '@/components/ThreadUserCard';

// Compact mode (single line - for review headers, comments)
<ThreadUserCard 
  userId="user-id-123"
  userName="Somchai"
  userAvatar="https://..."
  mode="compact"  // ← single line
/>

// Full mode (detailed card - for thread replies, main post)
<ThreadUserCard 
  userId="user-id-123"
  userName="Somchai"
  userAvatar="https://..."
  mode="full"     // ← detailed display
/>
```

### BadgesDisplay
```tsx
import { BadgesDisplay } from '@/components/BadgesDisplay';

// In profile page
<BadgesDisplay userId="user-id-123" />

// Shows:
// - All earned badges in grid
// - Progress to next badge
// - Rarity indicators
// - Empty state if none unlocked
```

### Leaderboard
```tsx
import { Leaderboard } from '@/components/Leaderboard';

// Standalone page
<Leaderboard />

// Features:
// - 3 tabs: Total | Activity | Reputation
// - Top 100 users
// - Medal display (🏆🥈🥉#N)
// - Sortable by different point types
```

---

## Data Structure Setup

### Required Database Tables

```sql
-- 1. User Points Tracking
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_points INTEGER DEFAULT 0,
  reputation_points INTEGER DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (action_points + reputation_points) STORED,
  badge_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Badge Progress Tracking
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 3. Point Transactions (audit trail)
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  point_type TEXT NOT NULL, -- 'action' or 'reputation'
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'post_created', 'like_received', etc
  related_id UUID, -- topic_id, review_id, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
```

---

## Hook Integration

### useUserRank Hook
Already exists at `/src/hooks/useUserRank.ts` - returns:
```tsx
{
  rank: {
    level: number,           // 1-6
    name: string,            // Thai name
    nameEn: string,          // English name
    icon: string,            // ◇, ◆, etc
    color: string,           // color code
    bgColor: string,         // background color
    borderColor: string,     // border color
    textColor: string,       // text color
    hasLegendAura: boolean   // true if level 6
  },
  totalPoints: number,
  nextRankPoints: number,
  progressPercentage: number
}
```

### useUserBadges Hook (NEW - TO CREATE)
Needed for BadgesDisplay:
```tsx
// Should return earned and progress
const { earned, next, progress } = useUserBadges(userId);
```

---

## Connection Workflow

### When User Gets Points
```
User Action (creates post)
    ↓
POST /api/points/add-action
    ↓
Points recorded in user_points table
    ↓
Check if new rank unlocked → Show notification
Check if badges unlocked → Show celebration
    ↓
Update leaderboard data
```

### When User Gets Likes
```
Other User Likes Post
    ↓
POST /api/points/add-reputation
    ↓
Reputation points added to user_points
    ↓
Update user's total_points (auto GENERATED field)
Check if badge progress updated
    ↓
ThreadUserCard shows updated reputation
```

---

## Frontend Implementation Order

### ✅ Already Done
- [x] Badge system definitions (`badgesSystem.ts`)
- [x] Point system enhancements (`pointSystem.ts`)
- [x] Leaderboard component (`Leaderboard.tsx`)
- [x] BadgesDisplay component (`BadgesDisplay.tsx`)
- [x] ThreadUserCard component (`ThreadUserCard.tsx`)

### 🔄 Next Steps
- [ ] Import ThreadUserCard into `TopicDetail.tsx`
- [ ] Import ThreadUserCard into `Reviews.tsx`
- [ ] Add BadgesDisplay to `Profile.tsx`
- [ ] Create/update Leaderboard page
- [ ] Create `useUserBadges` hook
- [ ] Add pagination to Leaderboard

### ⏳ Backend Tasks
- [ ] Create database tables (user_points, user_badges, point_transactions)
- [ ] Create API endpoints:
  - POST `/api/points/add-action`
  - POST `/api/points/add-reputation`
  - GET `/api/leaderboard` (with sorting)
  - GET `/api/user/:id/badges`
  - GET `/api/user/:id/stats`

---

## Testing Checklist

### UI Testing
- [ ] ThreadUserCard displays in TopicDetail replies
- [ ] ThreadUserCard compact mode in Reviews
- [ ] BadgesDisplay shows in profile
- [ ] Leaderboard tabs filter correctly
- [ ] Responsive on mobile

### Data Testing
- [ ] Points accumulate correctly
- [ ] Rank upgrades trigger
- [ ] Badges unlock when conditions met
- [ ] Leaderboard sorts by correct metric

### Performance Testing
- [ ] Leaderboard loads in < 2 seconds
- [ ] Profile with badges renders smoothly
- [ ] No unnecessary re-renders

---

## Color Reference (Lanna Theme)

```tsx
rankColors: {
  1: '#F59E0B', // Amber      (Chick)
  2: '#10B981', // Emerald    (Skilled)
  3: '#14B8A6', // Teal       (Champion)
  4: '#F97316', // Orange     (Instructor)
  5: '#F43F5E', // Rose       (Grand Master)
  6: '#FBBF24'  // Amber      (Legend - glowing)
}

rarityColors: {
  common: '#9CA3AF',    // Gray
  rare: '#3B82F6',      // Blue
  epic: '#A855F7',      // Purple
  legendary: '#FBBF24'  // Gold
}
```

---

## Notes & Reminders

⚠️ **Important**:
1. `ThreadUserCard` requires `useUserRank` hook working properly
2. `BadgesDisplay` requires real user stats from database
3. `Leaderboard` has TODO for backend query at line ~25
4. All components support Thai/English via `useLanguage` hook
5. Remember to update RLS policies for user_points table

💡 **Quick Wins**:
- ThreadUserCard integration is fastest (2 files = 30 min)
- Immediate visual impact on forum threads
- Users will see ranks and want to rank up

🚀 **Priority Order**:
1. ThreadUserCard → Reviews & TopicDetail
2. BadgesDisplay → Profile page  
3. Leaderboard backend → Full rankings page
