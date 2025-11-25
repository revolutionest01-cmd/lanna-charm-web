-- Add helpful_count column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN helpful_count integer NOT NULL DEFAULT 0;

-- Create review_likes table to track which users liked which reviews
CREATE TABLE public.review_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on review_likes
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

-- Policies for review_likes
CREATE POLICY "Anyone can view review likes" 
ON public.review_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like reviews" 
ON public.review_likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.review_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_review_likes_review_id ON public.review_likes(review_id);
CREATE INDEX idx_review_likes_user_id ON public.review_likes(user_id);

-- Function to update helpful_count when like is added or removed
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews 
    SET helpful_count = helpful_count + 1 
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews 
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to automatically update helpful_count
CREATE TRIGGER update_review_helpful_count_trigger
AFTER INSERT OR DELETE ON public.review_likes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- Comments for clarity
COMMENT ON TABLE public.review_likes IS 'Tracks which users found which reviews helpful';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of users who found this review helpful';