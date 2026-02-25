import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, ArrowLeft, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import sweetAlert from "@/lib/sweetAlert";

interface Message {
  id: string;
  sender_role: 'customer' | 'admin';
  content: string;
  created_at: string;
  is_read: boolean;
}

interface LiveChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const LiveChatWidget = ({ isOpen, onClose }: LiveChatWidgetProps) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find or create conversation
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;

    const initConversation = async () => {
      setLoading(true);
      try {
        // Find existing open conversation
        const { data: existing } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('customer_id', user.id)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setConversationId(existing.id);
        } else {
          setConversationId(null);
        }
      } catch (err) {
        console.error('Error init conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [isOpen, isAuthenticated, user]);

  // Fetch messages when conversation exists
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);

      // Mark admin messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_role', 'admin')
        .eq('is_read', false);
    };

    fetchMessages();
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Mark as read if admin message
        if (newMsg.sender_role === 'admin') {
          supabase
            .from('chat_messages')
            .update({ is_read: true })
            .eq('id', newMsg.id)
            .then(() => {});
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || !user) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      let convId = conversationId;

      // Create conversation if none exists
      if (!convId) {
        const { data: conv, error: convErr } = await supabase
          .from('chat_conversations')
          .insert({
            customer_id: user.id,
            customer_name: user.name,
            customer_avatar: user.avatar || null,
            last_message: content,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select('id')
          .single();

        if (convErr) throw convErr;
        convId = conv.id;
        setConversationId(convId);
      }

      // Send message
      const { error: msgErr } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          sender_role: 'customer',
          content,
        });

      if (msgErr) throw msgErr;

      // Update conversation
      await supabase
        .from('chat_conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_count: 1, // Signal for admin
          status: 'open',
        })
        .eq('id', convId);

    } catch (err) {
      console.error('Send error:', err);
      sweetAlert.error(language === 'th' ? 'ส่งข้อความไม่สำเร็จ' : 'Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, sending, user, conversationId, language]);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-20 right-2 left-2 md:inset-auto md:bottom-24 md:right-8 z-50 w-auto md:w-96 h-[70dvh] max-h-[500px] md:h-[500px] md:max-h-[600px] bg-background border border-border rounded-2xl md:rounded-lg shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl md:rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7 md:hidden">
              <ArrowLeft size={18} />
            </Button>
            <Headphones className="text-white" size={18} />
            <h3 className="font-bold text-white text-sm">Live Chat</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7">
            <X size={18} />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Headphones className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {language === 'th' ? 'กรุณาเข้าสู่ระบบเพื่อใช้ Live Chat' : 'Please login to use Live Chat'}
            </p>
            <Button variant="default" size="sm" className="mt-3" onClick={() => { onClose(); window.location.href = '/auth'; }}>
              {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-2 left-2 md:inset-auto md:bottom-24 md:right-8 z-50 w-auto md:w-96 h-[70dvh] max-h-[500px] md:h-[500px] md:max-h-[600px] bg-background border border-border rounded-2xl md:rounded-lg shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-gradient-to-r from-emerald-600 to-teal-600 rounded-t-2xl md:rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7 md:hidden">
            <ArrowLeft size={18} />
          </Button>
          <Headphones className="text-white" size={18} />
          <h3 className="font-bold text-white text-sm">Live Chat</h3>
          <Badge className="bg-white/20 text-white text-[10px] border-0">
            {language === 'th' ? 'พูดคุยกับเจ้าหน้าที่' : 'Talk to staff'}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7">
          <X size={18} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Headphones className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'เริ่มพิมพ์ข้อความเพื่อคุยกับเจ้าหน้าที่' : 'Type a message to start chatting with staff'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-2.5 ${
                  msg.sender_role === 'customer'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.sender_role === 'admin' && (
                    <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                      {language === 'th' ? '👤 เจ้าหน้าที่' : '👤 Staff'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2.5 sm:p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={language === 'th' ? 'พิมพ์ข้อความ...' : 'Type a message...'}
            disabled={sending}
            className="flex-1 h-9 text-sm"
          />
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9">
            {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveChatWidget;
