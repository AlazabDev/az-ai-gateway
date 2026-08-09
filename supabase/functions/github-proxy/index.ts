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

const safeSegment = (value: unknown, field: string): string => {
  const normalized = String(value || '').trim();
  if (!normalized || !/^[A-Za-z0-9_.-]+$/.test(normalized)) {
    throw new Error(`Invalid ${field}`);
  }
  return normalized;
};

const safePath = (value: unknown): string => {
  const normalized = String(value || '').replace(/^\/+/, '').trim();
  if (normalized.length > 500 || normalized.split('/').some((part) => part === '..')) {
    throw new Error('Invalid path');
  }
  return normalized;
};

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization');

  if (!supabaseUrl || !anonKey) return { error: json({ error: 'Supabase runtime is not configured' }, 500) };
  if (!authHeader?.startsWith('Bearer ')) return { error: json({ error: 'Unauthorized' }, 401) };

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.slice('Bearer '.length);
  const { data: claims, error: claimsError } = await client.auth.getClaims(token);
  const userId = claims?.claims?.sub as string | undefined;

  if (claimsError || !userId) return { error: json({ error: 'Unauthorized' }, 401) };

  const { data: isAdmin, error: roleError } = await client.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  if (roleError || !isAdmin) return { error: json({ error: 'Forbidden' }, 403) };
  return { userId };
}

async function githubRequest(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'alazab-ai-console',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authorization = await requireAdmin(req);
  if (authorization.error) return authorization.error;

  const githubToken = Deno.env.get('GITHUB_TOKEN');
  if (!githubToken) return json({ error: 'GITHUB_TOKEN is not configured' }, 503);

  try {
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action || '');
    let response: Response;

    if (action === 'user') {
      response = await githubRequest('/user', githubToken);
    } else if (action === 'repos') {
      const page = Math.max(1, Math.floor(Number(body.page) || 1));
      const perPage = Math.min(100, Math.max(1, Math.floor(Number(body.perPage) || 30)));
      const type = body.includePrivate ? 'all' : 'public';
      response = await githubRequest(`/user/repos?per_page=${perPage}&page=${page}&sort=updated&type=${type}`, githubToken);
    } else if (action === 'contents' || action === 'file') {
      const owner = safeSegment(body.owner, 'owner');
      const repo = safeSegment(body.repo, 'repo');
      const path = safePath(body.path);
      const encodedPath = path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
      response = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`, githubToken);
    } else {
      return json({ error: 'Unsupported action' }, 400);
    }

    const text = await response.text();
    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: 'GitHub returned a non-JSON response' };
    }

    if (!response.ok) {
      return json({ error: payload?.message || `GitHub HTTP ${response.status}` }, response.status);
    }

    if (action === 'file') {
      if (!payload || Array.isArray(payload) || payload.type !== 'file') {
        return json({ error: 'Requested path is not a file' }, 400);
      }
      if (payload.encoding !== 'base64' || typeof payload.content !== 'string') {
        return json({ error: 'Unsupported GitHub file encoding' }, 422);
      }

      const decoded = Uint8Array.from(atob(payload.content.replace(/\n/g, '')), (char) => char.charCodeAt(0));
      return json({ content: new TextDecoder().decode(decoded) });
    }

    return json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 400);
  }
});
