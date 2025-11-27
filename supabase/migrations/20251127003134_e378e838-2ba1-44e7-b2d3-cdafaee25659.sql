-- Add Facebook field to business_info table
ALTER TABLE public.business_info 
ADD COLUMN IF NOT EXISTS facebook TEXT;