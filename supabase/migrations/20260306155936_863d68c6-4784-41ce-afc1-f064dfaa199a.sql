
-- Web analytics events table for tracking visitor behavior
CREATE TABLE public.web_analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  user_id uuid,
  event_name text NOT NULL,
  event_category text,
  page_path text,
  current_url text,
  referrer text,
  element_id text,
  element_text text,
  element_type text,
  event_value numeric,
  duration_seconds numeric,
  scroll_depth integer,
  device_type text,
  device_brand text,
  browser text,
  os text,
  screen_resolution text,
  viewport text,
  language text,
  country_code text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX idx_web_analytics_created_at ON public.web_analytics_events (created_at DESC);
CREATE INDEX idx_web_analytics_event_name ON public.web_analytics_events (event_name);
CREATE INDEX idx_web_analytics_visitor ON public.web_analytics_events (visitor_id);
CREATE INDEX idx_web_analytics_session ON public.web_analytics_events (session_id);

-- RLS: allow anonymous inserts (for tracking), admin reads
ALTER TABLE public.web_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events"
ON public.web_analytics_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can read analytics events"
ON public.web_analytics_events FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'developer')
);
