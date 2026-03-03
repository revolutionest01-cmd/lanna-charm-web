
-- Create section_headings table for editable section titles/subtitles
CREATE TABLE public.section_headings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title_th text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  subtitle_th text,
  subtitle_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.section_headings ENABLE ROW LEVEL SECURITY;

-- Everyone can view
CREATE POLICY "Section headings viewable by everyone"
ON public.section_headings FOR SELECT
USING (true);

-- Admin can modify
CREATE POLICY "Admin can modify section headings"
ON public.section_headings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Developer can modify
CREATE POLICY "Developer can modify section headings"
ON public.section_headings FOR ALL
USING (has_role(auth.uid(), 'developer'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_section_headings_updated_at
BEFORE UPDATE ON public.section_headings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
