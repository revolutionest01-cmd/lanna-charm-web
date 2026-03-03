INSERT INTO public.feature_toggles (
  feature_key,
  feature_name_th,
  feature_name_en,
  description_th,
  description_en,
  is_enabled
)
VALUES
  (
    'features',
    'หน้าแรก: จุดเด่น',
    'Homepage: Features',
    'ส่วนแนะนำจุดเด่นของหน้าแรก',
    'Landing page features section',
    true
  ),
  (
    'rooms',
    'หน้าแรก: ห้องพัก',
    'Homepage: Rooms',
    'ส่วนแสดงห้องพักบนหน้าแรก',
    'Landing page rooms section',
    true
  ),
  (
    'menu',
    'หน้าแรก: เมนู',
    'Homepage: Menu',
    'ส่วนแสดงเมนูอาหารและเครื่องดื่มบนหน้าแรก',
    'Landing page menu section',
    true
  ),
  (
    'contact',
    'หน้าแรก: ติดต่อเรา',
    'Homepage: Contact',
    'ส่วนข้อมูลติดต่อในหน้าแรก',
    'Landing page contact section',
    true
  ),
  (
    'user_profile',
    'โปรไฟล์ผู้ใช้',
    'User Profile',
    'การเข้าถึงหน้าโปรไฟล์ผู้ใช้',
    'Access to user profile page',
    true
  )
ON CONFLICT (feature_key) DO NOTHING;
