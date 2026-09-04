-- ═══════════════════════════════════════════════════════════════════════════
--  منصة مركز تدريب شركة ترسانة الإسكندرية — مخطط قاعدة البيانات
--  0001_schema.sql — الجداول والعلاقات والفهارس والدوال
--  المنصة: PostgreSQL (Supabase)
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ───────────────────────────── أنواع مُعدَّدة ─────────────────────────────
do $$ begin
  create type content_kind      as enum ('news','announcement','instruction');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_kind    as enum ('complaint','suggestion','request','inquiry');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_status  as enum ('new','under_review','in_progress','answered','resolved','closed','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type submitter_role    as enum ('parent','student','teacher','staff','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present','absent','excused','late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role        as enum ('super_admin','editor','complaints_officer','student_affairs');
exception when duplicate_object then null; end $$;

-- ─────────────────────────── دوال مساعدة عامة ───────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ═══════════════════════════ 1) الهوية والصلاحيات ═══════════════════════════
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text,
  role        admin_role not null default 'editor',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.admin_users is 'مستخدمو لوحة الإدارة — مرتبطون بحسابات Supabase Auth';

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid() and a.is_active
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid() and a.is_active and a.role = 'super_admin'
  );
$$;

-- ═══════════════════════════ 2) إعدادات الموقع ═══════════════════════════
-- كل بيانات الموقع القابلة للتعديل تُحفظ هنا (مفتاح/قيمة JSON) — لا شيء ثابت في الكود
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null default 'null'::jsonb,
  group_name  text not null default 'general',
  label       text not null,
  input_type  text not null default 'text',   -- text | textarea | image | url | phone | email | color | list | number | boolean
  sort_order  int  not null default 0,
  is_public   boolean not null default true,  -- هل تُقرأ بدون تسجيل دخول؟
  updated_at  timestamptz not null default now()
);
create index if not exists site_settings_group_idx on public.site_settings(group_name, sort_order);
drop trigger if exists trg_site_settings_touch on public.site_settings;
create trigger trg_site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════ 3) البنية الأكاديمية ═══════════════════════════
create table if not exists public.grades (
  id          smallint primary key,
  name        text not null,             -- الصف الأول ...
  short_name  text not null,             -- أولى
  sort_order  int  not null default 0,
  is_active   boolean not null default true
);

