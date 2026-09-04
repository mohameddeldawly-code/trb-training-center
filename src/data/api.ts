/**
 * ═══════════════════════════════════════════════════════════════
 *  طبقة الوصول للبيانات (Data Layer)
 *  كل استعلام يمر من هنا فقط — لا تستدعي supabase مباشرةً من الواجهات.
 *  هذا يجعل تبديل مزوّد قاعدة البيانات مستقبلاً تعديلاً في هذا الملف وحده.
 * ═══════════════════════════════════════════════════════════════
 */
import { supabase } from '@/lib/supabase';
import { extractYouTubeId } from '@/lib/youtube';
import type {
  Book, Complaint, ComplaintUpdate, ContentKind, GalleryItem, Grade, ImportResult,
  ParentPortalResult, Post, SiteSetting, Specialization, Student, StudyPlan, Subject, Video,
  AdminUser, AttendanceSummary,
} from '@/types/db';

class DataError extends Error {
  constructor(message: string, public cause?: unknown) { super(message); this.name = 'DataError'; }
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new DataError(`تعذّر ${what}: ${res.error.message}`, res.error);
  return res.data as T;
}

/* ───────────────────────────── الإعدادات ───────────────────────────── */
export type SettingsMap = Record<string, any>;

export async function fetchSettings(): Promise<{ map: SettingsMap; rows: SiteSetting[] }> {
  const res = await supabase.from('site_settings').select('*').order('group_name').order('sort_order');
  const rows = unwrap(res, 'تحميل إعدادات الموقع') as SiteSetting[];
  const map: SettingsMap = {};
  rows.forEach((r) => { map[r.key] = r.value; });
  return { map, rows };
}

export async function updateSetting(key: string, value: unknown) {
  const res = await supabase.from('site_settings').update({ value }).eq('key', key).select().single();
  return unwrap(res, 'حفظ الإعداد');
}

export async function updateSettings(entries: Array<{ key: string; value: unknown }>) {
  for (const e of entries) await updateSetting(e.key, e.value);
}

/* ───────────────────────────── الصفوف ───────────────────────────── */
export async function fetchGrades(): Promise<Grade[]> {
  const res = await supabase.from('grades').select('*').eq('is_active', true).order('sort_order');
  return unwrap(res, 'تحميل الصفوف') as Grade[];
}

/* ───────────────────────────── التخصصات ───────────────────────────── */
export async function fetchSpecializations(includeUnpublished = false): Promise<Specialization[]> {
  let q = supabase.from('specializations').select('*').order('sort_order');
  if (!includeUnpublished) q = q.eq('is_published', true);
  return unwrap(await q, 'تحميل التخصصات') as Specialization[];
}

export async function fetchSpecializationBySlug(slug: string): Promise<Specialization | null> {
  const res = await supabase.from('specializations').select('*').eq('slug', slug).maybeSingle();
  return unwrap(res, 'تحميل بيانات التخصص') as Specialization | null;
}

export async function saveSpecialization(row: Partial<Specialization>) {
  const payload = { ...row };
  const res = row.id
    ? await supabase.from('specializations').update(payload).eq('id', row.id).select().single()
    : await supabase.from('specializations').insert(payload).select().single();
  return unwrap(res, 'حفظ التخصص') as Specialization;
}

