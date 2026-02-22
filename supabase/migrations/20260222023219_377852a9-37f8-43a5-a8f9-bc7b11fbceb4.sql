
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_rooms_is_available ON public.rooms(is_available);
