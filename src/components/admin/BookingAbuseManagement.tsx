import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Ban, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "@/lib/toast";

type BlacklistType = "email" | "phone" | "ip";

interface BookingAbuseEvent {
  id: string;
  created_at: string;
  request_name: string | null;
  request_email: string | null;
  request_phone: string | null;
  request_ip: string | null;
  status: string;
  risk_score: number;
  risk_flags: string[] | null;
  block_reason: string | null;
}

interface BookingBlacklistEntry {
  id: string;
  type: BlacklistType;
  value: string;
  reason: string | null;
  blocked_until: string | null;
  is_active: boolean;
  created_at: string;
}

type ErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const toErrorLike = (error: unknown): ErrorLike => {
  if (typeof error !== "object" || error === null) return {};
  const source = error as Record<string, unknown>;
  return {
    code: typeof source.code === "string" ? source.code : undefined,
    message: typeof source.message === "string" ? source.message : undefined,
    details: typeof source.details === "string" ? source.details : undefined,
    hint: typeof source.hint === "string" ? source.hint : undefined,
  };
};

const isMissingAntiAbuseTableError = (error: unknown): boolean => {
  const e = toErrorLike(error);
  const message = `${e.message || ""} ${e.details || ""} ${e.hint || ""}`.toLowerCase();
  return e.code === "42P01" || message.includes("booking_abuse_events") || message.includes("booking_blacklist");
};

type DbResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

type DbMutationResult = {
  error: { message?: string } | null;
};

