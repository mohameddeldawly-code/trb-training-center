-- ═══════════════════════════════════════════════════════════════════════════
--  0002_rls_and_rpc.sql — أمان مستوى الصف (RLS) + الدوال المكشوفة للواجهة
--  القاعدة: كل جدول مُقفل افتراضياً، والقراءة العامة مقصورة على المحتوى المنشور
--           وبيانات الطلاب لا تُقرأ علناً إطلاقاً — تُقرأ عبر دالة محكومة فقط
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.admin_users            enable row level security;
alter table public.site_settings          enable row level security;
alter table public.grades                 enable row level security;
alter table public.specializations        enable row level security;
alter table public.subjects               enable row level security;
alter table public.study_plans            enable row level security;
alter table public.books                  enable row level security;
alter table public.videos                 enable row level security;
alter table public.posts                  enable row level security;
alter table public.gallery_items          enable row level security;
alter table public.students               enable row level security;
alter table public.attendance_records     enable row level security;
alter table public.attendance_summaries   enable row level security;
alter table public.import_batches         enable row level security;
alter table public.complaints             enable row level security;
alter table public.complaint_updates      enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.portal_login_attempts  enable row level security;

-- ── admin_users: كل مدير يرى نفسه، والمدير الأعلى يرى ويدير الجميع ──
drop policy if exists admin_self_read   on public.admin_users;
create policy admin_self_read on public.admin_users for select
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists admin_super_write on public.admin_users;
create policy admin_super_write on public.admin_users for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ── الإعدادات: قراءة عامة للمفاتيح العامة فقط، الكتابة للإدارة ──
drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings for select
  using (is_public or public.is_admin());
drop policy if exists settings_admin_write on public.site_settings;
create policy settings_admin_write on public.site_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- ── مُولِّد سياسات المحتوى العام (قراءة للمنشور · كتابة للإدارة) ──
do $$
declare t text;
begin
  foreach t in array array['grades','specializations','subjects','study_plans','books','videos','posts','gallery_items']
  loop
    execute format('drop policy if exists %I on public.%I', t||'_public_read', t);
    execute format('drop policy if exists %I on public.%I', t||'_admin_write', t);
    execute format('create policy %I on public.%I for select using (%s or public.is_admin())',
                   t||'_public_read', t,
                   case
                     when t = 'grades'      then 'is_active'
                     when t = 'study_plans' then 'true'
                     else 'is_published'
                   end);
    execute format('create policy %I on public.%I for all using (public.is_admin()) with check (public.is_admin())',
                   t||'_admin_write', t);
  end loop;
end $$;

-- النشر المؤجَّل والمنتهي: يُخفى المحتوى خارج نافذة النشر عن الزوار
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select
  using (
    public.is_admin()
    or (is_published and published_at <= now() and (expires_at is null or expires_at > now()))
  );

-- ── بيانات الطلاب والحضور: لا قراءة عامة إطلاقاً ──
drop policy if exists students_admin_only on public.students;
create policy students_admin_only on public.students for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists att_admin_only on public.attendance_records;
create policy att_admin_only on public.attendance_records for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists attsum_admin_only on public.attendance_summaries;
create policy attsum_admin_only on public.attendance_summaries for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists imports_admin_only on public.import_batches;
create policy imports_admin_only on public.import_batches for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());
drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert on public.audit_logs for insert with check (public.is_admin());

drop policy if exists attempts_admin_read on public.portal_login_attempts;
create policy attempts_admin_read on public.portal_login_attempts for select using (public.is_admin());

-- ── الشكاوى: أي زائر يستطيع الإرسال فقط، والقراءة للإدارة ──
drop policy if exists complaints_public_insert on public.complaints;
-- الإرسال متاح للزائر، مع حد أعلى للمعدل يمنع الإغراق الآلي
create policy complaints_public_insert on public.complaints for insert
  to anon, authenticated with check (
    (select count(*) from public.complaints where created_at > now() - interval '1 minute') < 20
  );
drop policy if exists complaints_admin_read on public.complaints;
create policy complaints_admin_read on public.complaints for select using (public.is_admin());
drop policy if exists complaints_admin_write on public.complaints;
create policy complaints_admin_write on public.complaints for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists complaints_admin_delete on public.complaints;
create policy complaints_admin_delete on public.complaints for delete using (public.is_admin());

