
-- Add perk-related columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS avatar_frame text,
  ADD COLUMN IF NOT EXISTS active_perks text[] NOT NULL DEFAULT '{}';
