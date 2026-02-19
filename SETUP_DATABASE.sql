-- SETUP INSTRUCTIONS FOR ADMIN
-- This SQL script should be run in Supabase SQL Editor using the Admin account
-- URL: https://app.supabase.com/project/gomjfnkzhxqfmbwmaphz/sql
-- Login with admin credentials first

-- ======================================
-- ENABLE ANONYMOUS INSERT FOR SEEDING
-- ======================================

-- TEMPORARILY ALLOW ANONYMOUS INSERTS (for initial seeding only)
-- After seeding, disable these policies

-- Hero Content - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert hero content for seeding"
  ON public.hero_content
  FOR INSERT
  WITH CHECK (true);

-- Event Spaces - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert event spaces for seeding"
  ON public.event_spaces
  FOR INSERT
  WITH CHECK (true);

-- Rooms - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert rooms for seeding"
  ON public.rooms
  FOR INSERT
  WITH CHECK (true);

-- Menu Categories - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert menu categories for seeding"
  ON public.menu_categories
  FOR INSERT
  WITH CHECK (true);

-- Menus - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert menus for seeding"
  ON public.menus
  FOR INSERT
  WITH CHECK (true);

-- Room Images - Allow anonymous insert
CREATE OR REPLACE POLICY "Anyone can insert room images for seeding"
  ON public.room_images
  FOR INSERT
  WITH CHECK (true);

-- ======================================
-- INSERT HERO CONTENT
-- ======================================
INSERT INTO public.hero_content (image_url, title_th, title_en, subtitle_th, subtitle_en, is_active)
VALUES (
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=800&fit=crop',
  'ยินดีต้อนรับสู่เปลิน-พิง',
  'Welcome to Plern Ping',
  'ร้านกาแฟและจัดเลี้ยงที่สวยงามในเชียงใหม่',
  'Beautiful Cafe & Event Venue in Chiang Mai',
  true
)
ON CONFLICT DO NOTHING;

-- ======================================
-- INSERT EVENT SPACES
-- ======================================
INSERT INTO public.event_spaces (title_th, title_en, description_th, description_en, image_url, keywords_th, keywords_en, is_active)
VALUES (
  'ห้องจัดงาน',
  'Event Space',
  'พื้นที่กว้างขวางและสมบูรณ์สำหรับจัดงานต่างๆ เช่น งานแต่งงาน การประชุม และงานเลี้ยง',
  'Spacious and complete event space for various occasions such as weddings, meetings, and parties. Equipped with modern facilities and professional service.',
  'https://images.unsplash.com/photo-1519236395646-e914c58bf2d8?w=1200&h=800&fit=crop',
  'จัดงาน,ห้องประชุม,งานแต่งงาน',
  'events,conference,wedding',
  true
)
ON CONFLICT DO NOTHING;

-- ======================================
-- INSERT MENU CATEGORIES
-- ======================================
INSERT INTO public.menu_categories (name_th, name_en, sort_order)
VALUES 
  ('กาแฟ', 'Coffee', 1),
  ('เครื่องดื่ม', 'Beverages', 2),
  ('อาหาร', 'Food', 3),
  ('ของหวาน', 'Desserts', 4)
ON CONFLICT DO NOTHING;

-- ======================================
-- INSERT MENUS (AFTER CATEGORIES ARE INSERTED)
-- ======================================
INSERT INTO public.menus (name_th, name_en, description_th, description_en, price, category_id, image_url, is_recommended, is_active)
SELECT 
  'เอสเพรสโซ่',
  'Espresso',
  'โดส 1-2 โดสกาแฟที่ชาติและเข้มข้น',
  'Single or double shot of strong, concentrated coffee',
  45.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1),
  'https://images.unsplash.com/photo-1442512595331-e89e6fee58e9?w=400&h=400&fit=crop',
  true,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'เอสเพรสโซ่')

UNION ALL

SELECT 
  'คาปูชิโน่',
  'Cappuccino',
  'กาแฟเอสเพรสโซ่ผสมนมร้อนและโฟมนม',
  'Espresso coffee mixed with hot milk and milk foam',
  55.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1),
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  true,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'คาปูชิโน่')

UNION ALL

SELECT 
  'ลาเต้',
  'Latte',
  'กาแฟเอสเพรสโซ่ผสมนมร้อน',
  'Espresso coffee mixed with hot milk',
  55.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1),
  'https://images.unsplash.com/photo-1517701550927-30cf4ba52fe1?w=400&h=400&fit=crop',
  false,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'ลาเต้')