drop policy if exists cupd_admin_all on public.complaint_updates;
create policy cupd_admin_all on public.complaint_updates for all
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
--  الدوال المكشوفة (RPC) — المنفذ الوحيد للبيانات الحساسة
-- ═══════════════════════════════════════════════════════════════════════════

-- ① تتبع طلب/شكوى برقمه المرجعي + رقم الهاتف (تحقق من عاملين)
create or replace function public.track_complaint(p_ticket text, p_phone text)
returns table (
  ticket_id text, kind complaint_kind, status complaint_status,
  subject text, created_at timestamptz, responded_at timestamptz,
  closed_at timestamptz, response text, updates jsonb
)
language sql stable security definer set search_path = public as $$
  select c.ticket_id, c.kind, c.status, c.subject, c.created_at,
         c.responded_at, c.closed_at,
         case when c.status in ('answered','resolved','closed','rejected') then c.response else null end,
         (select coalesce(jsonb_agg(jsonb_build_object(
                   'note', u.note, 'to_status', u.to_status, 'created_at', u.created_at)
                   order by u.created_at), '[]'::jsonb)
            from public.complaint_updates u
           where u.complaint_id = c.id and u.is_public)
  from public.complaints c
  where upper(trim(c.ticket_id)) = upper(trim(p_ticket))
    and regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
$$;
revoke all on function public.track_complaint(text,text) from public;
grant execute on function public.track_complaint(text,text) to anon, authenticated;


