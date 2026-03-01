
-- Add missing columns to profiles table for Profile save and Ranking system
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status_message text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rank_path text DEFAULT 'chicken',
  ADD COLUMN IF NOT EXISTS rank_path_changed_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rank_display_tier_id integer DEFAULT NULL;
