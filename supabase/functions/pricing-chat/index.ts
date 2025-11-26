import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language = 'th' } = await req.json();
    console.log('Received message:', message, 'Language:', language);

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
          `- ${language === 'th' ? r.name_th : r.name_en}: ${r.price} บาท/คืน\n  ${language === 'th' ? r.description_th : r.description_en}`
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
          `- ${language === 'th' ? e.title_th : e.title_en}\n  ${language === 'th' ? e.description_th : e.description_en}`
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
          const categoryName = category ? (language === 'th' ? category.name_th : category.name_en) : 'ทั่วไป';
          return `- ${language === 'th' ? m.name_th : m.name_en} (${categoryName}): ${m.price} บาท${m.description_th || m.description_en ? '\n  ' + (language === 'th' ? m.description_th : m.description_en) : ''}`;
        }).join('\n')}`;
      }
    }

    // If no specific intent detected, provide general info
    if (!context) {
      context = 'ไม่พบข้อมูลที่เกี่ยวข้องกับคำถาม กรุณาระบุว่าต้องการถามเกี่ยวกับ ห้องพัก, ห้องประชุม/งานเลี้ยง หรือ อาหาร/เครื่องดื่ม';
      intent = 'unsupported';
    }

    console.log('Intent:', intent, 'Context length:', context.length);

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = language === 'th' 
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

    console.log('AI Response:', reply);

    return new Response(
      JSON.stringify({ reply, intent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pricing-chat:', error);
    const { language: errorLang = 'th' } = await req.json().catch(() => ({ language: 'th' }));
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        reply: errorLang === 'th' 
          ? 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่ค่ะ'
          : 'Sorry, an error occurred. Please try again or contact our staff.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});