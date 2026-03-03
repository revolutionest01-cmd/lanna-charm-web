import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple rate limiting using in-memory store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

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

function validateName(name: string): boolean {
  // Allow only Thai and English letters and spaces
  // Must be at least 2 characters
  const cleanName = name.trim();
  const nameRegex = /^[\u0E00-\u0E7Fa-zA-Z\s]{2,100}$/;
  return nameRegex.test(cleanName);
}

function validatePhone(phone: string): boolean {
  // Allow only 10 digits
  const cleanPhone = phone.trim();
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(cleanPhone);
}

function sanitizeString(str: string, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  // Remove potentially dangerous characters and limit length
  return str
    .replace(/[<>]/g, '') // Remove HTML brackets
    .trim()
    .substring(0, maxLength);
}

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  language?: string;
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
    const contactDisabled = await isFeatureTemporarilyDisabled('contact');
    if (contactDisabled) {
      return new Response(
        JSON.stringify({ error: "Contact is temporarily disabled", code: "FEATURE_DISABLED" }),
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
    const { name, email, phone, topic, message, language = 'en' } = body as ContactRequest;
    
    if (!name || !email || !phone || !topic || !message) {
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
    const sanitizedEmail = sanitizeString(email, 255);
    const sanitizedPhone = sanitizeString(phone, 10);
    const sanitizedTopic = sanitizeString(topic, 200);
    const sanitizedMessage = sanitizeString(message, 1000);

    // Validate input formats
    if (!validateName(sanitizedName)) {
      return new Response(
        JSON.stringify({ 
          error: language === 'th' 
            ? "ชื่อควรประกอบด้วยตัวอักษร (ไทย/อังกฤษ) และเว้นวรรคเท่านั้น"
            : "Name must contain only letters (Thai/English) and spaces"
        }),
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
        JSON.stringify({ 
          error: language === 'th' 
            ? "เบอร์โทรต้องมี 10 หลักและประกอบด้วยตัวเลขเท่านั้น"
            : "Phone number must be exactly 10 digits"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (sanitizedMessage.length < 10) {
      return new Response(
        JSON.stringify({ error: "Message too short" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    // Log only non-sensitive data
    console.log("Contact form received:", { 
      hasName: !!sanitizedName, 
      topic: sanitizedTopic,
      messageLength: sanitizedMessage.length 
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

    // Format message for LINE using sanitized inputs
    const lineMessage = `
📬 ข้อความใหม่จากแบบฟอร์มติดต่อ

👤 ชื่อ: ${sanitizedName}
📧 อีเมล: ${sanitizedEmail}
📱 เบอร์โทร: ${sanitizedPhone}
📋 หัวข้อ: ${sanitizedTopic}

💬 ข้อความ:
${sanitizedMessage}
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
    } catch (error: any) {
      console.error("Error sending LINE messages:", error.message);
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

    return new Response(
      JSON.stringify({ success: true, message: "Message sent to LINE successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in contact function:", error.message);
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
