-- ═══════════════════════════════════════════════════════════════════════════
--  0005_complaint_submit.sql — تصحيحان جوهريان في مسار إرسال الشكوى
--  يُنفَّذ بعد 0004. آمن لإعادة التنفيذ.
--
--  المشكلة الأولى: عدّاد تقييد المعدل داخل سياسة RLS كان يقرأ جدول الشكاوى
--  وهو نفسه محكوم بـ RLS، فيراه الزائر فارغاً دائماً — فيصبح القيد بلا أثر.
--
--  المشكلة الثانية: PostgreSQL يطبّق سياسات SELECT على
--  «INSERT ... RETURNING»، والزائر ليس له سياسة قراءة على الشكاوى،
--  فكان إرسال الشكوى يفشل عند طلب الرقم المرجعي. والحل دالة إرسال محكومة
--  تُرجع الرقم المرجعي وحده دون فتح قراءة الجدول للزائر.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① عدّاد المعدل — يقرأ الجدول كاملاً بصلاحية المالك
create or replace function public.complaints_rate_limit_ok()
returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.complaints
           where created_at > now() - interval '1 minute') < 20;
$$;
revoke all on function public.complaints_rate_limit_ok() from public, anon, authenticated;
grant execute on function public.complaints_rate_limit_ok() to anon, authenticated;

drop policy if exists complaints_public_insert on public.complaints;
create policy complaints_public_insert on public.complaints for insert
  to anon, authenticated
  with check ( public.is_admin() or public.complaints_rate_limit_ok() );
-- شرط is_admin أولاً حتى لا تُحجب الإدارة عن تسجيل شكوى واردة هاتفياً
-- إذا امتلأت نافذة الدقيقة بطلبات الزوار


-- ② دالة إرسال الشكوى — المنفذ المعتمد للزائر
create or replace function public.submit_complaint(
  p_submitter_name    text,
  p_phone             text,
  p_subject           text,
  p_details           text,
  p_kind              complaint_kind default 'complaint',
  p_submitter_role    submitter_role default 'parent',
  p_student_name      text default null,
  p_student_code      text default null,
  p_email             text default null,
  p_specialization_id uuid default null,
  p_attachment_url    text default null
)
returns text
language plpgsql security definer set search_path = public as $$
declare v_ticket text;
begin
  -- RLS لا تُطبَّق داخل دالة SECURITY DEFINER يملكها postgres، فيُفحص المعدل صراحةً
  if not public.complaints_rate_limit_ok() then
    raise exception 'تم تجاوز الحد المسموح من الطلبات خلال دقيقة، برجاء المحاولة بعد قليل';
  end if;

  insert into public.complaints(kind, submitter_name, submitter_role, student_name,
                                student_code, phone, email, specialization_id,
                                subject, details, attachment_url)
  values (p_kind, p_submitter_name, p_submitter_role, p_student_name,
          p_student_code, p_phone, p_email, p_specialization_id,
          p_subject, p_details, p_attachment_url)
  returning ticket_id into v_ticket;

  return v_ticket;
end $$;

-- محفّز التنظيف والتحقق (trg_complaint_sanitize) يعمل داخل هذه الدالة كما هو،
-- فتبقى كل قيود التحقق وتنقية المدخلات سارية.

revoke all on function public.submit_complaint(text,text,text,text,complaint_kind,submitter_role,text,text,text,uuid,text)
  from public, anon, authenticated;
grant execute on function public.submit_complaint(text,text,text,text,complaint_kind,submitter_role,text,text,text,uuid,text)
  to anon, authenticated;


-- ③ ملاحظتان مقصودتان (لا تُعدَّل بغير قصد)
--
-- (أ) لا تُسحب صلاحية التنفيذ عن is_admin() و complaints_rate_limit_ok():
--     سياسة الإدراج تُقيَّم بصلاحية الدور المُنفِّذ، فلو مُنع الزائر من تنفيذهما
--     لصار الرفض «permission denied» بدل رفض السياسة المقصود، وتعطّل الإرسال كلياً.
--     أما الدوال الحساسة (admin_dashboard_stats · import_students_attendance ·
--     purge_old_login_attempts) فمسحوبة صراحةً عن anon في 0002 و 0004.
--
-- (ب) الأرقام المرجعية متسلسلة لا متصلة: nextval ينفَّذ في محفّز BEFORE INSERT
--     قبل تقييم سياسة الأمان، ولا يُلغى بالتراجع. فقد تظهر فجوات في الترقيم عند
--     رفض طلب، وهذا سلوك متوقَّع — الرقم معرِّف لا عدّاد.
