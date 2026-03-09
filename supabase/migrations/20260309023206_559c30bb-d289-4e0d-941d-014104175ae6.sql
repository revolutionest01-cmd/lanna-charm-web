-- SECURITY FIX 1: Remove self-insert point transactions (privilege escalation)
DROP POLICY IF EXISTS "Users can insert own point transactions" ON public.point_transactions;

-- SECURITY FIX 2: Remove public read on booking_blacklist (data exposure)
DROP POLICY IF EXISTS "Service can read blacklist" ON public.booking_blacklist;

-- SECURITY FIX 3: Remove public insert on booking_abuse_events (data poisoning)
DROP POLICY IF EXISTS "Service can insert abuse events" ON public.booking_abuse_events;

-- SECURITY FIX 4: Restrict chat_logs insert to authenticated users
DROP POLICY IF EXISTS "Service can insert chat logs" ON public.chat_logs;
CREATE POLICY "Authenticated users can insert chat logs"
  ON public.chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);