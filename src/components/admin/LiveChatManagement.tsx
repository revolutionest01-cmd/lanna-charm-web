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
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevConvCountRef = useRef(0);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (data) {
      setConversations(data as Conversation[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

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
            if (prev.some(c => c.id === newConv.id)) return prev;
            return [newConv, ...prev];
          });
          // Play sound for new conversation
          if (soundEnabled) playNotificationSound();
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Conversation;
          setConversations(prev =>
            prev.map(c => c.id === updated.id ? updated : c)
              .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
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

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', selectedConv)
        .order('created_at', { ascending: true });

      if (data) setMessages(data as Message[]);

      // Mark customer messages as read & reset unread count
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', selectedConv)
        .eq('sender_role', 'customer')
        .eq('is_read', false);

      await supabase
        .from('chat_conversations')
        .update({ unread_count: 0 })
        .eq('id', selectedConv);
    };

    fetchMessages();
  }, [selectedConv]);

  // Realtime messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;

    const channel = supabase
      .channel(`admin-chat-msgs-${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${selectedConv}`,
      }, async (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Auto mark as read
        if (newMsg.sender_role === 'customer') {
          await supabase.from('chat_messages').update({ is_read: true }).eq('id', newMsg.id);
          await supabase.from('chat_conversations').update({ unread_count: 0 }).eq('id', selectedConv);
          if (soundEnabled) playNotificationSound();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, soundEnabled]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedConv || !user) return;
    const content = input.trim();
    setInput("");
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
      }).eq('id', selectedConv);

    } catch (err) {
      console.error('Send error:', err);
      setInput(content);
    } finally {
      setSending(false);
    }
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            {language === 'th' ? 'Live Chat' : 'Live Chat'}
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">{totalUnread}</Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'th' ? 'ตอบกลับลูกค้าแบบเรียลไทม์' : 'Reply to customers in real-time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchConversations} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px]">
        {/* Conversation List */}
        <div className="lg:col-span-1 border border-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50">
            <p className="text-sm font-medium">
              {language === 'th' ? `สนทนา (${openConversations.length})` : `Conversations (${openConversations.length})`}
            </p>
          </div>
          <ScrollArea className="h-[450px]">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {language === 'th' ? 'ยังไม่มีการสนทนา' : 'No conversations yet'}
              </div>
            ) : (
              <div>
                {/* Open conversations */}
                {openConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={`w-full text-left p-3 border-b border-border hover:bg-accent/50 transition-colors ${
                      selectedConv === conv.id ? 'bg-accent' : ''
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
                      <span className="text-sm font-medium truncate flex-1">{conv.customer_name}</span>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 h-4 animate-pulse">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(conv.last_message_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}

                {/* Closed conversations */}
                {closedConversations.length > 0 && (
                  <>
                    <div className="p-2 bg-muted/30 border-b border-border">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {language === 'th' ? 'ปิดแล้ว' : 'Closed'}
                      </p>
                    </div>
                    {closedConversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConv(conv.id)}
                        className={`w-full text-left p-3 border-b border-border hover:bg-accent/50 transition-colors opacity-60 ${
                          selectedConv === conv.id ? 'bg-accent opacity-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs truncate flex-1">{conv.customer_name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="p-3 border-b border-border bg-muted/50 flex items-center justify-between">
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
                          <p className="text-sm font-medium">{conv.customer_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {conv.status === 'open'
                              ? (language === 'th' ? '🟢 กำลังสนทนา' : '🟢 Active')
                              : (language === 'th' ? '🔴 ปิดแล้ว' : '🔴 Closed')
                            }
                          </p>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
                <div className="flex items-center gap-1">
                  {conversations.find(c => c.id === selectedConv)?.status === 'open' && (
                    <Button variant="outline" size="sm" onClick={() => handleCloseConversation(selectedConv)} className="text-xs h-7 gap-1">
                      <X className="h-3 w-3" />
                      {language === 'th' ? 'ปิด' : 'Close'}
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 lg:hidden border-primary/50 hover:border-primary hover:bg-primary/10 transition-all" 
                    onClick={() => setSelectedConv(null)}
                    title={language === 'th' ? 'ปิด' : 'Close'}
                  >
                    <X className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-2.5 ${
                        msg.sender_role === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-[10px] opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {msg.sender_role === 'admin' && msg.is_read && (
                            <CheckCheck className="h-3 w-3 opacity-70" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              {conversations.find(c => c.id === selectedConv)?.status === 'open' && (
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={language === 'th' ? 'พิมพ์ข้อความตอบกลับ...' : 'Type a reply...'}
                      disabled={sending}
                      className="flex-1 h-9 text-sm"
                    />
                    <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon" className="h-9 w-9">
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm">
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
