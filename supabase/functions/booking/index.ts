import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple rate limiting using in-memory store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window
const DAILY_LIMITS = {
  ip: 8,
  email: 4,
  phone: 4,
};
const MIN_SUBMIT_DURATION_MS = 1200;
const FAST_SUBMIT_RISK_MS = 2500;
const TEMP_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "yopmail.com",
  "sharklasers.com",
  "dispostable.com",
  "trashmail.com",
  "maildrop.cc",
  "fakeinbox.com",
]);

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  record.count++;
  return record.count > RATE_LIMIT;
}

// Input validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  // Allow Thai phone formats: 0xx-xxx-xxxx, 0xxxxxxxxx, +66xxxxxxxxx
  const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
  const cleanPhone = phone.replace(/[-\s]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length <= 15;
}

function validateDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date > new Date();
}

function parseISODateString(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toISODateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStayDates(checkInDate: Date, checkOutDate: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(checkInDate);

  while (cursor < checkOutDate) {
    dates.push(toISODateUTC(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function sanitizeString(str: string, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  // Remove potentially dangerous characters and limit length
  return str
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .substring(0, maxLength);
}

interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomId?: string;
  additionalDetails?: string;
  honeypot?: string;
  formStartedAt?: number;
}

interface AbuseEventPayload {
  request_name: string;
  request_email: string;
  request_phone: string;
  request_ip: string;
  user_agent: string;
  room_id: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  additional_details: string;
  status: "accepted" | "blocked" | "spam" | "reviewed";
  block_reason: string | null;
  risk_score: number;
  risk_flags: string[];
  honeypot_value: string;
  submit_duration_ms: number | null;
  metadata: Record<string, unknown>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}

function getSupabaseAdminConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return null;
  return { supabaseUrl, serviceRoleKey };
}

async function restCount(
  supabaseUrl: string,
  serviceRoleKey: string,
  query: string
): Promise<number> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Count query failed: ${text}`);
  }

  const contentRange = response.headers.get("content-range") || "";
  const totalStr = contentRange.includes("/") ? contentRange.split("/")[1] : "0";
  const total = Number(totalStr);
  return Number.isFinite(total) ? total : 0;
}

async function isValueBlacklisted(
  supabaseUrl: string,
  serviceRoleKey: string,
  type: "email" | "phone" | "ip",
  value: string
): Promise<boolean> {
  if (!value) return false;

  const query = `booking_blacklist?select=id,blocked_until&is_active=eq.true&type=eq.${encodeURIComponent(type)}&value=eq.${encodeURIComponent(value)}&order=created_at.desc&limit=1`;
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Blacklist query failed: ${text}`);
  }

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) return false;

  const blockedUntil = rows[0]?.blocked_until as string | null;
  if (!blockedUntil) return true;
  return new Date(blockedUntil).getTime() > Date.now();
}

