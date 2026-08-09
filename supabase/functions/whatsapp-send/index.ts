import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Supabase runtime is not configured' }, 500);
  }

  // Verify authorization
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.slice('Bearer '.length);
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
  if (claimsError || !claims?.claims?.sub) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { to, message, messageId: _messageId } = await req.json();
    if (!to || !message) {
      return json({ error: 'Missing recipient "to" or "message"' }, 400);
    }

    let apiResponseData = null;
    let sentViaApi = false;

    if (whatsappAccessToken && whatsappPhoneNumberId) {
      const url = `https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message },
        }),
      });

      const responseData = await res.json();
      if (!res.ok) {
        console.error('WhatsApp API error:', responseData);
        return json({ error: 'Failed to send via WhatsApp API', details: responseData }, 400);
      }
      apiResponseData = responseData;
      sentViaApi = true;
    } else {
      console.log(`[WhatsApp Simulation] Sending to ${to}: ${message}`);
      sentViaApi = false;
    }

    // Save outgoing message in whatsapp_messages table
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient.from('whatsapp_messages').insert({
      wa_message_id: `out_${Date.now()}`,
      from_number: to,
      from_name: 'Alazab AI (رد سريع)',
      message_type: 'text',
      text_content: message,
      status: 'sent',
      ai_summary: 'رد سريع مرسل من النظام',
    });

    return json({
      success: true,
      sentViaApi,
      apiResponse: apiResponseData,
      message: 'تم إرسال الرد السريع بنجاح',
    });
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
