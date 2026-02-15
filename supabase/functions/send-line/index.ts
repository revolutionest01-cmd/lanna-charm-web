import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function sanitize(str: string | undefined | null, maxLen = 500): string {
  if (!str) return '';
  return String(str).trim().slice(0, maxLen).replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const name = sanitize(body.name, 100);
    const email = sanitize(body.email, 255);
    const phone = sanitize(body.phone, 20);
    const topic = sanitize(body.topic, 200);
    const message = sanitize(body.message, 1000);
    const language = body.language === 'zh' ? 'zh' : body.language === 'en' ? 'en' : 'th';

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: name, email, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    const LINE_TO_USER_ID = Deno.env.get('LINE_TO_USER_ID');
    const LINE_TO_GROUP_ID = Deno.env.get('LINE_TO_GROUP_ID');

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      throw new Error('LINE credentials are not configured');
    }

    if (!LINE_TO_USER_ID && !LINE_TO_GROUP_ID) {
      throw new Error('No LINE recipients configured');
    }

    // Compose message text
    const text = language === 'th'
      ? `📩 ข้อความจากหน้า Contact:\nชื่อ: ${name}\nอีเมล: ${email}\nเบอร์: ${phone}\nหัวข้อ: ${topic}\nข้อความ: ${message}`
      : language === 'zh'
      ? `📩 来自联系页面的消息:\n姓名: ${name}\n电子邮件: ${email}\n电话: ${phone}\n主题: ${topic}\n消息: ${message}`
      : `📩 Message from Contact page:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nTopic: ${topic}\nMessage: ${message}`;

    // Send to specific recipients using push (NOT broadcast)
    const recipients = [LINE_TO_USER_ID, LINE_TO_GROUP_ID].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      const sendResp = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipientId,
          messages: [{ type: 'text', text }],
        }),
      });

      if (!sendResp.ok) {
        const err = await sendResp.text();
        console.error(`Failed to send LINE push to ${recipientId}:`, sendResp.status, err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-line function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
