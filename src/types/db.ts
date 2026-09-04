/** أنواع البيانات — مطابقة لمخطط قاعدة البيانات (supabase/migrations) */

export type ContentKind      = 'news' | 'announcement' | 'instruction';
export type ComplaintKind    = 'complaint' | 'suggestion' | 'request' | 'inquiry';
export type ComplaintStatus  =
  | 'new' | 'under_review' | 'in_progress' | 'answered' | 'resolved' | 'closed' | 'rejected';
export type SubmitterRole    = 'parent' | 'student' | 'teacher' | 'staff' | 'other';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';
export type AdminRole        = 'super_admin' | 'editor' | 'complaints_officer' | 'student_affairs';

export interface Grade {
  id: number; name: string; short_name: string; sort_order: number; is_active: boolean;
}

export interface Specialization {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  summary: string | null;
  definition: string | null;
  importance: string | null;
  objectives: string[];
  skills: string[];
  training_nature: string | null;
  equipment: string[];
  career_paths: string[];
  learning_outcomes: string[];
  safety_ppe: string[];
  main_hazards: string[];
  cover_image_url: string | null;
  icon: string | null;
  accent_color: string | null;
  sort_order: number;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  grade_id: number;
  specialization_id: string | null;
  is_common: boolean;
  description: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface StudyPlan {
  id: string;
  specialization_id: string;
  grade_id: number;
  title: string | null;
  focus: string | null;
  theory_topics: string[];
  practical_topics: string[];
  notes: string | null;
  sort_order: number;
}

export interface Book {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  author: string | null;
  grade_id: number | null;
  subject_id: string | null;
  specialization_id: string | null;
  cover_image_url: string | null;
  pdf_url: string | null;
  file_size_kb: number | null;
  pages: number | null;
  allow_download: boolean;
  sort_order: number;
  is_published: boolean;
  views_count: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_id: string | null;
  playlist_url: string | null;
  thumbnail_url: string | null;
  grade_id: number | null;
  subject_id: string | null;
  specialization_id: string | null;
  duration_text: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  kind: ContentKind;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  album: string | null;
  specialization_id: string | null;
  sort_order: number;
  is_published: boolean;
}

export interface Student {
  id: string;
  student_code: string;
  national_id: string | null;
  full_name: string;
  grade_id: number | null;
  specialization_id: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  academic_year: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface AttendanceSummary {
  student_id: string;
  academic_year: string | null;
  total_school_days: number | null;
  attendance_days: number;
  absence_days: number;
  attendance_pct: number | null;
  absence_pct: number | null;
  last_updated: string;
}

export interface Complaint {
  id: string;
  ticket_id: string;
  kind: ComplaintKind;
  status: ComplaintStatus;
  submitter_name: string;
  submitter_role: SubmitterRole;
  student_name: string | null;
  student_code: string | null;
  phone: string;
  email: string | null;
  specialization_id: string | null;
  subject: string;
  details: string;
  attachment_url: string | null;
  internal_notes: string | null;
  response: string | null;
  responded_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus | null;
  note: string | null;
  is_public: boolean;
  created_at: string;
}

export interface AdminUser {
  user_id: string;
  full_name: string;
  email: string | null;
  role: AdminRole;
  is_active: boolean;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  group_name: string;
  label: string;
  input_type: string;
  sort_order: number;
  is_public: boolean;
}

/** نتيجة دخول بوابة ولي الأمر */
export interface ParentPortalResult {
  ok: boolean;
  error?: 'disabled' | 'missing_identifier' | 'both_required' | 'too_many_attempts' | 'not_found';
  student?: {
    full_name: string; student_code: string; grade: string | null;
    specialization: string | null; academic_year: string | null;
    status: string; guardian_name: string | null;
  };
  attendance?: {
    total_school_days: number | null; attendance_days: number; absence_days: number;
    attendance_pct: number | null; absence_pct: number | null; last_updated: string | null;
  };
  absences?: Array<{ date: string; status: AttendanceStatus; section: string | null; reason: string | null }>;
}

export interface ImportResult {
  ok: boolean;
  batch_id: string;
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; student_code?: string; error: string }>;
}
