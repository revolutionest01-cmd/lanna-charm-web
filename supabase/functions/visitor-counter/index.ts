import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    // Rate limiting check
    if (isRateLimited(clientIP)) {
      console.log(`Rate limited request from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json().catch(() => ({ action: 'get' }));

    if (action === 'increment') {
      // Increment visitor count
      const { data: currentData, error: fetchError } = await supabase
        .from('visitor_stats')
        .select('*')
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Error fetching visitor stats:', fetchError);
        throw fetchError;
      }

      const newCount = (currentData?.total_visits || 5000) + 1;
      
      const { data, error } = await supabase
        .from('visitor_stats')
        .update({ 
          total_visits: newCount,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating visitor count:', error);
        throw error;
      }

      console.log(`Visitor count incremented to: ${newCount}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          total_visits: data.total_visits 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Get current count
      const { data, error } = await supabase
        .from('visitor_stats')
        .select('total_visits')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching visitor count:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          total_visits: data?.total_visits || 5000 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Visitor counter error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
