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

interface ConversationMeta {
  id: string;
  assigned_admin_name: string | null;
}

interface ChatConversation {
  id: string;
  status: 'open' | 'closed';
  last_message: string | null;
  last_message_at: string | null;
  assigned_admin_name: string | null;
}

const CHAT_INACTIVITY_MINUTES = 720;

const isConversationExpired = (lastMessageAt: string | null) => {
  if (!lastMessageAt) return false;
  const lastAt = new Date(lastMessageAt).getTime();
  if (Number.isNaN(lastAt)) return false;
  return Date.now() - lastAt > CHAT_INACTIVITY_MINUTES * 60 * 1000;
};

const getLatestConversation = (list: ChatConversation[]) => {
  if (list.length === 0) return null;
  return [...list].sort((a, b) => {
    const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bt - at;
  })[0];
};

const sortConversationsByLatest = (list: ChatConversation[]) => {
  return [...list].sort((a, b) => {
    const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bt - at;
  });
};

const getConversationDayKey = (lastMessageAt: string | null) => {
  if (!lastMessageAt) return 'unknown';
  const date = new Date(lastMessageAt);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface LiveChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnlineStaff {
  id: string;
  name: string;
}

const LiveChatWidget = ({ isOpen, onClose }: LiveChatWidgetProps) => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationMeta, setConversationMeta] = useState<ConversationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineStaff, setOnlineStaff] = useState<OnlineStaff[]>([]);
  const [userConversationIds, setUserConversationIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const groupedConversations = sortConversationsByLatest(conversations).reduce<Array<{
    key: string;
    representative: ChatConversation;
    count: number;
  }>>((acc, conversation) => {
    const dayKey = getConversationDayKey(conversation.last_message_at);
    const existing = acc.find((item) => item.key === dayKey);
    if (!existing) {
      acc.push({ key: dayKey, representative: conversation, count: 1 });
    } else {
      existing.count += 1;
    }
    return acc;
  }, []);
  const quickQuestions = language === 'th'
    ? [
        'สอบถามราคาแพ็กเกจห้องพัก',
        'วันนี้มีห้องว่างไหมครับ',
        'ขอรายละเอียดโปรโมชันล่าสุด',
        'จองห้องต้องทำอย่างไร',
      ]
    : [
        'Can I check room package prices?',
        'Do you have available rooms today?',
        'Please share your latest promotion',
        'How can I book a room?',
      ];

  // Find or create conversation
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;

    const initConversation = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('chat_conversations')
          .select('id, status, last_message, last_message_at, assigned_admin_name' as any)
          .eq('customer_id', user.id)
          .order('last_message_at', { ascending: false });

        const list = (data || []) as any as ChatConversation[];

        const staleOpenIds = list
          .filter((c) => c.status === 'open' && isConversationExpired(c.last_message_at))
          .map((c) => c.id);

        if (staleOpenIds.length > 0) {
          await supabase
            .from('chat_conversations')
            .update({ status: 'closed' })
            .in('id', staleOpenIds)
            .eq('customer_id', user.id);
        }

        const normalized = list.map((c) =>
          staleOpenIds.includes(c.id) ? { ...c, status: 'closed' as const } : c
        );

        const sortedConversations = sortConversationsByLatest(normalized);
        const activeConv = sortedConversations.find((c) => c.status === 'open') || sortedConversations[0] || null;
        setConversations(sortedConversations);
        setUserConversationIds(sortedConversations.map((conversation) => conversation.id));
        setConversationId(activeConv?.id || null);
        setConversationMeta(activeConv ? { id: activeConv.id, assigned_admin_name: activeConv.assigned_admin_name } : null);
      } catch (err) {
        console.error('Error init conversation:', err);
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [isOpen, isAuthenticated, user]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user) return;

    const channel = supabase
      .channel(`live-chat-conversations-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_conversations',
        filter: `customer_id=eq.${user.id}`,
      }, (payload) => {
        const next = payload.new as ChatConversation;
        setConversations((prev) => {
          const exists = prev.some((item) => item.id === next.id);
          const updated = exists
            ? prev.map((item) => (item.id === next.id ? next : item))
            : [next, ...prev];

          const sorted = sortConversationsByLatest(updated);
          setUserConversationIds(sorted.map((conversation) => conversation.id));
          return sorted;
        });

        if (conversationId === next.id) {
          setConversationMeta({
            id: next.id,
            assigned_admin_name: next.assigned_admin_name || null,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, isAuthenticated, user?.id, conversationId]);

  // Fetch messages when conversation exists
  useEffect(() => {
    if (!conversationId || !user?.id) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data: userConversations } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('customer_id', user.id)
        .order('last_message_at', { ascending: false });

      const ids = (userConversations || []).map((conversation) => conversation.id);
      setUserConversationIds(ids);

      if (ids.length === 0) {
        setMessages([]);
        return;
      }

      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .in('conversation_id', ids)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);

      // Mark admin messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('conversation_id', ids)
        .eq('sender_role', 'admin')
        .eq('is_read', false);
    };

    fetchMessages();
  }, [conversationId, user?.id]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-conversation-${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_conversations',
        filter: `id=eq.${conversationId}`,
      }, (payload) => {
        const updated = payload.new as ConversationMeta;
        setConversationMeta({
          id: updated.id,
          assigned_admin_name: updated.assigned_admin_name || null,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-user-all-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const newMsg = payload.new as Message & { conversation_id?: string };

        if (newMsg.conversation_id && !userConversationIds.includes(newMsg.conversation_id)) {
          return;
        }

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
  }, [conversationId, userConversationIds]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Live staff presence
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase.channel("live-chat-staff-presence", {
      config: {
        presence: {
          key: user?.id || `guest-${Date.now()}`,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const seenIds = new Set<string>();
        const staffs: OnlineStaff[] = [];

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            const role = presence.user_role as string | undefined;
            const isStaffRole = role === "admin" || role === "staff" || role === "developer";
            if (isStaffRole && !seenIds.has(presence.user_id)) {
              seenIds.add(presence.user_id);
              staffs.push({
                id: presence.user_id,
                name: presence.user_name || (language === "th" ? "เจ้าหน้าที่" : "Staff"),
              });
            }
          });
        });

        setOnlineStaff(staffs);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && isAuthenticated && user) {
          await channel.track({
            user_id: user.id,
            user_name: user.name,
            user_role: user.role || "user",
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, isAuthenticated, user?.id, user?.name, user?.role, language]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || sending || !user) return;
    setSending(true);

    try {
      let convId = conversationId;

      if (!convId) {
        const { data: latestExisting } = await supabase
          .from('chat_conversations')
          .select('id, assigned_admin_name' as any)
          .eq('customer_id', user.id)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if ((latestExisting as any)?.id) {
          convId = (latestExisting as any).id;
          setConversationId((latestExisting as any).id);
          setConversationMeta({ id: (latestExisting as any).id, assigned_admin_name: (latestExisting as any).assigned_admin_name || null });
        }
      }

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
        setConversationMeta({ id: convId, assigned_admin_name: null });
        setConversations((prev) => [{
          id: convId as string,
          status: 'open',
          last_message: content,
          last_message_at: new Date().toISOString(),
          assigned_admin_name: null,
        }, ...prev]);
        setUserConversationIds((prev) => prev.includes(convId as string) ? prev : [convId as string, ...prev]);
      } else {
        await supabase
          .from('chat_conversations')
          .update({ status: 'open', auto_reply_sent_at: null })
          .eq('id', convId)
          .eq('customer_id', user.id);
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

      setConversations((prev) => {
        const exists = prev.some((conversation) => conversation.id === convId);
        const updated = exists
          ? prev.map((conversation) =>
              conversation.id === convId
                ? {
                    ...conversation,
                    status: 'open' as const,
                    last_message: content,
                    last_message_at: new Date().toISOString(),
                  }
                : conversation
            )
          : [{
              id: convId as string,
              status: 'open' as const,
              last_message: content,
              last_message_at: new Date().toISOString(),
              assigned_admin_name: null,
            } as ChatConversation, ...prev];

        const sorted = sortConversationsByLatest(updated);
        setUserConversationIds(sorted.map((conversation) => conversation.id));
        return sorted;
      });

      if (onlineStaff.length === 0) {
        await (supabase.rpc as any)('create_live_chat_auto_reply', {
          _conversation_id: convId,
          _language: language,
        });
      }

    } catch (err) {
      console.error('Send error:', err);
      sweetAlert.error(language === 'th' ? 'ส่งข้อความไม่สำเร็จ' : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [sending, user, conversationId, language, onlineStaff.length, conversations]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    await sendMessage(content);
  }, [input, sending, sendMessage]);

  const handleQuickQuestion = async (question: string) => {
    if (sending) return;
    setInput("");
    await sendMessage(question);
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-20 right-2 left-2 md:inset-auto md:bottom-24 md:right-8 z-50 w-auto md:w-96 h-[70dvh] max-h-[500px] md:h-[500px] md:max-h-[600px] bg-background border border-border rounded-2xl md:rounded-lg shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-muted rounded-t-2xl md:rounded-t-lg shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-background/70 text-foreground h-7 w-7 md:hidden">
              <ArrowLeft size={18} />
            </Button>
            <Headphones className="text-foreground" size={18} />
            <h3 className="font-bold text-foreground text-sm">Live Chat</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-background/70 text-foreground h-7 w-7">
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
      <div className="flex items-start justify-between p-2.5 sm:p-3 border-b border-border bg-muted rounded-t-2xl md:rounded-t-lg shrink-0">
        <div className="flex items-start gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-background/70 text-foreground h-7 w-7 md:hidden">
            <ArrowLeft size={18} />
          </Button>
          <Headphones className="text-foreground mt-1 shrink-0" size={18} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-foreground text-sm">Live Chat</h3>
              <Badge className="bg-primary/10 text-primary text-[10px] border-0">
                {language === 'th' ? 'พูดคุยกับเจ้าหน้าที่' : 'Talk to staff'}
              </Badge>
            </div>
            <p className={`text-[10px] mt-0.5 truncate ${onlineStaff.length > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
              {conversationMeta?.assigned_admin_name
                ? (language === 'th'
                    ? `เจ้าหน้าที่ผู้ดูแล: ${conversationMeta.assigned_admin_name}`
                    : `Assigned staff: ${conversationMeta.assigned_admin_name}`)
                : onlineStaff.length > 0
                ? (
                    language === 'th'
                      ? `ออนไลน์ ${onlineStaff.length} คน • ${onlineStaff.slice(0, 2).map((s) => s.name).join(', ')}${onlineStaff.length > 2 ? ' +' : ''}`
                      : `${onlineStaff.length} staff online • ${onlineStaff.slice(0, 2).map((s) => s.name).join(', ')}${onlineStaff.length > 2 ? ' +' : ''}`
                  )
                : (language === 'th' ? 'ขณะนี้ยังไม่มีเจ้าหน้าที่ออนไลน์' : 'No staff online right now')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-background/70 text-foreground h-7 w-7">
          <X size={18} />
        </Button>
      </div>

      {/* Messages */}
      {conversations.length > 0 && (
        <div className="px-3 pt-2 pb-1 border-b border-border bg-background/70">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {groupedConversations.slice(0, 12).map((group) => {
              const conv = group.representative;
              const isActiveDay = conversations.some(
                (conversation) =>
                  conversation.id === conversationId &&
                  getConversationDayKey(conversation.last_message_at) === group.key
              );

              return (
              <Button
                key={group.key}
                type="button"
                size="sm"
                variant={isActiveDay ? 'default' : 'outline'}
                onClick={() => {
                  setConversationId(conv.id);
                  setConversationMeta({ id: conv.id, assigned_admin_name: conv.assigned_admin_name });
                }}
                className={`h-7 px-2.5 text-[11px] whitespace-nowrap border transition-colors ${
                  isActiveDay
                    ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                }`}
              >
                {(language === 'th' ? 'แชท' : 'Chat') +
                  (conv.last_message_at
                    ? ` • ${new Date(conv.last_message_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric' })}`
                    : '') +
                  (group.count > 1 ? ` (${group.count})` : '')}
              </Button>
              );
            })}
          </div>
        </div>
      )}

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
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
          {quickQuestions.map((question) => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              disabled={sending}
              onClick={() => handleQuickQuestion(question)}
              className="h-7 px-2.5 text-[11px] whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10"
            >
              {question}
            </Button>
          ))}
        </div>
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
