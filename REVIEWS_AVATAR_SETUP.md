# Reviews Avatar System - Setup & Migration Guide

## Overview
Enhanced the ReviewsManagement component with avatar selection and improved star rating preview. This document tracks the implementation and migration requirements.

## Components Updated

### Frontend: ReviewsManagement.tsx
**Location:** `src/components/admin/ReviewsManagement.tsx`

**New Features:**
1. **Avatar Selection** - 20 emoji options for customers
2. **Star Rating Preview** - Live visual feedback with amber stars
3. **Professional UI Redesign** - Improved form layout and card display

**Implementation Details:**

#### Avatar Options (20 emojis)
```typescript
const AVATAR_OPTIONS = [
  "😊", "😄", "😎", "🤩", "😍", 
  "🥳", "😇", "🤓", "😌", "😊",
  "👨", "👩", "👴", "👵", "👦",
  "👧", "🧔", "👱", "🤵", "💼"
];
```

#### Updated Review Type
```typescript
type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review_text_en: string;
  review_text_th: string;
  image_url: string | null;
  avatar: string;  // NEW FIELD
  is_active: boolean;
  created_at: string;
};
```

#### Form State Integration
- Avatar field initialized with default: "😊"
- Avatar persisted in database insert/update operations
- Avatar populated during edit operations from existing review data

#### UI Enhancements
- **Form Layout:** Grid layout with Customer Name + Avatar Grid (2 columns on md+)
- **Avatar Selector:** Interactive grid (5 columns) with hover/select effects
- **Star Preview:** 5 live stars with amber coloring based on selected rating
- **Card Display:** Professional redesign with avatar emoji badge, stars, and metadata

### Database Migration

**File:** `supabase/migrations/20260220000001_add_review_avatar.sql`

**Migration SQL:**
```sql
-- Add avatar column to reviews table
ALTER TABLE public.reviews
ADD COLUMN avatar text DEFAULT '😊' NOT NULL;
```

**Status:** ✅ Migration file created and ready to apply

**Current Implementation Checklist:**
- ✅ Frontend component fully updated with avatar system
- ✅ Avatar field added to Review type definition
- ✅ Avatar selection UI implemented
- ✅ Avatar persistence coded in database operations
- ✅ Star rating preview implemented
- ✅ TypeScript build validation passed (no errors)
- ⏳ Database migration ready to apply (awaiting Supabase CLI authentication)

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard: https://app.supabase.com
2. Select project: `gomjfnkzhxqfmbwmaphz`
3. Navigate to SQL Editor
4. Create new query and paste migration SQL:
```sql
ALTER TABLE public.reviews
ADD COLUMN avatar text DEFAULT '😊' NOT NULL;
```
5. Execute query

### Option 2: Using Supabase CLI
```bash
cd lanna-charm-web
supabase login
supabase link --project-ref gomjfnkzhxqfmbwmaphz
supabase db push
```

## Testing After Migration

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** Admin Backend → Reviews Management

3. **Test Avatar Selection:**
   - Click on avatar selection area
   - Verify 20 emoji options appear
   - Select different avatars
   - Verify selection highlight works

4. **Test Star Rating Preview:**
   - Change rating dropdown values 1-5
   - Verify stars display with amber color on selection
   - Verify animation/scale effect works

5. **Test Form Submission:**
   - Fill in all fields
   - Select an avatar
   - Submit form
   - Verify avatar appears in review card

6. **Test Edit Functionality:**
   - Edit an existing review
   - Verify avatar is pre-selected from existing data
   - Modify avatar and submit
   - Verify changes persist

## Deployment Checklist

- [ ] Apply migration to Supabase (steps above)
- [ ] Test all avatar and star features in dev environment
- [ ] Commit code changes:
  ```bash
  git add -A
  git commit -m "feat: Enhance Reviews section with avatar selection and star rating preview"
  ```
- [ ] Push to repository:
  ```bash
  git push origin main
  ```
- [ ] Deploy to production environment

## Code Changes Summary

**Files Modified:**
1. `src/components/admin/ReviewsManagement.tsx` - 9 replace operations

**Files Created:**
1. `supabase/migrations/20260220000001_add_review_avatar.sql` - New migration

**Build Status:** ✅ Passed (no TypeScript errors)

## Schema Update

**Existing Reviews Table:**
```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text_th TEXT NOT NULL,
  review_text_en TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

**After Migration:**
```sql
-- Same as above, plus:
ALTER TABLE public.reviews
ADD COLUMN avatar TEXT DEFAULT '😊' NOT NULL;
```

## Notes
- Avatar default value is "😊" (smiling face emoji)
- All 20 avatar options are Unicode emojis (compatible with all modern browsers)
- Avatar field is required (NOT NULL) with sensible default
- No breaking changes to existing functionality
- All existing reviews will inherit the default avatar "😊"
