-- Add RLS policy for updating visitor_stats (for incrementing count)
CREATE POLICY "Anyone can update visitor stats" 
ON public.visitor_stats 
FOR UPDATE 
USING (true)
WITH CHECK (true);