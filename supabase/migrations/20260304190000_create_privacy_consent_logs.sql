-- Consent evidence logs for PDPA/privacy compliance
CREATE TABLE IF NOT EXISTS public.privacy_consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  visitor_id text NULL,
  session_id text NULL,
  consent_status text NOT NULL CHECK (consent_status IN ('accepted', 'rejected')),
  analytics_allowed boolean NOT NULL DEFAULT false,
  policy_version text NOT NULL,
  locale text NULL,
  source text NULL,
  current_url text NULL,
  user_agent text NULL,
  metadata jsonb NULL
);

ALTER TABLE public.privacy_consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privacy_consent_logs_insert" ON public.privacy_consent_logs;
CREATE POLICY "privacy_consent_logs_insert"
ON public.privacy_consent_logs
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "privacy_consent_logs_select" ON public.privacy_consent_logs;
CREATE POLICY "privacy_consent_logs_select"
ON public.privacy_consent_logs
FOR SELECT
USING (
  ((auth.jwt() ->> 'role') = 'service_role')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_logs_created_at ON public.privacy_consent_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_logs_visitor_id ON public.privacy_consent_logs (visitor_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consent_logs_user_id ON public.privacy_consent_logs (user_id);

COMMENT ON TABLE public.privacy_consent_logs IS 'User consent evidence for privacy notice and analytics opt-in/out';