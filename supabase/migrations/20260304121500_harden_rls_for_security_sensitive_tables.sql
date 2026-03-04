-- Harden RLS policies for security-sensitive tables
-- Scope: booking_abuse_events, booking_blacklist, chat_logs
-- Goal: remove permissive policies and keep only admin/developer + required service_role access

-- ================================
-- booking_abuse_events
-- ================================
DROP POLICY IF EXISTS "Admin can view abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Admin can insert abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Admin can update abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Admin can delete abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Service can insert abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Admin and developer can view booking abuse events" ON public.booking_abuse_events;
DROP POLICY IF EXISTS "Admin and developer can manage booking abuse events" ON public.booking_abuse_events;

CREATE POLICY "secure_booking_abuse_events_select"
ON public.booking_abuse_events
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "secure_booking_abuse_events_insert"
ON public.booking_abuse_events
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
  OR auth.role() = 'service_role'
);

CREATE POLICY "secure_booking_abuse_events_update"
ON public.booking_abuse_events
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "secure_booking_abuse_events_delete"
ON public.booking_abuse_events
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

-- ================================
-- booking_blacklist
-- ================================
DROP POLICY IF EXISTS "Admin can view blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Admin can insert blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Admin can update blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Admin can delete blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Service can read blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Admin and developer can view booking blacklist" ON public.booking_blacklist;
DROP POLICY IF EXISTS "Admin and developer can manage booking blacklist" ON public.booking_blacklist;

CREATE POLICY "secure_booking_blacklist_select"
ON public.booking_blacklist
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
  OR auth.role() = 'service_role'
);

CREATE POLICY "secure_booking_blacklist_insert"
ON public.booking_blacklist
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "secure_booking_blacklist_update"
ON public.booking_blacklist
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "secure_booking_blacklist_delete"
ON public.booking_blacklist
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

-- ================================
-- chat_logs
-- ================================
DROP POLICY IF EXISTS "Only admins can view chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Only admins can delete chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Service can insert chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Developer can view chat logs" ON public.chat_logs;
DROP POLICY IF EXISTS "Developer can delete chat logs" ON public.chat_logs;

CREATE POLICY "secure_chat_logs_select"
ON public.chat_logs
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);

CREATE POLICY "secure_chat_logs_insert"
ON public.chat_logs
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
);

CREATE POLICY "secure_chat_logs_delete"
ON public.chat_logs
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'developer'::app_role)
);
