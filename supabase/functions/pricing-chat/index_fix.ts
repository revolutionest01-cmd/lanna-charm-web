import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const rawMessage = body.message;
    const language = body.language || 'th';

    if (!rawMessage || typeof rawMessage !== 'string' || rawMessage.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid message" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message = rawMessage.trim();
    const sanitizedLanguage = ['th', 'en', 'zh', 'ja'].includes(language) ? language : 'th';

    console.log('Chat request:', { messageLength: message.length, language: sanitizedLanguage });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch data
    const { data: rooms } = await supabase
      .from('rooms')
      .select('name_th, name_en, description_th, description_en, price, capacity')
      .eq('is_active', true);

    const { data: menus } = await supabase
      .from('menus')
      .select('name_th, name_en, description_th, description_en, price, is_recommended')
      .eq('is_active', true);

    // Build context
    let contextInfo = 'Available Information:\n';
    if (rooms && rooms.length > 0) {
      contextInfo += '\nRooms:\n';
      rooms.forEach(r => {
        contextInfo += `- ${sanitizedLanguage === 'th' ? r.name_th : r.name_en}: ${r.price} Baht/night\n`;
      });
    }
    if (menus && menus.length > 0) {
      contextInfo += '\nMenus:\n';
      menus.forEach(m => {
        const rec = m.is_recommended ? ' ⭐' : '';
        contextInfo += `- ${sanitizedLanguage === 'th' ? m.name_th : m.name_en}: ${m.price} Baht${rec}\n`;
      });
    }

    // Simple system prompt
    let systemPrompt = 'You are a helpful assistant for Plern Ping Cafe. Answer questions briefly and use only the information provided.\n\n' + contextInfo;
    if (sanitizedLanguage === 'th') {
      systemPrompt = 'คุณเป็นผู้ช่วยของ Plern Ping Cafe ตอบคำถามสั้นๆและใช้เฉพาะข้อมูลที่ให้มาเท่านั้น\n\n' + contextInfo;
    }

    console.log('Calling API with prompt length:', systemPrompt.length);

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
      console.error('API error:', aiResponse.status, errorText);
      throw new Error(`API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || 'Unable to generate response';

    return new Response(
      JSON.stringify({ reply, intent: 'answer' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ 
        error: 'Service error',
        details: error instanceof Error ? error.message : 'Unknown'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
