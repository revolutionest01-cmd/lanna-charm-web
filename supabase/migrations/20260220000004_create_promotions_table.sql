-- Create promotions table for monthly promotions
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_th text NOT NULL,
  title_en text NOT NULL,
  description_th text,
  description_en text,
  image_url text,
  discount_percentage integer CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Promotions are viewable by everyone"
  ON public.promotions FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update promotions"
  ON public.promotions FOR UPDATE
  USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete promotions"
  ON public.promotions FOR DELETE
  USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Create index for active promotions
CREATE INDEX idx_promotions_active_dates ON public.promotions(is_active, start_date, end_date);

-- Add updated_at trigger
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
