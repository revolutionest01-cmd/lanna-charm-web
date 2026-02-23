# 🔒 รายงานการตรวจสอบความปลอดภัย - ลานนา ชาร์ม (ภาษาไทย)

**วันที่:** 22 กุมภาพันธ์ 2026  
**สถานะ:** ⚠️ **พบปัญหา - ต้องแก้ไขเร่ง**

---

## สรุปภาพรวม (Executive Summary)

พบปัญหาความปลอดภัย **9 ปัญหาวิกฤต/สูง** และ **12 ปัญหากลาง** ที่จำเป็นต้องแก้ไข อาจเกี่ยวข้องกับ:
- การยืนยันตัวตน (Authentication) และการอนุญาต (Authorization)
- การตรวจสอบข้อมูลนำเข้า (Input Validation)
- การรั่วไหลของข้อมูลที่ละเอียดอ่อน

---

## 🔴 ปัญหาวิกฤต (CRITICAL) - แก้ไขด่วน

### 1. **Admin Status Spoofing - ใครก็ปลอมแปลงได้**
**ความรุนแรง:** 🔴 วิกฤต  
**ไฟล์ที่มีปัญหา:** `src/hooks/useAdminStatus.tsx`

**ปัญหา:** สถานะ Admin เก็บไว้ใน localStorage (ที่เก็บข้อมูลเบราว์เซอร์)

```typescript
// ❌ CODE ที่เปิดช่องโหว่
const cached = localStorage.getItem(ADMIN_CACHE_KEY);
// ผู้ใช้สามารถเปิด DevTools และแก้ไข localStorage ได้!
```

**ความเสี่ยง:** 
- ผู้ใช้ทั่วไปสามารถเปลี่ยน `app-admin-status` เป็น `true` 
- ข้ามการป้องกันแผงควบคุม Admin ได้โดยง่าย
- สามารถแก้ไขข้อมูลที่ไม่ควรแก้ไข

**วิธีแก้:**
```typescript
// ✅ ห้ามเชื่อถือ localStorage สำหรับสิ่งสำคัญด้านความปลอดภัย
// ต้องตรวจสอบจากฐานข้อมูลทุกครั้ง
const verifyAdmin = async (userId: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  return !!data && data.role === 'admin';
};
```

---

### 2. **ไม่มีการตรวจสอบ Admin ทางเซิร์ฟเวอร์**
**ความรุนแรง:** 🔴 วิกฤต  
**ไฟล์ที่มีปัญหา:** `src/pages/Admin.tsx`, `src/components/admin/*`

**ปัญหา:** ตรวจสอบการอนุญาตเฉพาะทางไคลเอนต์ (JavaScript ฝั่งผู้ใช้)

```typescript
// ❌ ตรวจสอบเฉพาะฝั่งไคลเอนต์
if (!isAuthenticated || !isAdmin) return null;
// ถ้าผู้ใช้แก้ไข isAdmin เป็น true ก็จะเข้าได้!
```

**ความเสี่ยง:**
- หากแก้ไข state ก็เห็นหน้า Admin เสมือนมีสิทธิ
- ไม่มีการตรวจสอบฝั่งเซิร์ฟเวอร์ทุกครั้งที่ส่ง request

**วิธีแก้:**
```typescript
// ✅ ตรวจสอบทุกครั้งที่ทำการดำเนินการ Admin
const handleAdminAction = async () => {
  // 1. ตรวจสอบ session มีผล
  const { data } = await supabase.auth.getSession();
  
  // 2. ตรวจสอบบทบาท Admin จากฐานข้อมูล
  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.session.user.id)
    .single();
  
  // 3. ยืนยันว่าเป็น admin จริง ๆ
  if (role?.role !== 'admin') {
    throw new Error('ไม่มีสิทธิ์เข้าถึง');
  }
  
  // 4. ทำการดำเนินการ
};
```

---

