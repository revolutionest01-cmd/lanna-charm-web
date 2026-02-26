
-- Add reputation_points column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_points integer NOT NULL DEFAULT 0;
