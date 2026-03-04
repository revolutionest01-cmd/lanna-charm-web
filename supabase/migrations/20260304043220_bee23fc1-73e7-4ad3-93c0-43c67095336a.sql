
-- Create point_transactions table for audit trail
CREATE TABLE public.point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  action text NOT NULL,
  reason text,
  source_type text,
  source_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_point_transactions_user_id ON public.point_transactions (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own point transactions"
ON public.point_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Admin/Developer can view all
CREATE POLICY "Admin can view all point transactions"
ON public.point_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- Only system (authenticated context) can insert own transactions
CREATE POLICY "Users can insert own point transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin/Developer can insert for any user
CREATE POLICY "Admin can insert point transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));

-- Admin/Developer can delete
CREATE POLICY "Admin can delete point transactions"
ON public.point_transactions FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'developer'::app_role));
