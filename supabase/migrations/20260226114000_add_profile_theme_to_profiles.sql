ALTER TABLE public.profiles
ADD COLUMN profile_theme text NOT NULL DEFAULT 'ocean';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_profile_theme_check
CHECK (profile_theme IN ('ocean', 'sunset', 'forest', 'royal', 'mono'));

COMMENT ON COLUMN public.profiles.profile_theme IS 'Profile page personal theme: ocean, sunset, forest, royal, mono';