create table if not exists public.specializations (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  short_name        text,
  summary           text,                       -- نبذة تعريفية مختصرة
  definition        text,                       -- تعريف بالتخصص
  importance        text,                       -- أهمية التخصص
  objectives        jsonb not null default '[]'::jsonb,   -- أهداف التخصص  (string[])
  skills            jsonb not null default '[]'::jsonb,   -- المهارات المكتسبة (string[])
  training_nature   text,                       -- طبيعة التدريب العملي
  equipment         jsonb not null default '[]'::jsonb,   -- المعدات والأدوات (string[])
  career_paths      jsonb not null default '[]'::jsonb,   -- مجالات العمل (string[])
  learning_outcomes jsonb not null default '[]'::jsonb,   -- مخرجات التعلم (string[])
  safety_ppe        jsonb not null default '[]'::jsonb,   -- مهمات الوقاية الإلزامية (string[])
  main_hazards      jsonb not null default '[]'::jsonb,   -- المخاطر الرئيسية (string[])
  cover_image_url   text,
  icon              text default 'wrench',
  accent_color      text default '#1f4a86',
  sort_order        int  not null default 0,
  is_published      boolean not null default true,
  meta_title        text,
  meta_description  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists spec_pub_idx on public.specializations(is_published, sort_order);
drop trigger if exists trg_spec_touch on public.specializations;
create trigger trg_spec_touch before update on public.specializations
  for each row execute function public.touch_updated_at();

-- المواد الدراسية: مادة مشتركة (specialization_id = null) أو تخصصية
create table if not exists public.subjects (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  code               text,
  grade_id           smallint not null references public.grades(id) on delete restrict,
  specialization_id  uuid references public.specializations(id) on delete cascade,
  is_common          boolean not null default false,   -- مادة مشتركة لجميع التخصصات
  description        text,
  sort_order         int not null default 0,
  is_published       boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
-- يمنع تكرار المادة نفسها عند إعادة تنفيذ ملف البذور.
-- nulls not distinct ضروري لأن المواد المشتركة تحمل specialization_id = null
create unique index if not exists subjects_uniq_idx
  on public.subjects (name, grade_id, specialization_id) nulls not distinct;
create index if not exists subjects_grade_idx on public.subjects(grade_id, sort_order);
create index if not exists subjects_spec_idx  on public.subjects(specialization_id);
drop trigger if exists trg_subjects_touch on public.subjects;
create trigger trg_subjects_touch before update on public.subjects
  for each row execute function public.touch_updated_at();

-- خطة الدراسة خلال السنوات الثلاث لكل تخصص
create table if not exists public.study_plans (
  id                uuid primary key default gen_random_uuid(),
  specialization_id uuid not null references public.specializations(id) on delete cascade,
  grade_id          smallint not null references public.grades(id) on delete restrict,
  title             text,
  focus             text,             -- محور السنة
  theory_topics     jsonb not null default '[]'::jsonb,
  practical_topics  jsonb not null default '[]'::jsonb,
  notes             text,
  sort_order        int not null default 0,
  updated_at        timestamptz not null default now(),
  unique (specialization_id, grade_id)
);
drop trigger if exists trg_plans_touch on public.study_plans;
create trigger trg_plans_touch before update on public.study_plans
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════ 4) المكتبة الإلكترونية ═══════════════════════════
create table if not exists public.books (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text unique,
  description       text,
  author            text,
  grade_id          smallint references public.grades(id) on delete set null,
  subject_id        uuid references public.subjects(id) on delete set null,
  specialization_id uuid references public.specializations(id) on delete set null,
  cover_image_url   text,
  pdf_url           text,
  file_size_kb      int,
  pages             int,
  allow_download    boolean not null default true,
  sort_order        int not null default 0,
  is_published      boolean not null default true,
  views_count       int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists books_pub_idx on public.books(is_published, grade_id, sort_order);
create index if not exists books_search_idx on public.books using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(author,'')));
drop trigger if exists trg_books_touch on public.books;
create trigger trg_books_touch before update on public.books
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════ 5) الفيديوهات التعليمية (YouTube فقط) ═══════════
create table if not exists public.videos (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  youtube_url       text not null,
  youtube_id        text,                       -- يُستخرج تلقائياً
  playlist_url      text,
  thumbnail_url     text,                       -- إن تُرك فارغاً يُستخدم thumbnail يوتيوب
  grade_id          smallint references public.grades(id) on delete set null,
  subject_id        uuid references public.subjects(id) on delete set null,
  specialization_id uuid references public.specializations(id) on delete set null,
  duration_text     text,
  sort_order        int not null default 0,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists videos_pub_idx on public.videos(is_published, sort_order);
drop trigger if exists trg_videos_touch on public.videos;
create trigger trg_videos_touch before update on public.videos
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════ 6) الأخبار والإعلانات والتعليمات ═══════════════
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  kind          content_kind not null default 'news',
  title         text not null,
  slug          text unique,
  excerpt       text,
  body          text,
  image_url     text,
  link_url      text,
  link_label    text,
  is_pinned     boolean not null default false,
  is_published  boolean not null default true,
  published_at  timestamptz not null default now(),
  expires_at    timestamptz,
  created_by    uuid references public.admin_users(user_id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_feed_idx on public.posts(kind, is_published, is_pinned desc, published_at desc);
drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════ 7) معرض الصور ═══════════════════════════
create table if not exists public.gallery_items (
  id                uuid primary key default gen_random_uuid(),
  title             text,
  caption           text,
  image_url         text not null,
  album             text default 'عام',
  specialization_id uuid references public.specializations(id) on delete set null,
  sort_order        int not null default 0,
  is_published      boolean not null default true,
  created_at        timestamptz not null default now()
);
create index if not exists gallery_pub_idx on public.gallery_items(is_published, sort_order);

