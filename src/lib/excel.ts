/**
 * ═══════════════════════════════════════════════════════════════
 *  أدوات Excel — تعتمد على SheetJS (xlsx) وهي مكتبة مجانية مفتوحة المصدر.
 *  تعمل بالكامل داخل متصفح المستخدم: لا يُرفع أي ملف إلى خدمة خارجية.
 * ═══════════════════════════════════════════════════════════════
 */
import * as XLSX from 'xlsx';
import { EXCEL_COLUMNS } from './constants';
import { digitsOnly, toLatinDigits } from './format';

/* ─────────────────────────── تصدير عام ─────────────────────────── */

export function exportRows(
  rows: Array<Record<string, unknown>>,
  fileName: string,
  sheetName = 'البيانات',
) {
  const ws = XLSX.utils.json_to_sheet(rows);
  // عرض أعمدة معقول بدل العرض الافتراضي الضيق
  const headers = Object.keys(rows[0] ?? {});
  ws['!cols'] = headers.map((h) => ({
    wch: Math.min(42, Math.max(12, h.length + 4,
      ...rows.slice(0, 200).map((r) => String(r[h] ?? '').length + 2))),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName, { compression: true });
}

export function exportCsv(rows: Array<Record<string, unknown>>, fileName: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  // BOM حتى تفتح العربية صحيحةً في Excel
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────── قالب استيراد الطلاب ─────────────────────── */

export function downloadStudentsTemplate() {
  const headers = EXCEL_COLUMNS.map((c) => c.header);

  // صف مثال يوضّح الصيغة المطلوبة لكل عمود
  const sample: Record<string, string> = {
    Student_ID: 'TRB-1001',
    National_ID: '30101011234567',
    Student_Name: 'محمد أحمد محمود علي',
    Grade: '1',
    Specialization: 'اللحام والقطع بالغاز',
    Academic_Year: '2026/2027',
    Guardian_Name: 'أحمد محمود علي',
    Guardian_Phone: '01000000000',
    Attendance_Days: '110',
    Absence_Days: '10',
    Total_School_Days: '120',
    Absence_Date: '2026-10-05',
    Section: 'نظري',
    Reason: 'عذر مرضي',
  };

  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet([sample], { header: headers });
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(16, h.length + 6) }));
  XLSX.utils.book_append_sheet(wb, ws, 'بيانات الطلاب');

  // ورقة تعليمات — تجعل القالب مفهوماً لغير المتخصص
  const guide = EXCEL_COLUMNS.map((c) => ({
    'اسم العمود': c.header,
    'إلزامي؟': c.required ? 'نعم' : 'لا',
    'الشرح': c.hint,
  }));
  const wsGuide = XLSX.utils.json_to_sheet(guide);
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'تعليمات');

  XLSX.writeFile(wb, 'قالب-بيانات-الطلاب-والغياب.xlsx');
}

/* ─────────────────────── قراءة ملف الاستيراد ─────────────────────── */

export interface ParsedRow {
  index: number;                      // رقم الصف داخل الملف (يبدأ من 2 لوجود العناوين)
  data: Record<string, string>;       // القيم بمفاتيح قاعدة البيانات
  errors: string[];                   // أخطاء التحقق لهذا الصف
}

export interface ParseResult {
  rows: ParsedRow[];
  validRows: ParsedRow[];
  invalidRows: ParsedRow[];
  missingColumns: string[];
  extraColumns: string[];
  fileName: string;
}

const HEADER_TO_KEY = new Map(EXCEL_COLUMNS.map((c) => [c.header.toLowerCase(), c.key as string]));

/** تطبيع اسم العمود ليقبل اختلاف حالة الأحرف والمسافات */
const normHeader = (h: string) => String(h ?? '').trim().toLowerCase().replace(/\s+/g, '_');

