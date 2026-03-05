
CREATE TABLE IF NOT EXISTS public.privacy_consent_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  consent_status text NOT NULL,
  analytics_allowed boolean NOT NULL DEFAULT false,
  policy_version text NOT NULL,
  locale text,
  source text,
  current_url text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.privacy_consent_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (including anonymous visitors)
CREATE POLICY "Anyone can insert consent logs"
  ON public.privacy_consent_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read consent logs
CREATE POLICY "Admins can read consent logs"
  ON public.privacy_consent_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_privacy_consent_logs_visitor ON public.privacy_consent_logs(visitor_id, created_at DESC);
CREATE INDEX idx_privacy_consent_logs_user ON public.privacy_consent_logs(user_id) WHERE user_id IS NOT NULL;
