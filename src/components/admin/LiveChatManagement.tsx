import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Headphones, Send, Loader2, RefreshCw, MessageSquare,
  User, Clock, CheckCheck, X, Volume2, VolumeX,
} from "lucide-react";

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar: string | null;
  assigned_admin_id: string | null;
  assigned_admin_name: string | null;
  auto_reply_sent_at: string | null;
  status: string;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  content: string;
  is_read: boolean;
  created_at: string;
}

const ADMIN_LIVECHAT_REFRESH_MS = 15000;

const dedupeConversationsByCustomer = (list: Conversation[]) => {
  const map = new Map<string, Conversation>();

  list.forEach((conversation) => {
    const key = conversation.customer_id || conversation.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, conversation);
      return;
    }

    const existingTime = existing.last_message_at ? new Date(existing.last_message_at).getTime() : 0;
    const candidateTime = conversation.last_message_at ? new Date(conversation.last_message_at).getTime() : 0;

    if (candidateTime > existingTime) {
      map.set(key, conversation);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const at = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bt = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bt - at;
  });
};

const getDayKey = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayKeyFromDate = (date: Date) => {
  if (Number.isNaN(date.getTime())) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateSeparatorLabel = (dateTime: string, language: 'th' | 'en') => {
  const target = new Date(dateTime);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const targetKey = getDayKeyFromDate(target);
  const todayKey = getDayKeyFromDate(today);
  const yesterdayKey = getDayKeyFromDate(yesterday);

  if (targetKey === todayKey) {
    return language === 'th' ? 'วันนี้' : 'Today';
  }

  if (targetKey === yesterdayKey) {
    return language === 'th' ? 'เมื่อวาน' : 'Yesterday';
  }

  return target.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Notification sound (simple beep using Web Audio API)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Second beep
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    }, 200);
  } catch (e) {
    console.log('Sound not supported');
  }
};

