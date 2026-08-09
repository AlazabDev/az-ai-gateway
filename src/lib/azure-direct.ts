import { supabase } from '@/integrations/supabase/client';

export type AzureRole = 'system' | 'user' | 'assistant';
export interface AzureMessage { role: AzureRole; content: string }

export interface AzureCallOptions {
  messages: AzureMessage[];
  temperature?: number;
  maxTokens?: number;
  task?: string;
}

export async function callAzureOpenAI(opts: AzureCallOptions): Promise<string> {
  const { data, error } = await supabase.functions.invoke('azure-ai-chat', {
    body: {
      messages: opts.messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      task: opts.task,
    },
  });

  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;

    try {
      if (context) {
        const parsed = await context.clone().json();
        if (parsed?.error) message = parsed.error;
      }
    } catch {
      // Preserve the original error returned by Supabase Functions.
    }

    throw new Error(message);
  }

  if (data?.error) throw new Error(data.error);
  return data?.content || '';
}

export const BASE_SYSTEM_PROMPT =
  'أنت مساعد محترف يتقن العربية والإنجليزية. التزم بالتعليمات بدقة وقدم نتائج جاهزة للاستخدام دون مقدمات أو اعتذارات.';

export type ToolKey =
  | 'summarize'
  | 'translate'
  | 'rewrite'
  | 'email'
  | 'extract'
  | 'brainstorm';

export interface ToolTemplate {
  system: string;
  userPrompt: (input: string, opt: Record<string, string>) => string;
  temperature?: number;
  maxTokens?: number;
}

export const TOOL_TEMPLATES: Record<ToolKey, ToolTemplate> = {
  summarize: {
    system: 'مهمتك تلخيص النصوص مع الحفاظ على المعنى الأساسي والمعلومات الجوهرية.',
    userPrompt: (input, options) =>
      `لخّص النص التالي في ${options.style || 'نقاط موجزة'}:\n\n${input}`,
    temperature: 0.3,
    maxTokens: 1200,
  },
  translate: {
    system: 'مهمتك الترجمة الاحترافية مع الحفاظ على المعنى، الأسلوب، والمصطلحات التقنية.',
    userPrompt: (input, options) =>
      `ترجم النص التالي إلى ${options.lang || 'الإنجليزية'} مع الحفاظ على المعنى والأسلوب:\n\n${input}`,
    temperature: 0.2,
    maxTokens: 2000,
  },
  rewrite: {
    system: 'مهمتك إعادة صياغة النصوص لتكون أوضح وأكثر تأثيراً مع الحفاظ على المعنى الأصلي.',
    userPrompt: (input, options) =>
      `أعد صياغة النص التالي بنبرة ${options.tone || 'احترافية'} وبشكل أوضح وأقصر:\n\n${input}`,
    temperature: 0.6,
    maxTokens: 1500,
  },
  email: {
    system: 'مهمتك كتابة رسائل بريد إلكتروني احترافية ومقنعة بصياغة ملائمة للسياق.',
    userPrompt: (input, options) =>
      `اكتب بريداً إلكترونياً ${options.tone || 'احترافياً'} باللغة ${options.lang || 'العربية'} حول الموضوع التالي. ابدأ بسطر "العنوان:" ثم نص الرسالة كاملاً:\n\n${input}`,
    temperature: 0.6,
    maxTokens: 1200,
  },
  extract: {
    system: 'مهمتك استخراج المعلومات المنظمة من النصوص بدقة عالية دون إضافة معلومات غير موجودة.',
    userPrompt: (input) =>
      `استخرج من النص التالي:\n1) المهام\n2) التواريخ والمواعيد\n3) القرارات\n4) المسؤولين\nأرجع النتيجة في قوائم منظمة وواضحة:\n\n${input}`,
    temperature: 0.2,
    maxTokens: 1500,
  },
  brainstorm: {
    system: 'مهمتك توليد أفكار إبداعية ومتنوعة وقابلة للتنفيذ.',
    userPrompt: (input, options) =>
      `قدّم ${options.count || '8'} أفكار إبداعية وقابلة للتنفيذ حول:\n\n${input}`,
    temperature: 0.9,
    maxTokens: 1500,
  },
};

export function buildToolMessages(
  tool: ToolKey,
  input: string,
  options: Record<string, string> = {},
): AzureMessage[] {
  const template = TOOL_TEMPLATES[tool];
  return [
    { role: 'system', content: `${BASE_SYSTEM_PROMPT}\n\n${template.system}` },
    { role: 'user', content: template.userPrompt(input, options) },
  ];
}

export async function runTool(
  tool: ToolKey,
  input: string,
  options: Record<string, string> = {},
  overrides: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const template = TOOL_TEMPLATES[tool];
  return callAzureOpenAI({
    messages: buildToolMessages(tool, input, options),
    temperature: overrides.temperature ?? template.temperature,
    maxTokens: overrides.maxTokens ?? template.maxTokens,
    task: tool,
  });
}
