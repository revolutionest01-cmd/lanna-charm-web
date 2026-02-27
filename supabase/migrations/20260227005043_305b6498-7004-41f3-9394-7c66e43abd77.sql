
-- Add missing profile columns for bio, social links, and theme
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_theme text DEFAULT 'ocean',
  ADD COLUMN IF NOT EXISTS bio_short text,
  ADD COLUMN IF NOT EXISTS social_facebook text,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_tiktok text;