export async function deleteSpecialization(id: string) {
  const res = await supabase.from('specializations').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف التخصص: ${res.error.message}`);
}

export async function reorder(table: string, items: Array<{ id: string; sort_order: number }>) {
  for (const it of items) {
    const res = await supabase.from(table).update({ sort_order: it.sort_order }).eq('id', it.id);
    if (res.error) throw new DataError(`تعذّر إعادة الترتيب: ${res.error.message}`);
  }
}

/* ───────────────────────────── المواد وخطط الدراسة ───────────────────────────── */
export async function fetchSubjects(params?: { gradeId?: number; specializationId?: string | null }): Promise<Subject[]> {
  let q = supabase.from('subjects').select('*').order('is_common', { ascending: false }).order('sort_order');
  if (params?.gradeId) q = q.eq('grade_id', params.gradeId);
  if (params?.specializationId !== undefined && params.specializationId !== null) {
    q = q.or(`specialization_id.eq.${params.specializationId},is_common.eq.true`);
  }
  return unwrap(await q, 'تحميل المواد الدراسية') as Subject[];
}

export async function saveSubject(row: Partial<Subject>) {
  const res = row.id
    ? await supabase.from('subjects').update(row).eq('id', row.id).select().single()
    : await supabase.from('subjects').insert(row).select().single();
  return unwrap(res, 'حفظ المادة') as Subject;
}

export async function deleteSubject(id: string) {
  const res = await supabase.from('subjects').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف المادة: ${res.error.message}`);
}

export async function fetchStudyPlans(specializationId: string): Promise<StudyPlan[]> {
  const res = await supabase.from('study_plans').select('*')
    .eq('specialization_id', specializationId).order('grade_id');
  return unwrap(res, 'تحميل خطة الدراسة') as StudyPlan[];
}

export async function saveStudyPlan(row: Partial<StudyPlan>) {
  const res = row.id
    ? await supabase.from('study_plans').update(row).eq('id', row.id).select().single()
    : await supabase.from('study_plans').insert(row).select().single();
  return unwrap(res, 'حفظ خطة الدراسة') as StudyPlan;
}

/* ───────────────────────────── المكتبة والكتب ───────────────────────────── */
export interface BookFilters {
  gradeId?: number | null; subjectId?: string | null; specializationId?: string | null;
  search?: string; includeUnpublished?: boolean; page?: number; pageSize?: number;
}

export async function fetchBooks(f: BookFilters = {}): Promise<{ rows: Book[]; count: number }> {
  const page = f.page ?? 1;
  const size = f.pageSize ?? 24;
  let q = supabase.from('books').select('*', { count: 'exact' }).order('sort_order').order('created_at', { ascending: false });
  if (!f.includeUnpublished) q = q.eq('is_published', true);
  if (f.gradeId) q = q.eq('grade_id', f.gradeId);
  if (f.subjectId) q = q.eq('subject_id', f.subjectId);
  if (f.specializationId) q = q.eq('specialization_id', f.specializationId);
  if (f.search?.trim()) q = q.or(`title.ilike.%${f.search.trim()}%,description.ilike.%${f.search.trim()}%,author.ilike.%${f.search.trim()}%`);
  q = q.range((page - 1) * size, page * size - 1);
  const res = await q;
  if (res.error) throw new DataError(`تعذّر تحميل الكتب: ${res.error.message}`);
  return { rows: (res.data ?? []) as Book[], count: res.count ?? 0 };
}

export async function fetchBook(id: string): Promise<Book | null> {
  const res = await supabase.from('books').select('*').eq('id', id).maybeSingle();
  return unwrap(res, 'تحميل الكتاب') as Book | null;
}

export async function saveBook(row: Partial<Book>) {
  const res = row.id
    ? await supabase.from('books').update(row).eq('id', row.id).select().single()
    : await supabase.from('books').insert(row).select().single();
  return unwrap(res, 'حفظ الكتاب') as Book;
}