export const LiveChatManagement = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCustomerConversationIds, setSelectedCustomerConversationIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevConvCountRef = useRef(0);
  const quickAnswers = language === 'th'
    ? [
        'สวัสดีค่ะ มีอะไรให้ช่วยได้บ้างคะ',
        'ขอบคุณสำหรับข้อความครับ กำลังตรวจสอบให้ทันที',
        'รบกวนแจ้งวันที่เข้าพักและจำนวนท่านได้ไหมครับ',
        'ขณะนี้ดำเนินการให้แล้ว หากเสร็จจะแจ้งทันทีครับ',
      ]
    : [
        'Hello! How can I assist you today?',
        'Thanks for your message. I am checking this now.',
        'Could you share your check-in date and number of guests?',
        'I am processing this for you and will update shortly.',
      ];

  // Fetch conversations
  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (data) {
      setConversations(dedupeConversationsByCustomer(data as Conversation[]));
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Track staff presence for customer widget
  useEffect(() => {
    if (!user) return;

    const role = user.role || 'user';
    const isStaffRole = role === 'admin' || role === 'staff' || role === 'developer';
    if (!isStaffRole) return;

    const channel = supabase.channel('live-chat-staff-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          user_name: user.name,
          user_role: role,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.name, user?.role]);

  // Realtime: new conversations and updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-live-chat')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_conversations',
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newConv = payload.new as Conversation;
          setConversations(prev => {
            const next = prev.some(c => c.id === newConv.id)
              ? prev
              : [newConv, ...prev];
            return dedupeConversationsByCustomer(next);
          });
          // Play sound for new conversation
          if (soundEnabled) playNotificationSound();
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Conversation;
          setConversations(prev =>
            dedupeConversationsByCustomer(
              prev.map(c => c.id === updated.id ? updated : c)
            )
          );
          // Play sound if unread increased (customer sent message)
          if (updated.unread_count > 0 && soundEnabled) {
            playNotificationSound();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled]);

  const refreshSelectedConversationMessages = useCallback(async () => {
    if (!selectedConv) {
      setMessages([]);
      setSelectedCustomerConversationIds([]);
      return;
    }

    const selectedConversation = conversations.find((conversation) => conversation.id === selectedConv);
    if (!selectedConversation) {
      setMessages([]);
      setSelectedCustomerConversationIds([]);
      return;
    }

    const { data: customerConversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('customer_id', selectedConversation.customer_id)
      .order('last_message_at', { ascending: false });

    const conversationIds = (customerConversations || []).map((conversation) => conversation.id);
    setSelectedCustomerConversationIds(conversationIds);

    if (conversationIds.length === 0) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .in('conversation_id', conversationIds)
      .eq('sender_role', 'customer')
      .eq('is_read', false);

    await supabase
      .from('chat_conversations')
      .update({ unread_count: 0 })
      .in('id', conversationIds);
  }, [selectedConv, conversations]);

  // Fetch messages for selected conversation
  useEffect(() => {
    refreshSelectedConversationMessages();
  }, [refreshSelectedConversationMessages]);

  // Polling fallback for missed realtime events
  useEffect(() => {
    const refreshNow = () => {
      if (document.hidden) return;
      fetchConversations(true);
      refreshSelectedConversationMessages();
    };

    const interval = window.setInterval(refreshNow, ADMIN_LIVECHAT_REFRESH_MS);
    window.addEventListener('focus', refreshNow);
    document.addEventListener('visibilitychange', refreshNow);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshNow);
      document.removeEventListener('visibilitychange', refreshNow);
    };
  }, [fetchConversations, refreshSelectedConversationMessages]);

  useEffect(() => {
    if (!selectedConv || !user) return;
    const conv = conversations.find(c => c.id === selectedConv);
    if (!conv || conv.status !== 'open' || conv.assigned_admin_id) return;

    const assignConversation = async () => {
      const { error } = await supabase
        .from('chat_conversations')
        .update({
          assigned_admin_id: user.id,
          assigned_admin_name: user.name,
        })
        .eq('id', selectedConv);

      if (!error) {
        setConversations(prev => prev.map(c =>
          c.id === selectedConv
            ? { ...c, assigned_admin_id: user.id, assigned_admin_name: user.name }
            : c
        ));
      }
    };

    assignConversation();
  }, [selectedConv, user?.id, user?.name, conversations]);

  // Realtime messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;

    const channel = supabase
      .channel(`admin-chat-msgs-${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, async (payload) => {
        const newMsg = payload.new as Message;

        if (!selectedCustomerConversationIds.includes(newMsg.conversation_id)) {
          return;
        }

        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Auto mark as read
        if (newMsg.sender_role === 'customer') {
          await supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id);
          if (selectedCustomerConversationIds.length > 0) {
            await supabase.from('chat_conversations').update({ unread_count: 0 }).in('id', selectedCustomerConversationIds);
          }
          if (soundEnabled) playNotificationSound();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, soundEnabled, selectedCustomerConversationIds]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending || !selectedConv || !user) return;
    setSending(true);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: selectedConv,
        sender_id: user.id,
        sender_role: 'admin',
        content,
      });

      if (error) throw error;

      // Update conversation
      await supabase.from('chat_conversations').update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_count: 0,
        assigned_admin_id: user.id,
        assigned_admin_name: user.name,
      }).eq('id', selectedConv);

    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setInput("");
    await sendMessage(content);
  };

  const handleQuickAnswer = async (answer: string) => {
    if (sending) return;
    setInput("");
    await sendMessage(answer);
  };

  const handleCloseConversation = async (convId: string) => {
    await supabase.from('chat_conversations').update({ status: 'closed' }).eq('id', convId);
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, status: 'closed' } : c));
    if (selectedConv === convId) setSelectedConv(null);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const openConversations = conversations.filter(c => c.status === 'open');
  const closedConversations = conversations.filter(c => c.status === 'closed');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Headphones className="w-4 h-4 text-primary" />
            </span>
            {language === 'th' ? 'Live Chat' : 'Live Chat'}
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">{totalUnread}</Badge>
            )}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'th' ? 'ตอบกลับลูกค้าแบบเรียลไทม์' : 'Reply to customers in real-time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchConversations} disabled={loading} className="gap-1.5 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
        {/* Conversation List */}
        <div className="lg:col-span-1 border border-slate-200/80 bg-white/95 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <p className="text-sm font-semibold text-slate-800">
              {language === 'th' ? `สนทนา (${openConversations.length})` : `Conversations (${openConversations.length})`}
            </p>
          </div>
          <ScrollArea className="h-[450px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm">
                {language === 'th' ? 'ยังไม่มีการสนทนา' : 'No conversations yet'}
              </div>
            ) : (
              <div>
                {/* Open conversations */}
                {openConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      selectedConv === conv.id ? 'bg-primary/10 ring-1 ring-inset ring-primary/25' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {conv.customer_avatar ? (
                        <img src={conv.customer_avatar} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-slate-800 truncate flex-1">{conv.customer_name}</span>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-4 animate-pulse">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 truncate">{conv.last_message}</p>
                    {conv.assigned_admin_name && (
                      <p className="text-[10px] text-primary/90 truncate mt-0.5">
                        {language === 'th' ? `ดูแลโดย: ${conv.assigned_admin_name}` : `Assigned: ${conv.assigned_admin_name}`}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(conv.last_message_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}

                {/* Closed conversations */}
                {closedConversations.length > 0 && (
                  <>
                    <div className="p-2 bg-slate-100/80 border-b border-slate-200">
                      <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                        {language === 'th' ? 'ปิดแล้ว' : 'Closed'}
                      </p>
                    </div>
                    {closedConversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv.id)}
                        className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors opacity-90 ${
                          selectedConv === conv.id ? 'bg-primary/10 opacity-100 ring-1 ring-inset ring-primary/25' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-slate-700 truncate flex-1">{conv.customer_name}</span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">{conv.last_message}</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 border border-slate-200/80 bg-white/95 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConv);
                    return conv ? (
                      <>
                        {conv.customer_avatar ? (
                          <img src={conv.customer_avatar} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{conv.customer_name}</p>
                          <p className="text-[10px] text-slate-600">
                            {conv.status === 'open'
                              ? (language === 'th' ? '🟢 กำลังสนทนา' : '🟢 Active')
                              : (language === 'th' ? '🔴 ปิดแล้ว' : '🔴 Closed')
                            }
                          </p>
                          <p className="text-[10px] text-primary/90">
                            {language === 'th'
                              ? `ผู้ดูแล: ${conv.assigned_admin_name || 'รอรับเคส'}`
                              : `Handler: ${conv.assigned_admin_name || 'Unassigned'}`}
                          </p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  {conversations.find(c => c.id === selectedConv)?.status === 'open' && (
                    <Button variant="outline" size="sm" onClick={() => handleCloseConversation(selectedConv)} className="text-xs h-7 gap-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm">
                      <X className="h-3 w-3" />
                      {language === 'th' ? 'ปิด' : 'Close'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 lg:hidden border-slate-300 bg-white text-slate-700 hover:border-primary hover:bg-primary/10 transition-all shadow-sm" 
                    onClick={() => setSelectedConv(null)}
                    title={language === 'th' ? 'ปิด' : 'Close'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 bg-gradient-to-b from-slate-50/60 to-white" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((msg, index) => {
                    const currentDayKey = getDayKey(msg.created_at);
                    const previousDayKey = index > 0 ? getDayKey(messages[index - 1].created_at) : null;
                    const showDateSeparator = index === 0 || currentDayKey !== previousDayKey;

                    return (
                      <div key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-2">
                            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                              {getDateSeparatorLabel(msg.created_at, language)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl p-2.5 shadow-sm ${
                            msg.sender_role === 'admin'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <p className="text-[10px] opacity-80">
                                {new Date(msg.created_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {msg.sender_role === 'admin' && msg.is_read && (
                                <CheckCheck className="h-3 w-3 opacity-80" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Input */}
              {conversations.find(c => c.id === selectedConv)?.status === 'open' && (
                <div className="p-3 border-t border-slate-200 bg-white">
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
                    {quickAnswers.map((answer) => (
                      <Button
                        key={answer}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={sending}
                        onClick={() => handleQuickAnswer(answer)}
                        className="h-7 px-2.5 text-[11px] whitespace-nowrap border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:border-primary/60"
                      >
                        {answer}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={language === 'th' ? 'พิมพ์ข้อความตอบกลับ...' : 'Type a reply...'}
                      disabled={sending}
                      className="flex-1 h-9 text-sm border-slate-300 bg-white focus-visible:ring-primary placeholder:text-slate-500"
                    />
                    <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="h-9 w-9 border border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 bg-gradient-to-b from-slate-50/60 to-white">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <p className="text-sm font-medium">
                  {language === 'th' ? 'เลือกบทสนทนาเพื่อเริ่มตอบกลับ' : 'Select a conversation to start replying'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
