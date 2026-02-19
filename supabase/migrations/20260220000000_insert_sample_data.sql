-- Insert sample data for hero_content
INSERT INTO public.hero_content (image_url, title_th, title_en, subtitle_th, subtitle_en, is_active)
VALUES (
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=800&fit=crop',
  'ยินดีต้อนรับสู่เปลิน-พิง',
  'Welcome to Plern Ping',
  'ร้านกาแฟและจัดเลี้ยงที่สวยงามในเชียงใหม่',
  'Beautiful Cafe & Event Venue in Chiang Mai',
  true
);

-- Insert sample data for event_spaces
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
);

-- Insert sample data for menu_categories (if not exists)
INSERT INTO public.menu_categories (name_th, name_en, sort_order)
VALUES 
  ('กาแฟ', 'Coffee', 1),
  ('เครื่องดื่ม', 'Beverages', 2),
  ('อาหาร', 'Food', 3),
  ('ของหวาน', 'Desserts', 4)
ON CONFLICT DO NOTHING;

-- Get category IDs for use in menus
WITH coffee_cat AS (SELECT id FROM public.menu_categories WHERE name_th = 'กาแฟ' LIMIT 1),
     beverage_cat AS (SELECT id FROM public.menu_categories WHERE name_th = 'เครื่องดื่ม' LIMIT 1),
     food_cat AS (SELECT id FROM public.menu_categories WHERE name_th = 'อาหาร' LIMIT 1),
     dessert_cat AS (SELECT id FROM public.menu_categories WHERE name_th = 'ของหวาน' LIMIT 1)

-- Insert sample menus
INSERT INTO public.menus (name_th, name_en, description_th, description_en, price, category_id, image_url, is_recommended, is_active)
SELECT 
  'เอสเพรสโซ่',
  'Espresso',
  'โดส 1-2 โดสกาแฟที่ชาติและเข้มข้น',
  'Single or double shot of strong, concentrated coffee',
  45.00,
  coffee_cat.id,
  'https://images.unsplash.com/photo-1442512595331-e89e6fee58e9?w=400&h=400&fit=crop',
  true,
  true
FROM coffee_cat

UNION ALL
SELECT 
  'คาปูชิโน่',
  'Cappuccino',
  'กาแฟเอสเพรสโซ่ผสมนมร้อนและโฟมนม',
  'Espresso coffee mixed with hot milk and milk foam',
  55.00,
  coffee_cat.id,
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  true,
  true
FROM coffee_cat

UNION ALL
SELECT 
  'ลาเต้',
  'Latte',
  'กาแฟเอสเพรสโซ่ผสมนมร้อน',
  'Espresso coffee mixed with hot milk',
  55.00,
  coffee_cat.id,
  'https://images.unsplash.com/photo-1517701550927-30cf4ba52fe1?w=400&h=400&fit=crop',
  false,
  true
FROM coffee_cat

UNION ALL
SELECT 
  'น้ำส้มสด',
  'Fresh Orange Juice',
  'น้ำส้มสดปั่นจากส้มสดใหม่',
  'Freshly extracted juice from fresh oranges',
  50.00,
  beverage_cat.id,
  'https://images.unsplash.com/photo-1600271886742-f049cd1f85c0?w=400&h=400&fit=crop',
  false,
  true
FROM beverage_cat

UNION ALL
SELECT 
  'ข้าวไข่เจียว',
  'Fried Rice with Egg',
  'ข้าวผัดกับไข่ไก่และเครื่องปรุง',
  'Fried rice with egg and seasonings',
  70.00,
  food_cat.id,
  'https://images.unsplash.com/photo-1609501676725-7186f017a4b1?w=400&h=400&fit=crop',
  true,
  true
FROM food_cat

UNION ALL
SELECT 
  'เค้กช็อกโกแลต',
  'Chocolate Cake',
  'เค้กช็อกโกแลตสดใหม่',
  'Fresh chocolate cake',
  80.00,
  dessert_cat.id,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
  true,
  true
FROM dessert_cat;

-- Insert sample rooms
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
  );

-- Insert sample room images
WITH rooms_data AS (
  SELECT id, name_th FROM public.rooms
)
INSERT INTO public.room_images (room_id, image_url, sort_order)
SELECT 
  r.id,
  CASE 
    WHEN r.name_th = 'ห้องประชุมเล็ก' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'
    WHEN r.name_th = 'ห้องประชุมกลาง' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop'
    WHEN r.name_th = 'ห้องบอลรูม' THEN 'https://images.unsplash.com/photo-1519167758993-c1e1e5475d11?w=600&h=400&fit=crop'
  END,
  1
FROM rooms_data r;