-- ═══════════════════════════ 8) الطلاب والحضور والغياب ═══════════════════════
create table if not exists public.students (
  id                uuid primary key default gen_random_uuid(),
  student_code      text not null unique,
  national_id       text unique,
  full_name         text not null,
  grade_id          smallint references public.grades(id) on delete set null,
  specialization_id uuid references public.specializations(id) on delete set null,
  guardian_name     text,
  guardian_phone    text,
  academic_year     text,
  status            text not null default 'active',   -- active | dismissed | graduated | withdrawn
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists students_code_idx on public.students(student_code);
create index if not exists students_nid_idx  on public.students(national_id);
create index if not exists students_grade_idx on public.students(grade_id, specialization_id);
drop trigger if exists trg_students_touch on public.students;
create trigger trg_students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- سجل الغياب اليومي (مصدر الحقيقة)
create table if not exists public.attendance_records (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  date        date not null,
  status      attendance_status not null default 'absent',
  section     text,                      -- نظري | عملي | ورش الشركة
  reason      text,
  import_id   uuid,
  created_at  timestamptz not null default now()
);
-- nulls not distinct ضروري: أغلب صفوف الاستيراد لا تحمل قسماً (section = null)،
-- وبدونه يتكرر سجل الغياب في كل عملية استيراد
create unique index if not exists attendance_records_uniq_idx
  on public.attendance_records (student_id, date, section) nulls not distinct;
create index if not exists att_student_idx on public.attendance_records(student_id, date desc);

-- ملخص الحضور لكل طالب/عام (يُحدَّث بالاستيراد أو يُحسب)
create table if not exists public.attendance_summaries (
  student_id        uuid primary key references public.students(id) on delete cascade,
  academic_year     text,
  total_school_days int,
  attendance_days   int not null default 0,
  absence_days      int not null default 0,
  attendance_pct    numeric(5,2),
  absence_pct       numeric(5,2),
  last_updated      timestamptz not null default now()
);

-- سجل عمليات الاستيراد
create table if not exists public.import_batches (
  id            uuid primary key default gen_random_uuid(),
  file_name     text,
  kind          text not null default 'students_attendance',
  rows_total    int not null default 0,
  rows_inserted int not null default 0,
  rows_updated  int not null default 0,
  rows_failed   int not null default 0,
  errors        jsonb not null default '[]'::jsonb,
  performed_by  uuid references public.admin_users(user_id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ═══════════════════════════ 9) الشكاوى والمقترحات والطلبات ═══════════════════
create sequence if not exists public.ticket_seq start 1;

create table if not exists public.complaints (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         text not null unique,
  kind              complaint_kind not null default 'complaint',
  status            complaint_status not null default 'new',
  submitter_name    text not null,
  submitter_role    submitter_role not null default 'parent',
  student_name      text,
  student_code      text,
  phone             text not null,
  email             text,
  specialization_id uuid references public.specializations(id) on delete set null,
  subject           text not null,
  details           text not null,
  attachment_url    text,
  internal_notes    text,
  response          text,
  responded_at      timestamptz,
  closed_at         timestamptz,
  assigned_to       uuid references public.admin_users(user_id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists complaints_status_idx on public.complaints(status, created_at desc);
create index if not exists complaints_kind_idx   on public.complaints(kind, created_at desc);
create index if not exists complaints_ticket_idx on public.complaints(ticket_id);
drop trigger if exists trg_complaints_touch on public.complaints;
create trigger trg_complaints_touch before update on public.complaints
  for each row execute function public.touch_updated_at();

-- سجل الإجراءات على كل طلب (تتبع ISO 21001 — بند 9.1.2)
create table if not exists public.complaint_updates (
  id           uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  from_status  complaint_status,
  to_status    complaint_status,
  note         text,
  is_public    boolean not null default false,   -- هل يظهر لمقدم الطلب عند التتبع؟
  actor_id     uuid references public.admin_users(user_id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists cupd_idx on public.complaint_updates(complaint_id, created_at desc);

-- توليد الرقم المرجعي: TRB-2026-000123
create or replace function public.gen_ticket_id()
returns trigger language plpgsql as $$
begin
  if new.ticket_id is null or new.ticket_id = '' then
    new.ticket_id := 'TRB-' || to_char(now(), 'YYYY') || '-' ||
                     lpad(nextval('public.ticket_seq')::text, 6, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_complaint_ticket on public.complaints;
create trigger trg_complaint_ticket before insert on public.complaints
  for each row execute function public.gen_ticket_id();

-- قيد الحالة عند الإغلاق/الرد
create or replace function public.complaint_status_stamps()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    if new.status in ('answered') and new.responded_at is null then new.responded_at := now(); end if;
    if new.status in ('resolved','closed','rejected') and new.closed_at is null then new.closed_at := now(); end if;
    insert into public.complaint_updates(complaint_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists trg_complaint_stamps on public.complaints;
create trigger trg_complaint_stamps before update on public.complaints
  for each row execute function public.complaint_status_stamps();

-- ═══════════════════════════ 10) سجل التدقيق ═══════════════════════════
create table if not exists public.audit_logs (
  id          bigserial primary key,
  actor_id    uuid references public.admin_users(user_id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists audit_idx on public.audit_logs(entity, created_at desc);

-- ═══════════════════════════ 11) محاولات دخول بوابة ولي الأمر ═══════════════
create table if not exists public.portal_login_attempts (
  id          bigserial primary key,
  identifier  text not null,
  succeeded   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists portal_attempts_idx on public.portal_login_attempts(identifier, created_at desc);
