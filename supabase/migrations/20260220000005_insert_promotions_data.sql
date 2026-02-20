-- Insert sample promotions data
INSERT INTO public.promotions (
  title_th,
  title_en,
  description_th,
  description_en,
  image_url,
  discount_percentage,
  start_date,
  end_date,
  is_active,
  display_order
) VALUES
(
  'ส่วนลด 50% กาแฟพิเศษ',
  '50% Off Special Coffee',
  'ลด 50% สำหรับเมนูกาแฟทั้งหมด ทุกวันจันทร์-ศุกร์',
  '50% discount on all coffee menus, Monday-Friday',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b3f7?w=500&h=400&fit=crop',
  50,
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  0
),
(
  'อาหารชุด Buy 1 Get 1',
  'Meal Set Buy 1 Get 1',
  'ซื้อชุดอาหารรับประทุน 1 ชุด ฟรี 1 ชุด',
  'Buy 1 food set, get 1 free on all bundles',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=400&fit=crop',
  100,
  NOW(),
  NOW() + INTERVAL '5 days',
  true,
  1
) ON CONFLICT DO NOTHING;
