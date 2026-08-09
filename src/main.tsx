import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { isSupabaseConfigured, missingSupabaseEnvVars } from './integrations/supabase/client'
import './index.css'

// Ensure RTL for Arabic UI
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.setAttribute('lang', 'ar');
}

function MissingEnvScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <div className="flex w-full max-w-lg flex-col gap-5 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-balance">إعدادات الاتصال غير مكتملة</h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            لا يمكن تشغيل التطبيق لأن متغيرات البيئة الخاصة بقاعدة البيانات (Supabase) غير مضبوطة.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">المتغيرات الناقصة:</p>
          <ul className="flex flex-col gap-2">
            {missingSupabaseEnvVars.map((name) => (
              <li
                key={name}
                className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
                dir="ltr"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium">طريقة الإصلاح:</p>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            أضف المتغيرات أعلاه إلى ملف <code className="font-mono text-xs">.env</code> في جذر
            المشروع، ثم أعد تشغيل خادم التطوير. للتحقق من الاتصال والجداول شغّل:
          </p>
          <code
            className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
            dir="ltr"
          >
            node scripts/check-supabase.mjs
          </code>
        </div>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  isSupabaseConfigured ? <App /> : <MissingEnvScreen />
);
