import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageCircle, ArrowLeft } from "lucide-react";
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

const PricingChatbot = ({ isOpen, onClose }: PricingChatbotProps) => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const welcomeMessage = language === 'th'
    ? "สวัสดีค่ะ 😊 สามารถพิมพ์ถามราคาห้องพัก ห้องประชุม หรือราคาอาหาร/เครื่องดื่มได้เลยนะคะ"
    : language === 'zh'
    ? "您好 😊 您可以询问房价、会议室价格或餐饮菜单价格。"
    : "Hello 😊 You can ask about room prices, meeting/event space prices, or food/beverage menu prices.";

  const quickQuestions = language === 'th'
    ? [
        "ห้องพักราคาเท่าไหร่?",
        "ห้องประชุมมีแบบไหนบ้าง?",
        "เมนูแนะนำมีอะไร?",
        "เครื่องดื่มราคาเท่าไหร่?",
      ]
    : language === 'zh'
    ? [
        "房价是多少？",
        "有什么会议室？",
        "推荐菜单有什么？",
        "饮品价格多少？",
      ]
    : [
        "Room prices?",
        "Meeting rooms available?",
        "Recommended menu?",
        "Drink prices?",
      ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
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
      const { data, error } = await supabase.functions.invoke('pricing-chat', {
        body: { message: messageText, language }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling chatbot:', error);
      sweetAlert.error(
        language === 'th'
          ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
          : language === 'zh'
          ? '发生错误，请重试'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const showQuickQuestions = messages.length <= 1 && !isLoading;

  return (
    <div className="fixed bottom-20 right-2 left-2 md:inset-auto md:bottom-24 md:right-8 z-50 w-auto md:w-96 h-[70dvh] max-h-[500px] md:h-[500px] md:max-h-[600px] bg-background border border-border rounded-2xl md:rounded-lg shadow-2xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border bg-gradient-to-r from-[#8B6F47] to-[#c65539] rounded-t-2xl md:rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white/20 text-white h-7 w-7 md:hidden"
          >
            <ArrowLeft size={18} />
          </Button>
          <MessageCircle className="text-white" size={18} />
          <h3 className="font-bold text-white text-sm">
            Plernping AI
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/20 text-white h-7 w-7"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2.5 ${
                  msg.role === 'user'
                    ? 'bg-[#c65539] text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] opacity-70 mt-1">
                  {msg.timestamp.toLocaleTimeString(language === 'th' ? 'th-TH' : language === 'zh' ? 'zh-CN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Quick Guide Questions */}
          {showQuickQuestions && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                {language === 'th' ? '💡 คำถามแนะนำ:' : language === 'zh' ? '💡 推荐问题:' : '💡 Quick questions:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                  >
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
              language === 'th'
                ? 'พิมพ์คำถาม...'
                : language === 'zh'
                ? '输入问题...'
                : 'Ask a question...'
            }
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-[#c65539] hover:bg-[#8B6F47] h-9 w-9"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingChatbot;
