
CREATE TABLE public.custom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type text NOT NULL DEFAULT 'text_image',
  title_th text DEFAULT '',
  title_en text DEFAULT '',
  subtitle_th text,
  subtitle_en text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom sections viewable by everyone" ON public.custom_sections
  FOR SELECT USING (true);

CREATE POLICY "Admin can modify custom sections" ON public.custom_sections
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developer can modify custom sections" ON public.custom_sections
  FOR ALL USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Staff can modify custom sections" ON public.custom_sections
  FOR ALL USING (has_role(auth.uid(), 'staff'::app_role));
