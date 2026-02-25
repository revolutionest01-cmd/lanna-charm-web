
-- Create review_replies table
CREATE TABLE public.review_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Everyone can read replies
CREATE POLICY "Anyone can view review replies"
ON public.review_replies FOR SELECT
USING (true);

-- Authenticated users can create replies
CREATE POLICY "Authenticated users can create replies"
ON public.review_replies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
ON public.review_replies FOR DELETE
USING (auth.uid() = user_id);

-- Add foreign key index
CREATE INDEX idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX idx_review_replies_user_id ON public.review_replies(user_id);
