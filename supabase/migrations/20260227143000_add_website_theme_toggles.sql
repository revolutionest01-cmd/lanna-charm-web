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
    'site_theme_ocean',
    'ธีมเว็บไซต์: Ocean Blue',
    'Website Theme: Ocean Blue',
    'ธีมหลักสีฟ้า Ocean สำหรับทั้งเว็บไซต์',
    'Ocean Blue global website theme',
    true
  ),
  (
    'site_theme_sunset',
    'ธีมเว็บไซต์: Sunset Gold',
    'Website Theme: Sunset Gold',
    'ธีมสีทองส้ม Sunset สำหรับทั้งเว็บไซต์',
    'Sunset Gold global website theme',
    false
  ),
  (
    'site_theme_forest',
    'ธีมเว็บไซต์: Forest Mint',
    'Website Theme: Forest Mint',
    'ธีมสีเขียว Forest สำหรับทั้งเว็บไซต์',
    'Forest Mint global website theme',
    false
  ),
  (
    'site_theme_royal',
    'ธีมเว็บไซต์: Royal Purple',
    'Website Theme: Royal Purple',
    'ธีมสีม่วง Royal สำหรับทั้งเว็บไซต์',
    'Royal Purple global website theme',
    false
  ),
  (
    'site_theme_mono',
    'ธีมเว็บไซต์: Mono Graphite',
    'Website Theme: Mono Graphite',
    'ธีมโมโนโทน Mono สำหรับทั้งเว็บไซต์',
    'Mono Graphite global website theme',
    false
  )
ON CONFLICT (feature_key) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'feature_toggles'
      AND policyname = 'Admin can update website theme toggles'
  ) THEN
    DROP POLICY "Admin can update website theme toggles" ON public.feature_toggles;
  END IF;
END $$;

CREATE POLICY "Admin can update website theme toggles"
ON public.feature_toggles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND feature_key LIKE 'site_theme_%'
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND feature_key LIKE 'site_theme_%'
);
