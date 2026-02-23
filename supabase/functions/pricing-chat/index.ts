import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
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

    // **COMPREHENSIVE KEYWORD DETECTION SYSTEM**
    // Track user keywords for learning and optimization
    const userKeywords = {
      // Rooms & Accommodation
      rooms: ['ห้องพัก', 'ที่พัก', 'ห้องนอน', 'room', 'accommodation', 'พัก'],
      pricing: ['ราคา', 'เท่าไหร่', 'ราคาเท่าไร', 'บาท', 'price', 'cost', 'ค่า'],
      parking: ['จอดรถ', 'ที่จอดรถ', 'parking', 'park', 'ที่จอด'],
      menu: ['เมนู', 'อาหาร', 'กิน', 'ของรับประทาน', 'menu', 'food', 'dish'],
      coffee: ['กาแฟ', 'coffee', 'คอฟฟี่', 'ชา', 'เครื่องดื่ม', 'drink', 'beverage'],
      recommended: ['แนะนำ', 'ยอดนิยม', 'ดี', 'ดีที่สุด', 'recommend', 'best', 'popular', 'suggest'],
      event: ['ห้องประชุม', 'จัดงาน', 'งานแต่งงาน', 'event', 'meeting', 'conference', 'wedding', 'party'],
    };

    // Extract keywords from message
    const messageLower = message.toLowerCase();
    const detectedCategories: string[] = [];
    let hasRoomKeyword = false, hasPricingKeyword = false, hasParkingKeyword = false;
    let hasMenuKeyword = false, hasRecommendedKeyword = false;

    Object.entries(userKeywords).forEach(([category, keywords]) => {
      if (keywords.some(kw => messageLower.includes(kw))) {
        detectedCategories.push(category);
        if (category === 'rooms') hasRoomKeyword = true;
        if (category === 'pricing') hasPricingKeyword = true;
        if (category === 'parking') hasParkingKeyword = true;
        if (category === 'menu' || category === 'coffee') hasMenuKeyword = true;
        if (category === 'recommended') hasRecommendedKeyword = true;
      }
    });

    // Log detected keywords for AI learning/analytics
    if (detectedCategories.length > 0) {
      console.log('Detected categories:', detectedCategories.join(', '));
    }

    // Always fetch ALL relevant data
    let contexts: string[] = [];
    let intent = 'general';

    // Always fetch all relevant data to provide comprehensive answers
    let allContext = '';

    // Fetch rooms data
    const { data: rooms } = await supabase
      .from('rooms')
      .select('name_th, name_en, description_th, description_en, price, capacity, amenities_th, amenities_en')
      .eq('is_active', true)
      .order('sort_order');

    // Fetch event spaces data
    const { data: events } = await supabase
      .from('event_spaces')
      .select('title_th, title_en, description_th, description_en, image_url')
      .eq('is_active', true);

    // **ALWAYS Fetch menus data** - critical for menu name matching
    const { data: menus } = await supabase
      .from('menus')
      .select(`
        name_th,
        name_en,
        description_th,
        description_en,
        price,
        is_recommended,
        menu_categories(name_th, name_en)
      `)
      .eq('is_active', true)
      .order('sort_order');

    // Fetch reviews for recommendations
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, customer_name, review_text_th, review_text_en')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    // **Helper function for fuzzy matching menu names**
    const findMatchingMenus = (query: string): typeof menus => {
      if (!menus) return [];
      const queryLower = query.toLowerCase();
      
      return menus.filter(m => {
        const nameTh = m.name_th.toLowerCase();
        const nameEn = m.name_en.toLowerCase();
        
        // Direct substring match
        if (nameTh.includes(queryLower) || nameEn.includes(queryLower)) return true;
        
        // Reverse: check if query contains menu name
        if (queryLower.includes(nameTh.substring(0, 4)) || 
            queryLower.includes(nameEn.substring(0, 4).toLowerCase())) return true;
        
        // Check individual words
        const queryWords = queryLower.split(' ');
        const menuWords = [...nameTh.split(' '), ...nameEn.toLowerCase().split(' ')];
        return queryWords.some(word => menuWords.some(mw => mw.includes(word) || word.length > 2));
      });
    };

    // Build context based on detected categories and intent
    // **IMPORTANT**: Only include data if it actually exists in the database
    const menuMatches = findMatchingMenus(message);
    
    if (menuMatches.length > 0) {
      // Found matching menu items - show them prominently
      intent = 'menu';
      contexts.push(`🍽️ เมนูที่ตรงกับคำถาม:\n${menuMatches.map(m => {
        let menuInfo = `- ${sanitizedLanguage === 'th' ? m.name_th : m.name_en}: ${m.price} บาท${m.is_recommended ? ' ⭐' : ''}`;
        if (m.description_th || m.description_en) {
          menuInfo += `\n  📝 ${sanitizedLanguage === 'th' ? m.description_th : m.description_en}`;
        }
        return menuInfo;
      }).join('\n')}`);
    } else if (hasRoomKeyword || (detectedCategories.includes('pricing') && messageLower.includes('ห้อง'))) {
      // Room-related queries - ONLY include if data exists
      intent = 'room';
      if (rooms && rooms.length > 0) {
        const roomInfo = rooms.map(r => {
          let info = `- ${sanitizedLanguage === 'th' ? r.name_th : r.name_en}: 💰 ${r.price} บาท/คืน`;
          if (r.description_th || r.description_en) {
            info += `\n  📍 ${sanitizedLanguage === 'th' ? r.description_th : r.description_en}`;
          }
          if (r.capacity) {
            info += `\n  👥 ความจุ: ${r.capacity} คน`;
          }
          if (r.amenities_th || r.amenities_en) {
            const amenities = sanitizedLanguage === 'th' ? r.amenities_th : r.amenities_en;
            info += `\n  ✨ ${amenities}`;
          }
          return info;
        }).join('\n\n');
        contexts.push(`📋 ข้อมูลห้องพักอย่างละเอียด:\n${roomInfo}`);
        
        // Add price summary for easy reference
        const priceList = rooms.map(r => `• ${sanitizedLanguage === 'th' ? r.name_th : r.name_en}: ${r.price} บาท/คืน`).join('\n');
        contexts.push(`💳 สรุปราคาห้องพัก:\n${priceList}`);
      } else {
        // No rooms found - add note to AI
        contexts.push(`⚠️ ไม่มีข้อมูลห้องพักในระบบ - ให้ตอบสุภาพว่าไม่สามารถแสดงข้อมูล สามารถติดต่อเจ้าหน้าที่ได้`);
      }
      
      // Add parking info if asked
      if (hasParkingKeyword && rooms && rooms.length > 0) {
        const parkingAmenities = rooms
          .filter(r => r.amenities_th?.toLowerCase().includes('จอด') || r.amenities_en?.toLowerCase().includes('park'))
          .map(r => `- ${sanitizedLanguage === 'th' ? r.name_th : r.name_en}: ${sanitizedLanguage === 'th' ? r.amenities_th : r.amenities_en}`)
          .join('\n');
        if (parkingAmenities) {
          contexts.push(`🚗 ที่จอดรถ:\n${parkingAmenities}`);
        }
      }
    } else if (messageLower.includes('ห้องประชุม') || messageLower.includes('meeting') || 
        messageLower.includes('งานเลี้ยง') || messageLower.includes('event') ||
        messageLower.includes('conference') || messageLower.includes('wedding')) {
      // Event/meeting space query - ONLY show if data exists
      intent = 'event';
      if (events && events.length > 0) {
        contexts.push(`ข้อมูลห้องประชุม & งานเลี้ยง:\n${events.map(e => 
          `- ${sanitizedLanguage === 'th' ? e.title_th : e.title_en}\n  ${sanitizedLanguage === 'th' ? e.description_th : e.description_en}`
        ).join('\n')}`);
      } else {
        // No event spaces found - add note to AI
        contexts.push(`⚠️ ไม่มีข้อมูลห้องประชุมหรือบริการจัดงานในระบบ - ให้ตอบสุภาพว่าไม่สามารถแสดงข้อมูล สามารถติดต่อเจ้าหน้าที่ได้`);
      }
    } else if (hasMenuKeyword) {
      // Menu-related queries (including coffee) - ONLY show if data exists
      intent = 'menu';
      if (menus && menus.length > 0) {
        const menusByCategory: { [key: string]: typeof menus } = {};
        menus.forEach(m => {
          const category = Array.isArray(m.menu_categories) ? m.menu_categories[0]?.name_th : (m.menu_categories as any)?.name_th;
          const categoryName = category || 'ทั่วไป';
          if (!menusByCategory[categoryName]) {
            menusByCategory[categoryName] = [];
          }
          menusByCategory[categoryName].push(m);
        });

        contexts.push(`ข้อมูลเมนูอาหารและเครื่องดื่ม:\n${Object.entries(menusByCategory).map(([category, items]) => {
          return `${category}:\n${items.map(m => 
            `  - ${sanitizedLanguage === 'th' ? m.name_th : m.name_en}: ${m.price} บาท${m.is_recommended ? ' ⭐' : ''}`
          ).join('\n')}`;
        }).join('\n')}`);

        // Add recommended items section if asked
        if (hasRecommendedKeyword) {
          const recommendedMenus = menus.filter(m => m.is_recommended);
          if (recommendedMenus.length > 0) {
            contexts.push(`⭐ เมนูแนะนำ:\n${recommendedMenus.map(m => 
              `- ${sanitizedLanguage === 'th' ? m.name_th : m.name_en}: ${m.price} บาท (${Array.isArray(m.menu_categories) ? m.menu_categories[0]?.name_th : (m.menu_categories as any)?.name_th})`
            ).join('\n')}`);
          }
        }
      } else {
        // No menus found - add note to AI
        contexts.push(`⚠️ ไม่มีข้อมูลเมนูในระบบ - ให้ตอบสุภาพว่าไม่สามารถแสดงข้อมูล สามารถติดต่อเจ้าหน้าที่ได้`);
      }
    }

    // **SMART FALLBACK**: Only include if no specific keyword matched
    if (contexts.length === 0 || (contexts.length === 1 && contexts[0]?.startsWith('⚠️'))) {
      // No specific match found - provide general info only
      const hasAnyData = (menus && menus.length > 0) || (rooms && rooms.length > 0) || (events && events.length > 0);
      
      if (hasAnyData) {
        if (menus && menus.length > 0) {
          const recommendedMenus = menus.filter(m => m.is_recommended);
          if (recommendedMenus.length > 0) {
            contexts.push(`⭐ เมนูแนะนำ:\n${recommendedMenus.map(m => 
              `  - ${sanitizedLanguage === 'th' ? m.name_th : m.name_en}: ${m.price} บาท`
            ).join('\n')}`);
          }
        }
        if (rooms && rooms.length > 0) {
          contexts.push(`🛏️ ห้องพัก: ${rooms.map(r => `${sanitizedLanguage === 'th' ? r.name_th : r.name_en} (${r.price} บาท/คืน)`).join(', ')}`);
        }
        if (events && events.length > 0) {
          contexts.push(`🎪 บริการจัดงาน: ${events.map(e => sanitizedLanguage === 'th' ? e.title_th : e.title_en).join(', ')}`);
        }
        intent = 'general';
      } else {
        // No data at all in database
        contexts.push(`⚠️ ขณะนี้ยังไม่มีข้อมูลในระบบ - ให้ตอบสุภาพและแนะนำให้ติดต่อเจ้าหน้าที่`);
        intent = 'no_data';
      }
    }

    if (reviews && reviews.length > 0) {
      contexts.push(`ความพึงพอใจจากลูกค้า: ⭐ ${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}/5`);
    }

    const context = contexts.join('\n\n');

    console.log('Intent detected:', intent);

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = sanitizedLanguage === 'th' 
      ? `คุณเป็น Plernping AI - ผู้ช่วยตอบคำถามของ Plern Ping Cafe & Resort

🎯 หน้าที่หลัก:
1. ค้นหาข้อมูลจาก Database ตามคำที่ลูกค้าถาม ก่อนตอบ
2. ตอบเฉพาะข้อมูลที่จริง ๆ มีอยู่ใน Database
3. ถ้าหาไม่เจอ ให้ตอบสุภาพและแนะนำติดต่อเจ้าหน้าที่

📋 กฎการตอบ:
✓ **ค้นหาก่อนตอบ**: ถ้าถามห้องพัก → ดูว่า Database มีห้องพักหรือไม่
✓ ถ้ามีข้อมูล → แสดงข้อมูลทั้งหมด พร้อมราคา / รายละเอียด
✓ ถ้าหาไม่เจอ → ตอบแบบนี้: "ขออภัยค่ะ, ขณะนี้ไม่มีข้อมูล [อะไร] ในระบบ กรุณาติดต่อเจ้าหน้าที่ได้"
✓ ตอบเป็นภาษาไทยสุภาพและเป็นมิตร
✓ ไม่สร้างข้อมูลที่ไม่มี - บอกความจริง

⚠️ สำคัญ:
• ลูกค้าถามห้องพัก แต่ Database ว่างเปล่า → ตอบสุภาพ ไม่ได้ตอบข้อมูลที่ไม่มี
• ลูกค้าถามห้องประชุม แต่ไม่มี → ตอบสุภาพ แนะนำติดต่อให้
• ลูกค้าถามเมนู แต่ Database ว่าง → ตอบสุภาพ ไม่บอกเมนูที่ไม่มี

🌟 ตัวอย่างการตอบ:
Q: มีห้องพักไหม?
A (ถ้ามีข้อมูล): มีครับ/ ค่ะ! ห้องพัก... [ขอมูลจริง]
A (ถ้าไม่มีข้อมูล): ขออภัยค่ะ, ขณะนี้ไม่มีข้อมูลห้องพักในระบบ กรุณาติดต่อเจ้าหน้าที่ได้

\`\`\`
${context}
\`\`\``
      : `You are Plernping AI - your mission is to help with Plern Ping Cafe & Resort inquiries

🎯 Your Role:
1. Search the Database for information about what customer asks - BEFORE answering
2. Only provide information that actually exists in the Database
3. If no data found, answer politely and suggest contacting staff

📋 Rules:
✓ **Search first, then answer**: If asking about rooms → check if Database has rooms
✓ If data exists → show all information with prices and details
✓ If not found → answer politely: "Sorry, we don't have [something] information. Please contact our staff."
✓ Answer in English, polite and friendly
✓ Don't make up information - always tell the truth

⚠️ Important:
• Customer asks for rooms but Database is empty → Answer politely, don't show fake data
• Customer asks for meeting rooms but no data → Answer politely, suggest contact
• Customer asks for menu but Database is empty → Answer politely, don't show fake menu

🌟 Example Answers:
Q: Do you have rooms?
A (if data exists): Yes! We have... [actual data]
A (if no data): Sorry, we don't have room information available right now. Please contact our staff.

\`\`\`
${context}
\`\`\``;

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
