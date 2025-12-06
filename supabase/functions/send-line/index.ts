import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { name, email, phone, topic, message, language = 'th' } = await req.json();

    const LINE_CHANNEL_ID = Deno.env.get('LINE_CHANNEL_ID');
    const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET');

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
      throw new Error('LINE channel credentials are not configured');
    }

    // Compose message text
    const text = language === 'th'
      ? `ข้อความจากหน้า Contact:\nชื่อ: ${name}\nอีเมล: ${email}\nเบอร์: ${phone}\nหัวข้อ: ${topic}\nข้อความ: ${message}`
      : `Message from Contact page:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nTopic: ${topic}\nMessage: ${message}`;

    // Request channel access token via client credentials
    const tokenResp = await fetch('https://api.line.me/v2/oauth/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }).toString(),
    });

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('Failed to obtain LINE access token', err);
      throw new Error('Failed to obtain LINE access token');
    }

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error('No access_token in response', tokenData);
      throw new Error('No access token returned from LINE');
    }

    // Broadcast message to channel followers
    const sendResp = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { type: 'text', text }
        ]
      }),
    });

    if (!sendResp.ok) {
      const err = await sendResp.text();
      console.error('Failed to send LINE message', sendResp.status, err);
      throw new Error('Failed to send LINE message');
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
