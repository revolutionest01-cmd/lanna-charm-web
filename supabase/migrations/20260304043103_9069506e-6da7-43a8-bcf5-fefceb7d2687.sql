
-- Add rank_path_start_points column to profiles table
ALTER TABLE public.profiles
ADD COLUMN rank_path_start_points integer DEFAULT NULL;

COMMENT ON COLUMN public.profiles.rank_path_start_points IS 'Points at the time user first chose a rank path; used to calculate path-relative progress';
