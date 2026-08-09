import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'azure-apim';
export type AzureApimModel = 'gpt-5.5' | 'gpt-5.1' | 'gpt-4.1' | 'gpt-4o';

export interface AIConfig {
  provider: AIProvider;
  model: AzureApimModel;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SendOptions {
  temperature?: number;
  maxTokens?: number;
  task?: string;
}

const STORAGE_KEY = 'ai-public-config';
const LEGACY_SECRET_KEYS = ['ai-config', 'azure-openai-config'];
const ALLOWED_MODELS: AzureApimModel[] = ['gpt-5.5', 'gpt-5.1', 'gpt-4.1', 'gpt-4o'];
const DEFAULT_CONFIG: AIConfig = {
  provider: 'azure-apim',
  model: 'gpt-5.5',
};

const SYSTEM_PROMPT =
  'أنت مساعد مهني داخلي لشركة العزب. أجب بالعربية أو الإنجليزية حسب لغة المستخدم، والتزم بالدقة وعدم اختلاق بيانات غير موجودة.';

function purgeLegacySecrets(): void {
  for (const key of LEGACY_SECRET_KEYS) localStorage.removeItem(key);
}

function isAllowedModel(value: unknown): value is AzureApimModel {
  return typeof value === 'string' && ALLOWED_MODELS.includes(value as AzureApimModel);
}

export class AIService {
  private readonly config: AIConfig;

  constructor(config: AIConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  async sendMessage(messages: ChatMessage[], options?: SendOptions): Promise<string> {
    const payload = {
      model: this.config.model,
      messages: [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      task: options?.task ?? 'chat',
    };

    const { data, error } = await supabase.functions.invoke('azure-ai-chat', {
      body: payload,
    });

    if (error) {
      const context = (error as { context?: Response }).context;
      let serverMessage = error.message;

      try {
        if (context) {
          const parsed = await context.clone().json();
          if (parsed?.error) serverMessage = parsed.error;
        }
      } catch {
        // Keep the original Supabase Functions error.
      }

      throw new Error(`فشل بوابة Azure AI: ${serverMessage}`);
    }

    if (data?.error) throw new Error(`فشل بوابة Azure AI: ${data.error}`);
    return data?.content || 'لم تُرجع خدمة الذكاء الاصطناعي محتوى.';
  }
}

export const aiConfigManager = {
  save: (config: AIConfig): void => {
    purgeLegacySecrets();
    const safeConfig: AIConfig = {
      provider: 'azure-apim',
      model: isAllowedModel(config.model) ? config.model : DEFAULT_CONFIG.model,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
  },

  load: (): AIConfig => {
    purgeLegacySecrets();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_CONFIG;

      const parsed = JSON.parse(stored) as Partial<AIConfig>;
      return {
        provider: 'azure-apim',
        model: isAllowedModel(parsed.model) ? parsed.model : DEFAULT_CONFIG.model,
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  clear: (): void => {
    purgeLegacySecrets();
    localStorage.removeItem(STORAGE_KEY);
  },

  isConfigured: (): boolean => {
    purgeLegacySecrets();
    return true;
  },
};

export const availableAzureModels = ALLOWED_MODELS;