export async function deleteBook(id: string) {
  const res = await supabase.from('books').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف الكتاب: ${res.error.message}`);
}

/* ───────────────────────────── الفيديوهات ───────────────────────────── */
export async function fetchVideos(f: { gradeId?: number | null; specializationId?: string | null; subjectId?: string | null; includeUnpublished?: boolean; limit?: number } = {}): Promise<Video[]> {
  let q = supabase.from('videos').select('*').order('sort_order').order('created_at', { ascending: false });
  if (!f.includeUnpublished) q = q.eq('is_published', true);
  if (f.gradeId) q = q.eq('grade_id', f.gradeId);
  if (f.specializationId) q = q.eq('specialization_id', f.specializationId);
  if (f.subjectId) q = q.eq('subject_id', f.subjectId);
  if (f.limit) q = q.limit(f.limit);
  return unwrap(await q, 'تحميل الفيديوهات') as Video[];
}

export async function saveVideo(row: Partial<Video>) {
  const payload = { ...row, youtube_id: extractYouTubeId(row.youtube_url) };
  const res = row.id
    ? await supabase.from('videos').update(payload).eq('id', row.id).select().single()
    : await supabase.from('videos').insert(payload).select().single();
  return unwrap(res, 'حفظ الفيديو') as Video;
}

export async function deleteVideo(id: string) {
  const res = await supabase.from('videos').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف الفيديو: ${res.error.message}`);
}

/* ───────────────────────────── الأخبار والإعلانات والتعليمات ───────────────────────────── */
export async function fetchPosts(f: { kind?: ContentKind; limit?: number; includeUnpublished?: boolean; pinnedFirst?: boolean } = {}): Promise<Post[]> {
  let q = supabase.from('posts').select('*');
  if (f.kind) q = q.eq('kind', f.kind);
  if (!f.includeUnpublished) q = q.eq('is_published', true);
  q = f.pinnedFirst === false
    ? q.order('published_at', { ascending: false })
    : q.order('is_pinned', { ascending: false }).order('published_at', { ascending: false });
  if (f.limit) q = q.limit(f.limit);
  return unwrap(await q, 'تحميل المحتوى') as Post[];
}

export async function fetchPost(idOrSlug: string): Promise<Post | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
  const res = await supabase.from('posts').select('*')
    .eq(isUuid ? 'id' : 'slug', idOrSlug).maybeSingle();
  return unwrap(res, 'تحميل الموضوع') as Post | null;
}

export async function savePost(row: Partial<Post>) {
  const res = row.id
    ? await supabase.from('posts').update(row).eq('id', row.id).select().single()
    : await supabase.from('posts').insert(row).select().single();
  return unwrap(res, 'حفظ الموضوع') as Post;
}

export async function deletePost(id: string) {
  const res = await supabase.from('posts').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر الحذف: ${res.error.message}`);
}

/* ───────────────────────────── معرض الصور ───────────────────────────── */
export async function fetchGallery(f: { specializationId?: string | null; limit?: number; includeUnpublished?: boolean } = {}): Promise<GalleryItem[]> {
  let q = supabase.from('gallery_items').select('*').order('sort_order').order('created_at', { ascending: false });
  if (!f.includeUnpublished) q = q.eq('is_published', true);
  if (f.specializationId) q = q.eq('specialization_id', f.specializationId);
  if (f.limit) q = q.limit(f.limit);
  return unwrap(await q, 'تحميل معرض الصور') as GalleryItem[];
}

export async function saveGalleryItem(row: Partial<GalleryItem>) {
  const res = row.id
    ? await supabase.from('gallery_items').update(row).eq('id', row.id).select().single()
    : await supabase.from('gallery_items').insert(row).select().single();
  return unwrap(res, 'حفظ الصورة') as GalleryItem;
}

export async function deleteGalleryItem(id: string) {
  const res = await supabase.from('gallery_items').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف الصورة: ${res.error.message}`);
}

/* ───────────────────────────── الشكاوى ───────────────────────────── */
export type NewComplaint = Pick<Complaint,
  'kind' | 'submitter_name' | 'submitter_role' | 'student_name' | 'student_code' |
  'phone' | 'email' | 'specialization_id' | 'subject' | 'details' | 'attachment_url'>;

/**
 * الإرسال يمر عبر دالة محكومة في قاعدة البيانات (submit_complaint) لا عبر INSERT مباشر.
 * السبب: PostgreSQL يطبّق سياسات SELECT على «INSERT ... RETURNING»، والزائر ليس له
 * سياسة قراءة على جدول الشكاوى — فالدالة هي الطريقة الوحيدة لإعادة الرقم المرجعي
 * دون فتح قراءة الجدول للجمهور. وهي كذلك تفرض حد المعدل على مستوى الخادم.
 */
