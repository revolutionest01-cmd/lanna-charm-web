-- Add detailed fields to menus table for beverage and food details

-- Add new columns for enhanced menu details
ALTER TABLE public.menus 
ADD COLUMN IF NOT EXISTS ingredients_th text,
ADD COLUMN IF NOT EXISTS ingredients_en text,
ADD COLUMN IF NOT EXISTS temperature_options text,
ADD COLUMN IF NOT EXISTS size_options text,
ADD COLUMN IF NOT EXISTS allergens_th text,
ADD COLUMN IF NOT EXISTS allergens_en text,
ADD COLUMN IF NOT EXISTS calories integer,
ADD COLUMN IF NOT EXISTS preparation_method_th text,
ADD COLUMN IF NOT EXISTS preparation_method_en text,
ADD COLUMN IF NOT EXISTS customization_options_th text,
ADD COLUMN IF NOT EXISTS customization_options_en text;

-- Update updated_at column
ALTER TABLE public.menus
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
