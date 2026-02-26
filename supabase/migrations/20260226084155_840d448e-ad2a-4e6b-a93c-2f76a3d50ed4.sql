
-- Create room_availability table
CREATE TABLE public.room_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  booked_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(room_id, availability_date)
);

-- Indexes
CREATE INDEX idx_room_availability_room_date ON public.room_availability(room_id, availability_date);
CREATE INDEX idx_room_availability_date_range ON public.room_availability(availability_date) WHERE NOT is_available;

-- Enable RLS
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view room availability"
  ON public.room_availability FOR SELECT
  USING (true);

-- Admin/Staff can insert
CREATE POLICY "Admins can insert room availability"
  ON public.room_availability FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff') OR 
    public.has_role(auth.uid(), 'developer')
  );

-- Admin/Staff can update
CREATE POLICY "Admins can update room availability"
  ON public.room_availability FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff') OR 
    public.has_role(auth.uid(), 'developer')
  );

-- Admin/Staff can delete
CREATE POLICY "Admins can delete room availability"
  ON public.room_availability FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'staff') OR 
    public.has_role(auth.uid(), 'developer')
  );

-- Updated_at trigger
CREATE TRIGGER update_room_availability_updated_at
  BEFORE UPDATE ON public.room_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_availability;
