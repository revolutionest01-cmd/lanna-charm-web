-- Add avatar column to reviews table
ALTER TABLE public.reviews
ADD COLUMN avatar text DEFAULT '😊' NOT NULL;