### 3. **Race Condition - ตรวจสอบล่าช้า**
**ความรุนแรง:** 🔴 วิกฤต  

**ปัญหา:** ให้สิทธิ์ Admin ทันที แล้วตรวจสอบในเบื้องหลัง

```typescript
// ❌ ให้สิทธิ์จาก Cache ทันที
const cachedStatus = getCachedAdminStatus(user.id);
if (cachedStatus !== null) {
  setIsAdmin(cachedStatus);  // ✅ ให้สิทธิ์แล้ว!
  
  // ตรวจสอบในภายหลัง (async)
  checkAdminStatusFromDB(user.id).catch(error => {
    // ไม่ทำอะไรถ้าตรวจสอบล้มเหลว!
  });
}
```

**ความเสี่ยง:**
- บทบาท Admin ถูกยกเลิก แต่ผู้ใช้ยังเข้าได้เพราะ cache
- สามารถดำเนินการ Admin สำเร็จก่อนตรวจสอบเสร็จ

---

### 4. **การตรวจสอบข้อมูลอ่อน - มีความเสี่ยง XSS**
**ความรุนแรง:** 🔴 วิกฤต

```typescript
// ❌ ป้องกันเพียงอักษร < และ >
function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}

// ถูกข้ามง่าย:
// <img src=x onerror=alert('xss')>  → ไม่ถูกลบ ❌
// <svg onload=alert()>              → ไม่ถูกลบ ❌
```

**วิธีแก้:**
```typescript
// ✅ ใช้ DOMPurify
import DOMPurify from 'dompurify';

function sanitizeString(str: string): string {
  return DOMPurify.sanitize(str, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// ทำให้ npm install ก่อน
// npm install dompurify
```

---

### 5. **ใช้ Room ID โดยตรงในฐานข้อมูล**
**ความรุนแรง:** 🔴 วิกฤต

```typescript
// ❌ Room ID จากผู้ใช้ใส่ URL โดยตรง
const fetchUrl = `${supabaseUrl}/rest/v1/rooms?id=eq.${sanitizedRoomId}`;
```

**ความเสี่ยง:**
- อาจข้ามตัวกรองได้ เช่น `&is_active=eq.false` (เห็นห้องปิด)
- Filter injection attacks

---

## 🟠 ปัญหาสูง (HIGH) - แก้ไขใน 1 สัปดาห์

### 6. **Rate Limiting หายเมื่อเซิร์ฟเวอร์รีสตาร์ท**
**ปัญหา:** เก็บไว้เพียง Memory (RAM) เท่านั้น

```typescript
// ❌ เก็บใน RAM ฝั่งเซิร์ฟเวอร์เท่านั้น
const rateLimitStore = new Map();
// หายทั้งหมดเมื่อ cold start!
```

**วิธีแก้:** ย้ายไปเก็บใน Supabase

---

### 7. **CORS ไม่มีการควบคุม**
**ปัญหา:** เว็บไซต์อื่นก็สามารถเรียก API ได้

```typescript
// ❌ อนุญาตทุกเว็บไซต์
'Access-Control-Allow-Origin': '*'
```

**ผู้เสี่ยง:**
- เว็บไซต์อื่น ๆ สามารถจองห้องพัก
- สแปมแบบฟอร์มติดต่อ

**วิธีแก้:** เพิ่มรายชื่อที่อนุญาต
```typescript
const ALLOWED_ORIGINS = [
  'https://lanna-charm.com',
  'https://www.lanna-charm.com',
];
```

---

### 8. **ข้อมูลส่วนตัวในไฟล์ Log**
**ปัญหา:** เก็บอีเมล วันที่ เบอร์โทรใน logs

```typescript
// ❌ ลง log ข้อมูลส่วนตัว
console.log('Booking:', { 
  name: sanitizedName,
  email: sanitizedEmail,  // ❌ เสี่ยง!
  phone: sanitizedPhone   // ❌ เสี่ยง!
});
```

