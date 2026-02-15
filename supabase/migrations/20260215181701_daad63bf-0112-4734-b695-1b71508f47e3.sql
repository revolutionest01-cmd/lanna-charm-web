-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update visitor stats" ON public.visitor_stats;

-- Create a SECURITY DEFINER function to safely increment visitor stats
CREATE OR REPLACE FUNCTION public.increment_visitor_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE visitor_stats
  SET total_visits = total_visits + 1,
      last_updated = now()
  WHERE id = (SELECT id FROM visitor_stats ORDER BY created_at LIMIT 1);
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.increment_visitor_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.increment_visitor_stats() TO authenticated;