-- Migration: Create room availability calendar system
-- Purpose: Track daily room availability for customers to see which dates are booked/available
-- Admin can mark dates as available or unavailable based on Agoda, Booking.com, etc.

-- Create room_availability table to store daily availability
CREATE TABLE IF NOT EXISTS public.room_availability (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  availability_date date NOT NULL,
  is_available boolean DEFAULT true,
  booked_by text, -- Name of person who booked (from Agoda/Booking/Manual entry)
  notes text, -- Additional notes (e.g., "Agoda booking", "Manual block", etc.)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_by uuid REFERENCES public.auth.users(id) ON DELETE SET NULL, -- Track which admin updated this
  CONSTRAINT unique_room_date UNIQUE(room_id, availability_date)
);

-- Create index for efficient queries
CREATE INDEX idx_room_availability_room_date ON public.room_availability(room_id, availability_date);
CREATE INDEX idx_room_availability_date_range ON public.room_availability(room_id, availability_date) WHERE is_available = false;

-- Add comments
COMMENT ON TABLE public.room_availability IS 'Tracks daily availability of rooms for booking calendar display';
COMMENT ON COLUMN public.room_availability.room_id IS 'Reference to the room';
COMMENT ON COLUMN public.room_availability.availability_date IS 'Date that this availability record applies to';
COMMENT ON COLUMN public.room_availability.is_available IS 'Whether the room is available on this date (true=available, false=booked/blocked)';
COMMENT ON COLUMN public.room_availability.booked_by IS 'Name of person/source who booked this date (e.g. "John Smith", "Agoda", "Booking.com")';
COMMENT ON COLUMN public.room_availability.notes IS 'Admin notes about this availability (e.g. reason for blocking, booking source)';
COMMENT ON COLUMN public.room_availability.updated_by IS 'Admin user ID who last updated this record';

-- Enable RLS
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Anyone can view room availability (read-only for public)
CREATE POLICY "Anyone can view room availability"
  ON public.room_availability FOR SELECT
  USING (true);

-- 2. Only authenticated admins and developers can insert/update/delete
CREATE POLICY "Only admin and developer can manage room availability"
  ON public.room_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'developer')
    )
  );
