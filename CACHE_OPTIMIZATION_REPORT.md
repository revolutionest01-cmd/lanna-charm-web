# Browser Cache Optimization Report
**Date:** February 20, 2026  
**Issue:** Admin page may hang/freeze when updating content due to stale cache  

---

## 🔍 Findings: Cache-Related Issues Detected

### ⚠️ CRITICAL ISSUES

#### 1. **invalidateContentCache() Function is a No-Op**
- **Location:** `src/hooks/useContentData.tsx` (line 142)
- **Problem:** Function imported by all Admin components but does nothing
- **Current Code:**
  ```tsx
  export const invalidateContentCache = (): void => {
    // No-op — admin components call useRefreshContent().refreshContent() directly
  };
  ```
- **Impact:** When Admin updates content (rooms, menus, reviews, etc.), cache is NOT invalidated
- **Result:** Old cached data displayed to users; page may appear frozen while cache expires

#### 2. **Admin Components Not Using useRefreshContent Hook**
- **Affected Components:**
  - ✗ `RoomsManagement.tsx` - Line 307: calls `invalidateContentCache()`
  - ✗ `ReviewsManagement.tsx` - Lines 233, 301, 322: calls `invalidateContentCache()`
  - ✗ `MenusManagement.tsx` - Line 483: calls `invalidateContentCache()`
  - ✗ `HeroManagement.tsx` - Line 222: calls `invalidateContentCache()`
  - ✗ `GalleryManagement.tsx` - Lines 157, 193: calls `invalidateContentCache()`
  - ✗ `EventSpaceManagement.tsx` - Line 224: calls `invalidateContentCache()`

- **Problem:** Components call no-op function instead of `useRefreshContent()`
- **Solution:** Should use `useRefreshContent()` hook to properly invalidate React Query cache

---

### ⚠️ MODERATE ISSUES

#### 3. **Long Cache Duration in useContentData Hooks**
- **Affected Hooks:** All data hooks (useHeroContent, useRooms, useMenus, etc.)
- **Current Configuration:**
  ```tsx
  staleTime: 5 * 60 * 1000,    // 5 minutes
  gcTime: 10 * 60 * 1000,       // 10 minutes (formerly cacheTime)
  refetchOnWindowFocus: false,   // Doesn't refetch when tab regains focus
  ```
- **Problem:** Data won't refresh for 5 minutes after update; `refetchOnWindowFocus: false` prevents refresh on tab switch
- **Impact:** Users on Admin page see old data even after successful update

#### 4. **QueryClient refetchOnWindowFocus Set to False Globally**
- **Location:** `src/App.tsx` (line 18)
- **Current Code:**
  ```tsx
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,    // ← Prevents refetch on focus
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });
  ```
- **Problem:** When user switches from form back to list, data doesn't auto-refresh
- **Impact:** Updated data not visible until manual refresh

#### 5. **No Automatic Polling After Admin Update**
- **Current Behavior:** After update, app only invalidates cache if components call `refreshContent()`
- **Problem:** No real-time sync mechanism; relies on manual cache invalidation
- **Risk:** If invalidation fails, data becomes stale

---

### ℹ️ EXISTING GOOD PRACTICES (Already Implemented)

✅ **HTTP Cache Headers Set in index.html:**
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

✅ **Service Worker Disabled (Preventing Stale Content):**
- Service Worker registration is disabled in `src/main.tsx`
- Prevents serving cached responses while app updates

✅ **Cache Cleanup on App Startup:**
- `src/lib/cacheCleanup.ts` clears old caches on fresh app load
- Unregisters service workers
- Clears problematic localStorage keys

✅ **Hash-Based Asset Versioning:**
- Vite configured with hash filenames: `[name].[hash].js`
- Forces browser to fetch new assets on deployment

---

## 🔧 Root Cause Analysis

**Why Admin Page May Hang After Update:**

1. Admin form submits → data saved to Supabase ✓
2. Success toast shown ✓
3. `invalidateContentCache()` called ✗ (no-op, doesn't execute)
4. React Query still serves stale cached data
5. User navigates back to list → sees old data
6. User refreshes page → waits for network request + sees fresh data
7. **Perceived hang:** App appears unresponsive because data isn't updating

---

## 📋 Action Items

### Priority 1: Fix Cache Invalidation (CRITICAL)
- [ ] Convert `invalidateContentCache()` to actual function that invalidates queries
- [ ] OR update all Admin components to use `useRefreshContent()` hook
- [ ] Test that cache is properly cleared after each update

### Priority 2: Improve Data Refresh Strategy (HIGH)
- [ ] Consider reducing `staleTime` from 5 to 3 minutes for Admin sections
- [ ] Enable `refetchOnWindowFocus: true` for data hooks (better UX)
- [ ] Add manual refresh button on Admin list pages

### Priority 3: Add Real-time Sync (MEDIUM)
- [ ] Implement Supabase real-time subscriptions for Admin data
- [ ] Auto-refresh list when data changes (even from other users)
- [ ] Add visual indicator when data is being synced

### Priority 4: Browser Caching Policy (MEDIUM)
- [ ] Document cache clearing process for users
- [ ] Add "Clear Cache" button to settings
- [ ] Monitor for similar issues

### Priority 5: Testing (MEDIUM)
- [ ] Test Admin update → list refresh workflow
- [ ] Verify no stale data shown after updates
- [ ] Test across different browsers/cache scenarios

---

## 📊 Current Cache Configuration Summary

| Setting | Value | Recommendation |
|---------|-------|-----------------|
| staleTime | 5 min | 3-5 min ✓ |
| gcTime | 10 min | 10 min ✓ |
| refetchOnWindowFocus | false | true for Admin |
| refetchOnMount | default | true ✓ |
| Service Worker | Disabled | Disabled ✓ |
| HTTP Cache Headers | Disabled | Disabled ✓ |
| Cache Invalidation | No-op ⚠️ | Needs fix |

---

## 🚀 Implementation Priority

**CRITICAL PATH (Do First):**
1. Fix `invalidateContentCache()` function to actually invalidate queries
2. Test Admin update → list refresh workflow
3. Verify no more stale data issues

**THEN (Improvements):**
4. Reduce staleTime for better real-time feel
5. Enable refetchOnWindowFocus for auto-refresh
6. Add manual refresh buttons

---

## 📝 Code References

- **Cache Invalidation:** `src/hooks/useContentData.tsx` (lines 142-159)
- **Admin Components:** `src/components/admin/*.tsx` (all 6 sections)
- **QueryClient Config:** `src/App.tsx` (lines 14-22)
- **Cache Cleanup:** `src/lib/cacheCleanup.ts`
- **Index.html Headers:** `index.html` (lines 12-14)
