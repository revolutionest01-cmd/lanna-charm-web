import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MessageSquare, Trash2, RefreshCw, Search, Clock, User, Bot, ChevronDown, ChevronUp } from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";

interface ChatLog {
  id: string;
  session_id: string;
  user_message: string;
  ai_reply: string;
  intent: string;
  language: string;
  ip_hash: string | null;
  created_at: string;
}

export const ChatLogsManagement = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs((data as ChatLog[]) || []);
    } catch (err) {
      console.error('Error fetching chat logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDeleteSession = async (sessionId: string) => {
    const confirmed = await sweetAlert.modal.confirmDelete(
      language === 'th' ? 'ลบบทสนทนานี้?' : 'Delete this conversation?',
      language === 'th' ? 'จะไม่สามารถกู้คืนได้' : 'This cannot be undone'
    );
    if (!confirmed) return;

    const { error } = await supabase.from('chat_logs').delete().eq('session_id', sessionId);
    if (error) {
      sweetAlert.error(language === 'th' ? 'ลบไม่สำเร็จ' : 'Delete failed');
      return;
    }
    setLogs(prev => prev.filter(l => l.session_id !== sessionId));
    sweetAlert.success(language === 'th' ? 'ลบแล้ว' : 'Deleted');
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  // Group logs by session
  const grouped = logs.reduce<Record<string, ChatLog[]>>((acc, log) => {
    if (!acc[log.session_id]) acc[log.session_id] = [];
    acc[log.session_id].push(log);
    return acc;
  }, {});

  // Sort sessions by most recent message
  const sortedSessions = Object.entries(grouped).sort((a, b) => {
    const aTime = new Date(a[1][0].created_at).getTime();
    const bTime = new Date(b[1][0].created_at).getTime();
    return bTime - aTime;
  });

  // Filter
  const filtered = search
    ? sortedSessions.filter(([, msgs]) =>
        msgs.some(m => m.user_message.toLowerCase().includes(search.toLowerCase()) || m.ai_reply.toLowerCase().includes(search.toLowerCase()))
      )
    : sortedSessions;

  const langLabel = (code: string) => {
    const map: Record<string, string> = { th: '🇹🇭', en: '🇬🇧', zh: '🇨🇳', ja: '🇯🇵' };
    return map[code] || code;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          {language === 'th' ? 'ประวัติแชท Plernping AI' : 'Plernping AI Chat Logs'}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'th' ? 'ดูบทสนทนาระหว่างผู้ใช้กับ AI เพื่อวิเคราะห์ความต้องการ' : 'View user-AI conversations for insights'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหาข้อความ...' : 'Search messages...'}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {language === 'th' ? 'รีเฟรช' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {language === 'th' ? `${filtered.length} บทสนทนา` : `${filtered.length} conversations`}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {language === 'th' ? `${logs.length} ข้อความ` : `${logs.length} messages`}
        </Badge>
      </div>

      {/* Conversation List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {language === 'th' ? 'ยังไม่มีประวัติแชท' : 'No chat logs yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(([sessionId, msgs]) => {
            const isExpanded = expandedSessions.has(sessionId);
            const firstMsg = msgs[msgs.length - 1]; // oldest
            const lastMsg = msgs[0]; // newest
            const date = new Date(lastMsg.created_at);

            return (
              <Card key={sessionId} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleSession(sessionId)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                        {langLabel(firstMsg.language)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {' '}
                        {date.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {msgs.length} {language === 'th' ? 'ข้อความ' : 'msgs'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {firstMsg.user_message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteSession(sessionId); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-3 sm:p-4">
                    <ScrollArea className="max-h-[400px]">
                      <div className="space-y-3">
                        {[...msgs].reverse().map((msg) => (
                          <div key={msg.id} className="space-y-1.5">
                            {/* User message */}
                            <div className="flex items-start gap-2">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground mb-0.5">
                                  {new Date(msg.created_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-sm bg-card border border-border rounded-lg p-2">{msg.user_message}</p>
                              </div>
                            </div>
                            {/* AI reply */}
                            <div className="flex items-start gap-2">
                              <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm bg-card border border-border rounded-lg p-2 whitespace-pre-wrap">{msg.ai_reply}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
