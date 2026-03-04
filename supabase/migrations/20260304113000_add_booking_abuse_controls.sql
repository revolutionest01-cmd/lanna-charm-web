-- Booking anti-abuse controls: events log + blacklist management

CREATE TABLE IF NOT EXISTS public.booking_abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  request_name text,
  request_email text,
  request_phone text,
  request_ip text,
  user_agent text,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in date,
  check_out date,
  guests integer,
  additional_details text,
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'blocked', 'spam', 'reviewed')),
  block_reason text,
  risk_score integer NOT NULL DEFAULT 0,
  risk_flags text[] NOT NULL DEFAULT '{}',
  honeypot_value text,
  submit_duration_ms integer,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.booking_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('email', 'phone', 'ip')),
  value text NOT NULL,
  reason text,
  blocked_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_blacklist_active_type_value
ON public.booking_blacklist(type, value)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_booking_abuse_events_created_at ON public.booking_abuse_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_abuse_events_status ON public.booking_abuse_events(status);
CREATE INDEX IF NOT EXISTS idx_booking_abuse_events_email ON public.booking_abuse_events(request_email);
CREATE INDEX IF NOT EXISTS idx_booking_abuse_events_phone ON public.booking_abuse_events(request_phone);
CREATE INDEX IF NOT EXISTS idx_booking_abuse_events_ip ON public.booking_abuse_events(request_ip);

CREATE INDEX IF NOT EXISTS idx_booking_blacklist_type_value ON public.booking_blacklist(type, value);
CREATE INDEX IF NOT EXISTS idx_booking_blacklist_active_until ON public.booking_blacklist(is_active, blocked_until);

ALTER TABLE public.booking_abuse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and developer can view booking abuse events"
ON public.booking_abuse_events FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admin and developer can manage booking abuse events"
ON public.booking_abuse_events FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admin and developer can view booking blacklist"
ON public.booking_blacklist FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "Admin and developer can manage booking blacklist"
ON public.booking_blacklist FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE TRIGGER update_booking_abuse_events_updated_at
BEFORE UPDATE ON public.booking_abuse_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_blacklist_updated_at
BEFORE UPDATE ON public.booking_blacklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_abuse_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_blacklist;