**ความเสี่ยง:** ทำให้อ่านได้ ฝ่ายปกครองหรือใครเข้าหาย logs ได้

---

### 9. **ไม่มี Session Timeout**
**ปัญหา:** Session มีผลตลอดไป

**ความเสี่ยง:** ทิ้งคอมพิวเตอร์ ใครก็ใช้ได้

**วิธีแก้:** ออกจากระบบอัตโนมัติหลังจาก 1 ชั่วโมง

---

## 🟡 ปัญหากลาง (MEDIUM) - แก้ไขเดือนนี้

### 10. **เบอร์โทรตรวจสอบไม่ถูก**
```typescript
// ❌ ยอมให้ 1-10 หลัก
const regex = /^\d{1,10}$/;

// ✅ ต้องเป็น 10 หลักพอดี
const regex = /^0\d{9}$/;
```

### 11. **อีเมลตรวจสอบไม่ถูก**
```typescript
// ❌ ตรวจสอบไม่ดี: "test@" ยอมได้
// ✅ ต้องใช้ RFC 5322 หรือ URL constructor
```

### 12. **ไม่มี HTTPS Enforcement (HSTS)**
- ต้องเพิ่มใน netlify.toml

### 13. **ไม่มี CSRF Token**
- ฟอร์มต้องมี token สำหรับป้องกัน CSRF

### 14. **ไม่เข้ารหัส localStorage**
- Auth tokens เก็บแบบข้อความธรรมชาติ
- XSS สามารถอ่านได้ง่าย

### 15. **ไม่มี Rate Limiting ฝั่ง Client**
- ตัวอักษรสามารถส่ง request ได้หลายครั้ง

### 16. **ไม่มี Content Security Policy (CSP)**
- ช่วยป้องกัน XSS

### 17. **ไม่ log การกระทำของ Admin**
- ต้อง log ทุกครั้งที่ admin แก้ไขข้อมูล

### 18. **API ตำแหน่งสาธารณะ**
- ไฟล์ URL สามารถเดาได้

---

## 📋 รายการวิธีแก้ (Action Items)

### วิกฤต (ทำทันที)
- [ ] ลบ Admin status ออกจาก localStorage caching
- [ ] เพิ่มการตรวจสอบ Admin ฝั่ง server ทุกครั้ง
- [ ] แก้ race condition ในการตรวจสอบ
- [ ] ใช้ DOMPurify เปลี่ยน sanitization
- [ ] ใช้ Supabase client library แทน raw fetch

### สูง (สัปดาห์นี้)
- [ ] ย้าย rate limiting ไปเก็บ Supabase
- [ ] เพิ่มโครงการ CORS whitelist
- [ ] ลบข้อมูลส่วนตัวออกจาก log
- [ ] เพิ่ม session timeout

### กลาง (เดือนนี้)
- [ ] ตรวจสอบเบอร์โทรเข้มงวด
- [ ] รวบรวมลบ Password validation
- [ ] เพิ่ม HTTPS enforcement
- [ ] เพิ่ม CSRF tokens
- [ ] เพิ่ม CSP headers
- [ ] เพิ่ม admin audit logging

---

## 📦 Package ที่ต้องติดตั้ง

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

---

## ✅ ขั้นตอนถัดไป

1. **ทันที:** ตรวจสอบปัญหา CRITICAL
2. **สัปดาห์นี้:** จัดตารางเวลา แก้ไข
3. **สิ้นเดือน:** คืนกำเนิดกระบวนการตรวจสอบความปลอดภัย

---

**สรุป:** มีปัญหาความปลอดภัยที่สำคัญ แต่สามารถแก้ไขได้ทั้งหมด

**ผู้บ่งชี้:** การตรวจสอบความปลอดภัยอัตโนมัติ  
**วันที่:** 22 กุมภาพันธ์ 2566
