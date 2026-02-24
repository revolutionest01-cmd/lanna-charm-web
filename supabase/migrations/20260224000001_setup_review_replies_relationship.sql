-- Setup proper relationship for review_replies -> profiles
-- This allows Supabase to recognize the relationship for PostgREST foreign table joins

-- First, ensure the foreign key is correct
ALTER TABLE public.review_replies
DROP CONSTRAINT IF EXISTS review_replies_user_id_fkey;

ALTER TABLE public.review_replies
ADD CONSTRAINT review_replies_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Verify the relationship exists
COMMENT ON TABLE public.review_replies IS 'Customer replies/comments on reviews with user profile relationship';
COMMENT ON COLUMN public.review_replies.user_id IS 'Foreign key to profiles table';
