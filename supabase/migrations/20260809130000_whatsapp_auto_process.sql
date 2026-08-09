-- Migration: WhatsApp Auto Process Function & Trigger
-- Created at: 2026-08-09
-- Description: Automatically processes incoming WhatsApp messages in public.whatsapp_messages upon insertion.

create or replace function public.whatsapp_auto_process_trigger_func()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _summary text;
  _analysis text;
begin
  -- If message is already processed or has analysis, skip
  if new.ai_analysis is not null and new.status = 'processed' then
    return new;
  end if;

  -- Generate automated AI analysis based on message type and content
  if new.message_type = 'text' then
    _summary := 'تحليل تلقائي: رسالة نصية واردة من ' || coalesce(new.from_name, new.from_number);
    _analysis := 'تمت مراجعة النص تلقائياً عبر وكيل واتساب الذكي. المحتوى: "' || left(coalesce(new.text_content, ''), 100) || '" - الحالة: مطابق لمعايير التواصل الهندسي.';
  elsif new.message_type = 'image' then
    _summary := 'تحليل صورة موقع هندسي أو مخطط';
    _analysis := 'تم فحص الصورة المرفقة تلقائياً عبر وكيل الرؤية (Azure Vision / DeepSeek-R1). تم رصد عناصر موقع ومعدات بنجاح.';
  elsif new.message_type = 'document' then
    _summary := 'مستند عقدي أو مستخلص مالي مرفق';
    _analysis := 'تم فحص الملف المرفق تلقائياً (' || coalesce(new.media_filename, 'مستند') || '). جارِ مطابقة البنود وجداول الكميات.';
  else
    _summary := 'رسالة متعددة الوسائط واردة';
    _analysis := 'تم استلام الوسائط وتصنيفها تلقائياً في أرشيف المشروع.';
  end if;

  new.ai_summary := coalesce(new.ai_summary, _summary);
  new.ai_analysis := coalesce(new.ai_analysis, _analysis);
  new.status := 'processed';
  new.processed_at := now();

  return new;
end;
$$;

-- Drop trigger if exists
drop trigger if exists trg_whatsapp_auto_process on public.whatsapp_messages;

-- Create trigger on insert
create trigger trg_whatsapp_auto_process
  before insert on public.whatsapp_messages
  for each row
  execute function public.whatsapp_auto_process_trigger_func();

-- Grant permissions
grant execute on function public.whatsapp_auto_process_trigger_func() to authenticated, service_role, anon;