export async function submitComplaint(row: NewComplaint): Promise<{ ticket_id: string }> {
  const res = await supabase.rpc('submit_complaint', {
    p_submitter_name:    row.submitter_name,
    p_phone:             row.phone,
    p_subject:           row.subject,
    p_details:           row.details,
    p_kind:              row.kind,
    p_submitter_role:    row.submitter_role,
    p_student_name:      row.student_name,
    p_student_code:      row.student_code,
    p_email:             row.email,
    p_specialization_id: row.specialization_id,
    p_attachment_url:    row.attachment_url,
  });
  if (res.error) throw new DataError(`تعذّر إرسال الطلب: ${res.error.message}`, res.error);
  return { ticket_id: res.data as string };
}

export async function trackComplaint(ticket: string, phone: string) {
  const res = await supabase.rpc('track_complaint', { p_ticket: ticket, p_phone: phone });
  if (res.error) throw new DataError(`تعذّر تتبع الطلب: ${res.error.message}`);
  return (res.data as any[])?.[0] ?? null;
}

export interface ComplaintFilters {
  status?: string; kind?: string; specializationId?: string; studentCode?: string;
  search?: string; from?: string; to?: string; page?: number; pageSize?: number;
}

export async function fetchComplaints(f: ComplaintFilters = {}): Promise<{ rows: Complaint[]; count: number }> {
  const page = f.page ?? 1;
  const size = f.pageSize ?? 25;
  let q = supabase.from('complaints').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (f.status) q = q.eq('status', f.status);
  if (f.kind) q = q.eq('kind', f.kind);
  if (f.specializationId) q = q.eq('specialization_id', f.specializationId);
  if (f.studentCode) q = q.ilike('student_code', `%${f.studentCode}%`);
  if (f.from) q = q.gte('created_at', f.from);
  if (f.to) q = q.lte('created_at', `${f.to}T23:59:59`);
  if (f.search?.trim()) {
    const s = f.search.trim();
    q = q.or(`ticket_id.ilike.%${s}%,submitter_name.ilike.%${s}%,subject.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  q = q.range((page - 1) * size, page * size - 1);
  const res = await q;
  if (res.error) throw new DataError(`تعذّر تحميل الشكاوى: ${res.error.message}`);
  return { rows: (res.data ?? []) as Complaint[], count: res.count ?? 0 };
}

export async function updateComplaint(id: string, patch: Partial<Complaint>) {
  const res = await supabase.from('complaints').update(patch).eq('id', id).select().single();
  return unwrap(res, 'تحديث الطلب') as Complaint;
}

export async function fetchComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
  const res = await supabase.from('complaint_updates').select('*')
    .eq('complaint_id', complaintId).order('created_at', { ascending: false });
  return unwrap(res, 'تحميل سجل الإجراءات') as ComplaintUpdate[];
}

export async function addComplaintNote(complaintId: string, note: string, isPublic = false) {
  const res = await supabase.from('complaint_updates')
    .insert({ complaint_id: complaintId, note, is_public: isPublic }).select().single();
  return unwrap(res, 'إضافة الملاحظة') as ComplaintUpdate;
}

/* ───────────────────────────── الطلاب والحضور ───────────────────────────── */
export async function fetchStudents(f: { search?: string; gradeId?: number | null; specializationId?: string | null; page?: number; pageSize?: number } = {}) {
  const page = f.page ?? 1;
  const size = f.pageSize ?? 25;
  let q = supabase.from('students').select('*, attendance_summaries(*)', { count: 'exact' }).order('student_code');
  if (f.gradeId) q = q.eq('grade_id', f.gradeId);
  if (f.specializationId) q = q.eq('specialization_id', f.specializationId);
  if (f.search?.trim()) {
    const s = f.search.trim();
    q = q.or(`full_name.ilike.%${s}%,student_code.ilike.%${s}%,national_id.ilike.%${s}%`);
  }
  q = q.range((page - 1) * size, page * size - 1);
  const res = await q;
  if (res.error) throw new DataError(`تعذّر تحميل الطلاب: ${res.error.message}`);
  return {
    rows: (res.data ?? []) as Array<Student & { attendance_summaries: AttendanceSummary[] }>,
    count: res.count ?? 0,
  };
}

export async function saveStudent(row: Partial<Student>) {
  const res = row.id
    ? await supabase.from('students').update(row).eq('id', row.id).select().single()
    : await supabase.from('students').insert(row).select().single();
  return unwrap(res, 'حفظ بيانات الطالب') as Student;
}

export async function deleteStudent(id: string) {
  const res = await supabase.from('students').delete().eq('id', id);
  if (res.error) throw new DataError(`تعذّر حذف الطالب: ${res.error.message}`);
}

export async function importStudentsAttendance(rows: unknown[], fileName?: string): Promise<ImportResult> {
  const res = await supabase.rpc('import_students_attendance', { p_rows: rows, p_file_name: fileName ?? null });
  if (res.error) throw new DataError(`تعذّر تنفيذ الاستيراد: ${res.error.message}`);
  return res.data as ImportResult;
}

export async function fetchImportBatches(limit = 20) {
  const res = await supabase.from('import_batches').select('*').order('created_at', { ascending: false }).limit(limit);
  return unwrap(res, 'تحميل سجل الاستيراد') as any[];
}

/* ───────────────────────────── بوابة ولي الأمر ───────────────────────────── */
export async function parentPortalLogin(studentCode: string, nationalId: string): Promise<ParentPortalResult> {
  const res = await supabase.rpc('parent_portal_login', {
    p_student_code: studentCode || null,
    p_national_id: nationalId || null,
  });
  if (res.error) throw new DataError(`تعذّر الدخول: ${res.error.message}`);
  return res.data as ParentPortalResult;
}

/* ───────────────────────────── الإحصائيات ───────────────────────────── */
export async function fetchPublicStats() {
  const res = await supabase.rpc('public_stats');
  if (res.error) return { specializations: 0, books: 0, videos: 0, students: 0, years: 3 };
  return res.data as Record<string, number>;
}

export async function fetchAdminStats() {
  const res = await supabase.rpc('admin_dashboard_stats');
  if (res.error) throw new DataError(`تعذّر تحميل الإحصائيات: ${res.error.message}`);
  return res.data as Record<string, number>;
}

/* ───────────────────────────── الملفات ───────────────────────────── */
export async function uploadFile(bucket: 'media' | 'books' | 'attachments', file: File, prefix = ''): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${prefix}${prefix ? '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const up = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false });
  if (up.error) throw new DataError(`تعذّر رفع الملف: ${up.error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* ───────────────────────────── الإدارة والصلاحيات ───────────────────────────── */
/**
 * قراءة سجل المدير بمعرّف المستخدم مباشرةً.
 * لا تستدعي supabase.auth هنا — المعرّف يأتي من الجلسة التي بيد المُستدعي،
 * وأي استدعاء لدوال المصادقة من داخل معالج تغيّر الحالة يسبب حلقة تحديث.
 */
export async function fetchAdminByUserId(userId: string): Promise<AdminUser | null> {
  const res = await supabase.from('admin_users').select('*').eq('user_id', userId).maybeSingle();
  if (res.error) return null;
  return (res.data as AdminUser | null) ?? null;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await supabase.from('admin_users').select('*').order('created_at');
  return unwrap(res, 'تحميل المستخدمين') as AdminUser[];
}

export async function updateAdminUser(userId: string, patch: Partial<AdminUser>) {
  const res = await supabase.from('admin_users').update(patch).eq('user_id', userId).select().single();
  return unwrap(res, 'تحديث المستخدم') as AdminUser;
}
