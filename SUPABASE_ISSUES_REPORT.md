# 🔍 Supabase Issues Report - Not Fixed Yet

**Date:** February 22, 2026  
**Status:** 📋 Issues Identified, Awaiting Lovable Fix

---

## Summary

ระบบ Supabase มีปัญหา **7 ข้อ** ที่ยังไม่ได้แก้ไข โดยเป็นปัญหาที่ตรวจสอบได้จากการ Security Audit

---

## 🔴 CRITICAL ISSUES (Supabase)

### 1. **CORS ยอมรับทุก Origin - ไม่มีการควบคุม**
**Severity:** 🔴 CRITICAL  
**Files:**
- [supabase/functions/booking/index.ts](supabase/functions/booking/index.ts#L4)
- [supabase/functions/contact/index.ts](supabase/functions/contact/index.ts#L4)
- [supabase/functions/pricing-chat/index.ts](supabase/functions/pricing-chat/index.ts#L6)
- [supabase/functions/quick-info/index.ts](supabase/functions/quick-info/index.ts#L5)
- [supabase/functions/send-line/index.ts](supabase/functions/send-line/index.ts#L5)

**Current Code:**
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // ❌ Allows ANY website
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
```

**Problem:**
- เว็บไซต์ใด ๆ ก็สามารถเรียก booking/contact API ได้
- สามารถจองห้องพัก หรือส่ง contact forms จากเว็บอื่น
- CSRF attack possible

**Fix Needed:**
```typescript
const ALLOWED_ORIGINS = [
  'https://lanna-charm.com',
  'https://www.lanna-charm.com',
];

function getCorsHeaders(origin: string) {
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Headers': isAllowed ? '...' : '',
    'Access-Control-Allow-Methods': isAllowed ? 'GET,POST' : '',
  };
}
```

---

### 2. **Rate Limiting ใช้ Memory เท่านั้น - หายเมื่อ Cold Start**
**Severity:** 🔴 CRITICAL  
**Files:**
- [supabase/functions/booking/index.ts](supabase/functions/booking/index.ts#L8-L23)
- [supabase/functions/contact/index.ts](supabase/functions/contact/index.ts#L8-L23)
- [supabase/functions/pricing-chat/index.ts](supabase/functions/pricing-chat/index.ts#L11-L25)
- [supabase/functions/quick-info/index.ts](supabase/functions/quick-info/index.ts#L11-L24)

**Current Code:**
```typescript
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);  // ❌ In-memory only
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  record.count++;
  return record.count > RATE_LIMIT;
}
```

**Problem:**
- ตัวเก็บข้อมูล rate limit หายเมื่อ server restart
- Cold start = ตัวเก็บใหม่ = ไม่มีประวัติ request เก่า
- Attacker สามารถส่ง unlimited requests เมื่อ cold start
- DoS attack possible

**Fix Needed:**
```
ย้าย rate limit data ไปเก็บใน Supabase table ที่ persistent
Create table: rate_limits (ip_hash, count, reset_time)
Query database แทน in-memory store
```

---

### 3. **Input Sanitization อ่อน - มี XSS Risk**
**Severity:** 🔴 CRITICAL  
**Files:**
- [supabase/functions/booking/index.ts](supabase/functions/booking/index.ts#L46-L52)
- [supabase/functions/contact/index.ts](supabase/functions/contact/index.ts#L41-L47)
- [supabase/functions/pricing-chat/index.ts](supabase/functions/pricing-chat/index.ts#L29-L35)
- [supabase/functions/send-line/index.ts](supabase/functions/send-line/index.ts#L27-L33)

**Current Code:**
```typescript
function sanitizeString(str: string, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')  // ❌ Only removes < and >
    .trim()
    .substring(0, maxLength);
}
```

**Problem:**
- ป้องกันเพียง `<` และ `>` เท่านั้น
- Bypass ง่าย: `<img onerror=alert()>` ← NOT removed
- `<svg onload=bad()>` ← NOT removed
- Event handlers: `onclick=`, `onmouseover=` ← NOT removed

**Fix Needed:**
```
ใช้ DOMPurify หรือ HTML entity encoding
Remove ALL HTML/JavaScript executable code
```

---

## 🟠 HIGH-RISK ISSUES (Supabase)

### 4. **Email Validation ไม่ดี - ยอมให้ Invalid Email**
**Severity:** 🟠 HIGH  
**Files:**
- [supabase/functions/booking/index.ts](supabase/functions/booking/index.ts#L26-L28)
- [supabase/functions/contact/index.ts](supabase/functions/contact/index.ts#L24-L26)

**Current Code:**
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}
```

**Problem:**
- Regex ไม่ดี: `"test@"` ✓ pass
- `"test@.com"` ✓ pass
- `"test@@mail.com"` ✓ pass
- `"test@mail"` ✓ pass (no TLD)

**Fix Needed:**
```
RFCใ 5322 regex หรือ email library validation
```

---

### 5. **Phone Number Validation - Weak**
**Severity:** 🟠 HIGH  
**Files:**
- [supabase/functions/contact/index.ts](supabase/functions/contact/index.ts#L36-L40)

**Current Code:**
```typescript
function validatePhone(phone: string): boolean {
  const cleanPhone = phone.trim();
  const phoneRegex = /^\d{10}$/;  // Only 10 digits
  return phoneRegex.test(cleanPhone);
}
```

**Problem:**
- ยอมให้ `"0000000000"` (all zeros)
- ยอมให้ `"1111111111"` (all same digit)
- ไม่ support international format
- ไม่ validate Thailand phone format properly

---

### 6. **Missing Audit Logging Table**
**Severity:** 🟠 HIGH

**Current State:**
- ❌ NO `admin_audit_logs` table in database
- ❌ NO audit trail สำหรับ admin actions

**What's Needed:**
```sql
CREATE TABLE admin_audit_logs (
  id uuid,
  user_id uuid,
  action text,
  resource text,
  timestamp timestamp,
  details jsonb
);
```

---

### 7. **Missing Rate Limit Table**
**Severity:** 🟠 HIGH

**Current State:**
- ❌ NO persistent `rate_limits` table
- Rate limiting only in-memory (issue #2)

**What's Needed:**
```sql
CREATE TABLE rate_limits (
  id uuid,
  ip_hash text,
  count integer,
  reset_time timestamp
);
```

---

## 📋 Supabase Infrastructure Checklist

- [x] ✅ User roles table (user_roles)
- [x] ✅ Profiles table (profiles)
- [x] ✅ Content tables (rooms, menus, gallery, etc.)
- [x] ✅ Review tables (reviews, review_likes)
- [x] ✅ Forum tables (forum_topics, forum_replies, forum_likes)
- [x] ✅ Business info table (business_info)
- [x] ✅ Activity logs table (activity_logs)
- [ ] ❌ **Admin audit logs table** ← MISSING
- [ ] ❌ **Rate limits table** ← MISSING
- [ ] ❌ **Session management table** ← MISSING

---

## 🔐 RLS (Row Level Security) Status

**Checked:** All existing tables have RLS policies configured properly

- ✅ Rooms RLS: `Only admins can modify`
- ✅ Menus RLS: `Only admins can modify`
- ✅ Gallery RLS: `Only admins can modify`
- ✅ Reviews RLS: `Only admins can modify`
- ✅ Profiles RLS: `Users can update own profile`
- ✅ Storage RLS: `Proper bucket policies`

---

## 🔍 Functions Status

All 5 Supabase functions have the same core issues:

| Function | CORS | Rate Limit | Input Sanitization | Validation |
|----------|------|-----------|-------------------|------------|
| booking | ❌ | ❌ | ❌ | ⚠️ |
| contact | ❌ | ❌ | ❌ | ⚠️ |
| pricing-chat | ❌ | ❌ | ❌ | ✅ |
| quick-info | ❌ | ❌ | ❌ | ✅ |
| send-line | ❌ | ❌ | ❌ | N/A |

---

## 📊 Priority to Fix

### สำหรับ Lovable ในลำดับ:

1. **CORS Origin Whitelist** (ทุก functions)
   - ไฟล์: 5 functions
   - เวลา: ~30 นาที

2. **Input Sanitization Upgrade** (ทุก functions)
   - ใช้ DOMPurify หรือ escapeHtml
   - ไฟล์: 5 functions
   - เวลา: ~1 ชั่วโมง

3. **Email Validation Fix** (booking, contact)
   - ไฟล์: 2 functions
   - เวลา: ~15 นาที

4. **Phone Number Validation** (contact)
   - ไฟล์: 1 function
   - เวลา: ~15 นาที

5. **Create Audit Logs Table** (Migration)
   - ไฟล์: New migration file
   - เวลา: ~30 นาที

6. **Create Rate Limits Table** (Migration)
   - ไฟล์: New migration file
   - เวลา: ~30 นาที

7. **Move Rate Limiting to Database** (ทุก functions)
   - ไฟล์: 4 functions
   - เวลา: ~2 ชั่วโมง

---

## 💡 Quick Summary for Lovable

```
Priority 1 (Must Fix):
┌─────────────────────────────────┐
│ 1. CORS - Whitelist allowed     │
│ 2. Input sanitization - Upgrade │
│ 3. Email/Phone validation       │
└─────────────────────────────────┘

Priority 2 (Should Fix):
┌─────────────────────────────────┐
│ 4. Audit logs table (migration) │
│ 5. Rate limit persistence       │
└─────────────────────────────────┘
```

---

## ⚠️ Risk Level: HIGH

- **Current**: System is vulnerable to:
  - CORS abuse
  - XSS attacks (via sanitization bypass)
  - DoS attacks (rate limit bypass on cold start)
  - Invalid data acceptance

- **When Fixed**: System will be significantly more secure

---

## 📝 Notes

- Audit report already generated: [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)
- All issues are in Supabase layer (functions)
- Frontend/React code is relatively secure
- Backend authorization (useAdminStatus.tsx) needs separate fix

---

**Prepared By:** Security Audit Tool  
**Ready For:** Lovable AI to implement fixes
