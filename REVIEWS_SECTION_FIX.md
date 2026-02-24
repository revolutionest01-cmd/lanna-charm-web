# Reviews Section Fix - Admin Approval Issue

## Problem Identified
When a user submitted a review and an admin approved it, the newly approved review was not appearing on the Reviews page. This was because:

1. **Long Cache Duration**: The reviews query had a 5-minute (`staleTime: 5 * 60 * 1000`) cache, meaning the data wouldn't automatically refresh for up to 5 minutes
2. **No Real-time Subscription**: There was no real-time subscription listening for changes to the reviews table, so when an admin changed `is_active` from `false` to `true`, the client had no way to know about it immediately

## Solutions Implemented

### 1. Added Real-Time Subscription (Lines 95-115)
```typescript
useEffect(() => {
  const channel = supabase
    .channel("reviews:is_active=true")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "reviews",
      },
      (payload) => {
        console.log("[Reviews] Real-time update received:", payload);
        // Invalidate the reviews query to refetch when any changes occur
        queryClient.invalidateQueries({ queryKey: ["reviews-all"], exact: true });
      }
    )
    .subscribe((status) => {
      console.log("[Reviews] Subscription status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [queryClient]);
```

**Result**: Now when an admin approves a review (changing `is_active` to `true`), Supabase immediately notifies the client via the real-time subscription, triggering an automatic refetch of the reviews list.

### 2. Reduced Cache Time (Line 88)
**Before**: `staleTime: 5 * 60 * 1000` (5 minutes)
**After**: `staleTime: 30 * 1000` (30 seconds)

**Result**: Even if there's a delay in the real-time notification, the data will automatically refresh every 30 seconds instead of waiting 5 minutes.

### 3. Added Manual Refresh Button (Lines 56, 378-391)
- Added `RefreshCw` icon import
- Added `isRefreshing` state to track manual refresh loading
- Created `handleRefreshReviews()` function to manually trigger a refetch
- Added refresh button to the page header

**Result**: Users can manually refresh the page if they want to see new reviews immediately.

## Changes Made

### File: `src/pages/Reviews.tsx`

1. **Import Changes** (Line 1)
   - Added `useEffect` to imports

2. **Icon Import** (Line 9)
   - Added `RefreshCw` icon for the refresh button

3. **New States** (Line 56)
   - Added `isRefreshing` state

4. **New Functions** (Lines 57-61)
   - Added `handleRefreshReviews()` function

5. **Query Configuration** (Line 88)
   - Changed `staleTime` from 5 minutes to 30 seconds

6. **Real-Time Subscription** (Lines 95-115)
   - Added `useEffect` hook with Supabase real-time subscription
   - Listens for any changes to the reviews table
   - Automatically invalidates cache on updates

7. **UI Enhancement** (Lines 378-391)
   - Added refresh button in the page header

## How It Works Now

1. When admin approves a review (sets `is_active = true`), Supabase sends a real-time update
2. The subscription receives this update immediately
3. The cache is invalidated, triggering an automatic refetch
4. New approved reviews appear at the top (they're already sorted by `created_at DESC`)
5. If there's no real-time notification for any reason, the cache expires after 30 seconds and refreshes automatically
6. Users can manually click "Refresh" button to force an immediate reload

## Sorting Order
Reviews are sorted by `created_at` in descending order (`ascending: false`), which means:
- Newest reviews appear at the top ✅
- Oldest reviews appear at the bottom ✅

## Testing Recommendations

1. Submit a new review as a user
2. Go to admin panel and approve the review
3. Check if the review appears immediately in the Reviews section
4. Verify that the newest reviews appear at the top
5. Test the manual refresh button
