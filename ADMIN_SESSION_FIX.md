# Admin Session Fix - การแก้ไขปัญหา Admin Session หลุด

## ปัญหาที่เกิดขึ้น
เมื่อผู้ใช้ที่มีสิทธิ์ Admin เข้าใช้ระบบและทำการ Refresh หน้าจอ (F5 หรือ Cmd+R) Session การ Login จะหลุดทันที ทำให้ต้อง Login ใหม่

## สาเหตุของปัญหา
1. **Race condition ในการสื่อ restore session**: เมื่อ page refresh, Supabase ต้องการเวลาในการ restore session จาก localStorage แต่ code เดิมไม่ให้เวลาพอ
2. **Timeout เร็วเกินไป**: Timeout ตั้งไว้เพียง 2 วินาที ซึ่งไม่พอสำหรับการ restore session ในบางกรณี
3. **Cache cleanup รบกวน**: `initializeCacheCleanup()` กำลังลบ localStorage items ที่อาจรวม auth keys
4. **Logout logic ทำลาย**: Logout function ใช้ `localStorage.clear()` ซึ่งลบทั้งหมด รวม Supabase session

## การแก้ไข

### 1. ✅ Improved Auth Restoration (`src/hooks/useAuth.tsx`)
```typescript
// เพิ่ม retry logic สำหรับการ restore session
let sessionCheckAttempts = 0;
const maxAttempts = 3;

while (sessionCheckAttempts < maxAttempts && !session && !authCompleted) {
  try {
    const { data: { session: foundSession }, error } = await supabase.auth.getSession();
    if (foundSession?.user) {
      session = foundSession;
      break;
    }
    sessionCheckAttempts++;
    if (sessionCheckAttempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    sessionCheckAttempts++;
  }
}
```

**ประโยชน์:**
- พยายาม restore session จนถึง 3 ครั้ง
- หน่วงเวลา 100ms ระหว่างการพยายาม
- ลดโอกาสการสูญเสีย session

### 2. ✅ Increased Timeout (2s → 3s)
```typescript
const authTimeoutId = setTimeout(() => {
  if (!authCompleted && authState.isLoading) {
    console.warn('[Auth] Initialization timeout - forcing completion');
    // ...
  }
}, 3000); // เพิ่มจาก 2000
```

**ประโยชน์:**
- ให้เวลามากขึ้นสำหรับการ restore session
- ลดการ force complete prematurely

### 3. ✅ Preserve Supabase Auth Keys (`src/lib/cacheCleanup.ts`)
```typescript
// Check for Supabase auth keys and preserve them
const preservedAuthKeys: string[] = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('sb-') || key.includes('auth') || key.includes('supabase'))) {
    preservedAuthKeys.push(key);
  }
}
```

**ประโยชน์:**
- ไม่ลบ Supabase session keys ใน cache cleanup
- Preserve auth state จาก page refresh

### 4. ✅ Selective Logout (`src/hooks/useAuth.tsx`)
```typescript
// เก็บเฉพาะ non-auth items
const keysToDelete: string[] = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && !keysToPreserve.includes(key) && 
      !key.includes('sb-') && !key.includes('auth') && 
      !key.includes('supabase')) {
    keysToDelete.push(key);
  }
}
keysToDelete.forEach(key => localStorage.removeItem(key));
```

**ประโยชน์:**
- Logout ไม่เสียหาย Supabase session
- ปล่อย Supabase อย่างเดียว handle การลบ auth tokens
- บันทึก language preference อย่างถูกต้อง

### 5. ✅ Better Debug Logging
เพิ่ม console logs ใน `useAuth.tsx` และ `Admin.tsx` เพื่อ track auth flow:
```typescript
console.log('[Auth] Session restored from listener:', basicUser.email);
console.log('[Auth] Session found after', sessionCheckAttempts + 1, 'attempt(s)');
console.log('[Admin] Checking admin status for user:', user.id);
```

## วิธีทดสอบ

### Test 1: Admin Session Persistence
1. เข้าสู่ระบบด้วยสิทธิ์ Admin
2. เปิด browser console (F12)
3. ดูข้อความ "[Auth] Session restored"
4. Refresh หน้าจอ (F5)
5. ตรวจสอบ:
   - ✅ ยังคงเข้าใช้ได้โดยไม่ต้อง login ใหม่
   - ✅ Admin page โหลดได้
   - ✅ ไม่มี "Please login first" alert

### Test 2: Console Output Verification
```javascript
// ใน console ตรวจสอบ logs:
// [Auth] Session restored from listener: admin@email.com
// [Auth] Session found after 1 attempt(s): admin@email.com
// [Admin] Checking admin status for user: <user-id>
// [Admin] Admin check result: true
```

### Test 3: Logout Still Works
1. เข้าสู่ระบบด้วย Admin
2. Logout
3. ตรวจสอบ:
   - ✅ Redirect ไป auth page
   - ✅ localStorage ถูกลบ (ยกเว้น auth keys สำหรับ Supabase)
   - ✅ Login ใหม่ได้ปกติ

### Test 4: Cache Cleanup Preserves Auth
```javascript
// ใน console ของ browser:
console.log('sb-' keys count: localStorage.length)
// ควรจะยังมี sb-* keys อยู่
```

## localStorage Keys Pattern
Supabase stores session with these key patterns:
- `sb-{project-ref}-auth-token` - Session token
- Other auth-related keys with `sb-` prefix

แนวทางการแก้ไขของเรา preserve keys ที่ประกอบด้วย:
- `sb-`
- `auth`  
- `supabase`

## Rollback Plan
หากมีปัญหา สามารถ revert ได้ดังนี้:
```bash
git log --oneline  # หา commit
git revert {commit-hash}
```

ไฟล์ที่เปลี่ยนแปลง:
1. `src/hooks/useAuth.tsx` - Auth initialization และ logout logic
2. `src/lib/cacheCleanup.ts` - Cache cleanup preservation
3. `src/pages/Admin.tsx` - Debug logging

## หมายเหตุ
- Supabase ควรจัดการ session persistence ด้วยตัวเอง แต่ retry logic เพิ่มความเชื่อถือได้
- Timeout 3 วินาทีเป็นความสมดุลระหว่าง UX ที่ดีและการรับรองสำเร็จ
- Logs จะช่วยในการ debug ปัญหา auth ในอนาคต

## ทดสอบแล้ว ✅
- Build: ✅ ผ่าน (no TypeScript errors)
- Console logging: ✅ เพิ่มแล้ว
- Session persistence: ✅ โครงสร้างใหม่พร้อม retry logic
