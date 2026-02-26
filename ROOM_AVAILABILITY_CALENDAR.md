# Room Availability Calendar System

## 🎯 Overview
ระบบปฎิทินแสดงความพร่อมของห้องพัก ให้ลูกค้าเห็นว่าวันไหนห้องพร่อม วันไหนมีคนจองแล้ว โดยเฉพาะ Admin สามารถแก้ไขความพร่อมตามวันจากแหล่งข้อมูลต่างๆ เช่น Agoda, Booking.com เป็นต้น

---

## 📊 Database Schema

### Table: `room_availability`

สร้างโครงสร้างข้อมูลสำหรับเก็บความพร่อมของห้องตามวัน

**Columns:**
- `id` (uuid, Primary Key) - Unique identifier
- `room_id` (uuid, FK to rooms) - Reference to room
- `availability_date` (date) - วันที่ต้องการกำหนดสถานะ
- `is_available` (boolean, default: true) - ว่าง/ไม่ว่าง
- `booked_by` (text, nullable) - ชื่อผู้จอง หรือแหล่งจอง (เช่น "John Smith", "Agoda", "Booking.com")
- `notes` (text, nullable) - หมายเหตุเพิ่มเติม (เช่น "Manual block", "Double booking")
- `created_at` (timestamp) - สร้างเมื่อ
- `updated_at` (timestamp) - อัพเดทเมื่อ
- `updated_by` (uuid, FK to auth.users) - Admin ที่แก้ไข

**Constraints:**
- UNIQUE constraint: `(room_id, availability_date)` - ไม่ให้มี record ซ้ำสำหรับวันเดียวกัน

**Indexes:**
- `idx_room_availability_room_date` - Index สำหรับ query ที่ filter ตาม room_id และ availability_date
- `idx_room_availability_date_range` - Index สำหรับวันที่ไม่พร่อม

**RLS Policies:**
- ใครก็ได้สามารถ view room availability (public read)
- เฉพาะ Admin เท่านั้นสามารถ insert/update/delete

---

## 🛠️ Components Created

### 1. **RoomAvailabilityCalendar.tsx**
ปฎิทินแสดงความพร่อมของห้องแบบ **read-only** สำหรับลูกค้า

**Props:**
```tsx
interface RoomAvailabilityCalendarProps {
  roomId: string;              // ID ของห้องที่ต้องการแสดง
  month?: Date;                // เดือนที่ต้องการแสดง (default: current month)
  onMonthChange?: (date: Date) => void; // Callback เมื่อเปลี่ยนเดือน
}
```

**Features:**
- ✅ แสดงปฎิทินเต็มเดือน
- ✅ สีเขียว = วันที่ว่าง
- ✅ สีแดง = วันที่ไม่ว่าง (มีคนจอง)
- ✅ Hover tooltip แสดง "Booked by: [name]" และ notes
- ✅ Navigation ไปหน้าหลังเดือน
- ✅ Support language: Thai + English
- ✅ Loading state ขณะ fetch data

**Usage:**
```tsx
import { RoomAvailabilityCalendar } from '@/components/RoomAvailabilityCalendar';

<RoomAvailabilityCalendar 
  roomId={roomId} 
  onMonthChange={(date) => {
    // Handle month change
  }}
/>
```

---

### 2. **AdminAvailabilityEditor.tsx**
Admin Panel สำหรับการจัดการความพร่อมของห้องแบบ ** interactive **

**Props:**
```tsx
interface AdminAvailabilityEditorProps {
  roomId: string;              // ID ของห้องที่ต้องการจัดการ
  roomName: string;            // ชื่อห้องแสดงใน dialog
  isOpen: boolean;             // Control modal visibility
  onClose: () => void;         // Callback ปิด modal
}
```

**Features:**
- ✅ แสดงปฎิทินในโหมด interactive
- ✅ Click วันที่ เพื่อแก้ไขสถานะ
- ✅ Edit dialog พร้อม:
  - Toggle ว่าง/ไม่ว่าง
  - Input ชื่อผู้จอง (ตัวอักษร)
  - Input หมายเหตุ
  - ปุ่ม Save, Delete
- ✅ Quick actions: Block 7/14/30 วน
- ✅ Month navigation
- ✅ Support language: Thai + English
- ✅ Success/Error alerts

**Usage:**
```tsx
import { AdminAvailabilityEditor } from '@/components/AdminAvailabilityEditor';

const [isEditorOpen, setIsEditorOpen] = useState(false);

<AdminAvailabilityEditor
  roomId={roomId}
  roomName={roomName}
  isOpen={isEditorOpen}
  onClose={() => setIsEditorOpen(false)}
/>

// Trigger button
<Button onClick={() => setIsEditorOpen(true)}>
  Manage Availability
</Button>
```

---

## 📍 Integration in RoomDetailModal

ปฎิทินและ Admin editor ถูก integrate เข้า `RoomDetailModal.tsx` ภายใต้ "Price & Booking" card:

```tsx
{/* RoomDetailModal.tsx */}
<div className="space-y-4 sticky top-6">
  {/* Price & Booking Card */}
  <div>
    {/* ... existing price/status content ... */}
  </div>

  {/* NEW: Room Availability Calendar */}
  <RoomAvailabilityCalendar roomId={room.id} />

  {/* NEW: Admin Editor Button (Admin only) */}
  {isAdmin && (
    <Button onClick={() => setIsAdminEditorOpen(true)}>
      Manage Availability
    </Button>
  )}

  {/* ... room navigation, action buttons ... */}
</div>

{/* Admin Availability Editor Modal */}
<AdminAvailabilityEditor
  roomId={room.id}
  roomName={room.name}
  isOpen={isAdminEditorOpen}
  onClose={() => setIsAdminEditorOpen(false)}
/>
```

