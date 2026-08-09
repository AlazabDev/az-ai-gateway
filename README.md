# Alazab AI Console

منصة ذكاء اصطناعي داخلية للعزب لإدارة وتحليل الملفات، المحادثات، العمليات الهندسية، المالية، واتساب الأعمال، التقارير، العقود، وتكاملات Azure AI وGitHub من خلال واجهة موحدة وآمنة.

## الهدف

الهدف من المشروع هو تحويل `eng-ai` من مجموعة صفحات وأدوات متفرقة إلى مركز تشغيل ذكاء اصطناعي داخلي يخدم أعمال العزب اليومية في الهندسة، الإدارة، المالية، المستندات، التواصل، وتحليل الكود.

## النطاق الحالي

- واجهة React / Vite / TypeScript.
- مصادقة Supabase Auth.
- جلسات دردشة محفوظة في Supabase.
- استدعاء Azure AI عبر Supabase Edge Functions.
- أدوات إنتاجية مثل التلخيص، الترجمة، إعادة الصياغة، استخراج المهام، وكتابة البريد.
- صفحات تشغيلية مبدئية للمالية، الهندسة، العقود، التقارير، واتساب، Azure، وGitHub.

## المعمارية المستهدفة

```txt
Frontend React / Vite
        |
        v
Supabase Auth + RLS
        |
        v
Supabase Edge Functions
        |
        +--> Azure AI / Azure OpenAI
        +--> GitHub API
        +--> WhatsApp Business
        +--> Storage / Documents
        +--> Reports / Finance / Engineering Tools
        |
        v
Postgres Tables + Logs + Vector Search
```

## قاعدة الإنتاج

لا يتم تخزين أي مفاتيح أو أسرار خام داخل المتصفح.

المسموح:

```txt
Frontend --> Supabase Edge Function --> External Service
```

الممنوع:

```txt
Frontend --> External Service using raw browser secrets
```

## التشغيل المحلي

```bash
pnpm install
cp .env.example .env
pnpm run type-check
pnpm run lint
pnpm run build
pnpm run dev
```

## متغيرات البيئة الأساسية

راجع `.env.example` قبل التشغيل. أهم القيم:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENTS_JSON
```

## أولويات التطوير

1. تثبيت البناء وإزالة أخطاء TypeScript/JSX.
2. توحيد هوية المشروع كـ Alazab AI Console.
3. توحيد بوابة الذكاء الاصطناعي عبر Edge Function واحدة.
4. تحويل قراءة الملفات إلى Knowledge/RAG دائم.
5. نقل GitHub وWhatsApp بالكامل إلى Edge Functions آمنة.
6. تطبيق صلاحيات أدوار واضحة على الواجهة وRLS وEdge Functions.
7. إضافة CI/CD قبل الدمج في `main`.

## أوامر التحقق قبل الدمج

```bash
pnpm run type-check
pnpm run lint
pnpm run build
```

## حالة الفرع `codex`

هذا الفرع مخصص لأول دفعة تطويرات تأسيسية:

- ضبط اسم المشروع ووصفه.
- إصلاح أخطاء build ظاهرة في التكاملات والقائمة الجانبية.
- توحيد نموذج Azure الافتراضي مع النماذج المسموحة في Edge Function.
- إضافة README إنتاجي مختصر.

## تعريف مختصر للنظام

منصة ذكاء اصطناعي داخلية لإدارة وتحليل ملفات ومحادثات وعمليات العزب الهندسية والمالية والتشغيلية، مدعومة بـ Azure AI وSupabase، وتهدف إلى تحويل المعرفة والبيانات اليومية إلى مخرجات عملية قابلة للاستخدام في الإدارة، التشغيل، التقارير، العقود، والمتابعة.
