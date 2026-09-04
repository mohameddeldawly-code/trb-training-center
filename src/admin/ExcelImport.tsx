import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, CheckCircle2, Download, FileSpreadsheet, FileUp, RotateCcw, Upload,
} from 'lucide-react';
import clsx from 'clsx';
import { AdminPage } from './AdminPage';
import { Button } from '@/components/ui/Button';
import { Alert, EmptyState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { fetchImportBatches, importStudentsAttendance } from '@/data/api';
import {
  downloadErrorReport, downloadStudentsTemplate, parseStudentsFile, type ParseResult,
} from '@/lib/excel';
import { EXCEL_COLUMNS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { ImportResult } from '@/types/db';

const STEPS = [
  'تحميل القالب',
  'تعبئة البيانات',
  'رفع الملف',
  'التحقق',
  'المعاينة',
  'تأكيد الاستيراد',
  'تقرير النتيجة',
];

export default function ExcelImport() {
  useSeo({ title: 'استيراد وتصدير Excel', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const batches = useQuery({ queryKey: ['import-batches'], queryFn: () => fetchImportBatches(10) });

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setParsing(true); setResult(null);
    try {
      const p = await parseStudentsFile(file);
      setParsed(p);
      setStep(p.missingColumns.length ? 3 : 4);
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر قراءة الملف', description: e instanceof Error ? e.message : undefined });
      setParsed(null);
    } finally { setParsing(false); }
  };

  const confirmImport = async () => {
    if (!parsed) return;
    setImporting(true);
    try {
      const res = await importStudentsAttendance(parsed.validRows.map((r) => r.data), parsed.fileName);
      setResult(res);
      setStep(6);
      void qc.invalidateQueries({ queryKey: ['students'] });
      void qc.invalidateQueries({ queryKey: ['import-batches'] });
      void qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.push({ tone: 'success', title: 'اكتمل الاستيراد' });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر الاستيراد', description: e instanceof Error ? e.message : undefined });
    } finally { setImporting(false); }
  };

  const reset = () => { setParsed(null); setResult(null); setStep(0); };

  return (
    <AdminPage title="استيراد وتصدير بيانات Excel"
      description="ارفع بيانات الطلاب والغياب دفعةً واحدة. النظام يتحقق من الأعمدة والبيانات ويعرض معاينة قبل الحفظ، ويُحدِّث السجلات الموجودة بدل تكرارها.">

      {/* شريط الخطوات */}
      <ol className="flex flex-wrap gap-2" aria-label="خطوات الاستيراد">
        {STEPS.map((s, i) => (
          <li key={s} className={clsx('flex min-w-[110px] flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold',
            i < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : i === step ? 'border-navy-700 bg-navy-700 text-white'
            : 'border-steel-200 bg-white text-steel-400')}>
            <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]',
              i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-white/20 text-white' : 'bg-steel-100 text-steel-500')}>
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* الخطوة 1 و2 */}
          <section className="card p-6">
            <h2 className="mb-2 text-[17px]">١ — حمّل القالب واملأه</h2>
            <p className="mb-5 text-[14px] leading-7 text-steel-600">
              حمّل ملف Excel الجاهز، وستجد فيه ورقة «بيانات الطلاب» بالأعمدة المطلوبة، وورقة «تعليمات» تشرح كل عمود.
              املأ البيانات ثم ارفع الملف في الخطوة التالية.
            </p>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />}
              onClick={() => { downloadStudentsTemplate(); setStep(Math.max(step, 2)); }}>
              تحميل قالب Excel
            </Button>

            <details className="mt-5 rounded-xl border border-steel-200 p-4">
              <summary className="cursor-pointer text-[13.5px] font-semibold text-navy-800">عرض الأعمدة المطلوبة</summary>
              <ul className="mt-3 space-y-1.5 text-[13px] text-steel-600">
                {EXCEL_COLUMNS.map((c) => (
                  <li key={c.key}>
                    <span className="font-mono font-bold text-navy-800" dir="ltr">{c.header}</span>
                    {c.required && <span className="mr-2 rounded bg-ember-50 px-1.5 py-0.5 text-[11px] font-bold text-ember-700">إجباري</span>}
                    {' — '}{c.hint}
                  </li>
                ))}
              </ul>
            </details>
          </section>

          {/* الخطوة 3 */}
          <section className="card p-6">
            <h2 className="mb-2 text-[17px]">٢ — ارفع الملف</h2>
            <label className="mt-4 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-steel-300 bg-steel-50 px-6 py-12 text-center transition hover:border-navy-400 hover:bg-navy-50/40">
              <FileUp className="h-10 w-10 text-steel-400" aria-hidden />
              <span className="text-[15px] font-semibold text-navy-800">
                {parsing ? 'جارٍ قراءة الملف…' : parsed ? parsed.fileName : 'اختر ملف Excel أو CSV'}
              </span>
              <span className="text-[13px] text-steel-500">xlsx · xls · csv</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" disabled={parsing}
                onChange={(e) => void onFile(e.target.files?.[0])} />
            </label>
          </section>

          {/* الخطوة 4 و5 — التحقق والمعاينة */}
          {parsed && (
            <section className="card p-6">
              <h2 className="mb-4 text-[17px]">٣ — نتيجة التحقق والمعاينة</h2>

              {parsed.missingColumns.length > 0 && (
                <Alert tone="danger" title="أعمدة إجبارية مفقودة">
                  الملف لا يحتوي على: {parsed.missingColumns.join(' · ')}. صحّح الملف وأعد رفعه.
                </Alert>
              )}
              {parsed.extraColumns.length > 0 && (
                <div className="mt-3">
                  <Alert tone="warning" title="أعمدة غير معروفة (سيتم تجاهلها)">
                    {parsed.extraColumns.join(' · ')}
                  </Alert>
                </div>
              )}

              <div className="my-5 grid gap-3 sm:grid-cols-3">
                {[
                  { l: 'إجمالي الصفوف', v: parsed.rows.length, tone: 'bg-navy-50 text-navy-800' },
                  { l: 'صفوف صالحة', v: parsed.validRows.length, tone: 'bg-emerald-50 text-emerald-800' },
                  { l: 'صفوف بها أخطاء', v: parsed.invalidRows.length, tone: 'bg-ember-50 text-ember-800' },
                ].map((s) => (
                  <div key={s.l} className={clsx('rounded-xl p-4 text-center', s.tone)}>
                    <p className="font-display text-[26px] font-bold leading-none">{s.v}</p>
                    <p className="mt-1.5 text-[13px] font-semibold">{s.l}</p>
                  </div>
                ))}
              </div>

              {parsed.invalidRows.length > 0 && (
                <div className="mb-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-[15px] text-ember-800">
                      <AlertTriangle className="h-4 w-4" aria-hidden /> الصفوف التي بها أخطاء (لن تُستورد)
                    </h3>
                    <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />}
                      onClick={() => downloadErrorReport(parsed.invalidRows)}>
                      تحميل تقرير الأخطاء
                    </Button>
                  </div>
                  <Table>
                    <thead><tr><Th>الصف</Th><Th>الكود</Th><Th>الاسم</Th><Th>الأخطاء</Th></tr></thead>
                    <tbody>
                      {parsed.invalidRows.slice(0, 20).map((r) => (
                        <tr key={r.index}>
                          <Td className="text-steel-500">{r.index}</Td>
                          <Td dir="ltr">{r.data.student_code || '—'}</Td>
                          <Td>{r.data.full_name || '—'}</Td>
                          <Td className="text-ember-700">{r.errors.join(' · ')}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {parsed.invalidRows.length > 20 && (
                    <p className="mt-2 text-[12.5px] text-steel-500">
                      يُعرض أول 20 صفاً — حمّل تقرير الأخطاء لرؤية الباقي.
                    </p>
                  )}
                </div>
              )}

              {parsed.validRows.length > 0 && (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-[15px] text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> معاينة البيانات التي ستُستورد
                  </h3>
                  <Table>
                    <thead>
                      <tr><Th>الكود</Th><Th>الاسم</Th><Th>الصف</Th><Th>التخصص</Th><Th>حضور</Th><Th>غياب</Th><Th>تاريخ غياب</Th></tr>
                    </thead>
                    <tbody>
                      {parsed.validRows.slice(0, 15).map((r) => (
                        <tr key={r.index}>
                          <Td dir="ltr" className="font-mono text-[13px]">{r.data.student_code}</Td>
                          <Td className="font-semibold">{r.data.full_name}</Td>
                          <Td>{r.data.grade_id || '—'}</Td>
                          <Td className="text-steel-600">{r.data.specialization || '—'}</Td>
                          <Td>{r.data.attendance_days || '—'}</Td>
                          <Td>{r.data.absence_days || '—'}</Td>
                          <Td>{r.data.absence_date || '—'}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  {parsed.validRows.length > 15 && (
                    <p className="mt-2 text-[12.5px] text-steel-500">
                      يُعرض أول 15 صفاً من {parsed.validRows.length}.
                    </p>
                  )}
                </>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-steel-200 pt-5">
                <Button size="lg" loading={importing} icon={<Upload className="h-[18px] w-[18px]" />}
                  disabled={parsed.validRows.length === 0 || parsed.missingColumns.length > 0}
                  onClick={() => void confirmImport()}>
                  تأكيد استيراد {parsed.validRows.length} سجل
                </Button>
                <Button variant="secondary" onClick={reset} icon={<RotateCcw className="h-4 w-4" />}>البدء من جديد</Button>
              </div>

              <p className="mt-4 text-[12.5px] leading-6 text-steel-500">
                يُنفَّذ الاستيراد بأسلوب Upsert: السجل الموجود بنفس كود الطالب يُحدَّث، والجديد يُضاف — فلا تتكرر السجلات.
              </p>
            </section>
          )}

          {/* الخطوة 7 — تقرير النتيجة */}
          {result && (
            <section className="card overflow-hidden">
              <div className="bg-emerald-50 px-6 py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" aria-hidden />
                <h2 className="text-[19px] text-emerald-900">اكتمل الاستيراد بنجاح</h2>
              </div>
              <div className="grid gap-3 p-6 sm:grid-cols-3">
                {[
                  { l: 'سجل تمت إضافته', v: result.inserted, tone: 'bg-emerald-50 text-emerald-800' },
                  { l: 'سجل تم تحديثه', v: result.updated, tone: 'bg-navy-50 text-navy-800' },
                  { l: 'سجل فشل', v: result.failed, tone: 'bg-ember-50 text-ember-800' },
                ].map((s) => (
                  <div key={s.l} className={clsx('rounded-xl p-5 text-center', s.tone)}>
                    <p className="font-display text-[30px] font-bold leading-none">{s.v}</p>
                    <p className="mt-2 text-[13px] font-semibold">{s.l}</p>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div className="px-6 pb-6">
                  <Alert tone="warning" title="سجلات لم تُستورد">
                    <ul className="mt-2 space-y-1">
                      {result.errors.slice(0, 10).map((e, i) => (
                        <li key={i}>الصف {e.row} ({e.student_code ?? '—'}): {e.error}</li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              )}
              <div className="border-t border-steel-200 px-6 py-4">
                <Button variant="secondary" onClick={reset} icon={<RotateCcw className="h-4 w-4" />}>استيراد ملف آخر</Button>
              </div>
            </section>
          )}
        </div>

        {/* سجل عمليات الاستيراد */}
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-[16px]">
              <FileSpreadsheet className="h-5 w-5 text-navy-700" aria-hidden /> آخر عمليات الاستيراد
            </h2>
            {batches.isLoading ? <SkeletonRows rows={4} />
              : batches.data?.length ? (
                <ul className="space-y-3">
                  {batches.data.map((b) => (
                    <li key={b.id} className="rounded-xl border border-steel-200 p-3.5">
                      <p className="truncate text-[13.5px] font-semibold text-navy-900">{b.file_name ?? 'بدون اسم'}</p>
                      <p className="mt-1 text-[12px] text-steel-500">{formatDateTime(b.created_at)}</p>
                      <p className="mt-2 flex flex-wrap gap-2 text-[12px]">
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">+{b.rows_inserted}</span>
                        <span className="rounded bg-navy-50 px-2 py-0.5 text-navy-700">↻{b.rows_updated}</span>
                        {b.rows_failed > 0 && <span className="rounded bg-ember-50 px-2 py-0.5 text-ember-700">✕{b.rows_failed}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState title="لا توجد عمليات سابقة" className="py-8" />}
          </div>

          <Alert tone="info" title="تصدير البيانات">
            تصدير بيانات الطلاب والحضور من صفحة «الطلاب والحضور»، وتصدير الشكاوى من صفحة «الشكاوى والمقترحات» —
            بصيغتي Excel و CSV.
          </Alert>
        </aside>
      </div>
    </AdminPage>
  );
}
