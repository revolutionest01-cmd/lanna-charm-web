
-- Storage bucket for custom sections images
INSERT INTO storage.buckets (id, name, public) VALUES ('custom-sections', 'custom-sections', true);

-- Storage RLS policies
CREATE POLICY "Public read custom-sections" ON storage.objects FOR SELECT USING (bucket_id = 'custom-sections');
CREATE POLICY "Admin upload custom-sections" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'custom-sections' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'developer')));
CREATE POLICY "Admin update custom-sections" ON storage.objects FOR UPDATE USING (bucket_id = 'custom-sections' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'developer')));
CREATE POLICY "Admin delete custom-sections" ON storage.objects FOR DELETE USING (bucket_id = 'custom-sections' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'developer')));

-- Homepage section order table
CREATE TABLE public.homepage_section_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.homepage_section_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view section order" ON public.homepage_section_order FOR SELECT USING (true);
CREATE POLICY "Admin can modify section order" ON public.homepage_section_order FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Developer can modify section order" ON public.homepage_section_order FOR ALL USING (public.has_role(auth.uid(), 'developer'));
CREATE POLICY "Staff can modify section order" ON public.homepage_section_order FOR ALL USING (public.has_role(auth.uid(), 'staff'));

-- Seed default section order
INSERT INTO public.homepage_section_order (section_key, order_index) VALUES
  ('hero', 0),
  ('features', 1),
  ('events', 2),
  ('rooms', 3),
  ('menu', 4),
  ('gallery', 5),
  ('reviews', 6),
  ('contact', 7);
