/**
 * ระบบคะแนนและยศของ Lanna Charm - ข้อมูลสรุป
 * Summary of Point System & Ranking Tiers
 */

# 📊 ระบบคะแนนและยศ Lanna Charm Community

## 1️⃣ ระบบคะแนน (Point System)

### Action Score (ทำเองได้)
- **ตั้งกระทู้ใหม่**: +10 คะแนน
- **ตอบกระทู้**: +5 คะแนน  
- **เข้าต่อเนื่องทุกวัน (Daily Streak)**: +2 คะแนน/วัน
- **เขียนรีวิว**: +8 คะแนน

### Quality Score (คนอื่นมอบให้)
- **ได้รับไลค์/ถูกใจ**: +15 คะแนน
- **ถูกปักหมุด**: +50 คะแนน
- **เลือกเป็น Best Answer**: +50 คะแนน
- **รีวิวถูก Mark Helpful**: +20 คะแนน

### Penalties (ลงโทษ)
- **ตรวจพบ Spam**: -20 คะแนน
- **กระทู้ถูกลบ**: -20 คะแนน
- **ถูก Report**: -15 คะแนน

### Daily Limits (ป้องกัน Spam)
- ได้สูงสุด **100 คะแนน** จากการตอบต่อวัน
- ได้สูงสุด **150 คะแนน** ต่อวันทั้งหมด

### Spam Detection Rules
- ต้องพิมพ์อย่างน้อย **5 ตัวอักษร**
- ต้องมีอย่างน้อย **2 คำ**
- คำที่ถูกแบน: "555", "ดัน", "อ่อ", "xxxx" เป็นต้น

---

## 2️⃣ ลำดับยศ (Ranking Tiers) - ธีมลานนา

| ระดับ | ชื่อยศ | ไอคอน | พิสัยคะแนน | สีธีม | ง่ายมายอลข│
|------|--------|-------|----------|-------|--------|
| 1 | นักศึกษา (Initiate) | 🧑‍🎓 | 0-100 | Blue | ผู้มาใหม่ |
| 2 | สูตรศิลป์ (Artisan) | 🎨 | 101-500 | Green | สมาชิกประจำ |
| 3 | นักบุญ (Sage) | 🙏 | 501-2,000 | Purple | ผู้มีประสบการณ์ |
| 4⭐ | ปราชญ์ (Scholar) | 🧙 | 2,001-5,000 | Amber | ผู้เชี่ยวชาญ |
| 5⭐ | อาจารย์ (Master) | ✨ | 5,001-10,000 | Rose | ปรมาจารย์ |
| 6👑 | บารมี (Legend) | 👑 | 10,001+ | Gold | ตำนาน |

---

## 3️⃣ สิทธิพิเศษ (Perks & Privileges)

### Visual Perks (โชว์ความเท่)

| ยศ | ปรมาจารย์ (5) | บารมี (6) |
|---|---|---|
| **กรอบรูป** | ✅ | ✅ |
| **สีชื่อโดดเด่น** | ✅ | ✅ |
| **เอฟเฟกต์นิมนต์** | - | ✅ |
| **ป้ายพิเศษ** | - | ✅ |

### System Perks (สิทธิในระบบ)

| สิทธิ | ยศขั้นต่ำ | รายละเอียด |
|------|--------|-----------|
| **ห้องลับ VIP** | ปราชญ์ (4) | เข้าถึงบอร์ดลับสำหรับการสนทนาระดับสูง |
| **เปลี่ยนชื่อปีละครั้ง** | นักบุญ (3) | เปลี่ยน Display Name ได้ปีละ 1 ครั้ง |
| **กรอบรูปโปรไฟล์** | อาจารย์ (5) | ปรับแต่งกรอบรูปให้หรูหรา |
| **ฉายาสุดคูล** | อาจารย์ (5) | ตั้งฉายาของตัวเองแสดงต่อท้ายชื่อ |
| **พื้นที่เก็บไฟล์เพิ่ม** | ปราชญ์ (4) | อัปโหลดไฟล์ขนาดใหญ่ได้มากขึ้น |
| **ป้ายเลื่องชื่อ** | บารมี (6) | ป้ายพิเศษแสดงในโปรไฟล์และโพสต์ |
| **เอฟเฟกต์นิมนต์** | บารมี (6) | ชื่อผู้ใช้มีเอฟเฟกต์ส่องแสง |

