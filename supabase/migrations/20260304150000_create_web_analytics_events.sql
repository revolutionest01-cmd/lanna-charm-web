-- Web analytics event stream for marketing-grade behavioral tracking
CREATE TABLE IF NOT EXISTS public.web_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  user_id uuid NULL,
  event_name text NOT NULL,
  event_category text NULL,
  page_path text NULL,
  current_url text NULL,
  referrer text NULL,
  element_id text NULL,
  element_text text NULL,
  element_type text NULL,
  event_value numeric NULL,
  duration_seconds integer NULL,
  scroll_depth integer NULL,
  device_type text NULL,
  device_brand text NULL,
  browser text NULL,
  os text NULL,
  screen_resolution text NULL,
  viewport text NULL,
  language text NULL,
  country_code text NULL,
  utm_source text NULL,
  utm_medium text NULL,
  utm_campaign text NULL,
  utm_content text NULL,
  utm_term text NULL,
  metadata jsonb NULL
);

ALTER TABLE public.web_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_analytics_events_insert" ON public.web_analytics_events;
CREATE POLICY "web_analytics_events_insert"
ON public.web_analytics_events
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "web_analytics_events_select" ON public.web_analytics_events;
CREATE POLICY "web_analytics_events_select"
ON public.web_analytics_events
FOR SELECT
USING (
  ((auth.jwt() ->> 'role') = 'service_role')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

DROP POLICY IF EXISTS "web_analytics_events_delete" ON public.web_analytics_events;
CREATE POLICY "web_analytics_events_delete"
ON public.web_analytics_events
FOR DELETE
USING (
  ((auth.jwt() ->> 'role') = 'service_role')
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE INDEX IF NOT EXISTS idx_web_analytics_events_created_at ON public.web_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_analytics_events_event_name ON public.web_analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_web_analytics_events_page_path ON public.web_analytics_events (page_path);
CREATE INDEX IF NOT EXISTS idx_web_analytics_events_visitor_id ON public.web_analytics_events (visitor_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_events_session_id ON public.web_analytics_events (session_id);
CREATE INDEX IF NOT EXISTS idx_web_analytics_events_utm_campaign ON public.web_analytics_events (utm_campaign);

COMMENT ON TABLE public.web_analytics_events IS 'Event-level user behavior tracking for analytics and marketing attribution';
