import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

// Simple rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60 * 1000;

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
  return str.replace(/[<>]/g, '').trim().substring(0, maxLength);
}

// Hash IP for privacy
function hashIP(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown';
    
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const rawMessage = body.message;
    const language = body.language || 'th';
    const sessionId = body.sessionId || 'unknown';
    const conversationHistory = body.conversationHistory || [];

    if (!rawMessage || typeof rawMessage !== 'string') {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = sanitizeString(rawMessage, 500);
    const sanitizedLanguage = ['th', 'en', 'zh', 'ja'].includes(language) ? language : 'th';

    if (message.length < 2) {
      return new Response(
        JSON.stringify({ error: "Message too short" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Chat request:', { messageLength: message.length, language: sanitizedLanguage, sessionId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: chatbotToggle } = await supabase
      .from('feature_toggles')
      .select('is_enabled')
      .eq('feature_key', 'ai_chatbot')
      .maybeSingle();

    if (chatbotToggle?.is_enabled === false) {
      return new Response(
        JSON.stringify({ error: 'AI chatbot is temporarily disabled', code: 'FEATURE_DISABLED' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ═══════════════════════════════════════════════
    // FETCH ALL DATABASE CONTEXT COMPREHENSIVELY
    // ═══════════════════════════════════════════════

    const [roomsRes, eventsRes, menusRes, reviewsRes, businessRes] = await Promise.all([
      supabase.from('rooms').select('name_th, name_en, description_th, description_en, price, capacity, amenities_th, amenities_en, is_available').eq('is_active', true).order('sort_order'),
      supabase.from('event_spaces').select('title_th, title_en, description_th, description_en, keywords_th, keywords_en').eq('is_active', true),
      supabase.from('menus').select('name_th, name_en, description_th, description_en, price, is_recommended, menu_categories(name_th, name_en)').eq('is_active', true).order('sort_order'),
      supabase.from('reviews').select('rating, customer_name, review_text_th, review_text_en').eq('is_active', true).order('created_at', { ascending: false }).limit(10),
      supabase.from('business_info').select('*').eq('is_active', true).limit(1).single(),
    ]);

    const rooms = roomsRes.data || [];
    const events = eventsRes.data || [];
    const menus = menusRes.data || [];
    const reviews = reviewsRes.data || [];
    const business = businessRes.data;

    // ═══════════════════════════════════════════════
    // BUILD COMPREHENSIVE CONTEXT
    // ═══════════════════════════════════════════════

    const isLangTh = sanitizedLanguage === 'th';

    let context = '';

    // Business Info
    if (business) {
      context += `📍 ข้อมูลธุรกิจ:\n`;
      context += `ชื่อ: ${isLangTh ? business.business_name_th : business.business_name_en}\n`;
      context += `โทร: ${business.phone_primary}${business.phone_secondary ? `, ${business.phone_secondary}` : ''}\n`;
      if (business.email) context += `อีเมล: ${business.email}\n`;
      if (business.line_id) context += `LINE: ${business.line_id}\n`;
      if (business.address_th || business.address_en) context += `ที่อยู่: ${isLangTh ? business.address_th : business.address_en}\n`;
      if (business.opening_hours_th || business.opening_hours_en) context += `เวลาเปิด: ${isLangTh ? business.opening_hours_th : business.opening_hours_en}\n`;
      if (business.facebook) context += `Facebook: ${business.facebook}\n`;
      if (business.google_maps_url) context += `Google Maps: ${business.google_maps_url}\n`;
      context += '\n';
    }

    // Rooms
    if (rooms.length > 0) {
      context += `🛏️ ห้องพัก (${rooms.length} ห้อง):\n`;
      rooms.forEach(r => {
        const name = isLangTh ? r.name_th : r.name_en;
        const desc = isLangTh ? r.description_th : r.description_en;
        const amenities = isLangTh ? r.amenities_th : r.amenities_en;
        const status = r.is_available ? '✅ ว่าง' : '❌ ไม่ว่าง';
        context += `- ${name}: ${r.price} บาท/คืน [${status}]`;
        if (r.capacity) context += ` | ความจุ: ${r.capacity}`;
        if (desc) context += `\n  ${desc}`;
        if (amenities) context += `\n  สิ่งอำนวยความสะดวก: ${amenities}`;
        context += '\n';
      });
      context += '\n';
    }

    // Menus by category
    if (menus.length > 0) {
      const menusByCategory: Record<string, typeof menus> = {};
      menus.forEach(m => {
        const cat = (m.menu_categories as any)?.name_th || 'ทั่วไป';
        if (!menusByCategory[cat]) menusByCategory[cat] = [];
        menusByCategory[cat].push(m);
      });

      context += `🍽️ เมนูอาหารและเครื่องดื่ม (${menus.length} รายการ):\n`;
      Object.entries(menusByCategory).forEach(([cat, items]) => {
        context += `  [${cat}]\n`;
        items.forEach(m => {
          const name = isLangTh ? m.name_th : m.name_en;
          const desc = isLangTh ? m.description_th : m.description_en;
          context += `  - ${name}: ${m.price} บาท${m.is_recommended ? ' ⭐แนะนำ' : ''}`;
          if (desc) context += ` (${desc})`;
          context += '\n';
        });
      });

      const recommended = menus.filter(m => m.is_recommended);
      if (recommended.length > 0) {
        context += `\n⭐ เมนูแนะนำพิเศษ: ${recommended.map(m => `${isLangTh ? m.name_th : m.name_en} (${m.price}฿)`).join(', ')}\n`;
      }
      context += '\n';
    }

    // Events
    if (events.length > 0) {
      context += `🎪 บริการจัดงาน:\n`;
      events.forEach(e => {
        const title = isLangTh ? e.title_th : e.title_en;
        const desc = isLangTh ? e.description_th : e.description_en;
        const keywords = isLangTh ? e.keywords_th : e.keywords_en;
        context += `- ${title}`;
        if (desc) context += `: ${desc}`;
        if (keywords) context += ` (${keywords})`;
        context += '\n';
      });
      context += '\n';
    }

    // Reviews summary
    if (reviews.length > 0) {
      const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
      context += `⭐ รีวิวจากลูกค้า: คะแนนเฉลี่ย ${avgRating}/5 (${reviews.length} รีวิวล่าสุด)\n`;
      reviews.slice(0, 3).forEach(r => {
        const text = isLangTh ? r.review_text_th : r.review_text_en;
        context += `  - ${r.customer_name} (${r.rating}⭐): "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"\n`;
      });
    }

    // ═══════════════════════════════════════════════
    // CALL AI WITH CONVERSATION HISTORY
    // ═══════════════════════════════════════════════

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const langMap: Record<string, string> = {
      th: 'ตอบเป็นภาษาไทยสุภาพและเป็นมิตร',
      en: 'Reply in English, polite and friendly',
      zh: '用中文回复，礼貌友好',
      ja: '日本語で丁寧に回答してください',
    };
    const langInstruction: string = langMap[sanitizedLanguage] || 'ตอบเป็นภาษาไทย';

    const systemPrompt = `คุณเป็น "Plernping AI" - ผู้ช่วยอัจฉริยะของ Plern Ping Cafe & Resort

🎯 หน้าที่:
- ตอบคำถามเกี่ยวกับห้องพัก ราคา เมนูอาหาร เครื่องดื่ม บริการจัดงาน ที่จอดรถ ข้อมูลติดต่อ เวลาทำการ ฯลฯ
- แนะนำเมนูและห้องพักตามความต้องการของลูกค้า
- ให้ข้อมูลที่ถูกต้องจาก DATABASE เท่านั้น ห้ามสร้างข้อมูลเอง

📋 กฎการตอบ:
✓ ${langInstruction}
✓ ตอบกระชับได้ใจความ (2-4 บรรทัด) แต่ครบถ้วน
✓ ถ้าถามราคา → แจ้งราคาจริงจาก DB พร้อมรายละเอียด
✓ ถ้าถามห้องพัก → แจ้งสถานะว่าง/ไม่ว่าง ราคา ความจุ สิ่งอำนวยความสะดวก
✓ ถ้าถามเมนู → แนะนำพร้อมราคาและคำอธิบาย เน้นเมนูแนะนำ (⭐)
✓ ถ้าถามข้อมูลติดต่อ → ให้เบอร์โทร LINE อีเมล ที่อยู่
✓ ถ้าถามเรื่องนอกเหนือ → แนะนำให้ติดต่อเจ้าหน้าที่พร้อมเบอร์โทร
✓ จำบทสนทนาก่อนหน้าเพื่อตอบต่อเนื่อง
✓ ใช้ Emoji อย่างเหมาะสมเพื่อความน่าอ่าน

═══════════ ข้อมูลจาก DATABASE ═══════════
${context}
═══════════════════════════════════════════`;

    // Build messages with conversation history (limit to last 10 messages)
    const historyMessages = conversationHistory
      .slice(-10)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: sanitizeString(msg.content, 300),
      }));

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", reply: "ขออภัยค่ะ ระบบกำลังรับคำถามจำนวนมาก กรุณาลองใหม่ในอีกสักครู่ค่ะ" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", reply: "ขออภัยค่ะ ระบบชั่วคราวไม่พร้อมให้บริการ กรุณาติดต่อเจ้าหน้าที่โดยตรงค่ะ" }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    // ═══════════════════════════════════════════════
    // SAVE CONVERSATION LOG
    // ═══════════════════════════════════════════════
    try {
      await supabase.from('chat_logs').insert({
        session_id: sessionId,
        user_message: message,
        ai_reply: reply,
        intent: 'auto',
        language: sanitizedLanguage,
        ip_hash: hashIP(clientIP),
      });
    } catch (logError) {
      console.error('Error saving chat log:', logError);
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pricing-chat:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred',
        reply: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่ค่ะ'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
