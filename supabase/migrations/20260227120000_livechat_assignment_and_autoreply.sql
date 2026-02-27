-- Live Chat: assignment + offline auto-reply support

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS assigned_admin_id UUID,
  ADD COLUMN IF NOT EXISTS assigned_admin_name TEXT,
  ADD COLUMN IF NOT EXISTS auto_reply_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_admin
  ON public.chat_conversations(assigned_admin_id);

CREATE OR REPLACE FUNCTION public.create_live_chat_auto_reply(
  _conversation_id UUID,
  _language TEXT DEFAULT 'th'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_auto_reply_sent_at TIMESTAMP WITH TIME ZONE;
  v_content TEXT;
BEGIN
  SELECT customer_id, auto_reply_sent_at
    INTO v_customer_id, v_auto_reply_sent_at
  FROM public.chat_conversations
  WHERE id = _conversation_id;

  IF v_customer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_customer_id THEN
    RETURN FALSE;
  END IF;

  IF v_auto_reply_sent_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  v_content := CASE
    WHEN COALESCE(_language, 'th') = 'th'
      THEN 'ขณะนี้เจ้าหน้าที่อาจไม่อยู่หน้าแชท ระบบได้รับข้อความของคุณแล้ว และจะมีเจ้าหน้าที่ตอบกลับโดยเร็วที่สุดค่ะ'
    ELSE 'Our staff may be offline right now. We have received your message and will reply as soon as possible.'
  END;

  INSERT INTO public.chat_messages (
    conversation_id,
    sender_id,
    sender_role,
    content,
    is_read
  ) VALUES (
    _conversation_id,
    '00000000-0000-0000-0000-000000000001',
    'admin',
    v_content,
    TRUE
  );

  UPDATE public.chat_conversations
  SET
    last_message = v_content,
    last_message_at = now(),
    auto_reply_sent_at = now()
  WHERE id = _conversation_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_live_chat_auto_reply(UUID, TEXT) TO authenticated;
