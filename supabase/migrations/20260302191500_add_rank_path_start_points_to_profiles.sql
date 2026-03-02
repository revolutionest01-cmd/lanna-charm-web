ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rank_path_start_points integer DEFAULT NULL;
