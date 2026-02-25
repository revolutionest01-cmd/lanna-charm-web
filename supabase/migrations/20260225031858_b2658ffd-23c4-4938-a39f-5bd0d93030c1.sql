
-- Create event_space_images table for multiple images per event space
CREATE TABLE public.event_space_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_space_id UUID NOT NULL REFERENCES public.event_spaces(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_space_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Event space images viewable by everyone"
ON public.event_space_images FOR SELECT
USING (true);

CREATE POLICY "Admin can modify event space images"
ON public.event_space_images FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Developer can modify event space images"
ON public.event_space_images FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Staff can modify event space images"
ON public.event_space_images FOR ALL
USING (has_role(auth.uid(), 'staff'::app_role));
