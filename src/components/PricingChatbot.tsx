import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, MessageCircle, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import sweetAlert from "@/lib/sweetAlert";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PricingChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

// Generate a session ID per browser session
const getSessionId = () => {
  let id = sessionStorage.getItem('plernping-chat-session');
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem('plernping-chat-session', id);
  }
  return id;
};

const CHAT_OPEN_COUNT_KEY = 'plernping-chat-open-count-v1';

const getChatOpenCount = () => {
  const count = Number(localStorage.getItem(CHAT_OPEN_COUNT_KEY) || '0');
  return Number.isFinite(count) && count > 0 ? count : 0;
};

const setChatOpenCount = (count: number) => {
  localStorage.setItem(CHAT_OPEN_COUNT_KEY, String(count));
};

const PricingChatbot = ({ isOpen, onClose }: PricingChatbotProps) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(getSessionId());
  const wasOpenRef = useRef(false);

  const firstOpenMessage = language === 'th'
    ? "สวัสดีค่ะ 😊 เพลินนะคะ ยินดีที่ได้รู้จักค่ะ เพลินเป็นผู้ช่วย AI ของ Plern Ping Cafe & Resort พร้อมช่วยตอบทุกคำถามเรื่องห้องพัก เมนู ราคา และข้อมูลต่างๆ ให้ลูกค้าตามที่อยากทราบค่ะ"
    : language === 'zh'
    ? "你好呀 😊 我叫Ploen，很高兴认识你！我是 Plern Ping Cafe & Resort 的AI女助手，可以亲切又礼貌地帮助你了解房间、菜单、价格和各项服务。"
    : language === 'ja'
    ? "こんにちは 😊 私はプローンです。はじめまして！Plern Ping Cafe & Resort の女性AIアシスタントとして、お部屋・メニュー・料金などを丁寧で親しみやすくご案内します。"
    : "Hi there 😊 I'm Ploen. Nice to meet you! I'm the female AI assistant of Plern Ping Cafe & Resort, here to help with rooms, menus, prices, and more in a friendly and polite way.";

  const quickQuestions = language === 'th'
    ? ["ห้องพักราคาเท่าไหร่?", "มีห้องว่างไหม?", "เมนูแนะนำ?", "เบอร์โทรติดต่อ?", "จัดงานได้ไหม?", "เวลาเปิด-ปิด?"]
    : language === 'zh'
    ? ["房价多少？", "有空房吗？", "推荐菜单？", "联系电话？", "可以举办活动吗？", "营业时间？"]
    : language === 'ja'
    ? ["部屋の料金は？", "空室はありますか？", "おすすめメニューは？", "連絡先は？", "イベントできますか？", "営業時間は？"]
    : ["Room prices?", "Any rooms available?", "Menu recommendations?", "Contact number?", "Can host events?", "Opening hours?"];

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const nextOpenCount = getChatOpenCount() + 1;
      setChatOpenCount(nextOpenCount);

      const greetingMessage =
        language === 'th' && nextOpenCount === 2
          ? `${firstOpenMessage} รอบนี้มีอะไรให้เพลินช่วยดีคะ`
          : firstOpenMessage;

      setMessages([{
        id: '1',
        role: 'assistant',
        content: greetingMessage,
        timestamp: new Date()
      }]);

      const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('plernping-chat-session', newId);
      sessionId.current = newId;
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, firstOpenMessage, language]);

  useEffect(() => {
    if (!isOpen) {
      if (messages.length > 0) {
        setMessages([]);
      }
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUrl = window.location.href;

      // Build conversation history (exclude welcome message)
      const history = messages
        .filter(m => m.id !== '1')
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('pricing-chat', {
        body: {
          message: messageText,
          language,
          sessionId: sessionId.current,
          userId: authData.user?.id || null,
          conversationHistory: history,
          clientContext: {
            currentUrl,
            pagePath: window.location.pathname,
            referrer: document.referrer || null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            browserLanguage: navigator.language,
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
          },
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error('Chatbot error:', error);
      const errMsg = language === 'th'
        ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
        : language === 'zh'
        ? '发生错误，请重试'
        : 'An error occurred. Please try again.';
      sweetAlert.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, language]);

  const handleClear = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: firstOpenMessage,
      timestamp: new Date()
    }]);
    // New session
    const newId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem('plernping-chat-session', newId);
    sessionId.current = newId;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const showQuickQuestions = (messages.length <= 1 || (messages.length > 1 && messages[messages.length - 1]?.role === 'assistant')) && !isLoading;

  return (
    <div className="fixed bottom-20 right-2 left-2 md:inset-auto md:bottom-24 md:right-8 z-50 w-auto md:w-96 h-[70dvh] max-h-[500px] md:h-[500px] md:max-h-[600px] bg-background border border-border rounded-2xl md:rounded-lg shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-gradient-to-r from-primary/90 to-highlight rounded-t-2xl md:rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7 md:hidden">
            <ArrowLeft size={18} />
          </Button>
          <MessageCircle className="text-white" size={18} />
          <h3 className="font-bold text-white text-sm">Plernping AI</h3>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 1 && (
            <Button variant="ghost" size="icon" onClick={handleClear} className="hover:bg-white/20 text-white h-7 w-7" title={language === 'th' ? 'ล้างแชท' : 'Clear chat'}>
              <Trash2 size={14} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 text-white h-7 w-7">
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-2.5 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString(language === 'th' ? 'th-TH' : language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {showQuickQuestions && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">
                {language === 'th' ? '💡 คำถามแนะนำ:' : language === 'zh' ? '💡 推荐问题:' : language === 'ja' ? '💡 おすすめの質問:' : '💡 Quick Questions:'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)} className="text-xs px-2 py-1.5 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all text-foreground truncate">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-2.5">
                <Loader2 className="animate-spin" size={18} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2.5 sm:p-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              language === 'th' ? 'พิมพ์คำถาม...' : language === 'zh' ? '输入问题...' : language === 'ja' ? '質問を入力...' : 'Ask a question...'
            }
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingChatbot;
