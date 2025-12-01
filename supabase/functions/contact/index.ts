import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, topic, message }: ContactRequest = await req.json();
    
    console.log("Received contact form submission:", { name, email, phone, topic });

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

    // Format message for LINE
    const lineMessage = `
📬 ข้อความใหม่จากแบบฟอร์มติดต่อ

👤 ชื่อ: ${name}
📧 อีเมล: ${email}
📱 เบอร์โทร: ${phone}
📋 หัวข้อ: ${topic}

💬 ข้อความ:
${message}
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
        console.error(`LINE API error for ${recipient}:`, errorText);
        throw new Error(`Failed to send to ${recipient}: ${errorText}`);
      }

      return recipient;
    });

    try {
      const sentTo = await Promise.all(sendPromises);
      console.log("LINE message sent successfully to:", sentTo);
    } catch (error: any) {
      console.error("Error sending LINE messages:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send LINE message",
          details: error.message 
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
    console.error("Error in contact function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