function excelDateToIso(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    // أرقام تواريخ Excel التسلسلية
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return '';
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = toLatinDigits(String(v).trim());
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`;
  return '';
}

export async function parseStudentsFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('الملف لا يحتوي على أي ورقة بيانات.');

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true });
  if (raw.length === 0) throw new Error('ورقة البيانات فارغة — لا توجد صفوف للاستيراد.');

  const fileHeaders = Object.keys(raw[0]).map(normHeader);
  const knownHeaders = EXCEL_COLUMNS.map((c) => normHeader(c.header));

  const missingColumns = EXCEL_COLUMNS
    .filter((c) => c.required && !fileHeaders.includes(normHeader(c.header)))
    .map((c) => c.header);

  const extraColumns = Object.keys(raw[0])
    .filter((h) => !knownHeaders.includes(normHeader(h)) && String(h).trim() !== '');

  const rows: ParsedRow[] = raw.map((r, i) => {
    const data: Record<string, string> = {};
    for (const [rawKey, rawVal] of Object.entries(r)) {
      const key = HEADER_TO_KEY.get(String(rawKey).trim().toLowerCase())
               ?? HEADER_TO_KEY.get(normHeader(rawKey).replace(/_/g, ' '));
      if (!key) continue;
      data[key] = String(rawVal ?? '').trim();
    }

    // تطبيع القيم
    if (data.national_id)    data.national_id  = digitsOnly(data.national_id);
    if (data.grade_id)       data.grade_id     = digitsOnly(data.grade_id);
    if (data.attendance_days)   data.attendance_days   = digitsOnly(data.attendance_days);
    if (data.absence_days)      data.absence_days      = digitsOnly(data.absence_days);
    if (data.total_school_days) data.total_school_days = digitsOnly(data.total_school_days);
    if (data.guardian_phone) data.guardian_phone = digitsOnly(data.guardian_phone);
    if (data.absence_date !== undefined) {
      const original = (r as any)[Object.keys(r).find((k) => HEADER_TO_KEY.get(String(k).trim().toLowerCase()) === 'absence_date') ?? ''];
      data.absence_date = excelDateToIso(original ?? data.absence_date);
    }

    const errors: string[] = [];
    if (!data.student_code) errors.push('كود الطالب مفقود');
    if (!data.full_name)    errors.push('اسم الطالب مفقود');
    if (data.national_id && data.national_id.length !== 14) errors.push('الرقم القومي يجب أن يكون 14 رقماً');
    if (data.grade_id && !['1', '2', '3'].includes(data.grade_id)) errors.push('الصف يجب أن يكون 1 أو 2 أو 3');
    const att = Number(data.attendance_days || 0);
    const abs = Number(data.absence_days || 0);
    const tot = Number(data.total_school_days || 0);
    if (data.attendance_days && !Number.isFinite(att)) errors.push('أيام الحضور ليست رقماً');
    if (data.absence_days && !Number.isFinite(abs)) errors.push('أيام الغياب ليست رقماً');
    if (tot > 0 && att + abs > tot) errors.push('مجموع الحضور والغياب أكبر من إجمالي أيام الدراسة');

    return { index: i + 2, data, errors };
  });

  // اكتشاف تكرار كود الطالب داخل الملف نفسه (خارج صفوف تواريخ الغياب المتعددة)
  const seen = new Map<string, number>();
  rows.forEach((row) => {
    const code = row.data.student_code;
    if (!code) return;
    if (seen.has(code) && !row.data.absence_date) {
      row.errors.push(`كود الطالب مكرر داخل الملف (الصف ${seen.get(code)})`);
    } else if (!seen.has(code)) {
      seen.set(code, row.index);
    }
  });

  return {
    rows,
    validRows: rows.filter((r) => r.errors.length === 0),
    invalidRows: rows.filter((r) => r.errors.length > 0),
    missingColumns,
    extraColumns,
    fileName: file.name,
  };
}

/** تقرير أخطاء الاستيراد كملف Excel قابل للتحميل */
export function downloadErrorReport(rows: ParsedRow[], fileName = 'تقرير-أخطاء-الاستيراد.xlsx') {
  const data = rows.map((r) => ({
    'رقم الصف': r.index,
    'كود الطالب': r.data.student_code ?? '',
    'اسم الطالب': r.data.full_name ?? '',
    'الأخطاء': r.errors.join(' · '),
  }));
  exportRows(data.length ? data : [{ 'رقم الصف': '', 'كود الطالب': '', 'اسم الطالب': '', 'الأخطاء': 'لا توجد أخطاء' }],
    fileName, 'الأخطاء');
}
