-- Add extra identity fields for user profile enhancements
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio_short text,
ADD COLUMN IF NOT EXISTS social_facebook text,
ADD COLUMN IF NOT EXISTS social_instagram text,
ADD COLUMN IF NOT EXISTS social_tiktok text;