import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileDown, Filter, MessageSquareWarning, Search, X } from 'lucide-react';
import clsx from 'clsx';
import { AdminPage } from './AdminPage';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Pagination, Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  addComplaintNote, fetchComplaintUpdates, fetchComplaints, fetchSpecializations, updateComplaint,
} from '@/data/api';
import { COMPLAINT_KINDS, COMPLAINT_STATUS, SUBMITTER_ROLES } from '@/lib/constants';
import { exportCsv, exportRows } from '@/lib/excel';
import { formatDateShort, formatDateTime } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { Complaint, ComplaintStatus } from '@/types/db';

const PAGE_SIZE = 25;

export default function ComplaintsAdmin() {
  useSeo({ title: 'إدارة الشكاوى', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ status: '', kind: '', specializationId: '', studentCode: '', search: '', from: '', to: '' });
  const [open, setOpen] = useState<Complaint | null>(null);
  const [exporting, setExporting] = useState(false);

  const specs = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const list  = useQuery({ queryKey: ['complaints', { ...f, page }], queryFn: () => fetchComplaints({ ...f, page, pageSize: PAGE_SIZE }) });
  const updates = useQuery({ queryKey: ['complaint-updates', open?.id], queryFn: () => fetchComplaintUpdates(open!.id), enabled: !!open });

  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['complaints'] }); void qc.invalidateQueries({ queryKey: ['complaint-updates'] }); void qc.invalidateQueries({ queryKey: ['admin-stats'] }); };

  const save = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Complaint> }) => updateComplaint(id, patch),
    onSuccess: (row) => { invalidate(); setOpen(row); toast.push({ tone: 'success', title: 'تم تحديث الطلب' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر التحديث', description: e instanceof Error ? e.message : undefined }),
  });

  const addNote = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => addComplaintNote(id, note),
    onSuccess: () => { invalidate(); toast.push({ tone: 'success', title: 'تمت إضافة الملاحظة' }); },
  });

  const specName = (id: string | null) => specs.data?.find((s) => s.id === id)?.name ?? '—';

  /** تصدير كل النتائج المطابقة للتصفية الحالية (لا الصفحة وحدها) */
  const doExport = async (kind: 'xlsx' | 'csv') => {
    setExporting(true);
    try {
      const all = await fetchComplaints({ ...f, page: 1, pageSize: 5000 });
      const rows = all.rows.map((c) => ({
        'الرقم المرجعي': c.ticket_id,
        'النوع': COMPLAINT_KINDS[c.kind],
        'الحالة': COMPLAINT_STATUS[c.status].label,
        'اسم مقدّم الطلب': c.submitter_name,
        'الصفة': SUBMITTER_ROLES[c.submitter_role],
        'اسم الطالب': c.student_name ?? '',
        'كود الطالب': c.student_code ?? '',
        'الهاتف': c.phone,
        'البريد الإلكتروني': c.email ?? '',
        'التخصص': specName(c.specialization_id),
        'الموضوع': c.subject,
        'التفاصيل': c.details,
        'الرد': c.response ?? '',
        'ملاحظات داخلية': c.internal_notes ?? '',
        'تاريخ التقديم': formatDateTime(c.created_at),
        'تاريخ الرد': c.responded_at ? formatDateTime(c.responded_at) : '',
        'تاريخ الإغلاق': c.closed_at ? formatDateTime(c.closed_at) : '',
      }));
      if (rows.length === 0) { toast.push({ tone: 'warning', title: 'لا توجد بيانات للتصدير' }); return; }
      const name = `الشكاوى-والمقترحات-${new Date().toISOString().slice(0, 10)}`;
      if (kind === 'xlsx') exportRows(rows, `${name}.xlsx`, 'الشكاوى');
      else exportCsv(rows, `${name}.csv`);
      toast.push({ tone: 'success', title: `تم تصدير ${rows.length} سجل` });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر التصدير', description: e instanceof Error ? e.message : undefined });
    } finally {
      setExporting(false);
    }
  };

  const hasFilters = Object.values(f).some(Boolean);

  return (
    <AdminPage title="الشكاوى والمقترحات والطلبات"
      description="عرض جميع الطلبات وتصفيتها وتغيير حالاتها وإضافة الردود والملاحظات الداخلية وتصديرها إلى Excel."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={exporting} onClick={() => void doExport('xlsx')} icon={<FileDown className="h-4 w-4" />}>
            تصدير Excel
          </Button>
          <Button variant="secondary" loading={exporting} onClick={() => void doExport('csv')} icon={<Download className="h-4 w-4" />}>
            تصدير CSV
          </Button>
        </div>
      }>

      {/* التصفية */}
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-navy-800">
          <Filter className="h-4 w-4" aria-hidden /> التصفية والبحث
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" aria-hidden />
            <input value={f.search} onChange={(e) => { setF({ ...f, search: e.target.value }); setPage(1); }}
              placeholder="رقم مرجعي · اسم · موضوع · هاتف" aria-label="بحث"
              className="h-11 w-full rounded-xl border border-steel-300 pr-10 pl-3 text-[14px]" />
          </div>
          <select value={f.status} onChange={(e) => { setF({ ...f, status: e.target.value }); setPage(1); }}
            aria-label="الحالة" className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]">
            <option value="">كل الحالات</option>
            {(Object.keys(COMPLAINT_STATUS) as ComplaintStatus[]).map((s) => (
              <option key={s} value={s}>{COMPLAINT_STATUS[s].label}</option>
            ))}
          </select>
          <select value={f.kind} onChange={(e) => { setF({ ...f, kind: e.target.value }); setPage(1); }}
            aria-label="النوع" className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]">
            <option value="">كل الأنواع</option>
            {Object.entries(COMPLAINT_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={f.specializationId} onChange={(e) => { setF({ ...f, specializationId: e.target.value }); setPage(1); }}
            aria-label="التخصص" className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]">
            <option value="">كل التخصصات</option>
            {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={f.studentCode} onChange={(e) => { setF({ ...f, studentCode: e.target.value }); setPage(1); }}
            placeholder="كود الطالب" aria-label="كود الطالب" dir="ltr"
            className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]" />
          <input type="date" value={f.from} onChange={(e) => { setF({ ...f, from: e.target.value }); setPage(1); }}
            aria-label="من تاريخ" className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]" />
          <input type="date" value={f.to} onChange={(e) => { setF({ ...f, to: e.target.value }); setPage(1); }}
            aria-label="إلى تاريخ" className="h-11 rounded-xl border border-steel-300 px-3 text-[14px]" />
          {hasFilters && (
            <button onClick={() => { setF({ status: '', kind: '', specializationId: '', studentCode: '', search: '', from: '', to: '' }); setPage(1); }}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-ember-200 text-[13.5px] font-semibold text-ember-700 hover:bg-ember-50">
              <X className="h-4 w-4" aria-hidden /> إلغاء التصفية
            </button>
          )}
        </div>
      </div>

      {list.isLoading ? <SkeletonRows rows={8} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.rows.length ? (
          <>
            <Table>
              <thead>
                <tr><Th>الرقم المرجعي</Th><Th>النوع</Th><Th>مقدّم الطلب</Th><Th>الموضوع</Th><Th>التخصص</Th><Th>الحالة</Th><Th>التاريخ</Th><Th className="w-20"></Th></tr>
              </thead>
              <tbody>
                {list.data.rows.map((c) => (
                  <tr key={c.id}>
                    <Td><span className="font-mono text-[13px] font-bold text-navy-800" dir="ltr">{c.ticket_id}</span></Td>
                    <Td>{COMPLAINT_KINDS[c.kind]}</Td>
                    <Td>
                      <p className="font-semibold">{c.submitter_name}</p>
                      <p className="text-[12px] text-steel-500">{SUBMITTER_ROLES[c.submitter_role]} · {c.phone}</p>
                    </Td>
                    <Td className="max-w-[240px] truncate">{c.subject}</Td>
                    <Td className="text-steel-600">{specName(c.specialization_id)}</Td>
                    <Td>
                      <span className={clsx('rounded-full border px-2.5 py-0.5 text-[12px] font-semibold', COMPLAINT_STATUS[c.status].tone)}>
                        {COMPLAINT_STATUS[c.status].label}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-steel-500">{formatDateShort(c.created_at)}</Td>
                    <Td>
                      <button onClick={() => setOpen(c)} aria-label={`فتح الطلب ${c.ticket_id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                        <Eye className="h-4 w-4" aria-hidden />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.count} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={<MessageSquareWarning className="h-7 w-7" />}
            title={hasFilters ? 'لا توجد طلبات مطابقة' : 'لا توجد طلبات بعد'}
            description={hasFilters ? 'جرّب تعديل شروط التصفية.' : 'ستظهر هنا الطلبات المرسلة من الموقع.'} />
        )}

      {/* تفاصيل الطلب */}
      <Modal open={!!open} onClose={() => setOpen(null)} size="lg"
        title={open ? `الطلب ${open.ticket_id}` : ''}
        description={open ? `${COMPLAINT_KINDS[open.kind]} · ${formatDateTime(open.created_at)}` : undefined}>
        {open && (
          <div className="space-y-6">
            <dl className="grid gap-4 rounded-xl bg-steel-50 p-5 sm:grid-cols-2">
              {[
                ['مقدّم الطلب', open.submitter_name],
                ['الصفة', SUBMITTER_ROLES[open.submitter_role]],
                ['الهاتف', open.phone],
                ['البريد الإلكتروني', open.email ?? '—'],
                ['اسم الطالب', open.student_name ?? '—'],
                ['كود الطالب', open.student_code ?? '—'],
                ['التخصص', specName(open.specialization_id)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12.5px] font-bold text-steel-500">{k}</dt>
                  <dd className="mt-0.5 text-[14.5px] text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="mb-2 text-[15px]">{open.subject}</h3>
              <p className="whitespace-pre-line rounded-xl border border-steel-200 p-4 text-[14.5px] leading-8 text-steel-700">
                {open.details}
              </p>
              {open.attachment_url && (
                <a href={open.attachment_url} target="_blank" rel="noopener noreferrer"
                   className="mt-3 inline-flex items-center gap-2 text-[13.5px] font-semibold text-navy-700 hover:text-navy-900">
                  <Download className="h-4 w-4" aria-hidden /> فتح المرفق
                </a>
              )}
            </div>

            <div className="grid gap-5 border-t border-steel-200 pt-5 sm:grid-cols-2">
              <Select label="حالة الطلب" value={open.status}
                onChange={(e) => save.mutate({ id: open.id, patch: { status: e.target.value as ComplaintStatus } })}>
                {(Object.keys(COMPLAINT_STATUS) as ComplaintStatus[]).map((s) => (
                  <option key={s} value={s}>{COMPLAINT_STATUS[s].label}</option>
                ))}
              </Select>
              <div className="text-[13px] text-steel-500">
                <p>تاريخ الرد: {open.responded_at ? formatDateTime(open.responded_at) : '—'}</p>
                <p className="mt-1">تاريخ الإغلاق: {open.closed_at ? formatDateTime(open.closed_at) : '—'}</p>
              </div>
            </div>

            <Textarea label="الرد المرسل لمقدّم الطلب" rows={4}
              hint="يظهر لمقدّم الطلب عند تتبعه بالرقم المرجعي بعد تغيير الحالة إلى «تم الرد» أو ما بعدها"
              defaultValue={open.response ?? ''}
              onBlur={(e) => e.target.value !== (open.response ?? '') && save.mutate({ id: open.id, patch: { response: e.target.value } })} />

            <Textarea label="ملاحظات داخلية" rows={3} hint="لا تظهر لمقدّم الطلب إطلاقاً"
              defaultValue={open.internal_notes ?? ''}
              onBlur={(e) => e.target.value !== (open.internal_notes ?? '') && save.mutate({ id: open.id, patch: { internal_notes: e.target.value } })} />

            <div>
              <h3 className="mb-3 text-[15px]">سجل الإجراءات</h3>
              {updates.data?.length ? (
                <ol className="space-y-2">
                  {updates.data.map((u) => (
                    <li key={u.id} className="rounded-xl border border-steel-200 p-3 text-[13.5px]">
                      <p className="text-steel-700">
                        {u.to_status
                          ? <>تغيير الحالة من «{u.from_status ? COMPLAINT_STATUS[u.from_status].label : '—'}» إلى «{COMPLAINT_STATUS[u.to_status].label}»</>
                          : u.note}
                      </p>
                      <p className="mt-1 text-[12px] text-steel-500">{formatDateTime(u.created_at)}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-[13.5px] text-steel-500">لا توجد إجراءات مسجَّلة بعد.</p>}

              <div className="mt-3 flex gap-2">
                <Input aria-label="ملاحظة جديدة" placeholder="أضف ملاحظة إلى سجل الإجراءات…"
                  onKeyDown={(e) => {
                    const el = e.currentTarget;
                    if (e.key === 'Enter' && el.value.trim()) {
                      addNote.mutate({ id: open.id, note: el.value.trim() });
                      el.value = '';
                    }
                  }} />
              </div>
            </div>

            <Alert tone="info">
              يُرصد زمن الرد على الطلبات ضمن مؤشرات الأداء المعلنة بالمركز وفق إجراء رصد رضا المستفيدين
              والتعامل مع الشكاوى والتظلمات (ISO-SAT-PR-01).
            </Alert>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
}