---

## 4️⃣ ขั้นตอนการอัปเลเวล (Level-Up Flow)

```
1. User Action
   └─ ผู้ใช้ตั้งกระทู้/ตอบ/ได้ไลค์

2. Event Listener
   └─ ระบบจับการกระทำ

3. Point Calculation
   └─ คำนวณคะแนนตามกฎระบบ
   └─ ตรวจสอบ Daily Limits
   └─ ตรวจสอบ Spam Detection

4. Save to Database
   └─ บันทึกคะแนนลง DB

5. Rank Check
   └─ ตรวจสอบกับตาราง Rank Threshold

6. Level Up Trigger
   └─ ถ้าผ่านเกณฑ์ → Trigger LevelUp

7. Celebrate & Notify
   └─ Pop-up Celebration
   └─ Sound Effect
   └─ Display New Perks
   └─ Show in Profile
```

---

## 5️⃣ Frontend Components ที่สร้างแล้ว

### 📁 Utility Files
- **[src/lib/pointSystem.ts](src/lib/pointSystem.ts)** 
  - Configuration ระบบคะแนน
  - Helper functions (isSpam, calculatePoints, getRankFromPoints, etc.)
  - Rank tier definitions

### 🎨 UI Components
- **[src/components/RankingSystem.tsx](src/components/RankingSystem.tsx)**
  - แสดงยศปัจจุบัน
  - Progress bar ไปยังยศถัดไป
  - Rank progression timeline
  - Unlocked perks display
  - Coming soon perks

- **[src/components/PointSystemVisualization.tsx](src/components/PointSystemVisualization.tsx)**
  - Action Points table
  - Quality Points table
  - Penalties table
  - Spam Detection rules
  - Point comparison bar chart

- **[src/components/LevelUpCelebration.tsx](src/components/LevelUpCelebration.tsx)**
  - Pop-up celebration modal
  - Confetti animation
  - Trophy bounce animation
  - Display new perks
  - Reward message

- **[src/components/UserEngagementStats.tsx](src/components/UserEngagementStats.tsx)** (Updated)
  - Ranking System integration
  - Point System visualization
  - Activity trend chart
  - Activity history (Topics/Replies/Reviews)

---

## 6️⃣ ในอนาคต (Next Steps - ผู้ใช้จะจัดการ)

### ✅ แบ็กเอนด์ & ฐานข้อมูล
- [ ] สร้าง `user_points` table เพื่อเก็บประวัติคะแนน
- [ ] สร้าง `user_ranks` table เพื่อเก็บยศปัจจุบันและสิทธิ
- [ ] สร้าง `point_transactions` table สำหรับ audit trail
- [ ] สร้าง trigger/function เพื่ออัปเดตคะแนนโดยอัตโนมัติ
- [ ] สร้าง daily script สำหรับ cleanup spam

### 🎯 Frontend Enhancements
- [ ] เชื่อม LevelUpCelebration modal กับ real-time updates
- [ ] เพิ่มhistory view สำหรับการได้คะแนน
- [ ] สร้าง leaderboard page แสดง top users
- [ ] เพิ่มตัวอักษรปรับแต่ง avatar frame ให้ลาแนน

### 📱 Advanced Features
- [ ] Notification system แจ้งเมื่อมีการอัปเลเวล
- [ ] Achievement badges system
- [ ] Monthly ranking reset option
- [ ] Point multiplier events (seasonal)

---

## 📝 หมายเหตุ

✅ **ปัจจุบัน**: ระบบหน้า Frontend สมบูรณ์แล้ว พร้อมใช้งาน
🔄 **ต่อไป**: ผู้ใช้จะจัดการส่วน Backend และ Database เอง  
💾 **ข้อมูล Mock**: ปัจจุบันใช้ข้อมูลจากการสะสม points จากจำนวน topics/replies/reviews

---

**Created**: February 26, 2026  
**Theme**: Lanna Culture 🏯  
**Status**: Frontend Complete ✅
