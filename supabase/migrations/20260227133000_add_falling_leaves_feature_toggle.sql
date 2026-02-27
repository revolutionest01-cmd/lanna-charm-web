INSERT INTO public.feature_toggles (
  feature_key,
  feature_name_th,
  feature_name_en,
  description_th,
  description_en,
  is_enabled
)
VALUES (
  'falling_leaves',
  'เอฟเฟกต์ใบไม้หน้าแรก',
  'Homepage Falling Leaves',
  'เอฟเฟกต์ใบไม้ร่วงในหน้าแรกของเว็บไซต์',
  'Falling leaves visual effect on the homepage',
  true
)
ON CONFLICT (feature_key) DO NOTHING;
