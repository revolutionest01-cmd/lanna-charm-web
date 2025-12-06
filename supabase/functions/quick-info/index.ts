import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting using in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // Max requests per window
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

serve(async (req) => {
  // Handle CORS preflight requests
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

    const body = await req.json().catch(() => ({}));
    const language = body.language;
    
    // Validate language input
    const sanitizedLanguage = ['th', 'en', 'zh'].includes(language) ? language : 'th';

    console.log('Quick info request received:', { language: sanitizedLanguage });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch business info
    const { data: businessInfo, error: businessError } = await supabase
      .from('business_info')
      .select('*')
      .eq('is_active', true)
      .single();

    if (businessError) {
      console.error('Error fetching business info:', businessError.message);
    }

    // Fetch minimum room price and count
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('price, name_th, name_en')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError.message);
    }

    // Calculate room statistics
    const roomStats = rooms && rooms.length > 0 ? {
      count: rooms.length,
      minPrice: rooms[0].price,
      maxPrice: rooms[rooms.length - 1].price,
      minRoomName: sanitizedLanguage === 'th' ? rooms[0].name_th : rooms[0].name_en
    } : null;

    const minRoomPrice = roomStats ? {
      price: roomStats.minPrice,
      name: roomStats.minRoomName
    } : null;

    // Fetch recommended menus (top 3)
    const { data: menus, error: menusError } = await supabase
      .from('menus')
      .select('name_th, name_en, price, image_url')
      .eq('is_active', true)
      .eq('is_recommended', true)
      .order('sort_order', { ascending: true })
      .limit(3);

    if (menusError) {
      console.error('Error fetching menus:', menusError.message);
    }

    // Prepare response data
    const responseData = {
      businessInfo: businessInfo ? {
        name: sanitizedLanguage === 'th' ? businessInfo.business_name_th : businessInfo.business_name_en,
        phone: businessInfo.phone_primary,
        phoneSecondary: businessInfo.phone_secondary,
        email: businessInfo.email,
        line: businessInfo.line_id,
        instagram: businessInfo.instagram,
        facebook: businessInfo.facebook,
        address: sanitizedLanguage === 'th' ? businessInfo.address_th : businessInfo.address_en,
        googleMaps: businessInfo.google_maps_url,
        openingHours: sanitizedLanguage === 'th' ? businessInfo.opening_hours_th : businessInfo.opening_hours_en,
      } : null,
      minRoomPrice: minRoomPrice ? {
        price: minRoomPrice.price,
        name: minRoomPrice.name,
      } : null,
      roomStats,
      recommendedMenus: menus || [],
      language: sanitizedLanguage,
    };

    console.log('Quick info response sent successfully');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in quick-info function:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
