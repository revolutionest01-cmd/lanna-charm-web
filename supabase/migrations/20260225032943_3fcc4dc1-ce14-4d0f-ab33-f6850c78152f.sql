
-- Create event_space_features table for editable service/feature items
CREATE TABLE public.event_space_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_space_id UUID NOT NULL REFERENCES public.event_spaces(id) ON DELETE CASCADE,
  icon_name TEXT NOT NULL DEFAULT 'Presentation',
  title_th TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_space_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view
CREATE POLICY "Event space features viewable by everyone"
ON public.event_space_features FOR SELECT
USING (true);

-- Admin can manage
CREATE POLICY "Admin can modify event space features"
ON public.event_space_features FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Developer can manage
CREATE POLICY "Developer can modify event space features"
ON public.event_space_features FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

-- Staff can manage
CREATE POLICY "Staff can modify event space features"
ON public.event_space_features FOR ALL
USING (has_role(auth.uid(), 'staff'::app_role));