-- ② دخول بوابة ولي الأمر — يرجع بيانات الطالب وملخص الحضور فقط
--    الضوابط: البوابة قابلة للإيقاف من الإعدادات · إمكانية اشتراط الكود والرقم القومي معاً
--             · حد أقصى للمحاولات الفاشلة لكل معرِّف خلال 15 دقيقة
create or replace function public.parent_portal_login(
  p_student_code text default null,
  p_national_id  text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_enabled     boolean;
  v_require_both boolean;
  v_max_attempts int;
  v_ident       text;
  v_fails       int;
  v_global      int;
  v_student     public.students%rowtype;
  v_sum         public.attendance_summaries%rowtype;
  v_absences    jsonb;
  v_code        text := nullif(trim(coalesce(p_student_code,'')), '');
  v_nid         text := nullif(regexp_replace(coalesce(p_national_id,''), '\D', '', 'g'), '');
begin
  select coalesce((value #>> '{}')::boolean, true) into v_enabled
    from public.site_settings where key = 'parent_portal.enabled';
  if v_enabled is false then
    return jsonb_build_object('ok', false, 'error', 'disabled');
  end if;

  select coalesce((value #>> '{}')::boolean, true) into v_require_both
    from public.site_settings where key = 'parent_portal.require_both';
  select coalesce((value #>> '{}')::int, 8) into v_max_attempts
    from public.site_settings where key = 'parent_portal.max_attempts';

  if v_code is null and v_nid is null then
    return jsonb_build_object('ok', false, 'error', 'missing_identifier');
  end if;
  if coalesce(v_require_both, true) and (v_code is null or v_nid is null) then
    return jsonb_build_object('ok', false, 'error', 'both_required');
  end if;

  -- بصمة المتصل إن توفّرت (خلف Cloudflare)، وإلا فالمعرِّفان المُدخلان
  v_ident := coalesce(
    nullif(current_setting('request.headers', true)::jsonb ->> 'cf-connecting-ip', ''),
    coalesce(v_code, '') || '|' || coalesce(v_nid, ''));

  -- ① حد لكل معرِّف/عنوان
  select count(*) into v_fails from public.portal_login_attempts
   where identifier = v_ident and not succeeded and created_at > now() - interval '15 minutes';
  if v_fails >= coalesce(v_max_attempts, 8) then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  -- ② حد عام يمنع تعداد الأكواد بتغيير القيمة في كل محاولة
  select count(*) into v_global from public.portal_login_attempts
   where not succeeded and created_at > now() - interval '15 minutes';
  if v_global >= coalesce(v_max_attempts, 8) * 10 then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  select * into v_student from public.students s
   where (v_code is null or upper(trim(s.student_code)) = upper(v_code))
     and (v_nid  is null or regexp_replace(coalesce(s.national_id,''), '\D', '', 'g') = v_nid)
   limit 1;

  if v_student.id is null then
    insert into public.portal_login_attempts(identifier, succeeded) values (v_ident, false);
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  insert into public.portal_login_attempts(identifier, succeeded) values (v_ident, true);
  select * into v_sum from public.attendance_summaries where student_id = v_student.id;

  select coalesce(jsonb_agg(x order by x->>'date' desc), '[]'::jsonb) into v_absences
  from (
    select jsonb_build_object('date', a.date, 'status', a.status, 'section', a.section, 'reason', a.reason) as x
    from public.attendance_records a
    where a.student_id = v_student.id and a.status in ('absent','excused','late')
    order by a.date desc limit 200
  ) t;

  return jsonb_build_object(
    'ok', true,
    'student', jsonb_build_object(
      'full_name',      v_student.full_name,
      'student_code',   v_student.student_code,
      'grade',          (select g.name from public.grades g where g.id = v_student.grade_id),
      'specialization', (select sp.name from public.specializations sp where sp.id = v_student.specialization_id),
      'academic_year',  v_student.academic_year,
      'status',         v_student.status,
      'guardian_name',  v_student.guardian_name
    ),
    'attendance', jsonb_build_object(
      'total_school_days', v_sum.total_school_days,
      'attendance_days',   coalesce(v_sum.attendance_days, 0),
      'absence_days',      coalesce(v_sum.absence_days, 0),
      'attendance_pct',    v_sum.attendance_pct,
      'absence_pct',       v_sum.absence_pct,
      'last_updated',      v_sum.last_updated
    ),
    'absences', v_absences
  );
end $$;
revoke all on function public.parent_portal_login(text,text) from public;
grant execute on function public.parent_portal_login(text,text) to anon, authenticated;


-- ③ إحصائيات عامة للصفحة الرئيسية (أرقام مجمّعة فقط — بلا أي بيانات شخصية)
create or replace function public.public_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'specializations', (select count(*) from public.specializations where is_published),
    'books',           (select count(*) from public.books           where is_published),
    'videos',          (select count(*) from public.videos          where is_published),
    'students',        (select count(*) from public.students        where status = 'active'),
    'years',           3
  );
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;


-- ④ لوحة معلومات الإدارة (للمصرَّح لهم فقط)
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'students',            (select count(*) from public.students where status='active'),
    'specializations',     (select count(*) from public.specializations),
    'subjects',            (select count(*) from public.subjects),
    'books',               (select count(*) from public.books),
    'videos',              (select count(*) from public.videos),
    'news',                (select count(*) from public.posts where kind='news'),
    'announcements',       (select count(*) from public.posts where kind='announcement'),
    'instructions',        (select count(*) from public.posts where kind='instruction'),
    'gallery',             (select count(*) from public.gallery_items),
    'complaints_total',    (select count(*) from public.complaints),
    'complaints_new',      (select count(*) from public.complaints where status='new'),
    'complaints_open',     (select count(*) from public.complaints where status in ('new','under_review','in_progress')),
    'complaints_closed',   (select count(*) from public.complaints where status in ('resolved','closed','rejected')),
    'avg_attendance_pct',  (select round(avg(attendance_pct),1) from public.attendance_summaries),
    'absences_this_month', (select count(*) from public.attendance_records
                             where status='absent' and date >= date_trunc('month', current_date))
  );
end $$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;


-- ⑤ استيراد الطلاب والغياب — Upsert ذرّي في معاملة واحدة
create or replace function public.import_students_attendance(p_rows jsonb, p_file_name text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r            jsonb;
  v_batch      uuid;
  v_ins        int := 0;
  v_upd        int := 0;
  v_fail       int := 0;
  v_errors     jsonb := '[]'::jsonb;
  v_student_id uuid;
  v_existed    boolean;
  v_grade      smallint;
  v_spec       uuid;
  v_att        int;
  v_abs        int;
  v_total      int;
  v_idx        int := 0;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  insert into public.import_batches(file_name, kind, rows_total, performed_by)
  values (p_file_name, 'students_attendance', jsonb_array_length(p_rows), auth.uid())
  returning id into v_batch;

  for r in select * from jsonb_array_elements(p_rows) loop
    v_idx := v_idx + 1;
    begin
      if coalesce(trim(r->>'student_code'), '') = '' then
        raise exception 'كود الطالب مفقود';
      end if;
      if coalesce(trim(r->>'full_name'), '') = '' then
        raise exception 'اسم الطالب مفقود';
      end if;

      v_grade := nullif(r->>'grade_id','')::smallint;
      select id into v_spec from public.specializations
        where name = nullif(trim(r->>'specialization'),'')
           or slug = nullif(trim(r->>'specialization'),'')
        limit 1;

      select id into v_student_id from public.students
        where upper(student_code) = upper(trim(r->>'student_code')) limit 1;
      v_existed := v_student_id is not null;

      if v_existed then
        update public.students set
          full_name         = coalesce(nullif(trim(r->>'full_name'),''), full_name),
          national_id       = coalesce(nullif(regexp_replace(coalesce(r->>'national_id',''),'\D','','g'),''), national_id),
          grade_id          = coalesce(v_grade, grade_id),
          specialization_id = coalesce(v_spec, specialization_id),
          guardian_name     = coalesce(nullif(trim(r->>'guardian_name'),''), guardian_name),
          guardian_phone    = coalesce(nullif(trim(r->>'guardian_phone'),''), guardian_phone),
          academic_year     = coalesce(nullif(trim(r->>'academic_year'),''), academic_year)
        where id = v_student_id;
        v_upd := v_upd + 1;
      else
        insert into public.students(student_code, national_id, full_name, grade_id,
                                    specialization_id, guardian_name, guardian_phone, academic_year)
        values (trim(r->>'student_code'),
                nullif(regexp_replace(coalesce(r->>'national_id',''),'\D','','g'),''),
                trim(r->>'full_name'), v_grade, v_spec,
                nullif(trim(r->>'guardian_name'),''),
                nullif(trim(r->>'guardian_phone'),''),
                nullif(trim(r->>'academic_year'),''))
        returning id into v_student_id;
        v_ins := v_ins + 1;
      end if;

      v_att   := nullif(r->>'attendance_days','')::int;
      v_abs   := nullif(r->>'absence_days','')::int;
      v_total := nullif(r->>'total_school_days','')::int;

      if v_att is not null or v_abs is not null then
        v_total := coalesce(v_total, coalesce(v_att,0) + coalesce(v_abs,0));
        insert into public.attendance_summaries(student_id, academic_year, total_school_days,
               attendance_days, absence_days, attendance_pct, absence_pct, last_updated)
        values (v_student_id, nullif(trim(r->>'academic_year'),''), v_total,
                coalesce(v_att,0), coalesce(v_abs,0),
                case when v_total > 0 then round(coalesce(v_att,0)::numeric * 100 / v_total, 2) end,
                case when v_total > 0 then round(coalesce(v_abs,0)::numeric * 100 / v_total, 2) end,
                now())
        on conflict (student_id) do update set
          academic_year     = excluded.academic_year,
          total_school_days = excluded.total_school_days,
          attendance_days   = excluded.attendance_days,
          absence_days      = excluded.absence_days,
          attendance_pct    = excluded.attendance_pct,
          absence_pct       = excluded.absence_pct,
          last_updated      = now();
      end if;

      if coalesce(trim(r->>'absence_date'),'') <> '' then
        insert into public.attendance_records(student_id, date, status, section, reason, import_id)
        values (v_student_id, (r->>'absence_date')::date, 'absent',
                nullif(trim(r->>'section'),''), nullif(trim(r->>'reason'),''), v_batch)
        on conflict (student_id, date, section) do update
          set status = 'absent', reason = excluded.reason, import_id = v_batch;
      end if;

    exception when others then
      v_fail := v_fail + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx,
                    'student_code', r->>'student_code', 'error', SQLERRM);
    end;
  end loop;

  update public.import_batches
     set rows_inserted = v_ins, rows_updated = v_upd, rows_failed = v_fail, errors = v_errors
   where id = v_batch;

  return jsonb_build_object('ok', true, 'batch_id', v_batch, 'inserted', v_ins,
                            'updated', v_upd, 'failed', v_fail, 'errors', v_errors);
end $$;
revoke all on function public.import_students_attendance(jsonb,text) from public, anon;
grant execute on function public.import_students_attendance(jsonb,text) to authenticated;
