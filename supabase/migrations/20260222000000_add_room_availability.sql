-- Migration: Add room availability status
-- Purpose: Add is_available field to rooms table for admin to toggle availability
-- Date: 2026-02-22

-- Add is_available column to rooms table (default: true - available for booking)
ALTER TABLE public.rooms
ADD COLUMN is_available boolean DEFAULT true;

-- Update existing rooms to be available (optional - defaults to true anyway)
UPDATE public.rooms
SET is_available = true
WHERE is_available IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.rooms.is_available IS 'Whether this room is available for booking (admin can toggle this when a booking is made)';

-- Create an index for better query performance
CREATE INDEX idx_rooms_is_available ON public.rooms(is_available);
