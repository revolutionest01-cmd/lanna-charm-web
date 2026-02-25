
-- Create chat_logs table for storing AI conversation logs
CREATE TABLE public.chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_reply TEXT NOT NULL,
  intent TEXT DEFAULT 'general',
  language TEXT DEFAULT 'th',
  user_id UUID,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view chat logs
CREATE POLICY "Only admins can view chat logs"
  ON public.chat_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge function (service role) can insert logs - allow insert for all (service role bypasses RLS)
CREATE POLICY "Service can insert chat logs"
  ON public.chat_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can delete chat logs
CREATE POLICY "Only admins can delete chat logs"
  ON public.chat_logs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for efficient querying
CREATE INDEX idx_chat_logs_created_at ON public.chat_logs (created_at DESC);
CREATE INDEX idx_chat_logs_session_id ON public.chat_logs (session_id);
