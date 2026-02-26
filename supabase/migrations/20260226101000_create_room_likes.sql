-- Create room_likes table to persist user likes for rooms
CREATE TABLE public.room_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_likes
ALTER TABLE public.room_likes ENABLE ROW LEVEL SECURITY;

-- Policies for room_likes
CREATE POLICY "Anyone can view room likes"
ON public.room_likes
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like rooms"
ON public.room_likes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own room likes"
ON public.room_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_room_likes_room_id ON public.room_likes(room_id);
CREATE INDEX idx_room_likes_user_id ON public.room_likes(user_id);

COMMENT ON TABLE public.room_likes IS 'Tracks which users liked which rooms';
