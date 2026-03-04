
-- Create booking_abuse_events table for tracking suspicious booking attempts
CREATE TABLE public.booking_abuse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  request_name text,
  request_email text,
  request_phone text,
  request_ip text,
  status text NOT NULL DEFAULT 'pending',
  risk_score integer NOT NULL DEFAULT 0,
  risk_flags text[] DEFAULT '{}',
  block_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  raw_payload jsonb
);

-- Create booking_blacklist table for temporary blocking
CREATE TABLE public.booking_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('email', 'phone', 'ip')),
  value text NOT NULL,
  reason text,
  blocked_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, value)
);

-- Enable RLS
ALTER TABLE public.booking_abuse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins/developers can view and manage abuse events
CREATE POLICY "Admin can view abuse events"
  ON public.booking_abuse_events FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can insert abuse events"
  ON public.booking_abuse_events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can update abuse events"
  ON public.booking_abuse_events FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can delete abuse events"
  ON public.booking_abuse_events FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Allow edge functions (service role) to insert abuse events
CREATE POLICY "Service can insert abuse events"
  ON public.booking_abuse_events FOR INSERT
  WITH CHECK (true);

-- RLS: Only admins/developers can manage blacklist
CREATE POLICY "Admin can view blacklist"
  ON public.booking_blacklist FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can insert blacklist"
  ON public.booking_blacklist FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can update blacklist"
  ON public.booking_blacklist FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

CREATE POLICY "Admin can delete blacklist"
  ON public.booking_blacklist FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- Allow edge functions to read blacklist for checking
CREATE POLICY "Service can read blacklist"
  ON public.booking_blacklist FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_booking_abuse_events_created_at ON public.booking_abuse_events(created_at DESC);
CREATE INDEX idx_booking_abuse_events_status ON public.booking_abuse_events(status);
CREATE INDEX idx_booking_abuse_events_risk_score ON public.booking_abuse_events(risk_score DESC);
CREATE INDEX idx_booking_blacklist_type_value ON public.booking_blacklist(type, value);
CREATE INDEX idx_booking_blacklist_active ON public.booking_blacklist(is_active) WHERE is_active = true;