async function logAbuseEvent(payload: AbuseEventPayload): Promise<void> {
  const config = getSupabaseAdminConfig();
  if (!config) return;

  const response = await fetch(`${config.supabaseUrl}/rest/v1/booking_abuse_events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.serviceRoleKey}`,
      apikey: config.serviceRoleKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Failed to log booking abuse event:", text);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
}

async function isFeatureTemporarilyDisabled(featureKey: string): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return false;

    const url = `${supabaseUrl}/rest/v1/feature_toggles?feature_key=eq.${encodeURIComponent(featureKey)}&select=is_enabled&limit=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      }
    });

    if (!response.ok) return false;
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return false;
    return rows[0]?.is_enabled === false;
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bookingDisabled = await isFeatureTemporarilyDisabled('booking');
    if (bookingDisabled) {
      return new Response(
        JSON.stringify({ error: "Booking is temporarily disabled", code: "FEATURE_DISABLED" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const body = await req.json();
    
    // Validate required fields exist
    const { name, email, phone, checkIn, checkOut, guests, roomId, additionalDetails, honeypot, formStartedAt } = body as BookingRequest;
    
    if (!name || !email || !phone || !checkIn || !checkOut || !guests) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize and validate inputs
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = normalizeEmail(sanitizeString(email, 255));
    const sanitizedPhone = normalizePhone(sanitizeString(phone, 20));
    const sanitizedCheckIn = sanitizeString(checkIn, 20);
    const sanitizedCheckOut = sanitizeString(checkOut, 20);
    const sanitizedRoomId = roomId ? sanitizeString(roomId, 100) : '';
    const sanitizedAdditionalDetails = additionalDetails ? sanitizeString(additionalDetails, 500) : '';
    const sanitizedHoneypot = honeypot ? sanitizeString(honeypot, 150) : '';
    const sanitizedGuests = Math.min(Math.max(1, Number(guests) || 1), 50);
    const userAgent = sanitizeString(req.headers.get("user-agent") || "", 300);
    const submitDurationMs = Number.isFinite(Number(formStartedAt))
      ? Math.max(0, Date.now() - Number(formStartedAt))
      : null;
    const riskFlags: string[] = [];
    let riskScore = 0;

    if (submitDurationMs !== null && submitDurationMs < FAST_SUBMIT_RISK_MS) {
      riskFlags.push("fast_submit");
      riskScore += 35;
    }

    if (submitDurationMs !== null && submitDurationMs < MIN_SUBMIT_DURATION_MS) {
      riskFlags.push("too_fast_submit");
      riskScore += 65;
    }

    if (sanitizedHoneypot) {
      riskFlags.push("honeypot_triggered");
      riskScore += 90;
    }

    // Validate input formats
    if (sanitizedName.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid name" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!validateEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!validatePhone(sanitizedPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!validateDate(sanitizedCheckIn) || !validateDate(sanitizedCheckOut)) {
      return new Response(
        JSON.stringify({ error: "Invalid booking dates" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const checkInDate = parseISODateString(sanitizedCheckIn);
    const checkOutDate = parseISODateString(sanitizedCheckOut);
    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      return new Response(
        JSON.stringify({ error: "Check-out date must be after check-in date" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailDomain = sanitizedEmail.split("@")[1] || "";
    if (TEMP_EMAIL_DOMAINS.has(emailDomain)) {
      riskFlags.push("temporary_email_domain");
      riskScore += 100;

      await logAbuseEvent({
        request_name: sanitizedName,
        request_email: sanitizedEmail,
        request_phone: sanitizedPhone,
        request_ip: clientIP,
        user_agent: userAgent,
        room_id: sanitizedRoomId || null,
        check_in: sanitizedCheckIn,
        check_out: sanitizedCheckOut,
        guests: sanitizedGuests,
        additional_details: sanitizedAdditionalDetails,
        status: "blocked",
        block_reason: "temporary_email",
        risk_score: riskScore,
        risk_flags: riskFlags,
        honeypot_value: sanitizedHoneypot,
        submit_duration_ms: submitDurationMs,
        metadata: { source: "booking_function" },
      });

      return new Response(
        JSON.stringify({ error: "Disposable email addresses are not allowed", code: "TEMP_EMAIL_BLOCKED" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (sanitizedHoneypot || (submitDurationMs !== null && submitDurationMs < MIN_SUBMIT_DURATION_MS)) {
      await logAbuseEvent({
        request_name: sanitizedName,
        request_email: sanitizedEmail,
        request_phone: sanitizedPhone,
        request_ip: clientIP,
        user_agent: userAgent,
        room_id: sanitizedRoomId || null,
        check_in: sanitizedCheckIn,
        check_out: sanitizedCheckOut,
        guests: sanitizedGuests,
        additional_details: sanitizedAdditionalDetails,
        status: "blocked",
        block_reason: sanitizedHoneypot ? "honeypot_triggered" : "submit_too_fast",
        risk_score: riskScore,
        risk_flags: riskFlags,
        honeypot_value: sanitizedHoneypot,
        submit_duration_ms: submitDurationMs,
        metadata: { source: "booking_function" },
      });

      return new Response(
        JSON.stringify({ error: "Request rejected by anti-abuse policy", code: "ANTI_ABUSE_BLOCKED" }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const adminConfig = getSupabaseAdminConfig();
    if (adminConfig) {
      try {
        const dayStart = new Date();
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayStartIso = dayStart.toISOString();

        const blockedByEmail = await isValueBlacklisted(adminConfig.supabaseUrl, adminConfig.serviceRoleKey, "email", sanitizedEmail);
        const blockedByPhone = await isValueBlacklisted(adminConfig.supabaseUrl, adminConfig.serviceRoleKey, "phone", sanitizedPhone);
        const blockedByIp = await isValueBlacklisted(adminConfig.supabaseUrl, adminConfig.serviceRoleKey, "ip", clientIP);

        if (blockedByEmail || blockedByPhone || blockedByIp) {
          riskFlags.push("blacklist_hit");
          riskScore += 100;

          await logAbuseEvent({
            request_name: sanitizedName,
            request_email: sanitizedEmail,
            request_phone: sanitizedPhone,
            request_ip: clientIP,
            user_agent: userAgent,
            room_id: sanitizedRoomId || null,
            check_in: sanitizedCheckIn,
            check_out: sanitizedCheckOut,
            guests: sanitizedGuests,
            additional_details: sanitizedAdditionalDetails,
            status: "blocked",
            block_reason: "blacklist_hit",
            risk_score: riskScore,
            risk_flags: riskFlags,
            honeypot_value: sanitizedHoneypot,
            submit_duration_ms: submitDurationMs,
            metadata: { source: "booking_function" },
          });

          return new Response(
            JSON.stringify({ error: "Request blocked", code: "BLACKLISTED" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        const [ipTodayCount, emailTodayCount, phoneTodayCount] = await Promise.all([
          restCount(
            adminConfig.supabaseUrl,
            adminConfig.serviceRoleKey,
            `booking_abuse_events?select=id&request_ip=eq.${encodeURIComponent(clientIP)}&created_at=gte.${encodeURIComponent(dayStartIso)}`
          ),
          restCount(
            adminConfig.supabaseUrl,
            adminConfig.serviceRoleKey,
            `booking_abuse_events?select=id&request_email=eq.${encodeURIComponent(sanitizedEmail)}&created_at=gte.${encodeURIComponent(dayStartIso)}`
          ),
          restCount(
            adminConfig.supabaseUrl,
            adminConfig.serviceRoleKey,
            `booking_abuse_events?select=id&request_phone=eq.${encodeURIComponent(sanitizedPhone)}&created_at=gte.${encodeURIComponent(dayStartIso)}`
          ),
        ]);

        if (ipTodayCount >= DAILY_LIMITS.ip || emailTodayCount >= DAILY_LIMITS.email || phoneTodayCount >= DAILY_LIMITS.phone) {
          riskFlags.push("daily_limit_exceeded");
          riskScore += 80;

          await logAbuseEvent({
            request_name: sanitizedName,
            request_email: sanitizedEmail,
            request_phone: sanitizedPhone,
            request_ip: clientIP,
            user_agent: userAgent,
            room_id: sanitizedRoomId || null,
            check_in: sanitizedCheckIn,
            check_out: sanitizedCheckOut,
            guests: sanitizedGuests,
            additional_details: sanitizedAdditionalDetails,
            status: "blocked",
            block_reason: "daily_limit_exceeded",
            risk_score: riskScore,
            risk_flags: riskFlags,
            honeypot_value: sanitizedHoneypot,
            submit_duration_ms: submitDurationMs,
            metadata: {
              source: "booking_function",
              ipTodayCount,
              emailTodayCount,
              phoneTodayCount,
            },
          });

          return new Response(
            JSON.stringify({ error: "Daily booking request limit exceeded", code: "DAILY_LIMIT_EXCEEDED" }),
            {
              status: 429,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      } catch (abuseCheckError) {
        console.error("Anti-abuse storage check failed:", getErrorMessage(abuseCheckError));
      }
    }
    
    // Log only non-sensitive data
    console.log("Booking request received:", { 
      hasName: !!sanitizedName, 
      hasEmail: !!sanitizedEmail,
      checkIn: sanitizedCheckIn, 
      checkOut: sanitizedCheckOut, 
      guests: sanitizedGuests 
    });

    // Get LINE credentials from environment
    const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    const LINE_TO_USER_ID = Deno.env.get("LINE_TO_USER_ID");
    const LINE_TO_GROUP_ID = Deno.env.get("LINE_TO_GROUP_ID");

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.error("LINE credentials not configured");
      return new Response(
        JSON.stringify({ error: "LINE credentials not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!LINE_TO_USER_ID && !LINE_TO_GROUP_ID) {
      console.error("No LINE recipient configured (USER_ID or GROUP_ID)");
      return new Response(
        JSON.stringify({ error: "No LINE recipient configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch room details if roomId provided
    let roomName = '';
    let roomPrice = '';
    
    console.log('roomId from body:', roomId);
    console.log('sanitizedRoomId:', sanitizedRoomId);
    
    if (sanitizedRoomId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const roomIdEncoded = encodeURIComponent(sanitizedRoomId);
        
        const fetchUrl = `${supabaseUrl}/rest/v1/rooms?id=eq.${roomIdEncoded}&select=name_th,price,is_available`;
        console.log('Fetching room from:', fetchUrl);
        
        const roomResponse = await fetch(fetchUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        });

        console.log('Room response status:', roomResponse.status);
        
        if (roomResponse.ok) {
          const rooms = await roomResponse.json();
          console.log('Room data received:', rooms);
          
          if (rooms && rooms.length > 0) {
            roomName = rooms[0].name_th || '';
            roomPrice = rooms[0].price != null ? `${rooms[0].price} บาท/คืน` : '';
            console.log('Room name:', roomName, 'Room price:', roomPrice);

            if (rooms[0].is_available === false) {
              return new Response(
                JSON.stringify({
                  error: 'Selected room is currently unavailable',
                  code: 'ROOM_UNAVAILABLE',
                }),
                {
                  status: 409,
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                }
              );
            }
          } else {
            console.log('No room found with id:', sanitizedRoomId);
            return new Response(
              JSON.stringify({ error: 'Selected room was not found' }),
              {
                status: 404,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            );
          }
        } else {
          const errorText = await roomResponse.text();
          console.error('Room fetch error response:', errorText);
          return new Response(
            JSON.stringify({ error: 'Failed to validate room availability' }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        const unavailableUrl = `${supabaseUrl}/rest/v1/room_availability?room_id=eq.${roomIdEncoded}&is_available=eq.false&availability_date=gte.${sanitizedCheckIn}&availability_date=lt.${sanitizedCheckOut}&select=availability_date`;
        const unavailableResponse = await fetch(unavailableUrl, {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          }
        });

        if (!unavailableResponse.ok) {
          const unavailableErrorText = await unavailableResponse.text();
          console.error('Availability conflict check failed:', unavailableErrorText);
          return new Response(
            JSON.stringify({ error: 'Failed to check room conflict dates' }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        const unavailableDates = await unavailableResponse.json();
        if (Array.isArray(unavailableDates) && unavailableDates.length > 0) {
          return new Response(
            JSON.stringify({
              error: 'Selected room is unavailable for one or more dates',
              code: 'ROOM_UNAVAILABLE',
              unavailableDates: unavailableDates.map((item: { availability_date: string }) => item.availability_date),
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      } catch (err) {
        console.error('Error fetching room details:', err);
        return new Response(
          JSON.stringify({ error: "Failed to validate room before booking" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      console.log('No roomId provided in booking');
    }

    // Format message for LINE using sanitized inputs
    const lineMessage = `
🏨 การจองห้องพักใหม่

👤 ชื่อ: ${sanitizedName}
📧 อีเมล: ${sanitizedEmail}
📱 เบอร์โทร: ${sanitizedPhone}
${roomName ? `🛏️ ประเภทห้อง: ${roomName}${roomPrice ? ` (${roomPrice})` : ''}` : ''}
📅 เช็คอิน: ${sanitizedCheckIn}
📅 เช็คเอาท์: ${sanitizedCheckOut}
👥 จำนวนผู้เข้าพัก: ${sanitizedGuests} คน
${sanitizedAdditionalDetails ? `📝 รายละเอียดเพิ่มเติม: ${sanitizedAdditionalDetails}` : ''}
    `.trim();

    // Send message to LINE Messaging API (to both user and group if configured)
    const recipients = [];
    if (LINE_TO_USER_ID) recipients.push(LINE_TO_USER_ID);
    if (LINE_TO_GROUP_ID) recipients.push(LINE_TO_GROUP_ID);

    const sendPromises = recipients.map(async (recipient) => {
      const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          to: recipient,
          messages: [
            {
              type: "text",
              text: lineMessage,
            },
          ],
        }),
      });

      if (!lineResponse.ok) {
        const errorText = await lineResponse.text();
        console.error(`LINE API error for recipient:`, errorText);
        throw new Error(`Failed to send LINE message`);
      }

      return recipient;
    });

    try {
      await Promise.all(sendPromises);
      console.log("LINE message sent successfully");
    } catch (error: unknown) {
      console.error("Error sending LINE messages:", getErrorMessage(error));
      return new Response(
        JSON.stringify({ 
          error: "Failed to send LINE message"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    await logAbuseEvent({
      request_name: sanitizedName,
      request_email: sanitizedEmail,
      request_phone: sanitizedPhone,
      request_ip: clientIP,
      user_agent: userAgent,
      room_id: sanitizedRoomId || null,
      check_in: sanitizedCheckIn,
      check_out: sanitizedCheckOut,
      guests: sanitizedGuests,
      additional_details: sanitizedAdditionalDetails,
      status: "accepted",
      block_reason: null,
      risk_score: riskScore,
      risk_flags: riskFlags,
      honeypot_value: sanitizedHoneypot,
      submit_duration_ms: submitDurationMs,
      metadata: { source: "booking_function" },
    });

    if (sanitizedRoomId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseServiceRoleKey) {
        console.error('SUPABASE_SERVICE_ROLE_KEY is missing; cannot lock room dates');
        return new Response(
          JSON.stringify({ error: 'Booking sent but date lock is not configured on server' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const stayDates = getStayDates(checkInDate, checkOutDate);
      const bookedBy = `${sanitizedName} (${sanitizedPhone})`;
      const lockRows = stayDates.map((availabilityDate) => ({
        room_id: sanitizedRoomId,
        availability_date: availabilityDate,
        is_available: false,
        booked_by: bookedBy,
        notes: `Website booking (${sanitizedCheckIn} to ${sanitizedCheckOut})`,
      }));

      const lockUrl = `${supabaseUrl}/rest/v1/room_availability?on_conflict=room_id,availability_date`;
      const lockResponse = await fetch(lockUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseServiceRoleKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(lockRows),
      });

      if (!lockResponse.ok) {
        const lockErrorText = await lockResponse.text();
        console.error('Failed to lock room availability dates:', lockErrorText);
        return new Response(
          JSON.stringify({ error: 'Booking received but failed to lock room dates', code: 'ROOM_LOCK_FAILED' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Booking sent to LINE successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in booking function:", getErrorMessage(error));
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
