-- Expand chat_logs tracking for richer marketing and behavior analytics
ALTER TABLE public.chat_logs
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS user_agent_hash text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS current_url text,
  ADD COLUMN IF NOT EXISTS page_path text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS browser_language text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS screen_resolution text,
  ADD COLUMN IF NOT EXISTS viewport text,
  ADD COLUMN IF NOT EXISTS visitor_fingerprint text,
  ADD COLUMN IF NOT EXISTS request_headers jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX IF NOT EXISTS idx_chat_logs_language ON public.chat_logs (language);
CREATE INDEX IF NOT EXISTS idx_chat_logs_country_code ON public.chat_logs (country_code);
CREATE INDEX IF NOT EXISTS idx_chat_logs_device_type ON public.chat_logs (device_type);
CREATE INDEX IF NOT EXISTS idx_chat_logs_page_path ON public.chat_logs (page_path);
CREATE INDEX IF NOT EXISTS idx_chat_logs_visitor_fingerprint ON public.chat_logs (visitor_fingerprint);
CREATE INDEX IF NOT EXISTS idx_chat_logs_utm_source ON public.chat_logs (utm_source);

COMMENT ON COLUMN public.chat_logs.metadata IS 'Flexible client telemetry payload for analytics and segmentation';
COMMENT ON COLUMN public.chat_logs.request_headers IS 'Sanitized subset of request headers captured at ingestion';
