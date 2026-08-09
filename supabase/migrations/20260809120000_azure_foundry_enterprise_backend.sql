-- Migration: Azure Foundry Enterprise Backend & Agent Orchestration
-- Created at: 2026-08-09
-- Description: Adds robust database schema for Azure AI Foundry models, agents, telemetry, auditing, and BIM engineering data.

-- 1. Azure Foundry Models Table
create table if not exists public.azure_foundry_models (
  id uuid primary key default gen_random_uuid(),
  model_code text unique not null,
  display_name text not null,
  category text not null,
  tokens_per_min text not null,
  retirement_date text,
  is_active boolean not null default true,
  config jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Azure Foundry Agents Table
create table if not exists public.azure_foundry_agents (
  id uuid primary key default gen_random_uuid(),
  agent_code text unique not null,
  name_ar text not null,
  version integer not null default 1,
  status text not null default 'Running',
  module text not null,
  description text,
  assigned_model text references public.azure_foundry_models(model_code) on update cascade,
  system_prompt text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Azure Foundry Audit & Execution Logs Table
create table if not exists public.azure_foundry_audit_logs (
  id uuid primary key default gen_random_uuid(),
  agent_code text not null,
  model_code text not null,
  prompt text not null,
  response text,
  latency_ms integer,
  tokens_used integer,
  status text not null default 'success',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 4. Engineering BIM & IFC Files Table
create table if not exists public.engineering_bim_files (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  file_name text not null,
  file_size bigint,
  parsed_elements count integer default 0,
  ai_analysis_summary text,
  status text not null default 'processed',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.azure_foundry_models enable row level security;
alter table public.azure_foundry_agents enable row level security;
alter table public.azure_foundry_audit_logs enable row level security;
alter table public.engineering_bim_files enable row level security;

-- Policies for Authenticated & Service Roles
create policy "Authenticated users can read azure models"
  on public.azure_foundry_models for select to authenticated using (true);

create policy "Authenticated users can read azure agents"
  on public.azure_foundry_agents for select to authenticated using (true);

create policy "Authenticated users can read audit logs"
  on public.azure_foundry_audit_logs for select to authenticated using (true);

create policy "Authenticated users can insert audit logs"
  on public.azure_foundry_audit_logs for insert to authenticated with check (true);

create policy "Authenticated users can read BIM files"
  on public.engineering_bim_files for select to authenticated using (true);

create policy "Authenticated users can insert BIM files"
  on public.engineering_bim_files for insert to authenticated with check (true);

-- Seed initial models
insert into public.azure_foundry_models (model_code, display_name, category, tokens_per_min, retirement_date, description)
values
  ('az-model-gpt', 'GPT-5.6 Luna', 'General / Reasoning', '2,000,000', '٢٠٢٨/١/١١', 'النموذج الأساسي للتفكير العميق وتوليد الكود والمخططات المعمارية.'),
  ('az-model-deepseek', 'DeepSeek-R1 / V3', 'Engineering & Logic', '٢٥٠,٠٠٠', '٢٠٢٨/٢/٢٠', 'مخصص للحسابات الإنشائية المعقدة والتحليل الهندسي الدقيق.'),
  ('az-model-sol', 'GPT-5.6 Sol', 'Structural & BIM', '٢,٥٠0,000', '٢٠٢٨/١/١١', 'نموذج متخصص في جداول الكميات BIM ومطابقة المخططات.'),
  ('az-model-finance', 'Financial GPT', 'Finance & Contracts', '٢٥٠,٠٠٠', '٢٠٢٨/٢/٢٠', 'تحليل العقود، الموازنات، وتكاليف المقاولات.'),
  ('az-models-text', 'Text Embedding 3', 'Embeddings & RAG', '٥٣٢,٠٠٠', '٢٠٢٨/٢/٩', 'فهرسة المستندات الهندسية ومحركات البحث في الأرشيف.'),
  ('az-model-maint', 'Maintenance LLM', 'Operations & Maint', '٢٥٠,٠٠٠', '٢٠٢٧/٩/٢١', 'إدارة تشغيل وصيانة المعدات ومتابعة البلاغات.'),
  ('az-model-core', 'Core Router', 'Routing & Gateway', '٥٠0,000', '٢٠٢٧/١٠/٢٦', 'توجيه الطلبات الذكية وإدارة الحماية (Guardrails).')
on conflict (model_code) do update
set display_name = excluded.display_name,
    tokens_per_min = excluded.tokens_per_min,
    description = excluded.description;

-- Seed initial agents
insert into public.azure_foundry_agents (agent_code, name_ar, version, status, module, description, assigned_model)
values
  ('az-agent-auth', 'وكيل الصلاحيات والأمان', 3, 'Running', 'الصلاحيات والأمان', 'إدارة أذونات المستخدمين وتأمين جلسات العمل.', 'az-model-core'),
  ('az-agent-azabot', 'المساعد الذكي العام', 6, 'Running', 'المساعد الذكي العام', 'المساعد الرئيسي للاستفسارات الهندسية والمؤسسية.', 'az-model-gpt'),
  ('az-agent-bim', 'وكيل نمذجة معلومات البناء BIM', 4, 'Running', 'نمذجة معلومات البناء BIM', 'تحليل ملفات IFC/DXF ونماذج ثلاثية الأبعاد.', 'az-model-sol'),
  ('az-agent-copilot', 'مساعد التصميم المعماري', 3, 'Running', 'مساعد التصميم', 'مساعدة المهندسين المعماريين في التصميم والتخطيط.', 'az-model-gpt'),
  ('az-agent-core', 'وكيل النواة والربط', 6, 'Running', 'النواة والربط', 'تنسيق العمل بين البوابات والنقاط المركزية.', 'az-model-core'),
  ('az-agent-finance', 'وكيل المالية والمقاولات', 5, 'Running', 'المالية والمقاولات', 'تدقيق المستخلصات المالية وجداول الدفعات.', 'az-model-finance'),
  ('az-agent-maint', 'وكيل الصيانة والتشغيل', 22, 'Running', 'الصيانة والتشغيل', 'متابعة أعطال المعدات وجدولة الصيانة الوقائية.', 'az-model-maint'),
  ('az-agent-payments', 'وكيل المدفوعات', 4, 'Running', 'المدفوعات والمستخلصات', 'معالجة الفواتير والمدفوعات البنكية للموردين.', 'az-model-finance'),
  ('az-agent-prod', 'وكيل الإنتاج والموقع', 11, 'Running', 'الإنتاج والموقع', 'مراقبة نسب الإنجاز ومعدات التشغيل في الموقع.', 'az-model-deepseek'),
  ('az-agent-project', 'وكيل إدارة المشاريع', 2, 'Running', 'إدارة المشاريع', 'متابعة الجدول الزمني والميزانيات والمخاطر.', 'az-model-gpt'),
  ('az-agent-vision', 'وكيل الرؤية الحاسوبية OCR', 3, 'Running', 'الرؤية الحاسوبية OCR', 'قراءة المخططات الهندسية وصور عيوب الموقع.', 'az-model-deepseek'),
  ('az-agent-data', 'وكيل البيانات والبحث', 4, 'Running', 'إدارة البيانات والبحث', 'بحث ذكي في الأرشيف الهندسي والعقود.', 'az-models-text')
on conflict (agent_code) do update
set name_ar = excluded.name_ar,
    version = excluded.version,
    module = excluded.module,
    description = excluded.description;

-- Stored Procedure for Recording Agent Execution Telemetry
create or replace function public.record_agent_execution(
  _agent_code text,
  _model_code text,
  _prompt text,
  _response text,
  _latency_ms integer,
  _tokens_used integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _log_id uuid;
begin
  insert into public.azure_foundry_audit_logs (
    agent_code,
    model_code,
    prompt,
    response,
    latency_ms,
    tokens_used,
    status,
    created_by
  )
  values (
    _agent_code,
    _model_code,
    _prompt,
    _response,
    _latency_ms,
    _tokens_used,
    'success',
    auth.uid()
  )
  returning id into _log_id;

  return _log_id;
end;
$$;

revoke all on function public.record_agent_execution(text, text, text, text, integer, integer) from public, anon;
grant execute on function public.record_agent_execution(text, text, text, text, integer, integer) to authenticated, service_role;
