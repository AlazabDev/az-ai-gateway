import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { callAzureOpenAIChat } from '../_shared/azure-config.ts';
import { startLog, markRunning, finishLog } from '../_shared/usage-log.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_MODELS = new Set(['gpt-5.5', 'gpt-5.1', 'gpt-4.1', 'gpt-4o']);
const ALLOWED_DEPLOYMENTS = new Set(['gpt-5.5', 'az-finance', 'gpt-4.1', 'gpt-4o']);
const ADMIN_TASK_PREFIXES = ['finance-', 'finance:', 'finance_', 'contract-', 'report-', 'architecture-'];
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 12000;
const MAX_TOTAL_CHARS = 40000;
const DEFAULT_MAX_TOKENS = 1200;
const HARD_MAX_TOKENS = 4000;
const REQUESTS_PER_MINUTE = 20;
const REQUESTS_PER_DAY = 500;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  model?: string;
  deployment?: string;
  api_version?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  task?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeTask(value: unknown): string {
  return String(value || 'chat').replace(/[^A-Za-z0-9:_-]/g, '').slice(0, 64) || 'chat';
}

function requiresAdmin(task: string): boolean {
  return ADMIN_TASK_PREFIXES.some((prefix) => task.startsWith(prefix));
}

function sanitizeApiVersion(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return /^\d{4}-\d{2}-\d{2}(?:-preview)?$/.test(normalized) ? normalized : undefined;
}

function sanitizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  let totalChars = 0;

  for (const rawMessage of messages.slice(0, MAX_MESSAGES)) {
    const role = ['system', 'user', 'assistant'].includes(rawMessage.role)
      ? rawMessage.role
      : 'user';
    const remaining = MAX_TOTAL_CHARS - totalChars;
    if (remaining <= 0) break;

    const content = String(rawMessage.content || '')
      .slice(0, Math.min(MAX_MESSAGE_CHARS, remaining))
      .trim();
    if (!content) continue;

    result.push({ role, content });
    totalChars += content.length;
  }

  return result;
}

async function checkRateLimit(client: SupabaseClient, userId: string) {
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [minuteResult, dayResult] = await Promise.all([
    client
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', minuteAgo),
    client
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayAgo),
  ]);

  if (minuteResult.error || dayResult.error) {
    throw new Error('Unable to verify AI usage limits');
  }

  if ((minuteResult.count || 0) >= REQUESTS_PER_MINUTE) {
    return json({ error: 'Rate limit exceeded. Try again in one minute.' }, 429);
  }
  if ((dayResult.count || 0) >= REQUESTS_PER_DAY) {
    return json({ error: 'Daily AI usage limit exceeded.' }, 429);
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let logId: string | null = null;
  let startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authHeader = req.headers.get('Authorization');

    if (!supabaseUrl || !anonKey) return json({ error: 'Supabase runtime is not configured' }, 500);
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.slice('Bearer '.length);
    const { data: claims, error: claimError } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub as string | undefined;

    if (claimError || !userId) return json({ error: 'Unauthorized' }, 401);

    const rateLimitError = await checkRateLimit(supabase, userId);
    if (rateLimitError) return rateLimitError;

    const body = await req.json() as ChatRequest;
    if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return json({ error: 'messages array required' }, 400);
    }

    const operation = normalizeTask(body.task);
    if (requiresAdmin(operation)) {
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      if (roleError || !isAdmin) return json({ error: 'Forbidden' }, 403);
    }

    const requestedModel = body.model || undefined;
    const requestedDeployment = body.deployment || undefined;
    if (requestedModel && !ALLOWED_MODELS.has(requestedModel)) {
      return json({ error: 'Model is not allowed' }, 400);
    }
    if (requestedDeployment && !ALLOWED_DEPLOYMENTS.has(requestedDeployment)) {
      return json({ error: 'Deployment is not allowed' }, 400);
    }

    const safeMessages = sanitizeMessages(body.messages);
    if (!safeMessages.length) return json({ error: 'messages content required' }, 400);

    const safeMaxTokens = Math.min(
      Math.max(Number(body.max_tokens || DEFAULT_MAX_TOKENS), 1),
      HARD_MAX_TOKENS,
    );
    const safeTemperature = Math.min(Math.max(Number(body.temperature ?? 0.7), 0), 1);
    const safeApiVersion = sanitizeApiVersion(body.api_version);

    const modelHint = requestedModel || requestedDeployment || 'default';
    const started = await startLog({ userId, operation, model: `azure:${modelHint}` });
    logId = started.id;
    startedAt = started.startedAt;
    await markRunning(logId);

    const { response, body: upstreamBody, config } = await callAzureOpenAIChat({
      model: requestedModel,
      deployment: requestedDeployment,
      apiVersion: safeApiVersion,
      messages: safeMessages,
      temperature: safeTemperature,
      maxTokens: safeMaxTokens,
    });

    const usage = upstreamBody?.usage ?? {};
    const content = upstreamBody?.choices?.[0]?.message?.content ?? '';

    if (!response.ok) {
      const errorMessage = upstreamBody?.error?.message || `HTTP ${response.status}`;
      await finishLog(logId, {
        startedAt,
        status: 'failed',
        errorMessage,
        promptTokens: usage.prompt_tokens ?? null,
        completionTokens: usage.completion_tokens ?? null,
        totalTokens: usage.total_tokens ?? null,
      });
      return json(
        { error: errorMessage, upstream_status: response.status, deployment: config.deployment },
        response.status === 429 ? 429 : 502,
      );
    }

    await finishLog(logId, {
      startedAt,
      status: 'succeeded',
      summary: content.slice(0, 160),
      promptTokens: usage.prompt_tokens ?? null,
      completionTokens: usage.completion_tokens ?? null,
      totalTokens: usage.total_tokens ?? null,
    });

    return json({
      content,
      model: requestedModel || config.deployment,
      deployment: config.deployment,
      api_version: config.apiVersion,
      usage,
      latency_ms: Date.now() - startedAt,
      log_id: logId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (logId) {
      try {
        await finishLog(logId, { startedAt, status: 'failed', errorMessage: message });
      } catch {
        // Logging failure must not hide the original request failure.
      }
    }
    return json({ error: message }, 500);
  }
});