UNION ALL

SELECT 
  'น้ำส้มสด',
  'Fresh Orange Juice',
  'น้ำส้มสดปั่นจากส้มสดใหม่',
  'Freshly extracted juice from fresh oranges',
  50.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'เครื่องดื่ม' LIMIT 1),
  'https://images.unsplash.com/photo-1600271886742-f049cd1f85c0?w=400&h=400&fit=crop',
  false,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'น้ำส้มสด')

UNION ALL

SELECT 
  'ข้าวไข่เจียว',
  'Fried Rice with Egg',
  'ข้าวผัดกับไข่ไก่และเครื่องปรุง',
  'Fried rice with egg and seasonings',
  70.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'อาหาร' LIMIT 1),
  'https://images.unsplash.com/photo-1609501676725-7186f017a4b1?w=400&h=400&fit=crop',
  true,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'ข้าวไข่เจียว')

UNION ALL

SELECT 
  'เค้กช็อกโกแลต',
  'Chocolate Cake',
  'เค้กช็อกโกแลตสดใหม่',
  'Fresh chocolate cake',
  80.00,
  (SELECT id FROM public.menu_categories WHERE name_th = 'ของหวาน' LIMIT 1),
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  true,
  true
WHERE NOT EXISTS(SELECT 1 FROM public.menus WHERE name_th = 'เค้กช็อกโกแลต');

-- ======================================
-- INSERT ROOMS
-- ======================================
INSERT INTO public.rooms (name_th, name_en, description_th, description_en, price, is_active, sort_order)
VALUES 
  (
    'ห้องประชุมเล็ก',
    'Small Conference Room',
    'ห้องประชุมขนาดเล็กสำหรับประชุมขนาด 10-15 คน',
    'Small conference room for 10-15 people',
    2000.00,
    true,
    1
  ),
  (
    'ห้องประชุมกลาง',
    'Medium Conference Room',
    'ห้องประชุมขนาดกลางสำหรับประชุมขนาด 30-50 คน',
    'Medium conference room for 30-50 people',
    3500.00,
    true,
    2
  ),
  (
    'ห้องบอลรูม',
    'Ballroom',
    'ห้องบอลรูมขนาดใหญ่สำหรับงานเลี้ยงที่มีผู้เข้าร่วมจำนวนมาก',
    'Large ballroom for big events and parties',
    8000.00,
    true,
    3
  )
ON CONFLICT DO NOTHING;

-- ======================================
-- INSERT ROOM IMAGES
-- ======================================
INSERT INTO public.room_images (room_id, image_url, sort_order)
SELECT 
  r.id,
  CASE 
    WHEN r.name_th = 'ห้องประชุมเล็ก' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'
    WHEN r.name_th = 'ห้องประชุมกลาง' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'
    WHEN r.name_th = 'ห้องบอลรูม' THEN 'https://images.unsplash.com/photo-1519167758993-c1e1e5475d11?w=600&h=400&fit=crop'
  END,
  1
FROM public.rooms r
WHERE NOT EXISTS(
  SELECT 1 FROM public.room_images ri WHERE ri.room_id = r.id
);

-- ======================================
-- DISABLE SEEDING POLICIES (AFTER COMPLETION)
-- ======================================
-- Once seeding is complete, run these commands to remove the temporary policies:
-- DROP POLICY IF EXISTS "Anyone can insert hero content for seeding" ON public.hero_content;
-- DROP POLICY IF EXISTS "Anyone can insert event spaces for seeding" ON public.event_spaces;
-- DROP POLICY IF EXISTS "Anyone can insert rooms for seeding" ON public.rooms;
-- DROP POLICY IF EXISTS "Anyone can insert menu categories for seeding" ON public.menu_categories;
-- DROP POLICY IF EXISTS "Anyone can insert menus for seeding" ON public.menus;
-- DROP POLICY IF EXISTS "Anyone can insert room images for seeding" ON public.room_images;

-- ======================================
-- VERIFICATION QUERIES
-- ======================================
-- Check if data was inserted:
-- SELECT COUNT(*) as hero_count FROM public.hero_content;
-- SELECT COUNT(*) as event_count FROM public.event_spaces;
-- SELECT COUNT(*) as menu_count FROM public.menus;
-- SELECT COUNT(*) as room_count FROM public.rooms;
-- SELECT COUNT(*) as room_image_count FROM public.room_images;
