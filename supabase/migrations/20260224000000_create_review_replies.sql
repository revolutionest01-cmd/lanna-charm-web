-- Create review_replies table for customer interactions on reviews
CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_review_replies_review_id ON public.review_replies(review_id);
CREATE INDEX idx_review_replies_user_id ON public.review_replies(user_id);
CREATE INDEX idx_review_replies_created_at ON public.review_replies(created_at DESC);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view replies on public reviews
CREATE POLICY "Anyone can view review replies"
  ON public.review_replies FOR SELECT
  USING (true);

-- Authenticated users can insert replies
CREATE POLICY "Authenticated users can create review replies"
  ON public.review_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own replies
CREATE POLICY "Users can update their own review replies"
  ON public.review_replies FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own review replies"
  ON public.review_replies FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_review_replies_updated_at
  BEFORE UPDATE ON public.review_replies
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
