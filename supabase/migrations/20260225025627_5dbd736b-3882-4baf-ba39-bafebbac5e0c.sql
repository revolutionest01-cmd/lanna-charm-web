
-- Create feature_panels table for the horizontal accordion
CREATE TABLE public.feature_panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_th TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  subtitle_th TEXT,
  subtitle_en TEXT,
  image_url TEXT,
  logo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_panels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Feature panels viewable by everyone"
  ON public.feature_panels FOR SELECT
  USING (true);

CREATE POLICY "Developer can modify feature panels"
  ON public.feature_panels FOR ALL
  USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Admin can modify feature panels"
  ON public.feature_panels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_feature_panels_updated_at
  BEFORE UPDATE ON public.feature_panels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for feature panel images
INSERT INTO storage.buckets (id, name, public) VALUES ('features', 'features', true);

-- Storage RLS policies
CREATE POLICY "Feature images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'features');

CREATE POLICY "Admin can upload feature images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'features' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update feature images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'features' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete feature images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'features' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developer can upload feature images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'features' AND has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developer can update feature images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'features' AND has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developer can delete feature images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'features' AND has_role(auth.uid(), 'developer'::app_role));

-- Insert 4 default panels
INSERT INTO public.feature_panels (title_th, title_en, subtitle_th, subtitle_en, sort_order) VALUES
  ('กาแฟคั่วมือ', 'Artisan Coffee', 'กาแฟคั่วมือคุณภาพเยี่ยม คัดสรรจากดอยสูง', 'Premium hand-roasted coffee from highland origins', 1),
  ('สถาปัตยกรรมล้านนา', 'Lanna Architecture', 'สัมผัสความงามของสถาปัตยกรรมล้านนาแท้ๆ', 'Experience the beauty of authentic Lanna architecture', 2),
  ('สวนธรรมชาติ', 'Garden Setting', 'พักผ่อนท่ามกลางสวนสีเขียวร่มรื่น', 'Relax in lush green garden surroundings', 3),
  ('อาหารพื้นเมือง', 'Local Cuisine', 'ลิ้มรสอาหารเหนือต้นตำรับ', 'Taste authentic Northern Thai cuisine', 4);
