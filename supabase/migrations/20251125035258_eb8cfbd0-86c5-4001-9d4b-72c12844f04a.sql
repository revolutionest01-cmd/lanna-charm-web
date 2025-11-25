-- Add user_id column to reviews table to track who submitted the review
ALTER TABLE public.reviews 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Update RLS policies to allow authenticated users to submit reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Only admins can modify reviews" ON public.reviews;

-- Public can view active reviews OR admins can view all
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews 
FOR SELECT 
USING ((is_active = true) OR has_role(auth.uid(), 'admin'));

-- Authenticated users can insert their own reviews
CREATE POLICY "Authenticated users can submit reviews" 
ON public.reviews 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews, admins can update any
CREATE POLICY "Users can update own reviews, admins can update any" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Users can delete their own reviews, admins can delete any
CREATE POLICY "Users can delete own reviews, admins can delete any" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Comment for clarity
COMMENT ON COLUMN public.reviews.user_id IS 'User who submitted the review. NULL for admin-created reviews.';