
-- ═══════════════════════════════════════════
-- LIVE CHAT SYSTEM TABLES
-- ═══════════════════════════════════════════

-- Conversations table (one per customer)
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_conversations_customer ON public.chat_conversations(customer_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_conversations_last_msg ON public.chat_conversations(last_message_at DESC);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ═══ RLS Policies: chat_conversations ═══

-- Customers can view their own conversations
CREATE POLICY "Customers view own conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = customer_id);

-- Admins can view all conversations
CREATE POLICY "Admins view all conversations"
  ON public.chat_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can create conversations (for themselves)
CREATE POLICY "Users create own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own conversations
CREATE POLICY "Customers update own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = customer_id);

-- Admins can update any conversation
CREATE POLICY "Admins update any conversation"
  ON public.chat_conversations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ═══ RLS Policies: chat_messages ═══

-- Customers can view messages in their own conversations
CREATE POLICY "Customers view own messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND customer_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins view all messages"
  ON public.chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert messages in their conversations
CREATE POLICY "Users send messages in own conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      sender_role = 'customer' AND EXISTS (
        SELECT 1 FROM public.chat_conversations
        WHERE id = conversation_id AND customer_id = auth.uid()
      )
    )
  );

-- Admins can send messages in any conversation
CREATE POLICY "Admins send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND sender_role = 'admin' AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can update messages (mark as read)
CREATE POLICY "Admins update messages"
  ON public.chat_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Customers can update messages in own conversations (mark as read)
CREATE POLICY "Customers update own messages"
  ON public.chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND customer_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- Trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
