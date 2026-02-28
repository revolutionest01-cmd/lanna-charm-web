
-- Create user_signature_settings table
CREATE TABLE public.user_signature_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  signature_text TEXT,
  signature_image_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_signature_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view signatures"
  ON public.user_signature_settings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own signature"
  ON public.user_signature_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own signature"
  ON public.user_signature_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own signature"
  ON public.user_signature_settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Developer can manage all signatures"
  ON public.user_signature_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'developer'));

-- Trigger for updated_at
CREATE TRIGGER update_user_signature_settings_updated_at
  BEFORE UPDATE ON public.user_signature_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
