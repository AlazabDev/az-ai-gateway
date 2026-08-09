import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function handleError(
  error: unknown,
  options: {
    showToast?: boolean;
    logError?: boolean;
    context?: string;
  } = {}
): AppError {
  const {
    showToast = true,
    logError = true,
    context = 'Error',
  } = options;

  const message = getErrorMessage(error);
  const appError = isAppError(error)
    ? error
    : new AppError('UNKNOWN_ERROR', message);

  if (logError) {
    console.error(`[${context}]`, appError);
  }

  if (showToast) {
    toast.error(message, {
      duration: 5000,
    });
  }

  return appError;
}

export function handleSuccess(
  message: string,
  options: { duration?: number } = {}
) {
  toast.success(message, {
    duration: options.duration ?? 3000,
  });
}

// Common error constructors
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

export const createError = (
  code: keyof typeof ErrorCodes,
  message: string,
  statusCode: number = 500
) => new AppError(ErrorCodes[code], message, statusCode);

/**
 * PostgREST / Postgres error codes mapped to Arabic messages.
 * Raw messages like "permission denied for table tasks" were being shown
 * directly to users on the tasks / reports / contracts pages.
 */
const POSTGREST_ERROR_MESSAGES_AR: Record<string, string> = {
  // Postgres
  '42501': 'لا تملك صلاحية الوصول إلى هذه البيانات. تأكد من تسجيل الدخول بحساب لديه الصلاحية.',
  '42P01': 'الجدول المطلوب غير موجود في قاعدة البيانات. يلزم تشغيل تحديثات قاعدة البيانات (migrations).',
  '23505': 'هذا السجل موجود بالفعل. جرّب قيمة مختلفة.',
  '23503': 'لا يمكن إتمام العملية لأن السجل مرتبط ببيانات أخرى.',
  '23502': 'هناك حقل مطلوب تُرك فارغاً. أكمل جميع الحقول الإلزامية.',
  '22P02': 'صيغة إحدى القيم غير صحيحة. تحقق من المدخلات.',
  // PostgREST
  PGRST301: 'انتهت صلاحية الجلسة. أعد تسجيل الدخول للمتابعة.',
  PGRST116: 'لم يتم العثور على السجل المطلوب.',
  PGRST204: 'أحد الأعمدة المُرسلة غير موجود في الجدول.',
};

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseLikeError(error: unknown): error is SupabaseLikeError {
  return typeof error === 'object' && error !== null && ('code' in error || 'message' in error);
}

/**
 * Converts a Supabase/PostgREST error into a user-facing Arabic message.
 * Falls back to a generic Arabic message rather than leaking SQL details.
 */
export function getDatabaseErrorMessageAr(error: unknown): string {
  if (!isSupabaseLikeError(error)) {
    return 'حدث خطأ غير متوقع أثناء الاتصال بقاعدة البيانات. حاول مرة أخرى.';
  }

  const code = error.code ?? '';
  if (code && POSTGREST_ERROR_MESSAGES_AR[code]) {
    return POSTGREST_ERROR_MESSAGES_AR[code];
  }

  const message = error.message ?? '';

  if (/JWT|token|not authenticated|Auth session missing/i.test(message)) {
    return 'انتهت صلاحية الجلسة. أعد تسجيل الدخول للمتابعة.';
  }

  if (/permission denied|row-level security|RLS/i.test(message)) {
    return POSTGREST_ERROR_MESSAGES_AR['42501'];
  }

  if (/Failed to fetch|NetworkError|network/i.test(message)) {
    return 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت ثم حاول مرة أخرى.';
  }

  return 'حدث خطأ أثناء تنفيذ العملية على قاعدة البيانات. حاول مرة أخرى.';
}

/**
 * Logs the technical error and shows the Arabic equivalent as a toast.
 */
export function handleDatabaseError(error: unknown, context = 'Database'): string {
  const friendly = getDatabaseErrorMessageAr(error);
  console.error(`[${context}]`, error);
  toast.error(friendly, { duration: 6000 });
  return friendly;
}
