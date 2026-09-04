import type { ComplaintKind, ComplaintStatus, SubmitterRole } from '@/types/db';

export const COMPLAINT_KINDS: Record<ComplaintKind, string> = {
  complaint: 'شكوى',
  suggestion: 'مقترح',
  request:    'طلب',
  inquiry:    'استفسار',
};

export const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; tone: string }> = {
  new:          { label: 'جديد',          tone: 'bg-navy-100 text-navy-800 border-navy-200' },
  under_review: { label: 'قيد المراجعة',  tone: 'bg-brass-100 text-brass-800 border-brass-200' },
  in_progress:  { label: 'قيد المعالجة',  tone: 'bg-brass-100 text-brass-800 border-brass-200' },
  answered:     { label: 'تم الرد',        tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  resolved:     { label: 'تم الحل',        tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  closed:       { label: 'مغلق',           tone: 'bg-steel-100 text-steel-700 border-steel-200' },
  rejected:     { label: 'مرفوض',          tone: 'bg-ember-50 text-ember-800 border-ember-200' },
};

export const SUBMITTER_ROLES: Record<SubmitterRole, string> = {
  parent:  'ولي أمر',
  student: 'طالب',
  teacher: 'مدرس',
  staff:   'موظف',
  other:   'أخرى',
};

export const ATTENDANCE_STATUS: Record<string, string> = {
  present: 'حضور',
  absent:  'غياب',
  excused: 'غياب بعذر',
  late:    'تأخير',
};

/** ترتيب مراحل معالجة الطلب — يُستخدم في شريط التتبع */
export const COMPLAINT_FLOW: ComplaintStatus[] = ['new', 'under_review', 'in_progress', 'answered', 'resolved', 'closed'];

export const PLACEHOLDER_TEXT = '[يتم تحديث هذه البيانات من لوحة الإدارة]';

/** أعمدة قالب Excel لاستيراد الطلاب والغياب */
export const EXCEL_COLUMNS = [
  { key: 'student_code',      header: 'Student_ID',             required: true,  hint: 'كود الطالب — إجباري ومفتاح المطابقة' },
  { key: 'national_id',       header: 'National_ID',            required: false, hint: 'الرقم القومي (14 رقماً)' },
  { key: 'full_name',         header: 'Student_Name',           required: true,  hint: 'اسم الطالب رباعياً' },
  { key: 'grade_id',          header: 'Grade',                  required: false, hint: 'رقم الصف: 1 أو 2 أو 3' },
  { key: 'specialization',    header: 'Specialization',         required: false, hint: 'اسم التخصص كما هو مسجَّل بالمنصة' },
  { key: 'academic_year',     header: 'Academic_Year',          required: false, hint: 'مثال: 2026/2027' },
  { key: 'guardian_name',     header: 'Guardian_Name',          required: false, hint: 'اسم ولي الأمر' },
  { key: 'guardian_phone',    header: 'Guardian_Phone',         required: false, hint: 'رقم هاتف ولي الأمر' },
  { key: 'attendance_days',   header: 'Attendance_Days',        required: false, hint: 'عدد أيام الحضور' },
  { key: 'absence_days',      header: 'Absence_Days',           required: false, hint: 'عدد أيام الغياب' },
  { key: 'total_school_days', header: 'Total_School_Days',      required: false, hint: 'إجمالي أيام الدراسة (يُحسب تلقائياً إن تُرك فارغاً)' },
  { key: 'absence_date',      header: 'Absence_Date',           required: false, hint: 'تاريخ يوم غياب واحد (YYYY-MM-DD) — صف لكل يوم' },
  { key: 'section',           header: 'Section',                required: false, hint: 'نظري / عملي / ورش الشركة' },
  { key: 'reason',            header: 'Reason',                 required: false, hint: 'سبب الغياب إن وُجد' },
] as const;

export type ExcelColumnKey = (typeof EXCEL_COLUMNS)[number]['key'];
