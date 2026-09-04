/** أدوات تنسيق عربية موحّدة */

const AR_DATE = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
const AR_DATE_SHORT = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
const AR_DATETIME = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export const formatDate = (v?: string | null) => (v ? AR_DATE.format(new Date(v)) : '—');
export const formatDateShort = (v?: string | null) => (v ? AR_DATE_SHORT.format(new Date(v)) : '—');
export const formatDateTime = (v?: string | null) => (v ? AR_DATETIME.format(new Date(v)) : '—');

export const formatNumber = (n?: number | null) =>
  n === null || n === undefined ? '—' : new Intl.NumberFormat('ar-EG').format(n);

export const formatPercent = (n?: number | null) =>
  n === null || n === undefined ? '—' : `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 1 }).format(n)}%`;

export const formatFileSize = (kb?: number | null) => {
  if (!kb) return '—';
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} ميجابايت` : `${Math.round(kb)} كيلوبايت`;
};

/** تحويل الأرقام العربية-الهندية إلى لاتينية قبل الحفظ أو البحث */
export const toLatinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
   .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

export const digitsOnly = (s: string) => toLatinDigits(s).replace(/\D/g, '');

/** تطبيع نص عربي للبحث (إزالة التشكيل وتوحيد الألف والهاء) */
export const normalizeArabic = (s: string) =>
  toLatinDigits(s)
    .replace(/[ً-ْٰ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const slugify = (s: string) =>
  s.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').slice(0, 80).toLowerCase();
