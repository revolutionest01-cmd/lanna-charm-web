import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { language = 'th' } = await req.json();

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
      console.error('Error fetching business info:', businessError);
    }

    // Fetch minimum room price and count
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('price, name_th, name_en')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
    }

    // Calculate room statistics
    const roomStats = rooms && rooms.length > 0 ? {
      count: rooms.length,
      minPrice: rooms[0].price,
      maxPrice: rooms[rooms.length - 1].price,
      minRoomName: language === 'th' ? rooms[0].name_th : rooms[0].name_en
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
      console.error('Error fetching menus:', menusError);
    }

    // Prepare response data
    const responseData = {
      businessInfo: businessInfo ? {
        name: language === 'th' ? businessInfo.business_name_th : businessInfo.business_name_en,
        phone: businessInfo.phone_primary,
        phoneSecondary: businessInfo.phone_secondary,
        email: businessInfo.email,
        line: businessInfo.line_id,
        instagram: businessInfo.instagram,
        facebook: businessInfo.facebook,
        address: language === 'th' ? businessInfo.address_th : businessInfo.address_en,
        googleMaps: businessInfo.google_maps_url,
        openingHours: language === 'th' ? businessInfo.opening_hours_th : businessInfo.opening_hours_en,
      } : null,
      minRoomPrice: minRoomPrice ? {
        price: minRoomPrice.price,
        name: minRoomPrice.name,
      } : null,
      roomStats,
      recommendedMenus: menus || [],
      language,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in quick-info function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