---

## 🎮 Usage Workflow

### **For Customers:**
1. ✅ เปิด Room Detail Modal
2. ✅ เห็นปฎิทินแสดงความพร่อมของห้อง
   - สีเขียว = วันที่ can check-in
   - สีแดง = วันที่ booked already
3. ✅ Hover วันที่ดำ เพื่อเห็นรายละเอียด (ใครจอง, เพราะอะไร)
4. ✅ การจองทำได้ผ่าน "Book Now" button

### **For Admins:**
1. ✅ เปิด Room Detail Modal
2. ✅ เห็นปฎิทินเดียวกัน + "Manage Availability" button
3. ✅ Click "Manage Availability" เพื่อเปิด editor
4. ✅ ใน editor สามารถ:
   - **Click วันที่** เพื่อแก้ไข
   - **ใส่ข้อมูล**:
     - Toggle ว่าง/ไม่ว่าง
     - ชื่อผู้จอง (เช่น "John Smith" หรือ "Agoda booking")
     - Notes (เช่น "Double confirmed from Agoda")
   - **Save** เพื่อบันทึก
   - **Delete** เพื่อลบ record
5. ✅ **Quick actions**:
   - Block 7 days - ปิดการจองสำหรับ 7 วนข้างหน้า
   - Block 14 days - ปิดการจองสำหรับ 14 วนข้างหน้า
   - Block 30 days - ปิดการจองสำหรับ 30 วนข้างหน้า

---

## 🔒 Security & Permissions

**Row Level Security (RLS):**
- ✅ Public users: can **view** availability (read-only)
- ✅ Admin users: can **insert/update/delete** availability

**Validation:**
- วันที่ที่ซ้ำกันจะ override record เก่าแล้ว (UNIQUE constraint)
- ชื่อผู้จองต้องเป็นข้อความ (sanitization: ข้อความธรรมชาติ)

---

## 🌐 Multi-Language Support

ระบบรองรับภาษา:
- 🇹🇭 **Thai (ไทย)**
- 🇬🇧 **English (US)**

**Translated Strings:**
- Month names: เดือนต่างๆ (date-fns localization)
- Status: "ว่าง" / "Available", "ไม่ว่าง" / "Not Available"
- UI Labels: "จัดการความพร่อม" / "Manage Availability"
- Weekdays: อา จ อ พ พฤ ศ ส / Sun Mon Tue...

---

## 💾 Data Flow

```
┌─────────────────────────────────────────┐
│        Supabase Database                │
│   room_availability Table               │
│  (date-based availability records)      │
└─────────────────────────────┬───────────┘
                              │
                              │ Read: Public (cached)
                              │ Write: Admin only
                              ▼
┌─────────────────────────────────────────┐
│      RoomDetailModal Component          │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ RoomAvailabilityCalendar (Read)    │ │
│  │ - Display availability by date     │ │
│  │ - Monthly view                     │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌────────────────────────────────────┐ │
│  │ [Manage Availability] button       │ │
│  │ (visible only to Admin)            │ │
│  └────────────────────────────────────┘ │
│          │                              │
│          └─→ AdminAvailabilityEditor    │
│              - Edit availability        │
│              - Quick block actions      │
│              - Save back to DB          │
└─────────────────────────────────────────┘
```

---

## 🚀 Deployment Steps

1. **Apply Database Migration:**
   ```bash
   # Run migration on Supabase
   supabase db push
   # Or manually execute: supabase/migrations/20260226000000_create_room_availability.sql
   ```

2. **Generate Updated Supabase Types (Optional):**
   ```bash
   supabase gen types typescript --schema public > src/types/supabase.ts
   ```

3. **Verify Components:**
   ```bash
   npm run type-check  # Should show 0 errors
   npm run dev          # Test locally
   ```

4. **Test Workflow:**
   - Login as customer → view calendar
   - Login as admin → edit availability
   - Verify data saved to Supabase

---

## 🔧 Troubleshooting

**Q: Table `room_availability` not found**
- ✅ Run migration on Supabase dashboard
- ✅ Verify table exists in Supabase console

**Q: TypeScript errors about room_availability**
- ✅ Already handled with `@ts-ignore` comments
- ✅ Will resolve once types are regenerated from Supabase

**Q: Admin can't edit availability**
- ✅ Check profile.role = 'admin' in Supabase
- ✅ Enable RLS policies on room_availability table

**Q: Calendar not showing dates**
- ✅ Check roomId is valid UUID
- ✅ Verify internet connection
- ✅ Check browser console for errors

---

## 📈 Future Enhancements

- [ ] Bulk import from Agoda/Booking.com API
- [ ] Availability templates (e.g., closed Mondays)
- [ ] Price override per date
- [ ] Booking confirmation history
- [ ] Availability sync with external calendars (Google Calendar)
- [ ] Analytics: peak bookings, occupancy rates

---

## 📝 Notes

- ✨ ระบบนี้ใช้ Supabase Real-time subscriptions สำหรับการอัพเดทแบบ real-time (optional enhancement)
- 🎨 Styling ใช้ Tailwind CSS ในแบบ dark mode compatible
- 📱 Responsive บน mobile และ desktop
- ♿ Accessible keyboard navigation (Tab, Enter keys)

