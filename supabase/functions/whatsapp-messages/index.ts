import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

async function requireAdmin(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.slice('Bearer '.length);
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claims?.claims?.sub as string | undefined;

  if (claimsError || !userId) return json({ error: 'Unauthorized' }, 401);

  const { data: isAdmin, error: roleError } = await userClient.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!['GET', 'POST'].includes(req.method)) return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Supabase runtime is not configured' }, 500);
  }

  const authError = await requireAdmin(req, supabaseUrl, anonKey);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    let requestBody: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try {
        requestBody = await req.json();
      } catch {
        requestBody = {};
      }
    }

    const readValue = (key: string): unknown => requestBody[key] ?? url.searchParams.get(key);
    const page = Math.max(1, Math.floor(Number(readValue('page')) || 1));
    const limit = Math.min(100, Math.max(1, Math.floor(Number(readValue('limit')) || 50)));
    const type = String(readValue('type') || 'all');
    const rawSearch = String(readValue('search') || '');
    const search = rawSearch.replace(/[,()*]/g, '').slice(0, 100);
    const offset = (page - 1) * limit;

    const allowedTypes = new Set([
      'text',
      'image',
      'video',
      'audio',
      'document',
      'sticker',
      'location',
      'contacts',
    ]);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    let query = adminClient
      .from('whatsapp_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type !== 'all' && allowedTypes.has(type)) {
      query = query.eq('message_type', type);
    }

    if (search) {
      query = query.or(
        `text_content.ilike.%${search}%,from_name.ilike.%${search}%,from_number.ilike.%${search}%,ai_summary.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return json({
      messages: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('WhatsApp messages fetch error:', error);
    return json({ error: 'Failed to fetch messages' }, 500);
  }
});
