-- Add twitter field for X (Twitter) social media
ALTER TABLE public.business_info
ADD COLUMN twitter text DEFAULT NULL;