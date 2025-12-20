-- Create visitor stats table
CREATE TABLE public.visitor_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_visits bigint NOT NULL DEFAULT 5000,
  unique_visitors bigint NOT NULL DEFAULT 5000,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read visitor stats
CREATE POLICY "Visitor stats are viewable by everyone"
ON public.visitor_stats
FOR SELECT
USING (true);

-- Only allow edge functions to update (using service role)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Insert initial record with 5000 starting count
INSERT INTO public.visitor_stats (total_visits, unique_visitors)
VALUES (5000, 5000);