export const BookingAbuseManagement = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<BookingAbuseEvent[]>([]);
  const [blacklist, setBlacklist] = useState<BookingBlacklistEntry[]>([]);
  const [blacklistType, setBlacklistType] = useState<BlacklistType>("email");
  const [blacklistValue, setBlacklistValue] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blockHours, setBlockHours] = useState("72");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const eventsPromise = supabase
        .from("booking_abuse_events" as never)
          .select("id, created_at, request_name, request_email, request_phone, request_ip, status, risk_score, risk_flags, block_reason")
          .order("created_at", { ascending: false })
          .limit(50) as unknown as Promise<DbResult<BookingAbuseEvent>>;

      const blacklistPromise = supabase
        .from("booking_blacklist" as never)
          .select("id, type, value, reason, blocked_until, is_active, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50) as unknown as Promise<DbResult<BookingBlacklistEntry>>;

      const [eventsRes, blacklistRes] = await Promise.all([eventsPromise, blacklistPromise]);

      if (eventsRes.error) throw eventsRes.error;
      if (blacklistRes.error) throw blacklistRes.error;

      setEvents(eventsRes.data || []);
      setBlacklist(blacklistRes.data || []);
    } catch (error) {
      console.error("Failed to load booking abuse data:", error);
      if (isMissingAntiAbuseTableError(error)) {
        toast.error(
          language === "th"
            ? "ยังไม่ได้ตั้งค่าฐานข้อมูล Anti-abuse (ต้องรัน migration ก่อน)"
            : "Anti-abuse database is not set up yet (run migration first)."
        );
      } else {
        toast.error(language === "th" ? "โหลดข้อมูล Anti-abuse ไม่สำเร็จ" : "Failed to load anti-abuse data");
      }
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const markAsSpam = async (eventId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const mutationPromise = supabase
        .from("booking_abuse_events" as never)
        .update({
          status: "spam",
          reviewed_by: userData.user?.id || null,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", eventId) as unknown as Promise<DbMutationResult>;

      const { error } = await mutationPromise;

      if (error) throw error;
      toast.success(language === "th" ? "มาร์กเป็นสแปมแล้ว" : "Marked as spam");
      await loadData();
    } catch (error) {
      console.error("Failed to mark spam:", error);
      toast.error(language === "th" ? "มาร์กสแปมไม่สำเร็จ" : "Failed to mark spam");
    }
  };

  const addToBlacklist = async () => {
    const value = blacklistValue.trim();
    const hours = Number(blockHours);

    if (!value) {
      toast.error(language === "th" ? "กรุณากรอกค่าที่ต้องการบล็อก" : "Please enter blacklist value");
      return;
    }

    if (!Number.isFinite(hours) || hours <= 0) {
      toast.error(language === "th" ? "จำนวนชั่วโมงไม่ถูกต้อง" : "Invalid block hours");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const blockedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

      const mutationPromise = supabase
        .from("booking_blacklist" as never)
        .upsert(
          {
            type: blacklistType,
            value,
            reason: blacklistReason.trim() || null,
            blocked_until: blockedUntil,
            is_active: true,
            created_by: userData.user?.id || null,
          } as never,
          { onConflict: "type,value" }
        ) as unknown as Promise<DbMutationResult>;

      const { error } = await mutationPromise;

      if (error) throw error;

      setBlacklistValue("");
      setBlacklistReason("");
      toast.success(language === "th" ? "เพิ่ม blacklist สำเร็จ" : "Blacklist added");
      await loadData();
    } catch (error) {
      console.error("Failed to add blacklist:", error);
      toast.error(language === "th" ? "เพิ่ม blacklist ไม่สำเร็จ" : "Failed to add blacklist");
    }
  };

  const disableBlacklist = async (id: string) => {
    try {
      const mutationPromise = supabase
        .from("booking_blacklist" as never)
        .update({ is_active: false } as never)
        .eq("id", id) as unknown as Promise<DbMutationResult>;

      const { error } = await mutationPromise;

      if (error) throw error;
      toast.success(language === "th" ? "ปิด blacklist แล้ว" : "Blacklist disabled");
      await loadData();
    } catch (error) {
      console.error("Failed to disable blacklist:", error);
      toast.error(language === "th" ? "ปิด blacklist ไม่สำเร็จ" : "Failed to disable blacklist");
    }
  };

  const riskSummary = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentEvents = events.filter((event) => new Date(event.created_at).getTime() >= oneDayAgo);

    return {
      highRisk: recentEvents.filter((event) => event.risk_score >= 70).length,
      blocked: recentEvents.filter((event) => event.status === "blocked").length,
      spam: recentEvents.filter((event) => event.status === "spam").length,
      fastSubmit: recentEvents.filter((event) => (event.risk_flags || []).includes("fast_submit")).length,
    };
  }, [events]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            {language === "th" ? "Booking Anti-Abuse" : "Booking Anti-Abuse"}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">{language === "th" ? "High risk (24 ชม.)" : "High risk (24h)"}</p>
            <p className="text-lg font-bold text-red-600">{riskSummary.highRisk}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">{language === "th" ? "ถูกบล็อก" : "Blocked"}</p>
            <p className="text-lg font-bold text-amber-600">{riskSummary.blocked}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">{language === "th" ? "มาร์กสแปม" : "Marked spam"}</p>
            <p className="text-lg font-bold text-rose-600">{riskSummary.spam}</p>
          </div>
          <div className="rounded-lg border p-2">
            <p className="text-xs text-muted-foreground">{language === "th" ? "ส่งเร็วผิดปกติ" : "Fast submit"}</p>
            <p className="text-lg font-bold text-orange-600">{riskSummary.fastSubmit}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Ban className="w-4 h-4" />
            {language === "th" ? "Blacklist ชั่วคราว" : "Temporary Blacklist"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={blacklistType}
                onChange={(e) => setBlacklistType(e.target.value as BlacklistType)}
                className="w-full h-9 rounded-md border border-input bg-white px-2 text-sm"
              >
                <option value="email">email</option>
                <option value="phone">phone</option>
                <option value="ip">ip</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Value</Label>
              <Input value={blacklistValue} onChange={(e) => setBlacklistValue(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Hours</Label>
              <Input value={blockHours} onChange={(e) => setBlockHours(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs">Reason</Label>
              <Input value={blacklistReason} onChange={(e) => setBlacklistReason(e.target.value)} className="h-9" />
            </div>
          </div>
          <Button onClick={() => void addToBlacklist()} size="sm">
            {language === "th" ? "เพิ่ม Blacklist" : "Add Blacklist"}
          </Button>

          {blacklist.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>{language === "th" ? "หมดอายุ" : "Expires"}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklist.slice(0, 8).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{item.value}</TableCell>
                    <TableCell className="text-xs">{item.blocked_until ? new Date(item.blocked_until).toLocaleString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => void disableBlacklist(item.id)}>
                        {language === "th" ? "ปิด" : "Disable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {language === "th" ? "เหตุการณ์จองล่าสุด" : "Recent Booking Events"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === "th" ? "เวลา" : "Time"}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>{language === "th" ? "สถานะ" : "Status"}</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.slice(0, 20).map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs">{new Date(event.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{event.request_email || "-"}</TableCell>
                  <TableCell className="text-xs">{event.request_phone || "-"}</TableCell>
                  <TableCell className="text-xs">{event.request_ip || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={event.status === "blocked" || event.status === "spam" ? "destructive" : "secondary"}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{event.risk_score}</TableCell>
                  <TableCell className="text-right">
                    {event.status !== "spam" && (
                      <Button size="sm" variant="outline" onClick={() => void markAsSpam(event.id)}>
                        {language === "th" ? "Mark spam" : "Mark spam"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
