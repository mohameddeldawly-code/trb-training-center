-- ═══════════════════════════════════════════════════════════════════════════
--  0003_storage.sql — مخازن الملفات (Supabase Storage)
--  media : الصور العامة (الشعار · أغلفة · صور التخصصات · معرض الصور)
--  books : ملفات الكتب PDF
--  attachments : مرفقات الشكاوى (خاص — لا يُقرأ إلا بواسطة الإدارة)
-- ═══════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media',       'media',       true,  10485760,
     array['image/png','image/jpeg','image/webp','image/svg+xml','image/gif']),
  ('books',       'books',       true,  52428800, array['application/pdf']),
  ('attachments', 'attachments', false, 10485760,
     array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- قراءة عامة للصور والكتب
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select
  using (bucket_id in ('media','books'));

-- الرفع والتعديل والحذف للإدارة فقط
drop policy if exists "admin write media" on storage.objects;
create policy "admin write media" on storage.objects for insert
  to authenticated with check (bucket_id in ('media','books') and public.is_admin());

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update
  to authenticated using (bucket_id in ('media','books') and public.is_admin());

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete
  to authenticated using (bucket_id in ('media','books') and public.is_admin());

-- مرفقات الشكاوى: يرفعها الزائر، ولا يقرأها إلا الإدارة
-- الرفع محصور في مجلد باسم الشهر الحالي — يسهّل حصر أي إساءة استخدام وتنظيفها
drop policy if exists "anyone upload attachment" on storage.objects;
create policy "anyone upload attachment" on storage.objects for insert
  to anon, authenticated with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = to_char(now(), 'YYYY-MM')
  );

drop policy if exists "admin read attachments" on storage.objects;
create policy "admin read attachments" on storage.objects for select
  to authenticated using (bucket_id = 'attachments' and public.is_admin());

-- حذف مرفقات الشكاوى (تنظيف ما لم يعد مطلوباً) — للإدارة فقط
drop policy if exists "admin delete attachments" on storage.objects;
create policy "admin delete attachments" on storage.objects for delete
  to authenticated using (bucket_id = 'attachments' and public.is_admin());
