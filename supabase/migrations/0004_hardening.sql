-- ═══════════════════════════════════════════════════════════════════════════
--  0004_hardening.sql — تشديدات أمنية وتصحيحات صلاحيات
--  يُنفَّذ بعد 0003. آمن لإعادة التنفيذ.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① الزائر يحتاج صلاحية استخدام تسلسل الأرقام المرجعية عند إرسال الطلب.
--    الحل الأنظف: جعل دالة التوليد SECURITY DEFINER بدل منح الصلاحية للزائر.
create or replace function public.gen_ticket_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ticket_id is null or new.ticket_id = '' then
    new.ticket_id := 'TRB-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('public.ticket_seq')::text, 6, '0');
  end if;
  return new;
end $$;

-- ② منع الزائر من تعيين حقول إدارية عند إرسال الطلب
--    (الحالة · الرد · الملاحظات الداخلية · تواريخ الرد والإغلاق · المسؤول)
create or replace function public.sanitize_new_complaint()
returns trigger language plpgsql
security definer set search_path = public as $$
begin
  -- الإدارة قد تُسجّل شكوى واردة هاتفياً بحالة وملاحظات جاهزة — لا تُمسح بياناتها
  if public.is_admin() then
    return new;
  end if;

  new.status         := 'new';
  new.response       := null;
  new.internal_notes := null;
  new.responded_at   := null;
  new.closed_at      := null;
  new.assigned_to    := null;
  new.created_at     := now();
  new.updated_at     := now();

  -- تنظيف المدخلات وتقييد أطوالها
  new.submitter_name := left(btrim(coalesce(new.submitter_name, '')), 150);
  new.subject        := left(btrim(coalesce(new.subject, '')), 200);
  new.details        := left(btrim(coalesce(new.details, '')), 5000);
  new.phone          := left(regexp_replace(coalesce(new.phone, ''), '\D', '', 'g'), 20);
  new.student_name   := left(btrim(coalesce(new.student_name, '')), 150);
  new.student_code   := left(btrim(coalesce(new.student_code, '')), 40);
  new.email          := nullif(left(btrim(coalesce(new.email, '')), 150), '');
  new.student_name   := nullif(new.student_name, '');
  new.student_code   := nullif(new.student_code, '');

  -- رابط المرفق يأتي من المتصفح: يُقصَّر ويُرفض ما ليس رابطاً صحيحاً
  new.attachment_url := nullif(left(btrim(coalesce(new.attachment_url, '')), 500), '');
  if new.attachment_url is not null and new.attachment_url !~ '^https?://' then
    new.attachment_url := null;
  end if;

  if length(new.submitter_name) < 3 then raise exception 'اسم مقدّم الطلب قصير جداً'; end if;
  if length(new.subject) < 5      then raise exception 'موضوع الرسالة قصير جداً'; end if;
  if length(new.details) < 20     then raise exception 'تفاصيل الطلب قصيرة جداً'; end if;
  if length(new.phone) < 8        then raise exception 'رقم الهاتف غير صحيح'; end if;

  return new;
end $$;

drop trigger if exists trg_complaint_sanitize on public.complaints;
create trigger trg_complaint_sanitize before insert on public.complaints
  for each row execute function public.sanitize_new_complaint();

-- ترتيب المحفّزات أبجدي داخل نفس الحدث، و trg_complaint_sanitize يسبق trg_complaint_ticket
-- فتُنظَّف البيانات أولاً ثم يُولَّد الرقم المرجعي.

-- ③ حماية محفّز تسجيل تغيّر الحالة من انتهاك المفتاح الأجنبي
--    إن لم يكن المستخدم الحالي مقيَّداً في admin_users
create or replace function public.complaint_status_stamps()
returns trigger language plpgsql as $$
declare v_actor uuid;
begin
  if new.status is distinct from old.status then
    if new.status = 'answered' and new.responded_at is null then new.responded_at := now(); end if;
    if new.status in ('resolved','closed','rejected') and new.closed_at is null then new.closed_at := now(); end if;

    select a.user_id into v_actor from public.admin_users a where a.user_id = auth.uid();

    insert into public.complaint_updates(complaint_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, v_actor);
  end if;
  return new;
end $$;

-- ④ فهارس إضافية لتسريع الاستعلامات الشائعة
create index if not exists complaints_created_idx on public.complaints(created_at desc);
create index if not exists att_date_idx           on public.attendance_records(date desc);
create index if not exists posts_published_idx    on public.posts(published_at desc);

-- ⑤ تنظيف دوري لمحاولات دخول البوابة (تُستدعى يدوياً أو بمهمة مجدولة)
create or replace function public.purge_old_login_attempts()
returns void language sql security definer set search_path = public as $$
  delete from public.portal_login_attempts where created_at < now() - interval '30 days';
$$;
-- ملاحظة مهمة: Supabase تمنح EXECUTE صراحةً لدور anon على كل دالة في public،
-- ولا يكفي revoke من PUBLIC وحده — لذلك تُسمّى الأدوار صراحةً.
revoke all on function public.purge_old_login_attempts() from public, anon, authenticated;
