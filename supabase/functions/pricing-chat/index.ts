import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting using in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per window
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

function sanitizeString(str: string, maxLength: number = 500): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, maxLength);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    const rawMessage = body.message;
    const language = body.language || 'th';

    // Validate inputs
    if (!rawMessage || typeof rawMessage !== 'string') {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const message = sanitizeString(rawMessage, 500);
    const sanitizedLanguage = ['th', 'en', 'zh'].includes(language) ? language : 'th';

    if (message.length < 2) {
      return new Response(
        JSON.stringify({ error: "Message too short" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Chat request received:', { messageLength: message.length, language: sanitizedLanguage });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Detect intent from message
    const messageLower = message.toLowerCase();
    let context = '';
    let intent = 'general';

    // Check for room-related queries
    if (messageLower.includes('ห้องพัก') || messageLower.includes('room') || 
        messageLower.includes('ที่พัก') || messageLower.includes('accommodation')) {
      intent = 'room';
      const { data: rooms } = await supabase
        .from('rooms')
        .select('name_th, name_en, description_th, description_en, price')
        .eq('is_active', true)
        .order('sort_order');
      
      if (rooms && rooms.length > 0) {
        context = `ข้อมูลห้องพัก:\n${rooms.map(r => 
          `- ${sanitizedLanguage === 'th' ? r.name_th : r.name_en}: ${r.price} บาท/คืน\n  ${sanitizedLanguage === 'th' ? r.description_th : r.description_en}`
        ).join('\n')}`;
      }
    }
    // Check for event space queries
    else if (messageLower.includes('ห้องประชุม') || messageLower.includes('meeting') || 
             messageLower.includes('งานเลี้ยง') || messageLower.includes('event') ||
             messageLower.includes('conference')) {
      intent = 'event';
      const { data: events } = await supabase
        .from('event_spaces')
        .select('title_th, title_en, description_th, description_en')
        .eq('is_active', true);
      
      if (events && events.length > 0) {
        context = `ข้อมูลห้องประชุม & งานเลี้ยง:\n${events.map(e => 
          `- ${sanitizedLanguage === 'th' ? e.title_th : e.title_en}\n  ${sanitizedLanguage === 'th' ? e.description_th : e.description_en}`
        ).join('\n')}`;
      }
    }
    // Check for menu queries
    else if (messageLower.includes('อาหาร') || messageLower.includes('food') || 
             messageLower.includes('เครื่องดื่ม') || messageLower.includes('drink') ||
             messageLower.includes('เมนู') || messageLower.includes('menu') ||
             messageLower.includes('กาแฟ') || messageLower.includes('coffee')) {
      intent = 'menu';
      const { data: menus } = await supabase
        .from('menus')
        .select(`
          name_th,
          name_en,
          description_th,
          description_en,
          price,
          menu_categories(name_th, name_en)
        `)
        .eq('is_active', true)
        .order('sort_order');
      
      if (menus && menus.length > 0) {
        context = `ข้อมูลเมนูอาหารและเครื่องดื่ม:\n${menus.map(m => {
          const category = Array.isArray(m.menu_categories) ? m.menu_categories[0] : m.menu_categories;
          const categoryName = category ? (sanitizedLanguage === 'th' ? category.name_th : category.name_en) : 'ทั่วไป';
          return `- ${sanitizedLanguage === 'th' ? m.name_th : m.name_en} (${categoryName}): ${m.price} บาท${m.description_th || m.description_en ? '\n  ' + (sanitizedLanguage === 'th' ? m.description_th : m.description_en) : ''}`;
        }).join('\n')}`;
      }
    }

    // If no specific intent detected, provide general info
    if (!context) {
      context = 'ไม่พบข้อมูลที่เกี่ยวข้องกับคำถาม กรุณาระบุว่าต้องการถามเกี่ยวกับ ห้องพัก, ห้องประชุม/งานเลี้ยง หรือ อาหาร/เครื่องดื่ม';
      intent = 'unsupported';
    }

    console.log('Intent detected:', intent);

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = sanitizedLanguage === 'th' 
      ? `คุณเป็นผู้ช่วยตอบคำถามเกี่ยวกับราคาห้องพัก ห้องประชุม/งานเลี้ยง และเมนูอาหาร/เครื่องดื่มของ Plern Ping Cafe & Resort

กฎการตอบ:
1. ตอบเป็นภาษาไทยที่สุภาพและเป็นมิตร
2. ใช้ข้อมูลจาก context ที่ให้ไปเท่านั้น ห้ามสร้างข้อมูลเอง
3. ถ้าไม่มีข้อมูล หรือคำถามไม่เกี่ยวกับราคา ให้แนะนำให้ติดต่อเจ้าหน้าที่โดยกดปุ่ม "ติดต่อเรา"
4. แสดงราคาชัดเจน พร้อมหน่วยเงิน (บาท)
5. ตอบสั้น กระชับ เข้าใจง่าย

${context}`
      : `You are a helpful assistant for Plern Ping Cafe & Resort, answering questions about room prices, meeting/event space prices, and food/beverage menu prices.

Rules:
1. Answer in English politely and friendly
2. Use only the information from the provided context, do not make up information
3. If no data available or question is not about pricing, suggest contacting staff via "Contact Us" button
4. Show prices clearly with currency (Baht)
5. Keep answers short, clear, and easy to understand

${context}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ reply, intent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pricing-chat:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred',
        reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่ค่ะ'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
