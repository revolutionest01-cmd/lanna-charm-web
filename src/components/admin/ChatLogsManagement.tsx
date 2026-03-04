import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageSquare,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Link2,
  Languages,
  Hash,
} from "lucide-react";
import sweetAlert from "@/lib/sweetAlert";

interface ChatLog {
  id: string;
  session_id: string;
  user_message: string;
  ai_reply: string;
  intent: string;
  language: string;
  user_id: string | null;
  ip_hash: string | null;
  ip_address: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  user_agent: string | null;
  user_agent_hash: string | null;
  referrer: string | null;
  current_url: string | null;
  page_path: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  browser_language: string | null;
  timezone: string | null;
  platform: string | null;
  device_type: string | null;
  screen_resolution: string | null;
  viewport: string | null;
  visitor_fingerprint: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const ChatLogsManagement = () => {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  interface SessionGroup {
    sessionId: string;
    messages: ChatLog[];
    firstMessage: ChatLog;
    latestMessage: ChatLog;
    latestAt: number;
    identityTokens: string[];
  }

  interface IdentityGroup {
    id: string;
    sessions: SessionGroup[];
    messages: ChatLog[];
    latestAt: number;
    representative: ChatLog;
    identityTokens: string[];
  }

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

  const handleDeleteIdentity = async (sessionIds: string[]) => {
    if (sessionIds.length === 0) return;

    const confirmed = await sweetAlert.modal.confirmDelete(
      language === 'th' ? 'ลบบทสนทนาผู้ใช้นี้ทั้งหมด?' : 'Delete all conversations for this identity?',
      language === 'th' ? 'จะไม่สามารถกู้คืนได้' : 'This cannot be undone'
    );
    if (!confirmed) return;

    const { error } = await supabase.from('chat_logs').delete().in('session_id', sessionIds);
    if (error) {
      sweetAlert.error(language === 'th' ? 'ลบไม่สำเร็จ' : 'Delete failed');
      return;
    }
    setLogs(prev => prev.filter(l => !sessionIds.includes(l.session_id)));
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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const inLanguage = languageFilter === "all" || (log.language || "th") === languageFilter;
      const searchText = search.trim().toLowerCase();

      if (!searchText) return inLanguage;

      const fields = [
        log.user_message,
        log.ai_reply,
        log.country_code,
        log.city,
        log.page_path,
        log.referrer,
        log.utm_source,
        log.utm_medium,
        log.utm_campaign,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return inLanguage && fields.includes(searchText);
    });
  }, [logs, search, languageFilter]);

  const identityGroups = useMemo<IdentityGroup[]>(() => {
    const groupedBySession = filteredLogs.reduce<Record<string, ChatLog[]>>((acc, log) => {
      if (!acc[log.session_id]) acc[log.session_id] = [];
      acc[log.session_id].push(log);
      return acc;
    }, {});

    const sessions: SessionGroup[] = Object.entries(groupedBySession).map(([sessionId, messages]) => {
      const sortedDesc = [...messages].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latestMessage = sortedDesc[0];
      const firstMessage = sortedDesc[sortedDesc.length - 1];
      const metadataName = typeof latestMessage.metadata?.user_name === 'string'
        ? latestMessage.metadata.user_name
        : null;

      const tokens = [
        latestMessage.user_id ? `uid:${latestMessage.user_id}` : null,
        metadataName ? `name:${String(metadataName).trim().toLowerCase()}` : null,
        latestMessage.ip_hash ? `ip:${latestMessage.ip_hash}` : null,
        latestMessage.ip_address ? `ipaddr:${latestMessage.ip_address}` : null,
        latestMessage.visitor_fingerprint ? `visitor:${latestMessage.visitor_fingerprint}` : null,
        latestMessage.user_agent_hash ? `uah:${latestMessage.user_agent_hash}` : null,
        latestMessage.user_agent ? `ua:${latestMessage.user_agent.toLowerCase()}` : null,
        latestMessage.platform && latestMessage.screen_resolution
          ? `device:${latestMessage.platform}:${latestMessage.screen_resolution}:${latestMessage.browser_language || ''}`
          : null,
      ].filter((token): token is string => Boolean(token));

      return {
        sessionId,
        messages: sortedDesc,
        firstMessage,
        latestMessage,
        latestAt: new Date(latestMessage.created_at).getTime(),
        identityTokens: [...new Set(tokens)],
      };
    });

    const parent = new Map<string, string>();
    sessions.forEach((session) => parent.set(session.sessionId, session.sessionId));

    const find = (id: string): string => {
      const root = parent.get(id) || id;
      if (root === id) return id;
      const next = find(root);
      parent.set(id, next);
      return next;
    };

    const union = (a: string, b: string) => {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA !== rootB) parent.set(rootB, rootA);
    };

    const tokenOwner = new Map<string, string>();
    sessions.forEach((session) => {
      session.identityTokens.forEach((token) => {
        const existingOwner = tokenOwner.get(token);
        if (existingOwner) {
          union(existingOwner, session.sessionId);
        } else {
          tokenOwner.set(token, session.sessionId);
        }
      });
    });

    const groupedByIdentity = new Map<string, SessionGroup[]>();
    sessions.forEach((session) => {
      const root = find(session.sessionId);
      if (!groupedByIdentity.has(root)) groupedByIdentity.set(root, []);
      groupedByIdentity.get(root)!.push(session);
    });

    return Array.from(groupedByIdentity.entries()).map(([rootId, groupedSessions]) => {
      const sortedSessions = [...groupedSessions].sort((a, b) => b.latestAt - a.latestAt);
      const mergedMessages = sortedSessions
        .flatMap((s) => s.messages)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const representative = sortedSessions[0].latestMessage;
      const allTokens = [...new Set(sortedSessions.flatMap((s) => s.identityTokens))];

      return {
        id: rootId,
        sessions: sortedSessions,
        messages: mergedMessages,
        latestAt: sortedSessions[0].latestAt,
        representative,
        identityTokens: allTokens,
      };
    }).sort((a, b) => b.latestAt - a.latestAt);
  }, [filteredLogs]);

  const uniqueVisitors = identityGroups.length;
  const uniquePages = new Set(filteredLogs.map((l) => l.page_path).filter(Boolean)).size;

  const langLabel = (code: string) => {
    const map: Record<string, string> = { th: '🇹🇭', en: '🇬🇧', zh: '🇨🇳', ja: '🇯🇵' };
    return map[code] || code;
  };

  const deviceIcon = (deviceType: string | null) => {
    if (deviceType === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
    if (deviceType === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
    return <Monitor className="h-3.5 w-3.5" />;
  };

  const shortValue = (value: string | null, size = 16) => {
    if (!value) return '-';
    return value.length > size ? `${value.slice(0, size)}...` : value;
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">{language === 'th' ? 'บทสนทนา' : 'Conversations'}</p>
            <p className="text-xl font-semibold">{identityGroups.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">{language === 'th' ? 'ข้อความทั้งหมด' : 'Messages'}</p>
            <p className="text-xl font-semibold">{filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">{language === 'th' ? 'ผู้ใช้งานไม่ซ้ำ' : 'Unique visitors'}</p>
            <p className="text-xl font-semibold">{uniqueVisitors}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-slate-200">
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">{language === 'th' ? 'หน้าที่ถูกถามถึง' : 'Page paths'}</p>
            <p className="text-xl font-semibold">{uniquePages}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={language === 'th' ? 'ค้นหาข้อความ...' : 'Search messages...'}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder={language === 'th' ? 'ภาษา' : 'Language'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'th' ? 'ทุกภาษา' : 'All languages'}</SelectItem>
            <SelectItem value="th">🇹🇭 ไทย</SelectItem>
            <SelectItem value="en">🇬🇧 English</SelectItem>
            <SelectItem value="zh">🇨🇳 中文</SelectItem>
            <SelectItem value="ja">🇯🇵 日本語</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {language === 'th' ? 'รีเฟรช' : 'Refresh'}
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {language === 'th' ? `${identityGroups.length} ตัวตนผู้ใช้` : `${identityGroups.length} user identities`}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {language === 'th' ? `${filteredLogs.length} ข้อความ` : `${filteredLogs.length} messages`}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {language === 'th' ? `${new Set(filteredLogs.map((l) => l.session_id)).size} sessions` : `${new Set(filteredLogs.map((l) => l.session_id)).size} sessions`}
        </Badge>
      </div>

      {/* Conversation List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : identityGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            {language === 'th' ? 'ยังไม่มีประวัติแชท' : 'No chat logs yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {identityGroups.map((identity, identityIndex) => {
            const isExpanded = expandedSessions.has(identity.id);
            const newestMessage = identity.representative;
            const firstMessage = identity.messages[0];
            const date = new Date(newestMessage.created_at);

            return (
              <Card key={identity.id} className="overflow-hidden bg-white border-slate-200">
                <div
                  className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleSession(identity.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 shrink-0">
                        {language === 'th' ? `ผู้ใช้ #${identityIndex + 1}` : `User #${identityIndex + 1}`}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 gap-1 shrink-0">
                        {deviceIcon(newestMessage.device_type)}
                        {(newestMessage.device_type || 'desktop').toUpperCase()}
                      </Badge>
                      {!!newestMessage.country_code && (
                        <Badge variant="outline" className="text-[10px] px-1.5 gap-1 shrink-0">
                          <MapPin className="h-3 w-3" />
                          {newestMessage.country_code}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                        {identity.sessions.length} {language === 'th' ? 'sessions' : 'sessions'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {date.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: '2-digit' })}
                        {' '}
                        {date.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {identity.messages.length} {language === 'th' ? 'ข้อความ' : 'msgs'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {firstMessage.user_message}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {newestMessage.page_path && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 gap-1">
                          <Link2 className="h-3 w-3" />
                          {shortValue(newestMessage.page_path, 28)}
                        </Badge>
                      )}
                      {newestMessage.utm_source && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 gap-1">
                          UTM: {shortValue(newestMessage.utm_source, 16)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {langLabel(newestMessage.language || 'th')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteIdentity(identity.sessions.map((s) => s.sessionId)); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-3">
                      <Card className="bg-white border-slate-200">
                        <CardContent className="p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">{language === 'th' ? 'Identity' : 'Identity'}</p>
                              <p className="font-medium truncate">{shortValue(identity.id, 18)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{language === 'th' ? 'Sessions' : 'Sessions'}</p>
                              <p className="font-medium truncate">{identity.sessions.length}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">IP</p>
                              <p className="font-medium truncate">{shortValue(newestMessage.ip_address || newestMessage.ip_hash, 18)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{language === 'th' ? 'อุปกรณ์' : 'Device'}</p>
                              <p className="font-medium truncate">{newestMessage.device_type || '-'}</p>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground">{language === 'th' ? 'Linked sessions' : 'Linked sessions'}</p>
                            <div className="flex flex-wrap gap-1">
                              {identity.sessions.map((session) => (
                                <Badge key={session.sessionId} variant="outline" className="text-[10px] px-1.5">
                                  {shortValue(session.sessionId, 12)}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Geo</p>
                            <p className="text-foreground">
                              {[newestMessage.country_code, newestMessage.region, newestMessage.city].filter(Boolean).join(' • ') || '-'}
                            </p>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> URL</p>
                            <p className="text-foreground break-all">{newestMessage.current_url || '-'}</p>
                            <p className="text-foreground break-all">{newestMessage.referrer || '-'}</p>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> UTM</p>
                            <p className="text-foreground break-words">
                              {[
                                newestMessage.utm_source && `source:${newestMessage.utm_source}`,
                                newestMessage.utm_medium && `medium:${newestMessage.utm_medium}`,
                                newestMessage.utm_campaign && `campaign:${newestMessage.utm_campaign}`,
                              ].filter(Boolean).join(' | ') || '-'}
                            </p>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <p className="text-muted-foreground flex items-center gap-1"><Languages className="h-3 w-3" /> Client</p>
                            <p className="text-foreground">{newestMessage.browser_language || '-'} | {newestMessage.timezone || '-'}</p>
                            <p className="text-foreground">{newestMessage.platform || '-'} | {newestMessage.screen_resolution || '-'} | {newestMessage.viewport || '-'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <ScrollArea className="max-h-[460px] pr-2">
                        <div className="space-y-3">
                          {identity.sessions.map((session) => (
                            <div key={session.sessionId} className="space-y-2">
                              <Badge variant="outline" className="text-[10px] px-2">
                                session: {session.sessionId}
                              </Badge>
                              {[...session.messages].reverse().map((msg) => (
                                <div key={msg.id} className="space-y-1.5">
                                  <div className="flex items-start gap-2">
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <User className="h-3 w-3 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground mb-0.5">
                                        {new Date(msg.created_at).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      <div className="text-sm bg-white border border-slate-200 rounded-lg p-2 max-h-36 overflow-y-auto whitespace-pre-wrap break-words">
                                        {msg.user_message}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Bot className="h-3 w-3 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm bg-white border border-slate-200 rounded-lg p-2 max-h-44 overflow-y-auto whitespace-pre-wrap break-words">
                                        {msg.ai_reply}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
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
