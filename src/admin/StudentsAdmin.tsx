import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileDown, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';
import { AdminPage } from './AdminPage';
import { Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Pagination, Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { deleteStudent, fetchGrades, fetchSpecializations, fetchStudents, saveStudent } from '@/data/api';
import { exportRows } from '@/lib/excel';
import { formatPercent } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { Student } from '@/types/db';

const PAGE_SIZE = 25;

export default function StudentsAdmin() {
  useSeo({ title: 'الطلاب والحضور', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [spec, setSpec] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Student> | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [exporting, setExporting] = useState(false);

  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs  = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const list   = useQuery({ queryKey: ['students', { page, search, grade, spec }],
    queryFn: () => fetchStudents({ page, pageSize: PAGE_SIZE, search, gradeId: grade, specializationId: spec }) });

  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['students'] }); void qc.invalidateQueries({ queryKey: ['admin-stats'] }); };

  /** إزالة الحقول المُحمَّلة بالربط (ليست أعمدة في الجدول) قبل الحفظ */
  const stripJoined = (row: Partial<Student> & { attendance_summaries?: unknown }) => {
    const { attendance_summaries: _ignored, ...columns } = row;
    return columns as Partial<Student>;
  };

  const save = useMutation({
    mutationFn: (row: Partial<Student>) => saveStudent(stripJoined(row)),
    onSuccess: () => { invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم حفظ بيانات الطالب' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => { invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف الطالب' }); },
  });

  const specName = (id: string | null) => specs.data?.find((s) => s.id === id)?.name ?? '—';

  const doExport = async () => {
    setExporting(true);
    try {
      const all = await fetchStudents({ page: 1, pageSize: 5000, search, gradeId: grade, specializationId: spec });
      const rows = all.rows.map((s) => {
        const a = s.attendance_summaries?.[0];
        return {
          Student_ID: s.student_code,
          National_ID: s.national_id ?? '',
          Student_Name: s.full_name,
          Grade: s.grade_id ?? '',
          Specialization: specName(s.specialization_id),
          Academic_Year: s.academic_year ?? '',
          Guardian_Name: s.guardian_name ?? '',
          Guardian_Phone: s.guardian_phone ?? '',
          Attendance_Days: a?.attendance_days ?? '',
          Absence_Days: a?.absence_days ?? '',
          Total_School_Days: a?.total_school_days ?? '',
          Attendance_Percentage: a?.attendance_pct ?? '',
          Absence_Percentage: a?.absence_pct ?? '',
          Status: s.status,
        };
      });
      if (!rows.length) { toast.push({ tone: 'warning', title: 'لا توجد بيانات للتصدير' }); return; }
      exportRows(rows, `بيانات-الطلاب-${new Date().toISOString().slice(0, 10)}.xlsx`, 'الطلاب');
      toast.push({ tone: 'success', title: `تم تصدير ${rows.length} سجل` });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر التصدير', description: e instanceof Error ? e.message : undefined });
    } finally { setExporting(false); }
  };

  const set = (p: Partial<Student>) => setEditing((e) => ({ ...(e ?? {}), ...p }));

  return (
    <AdminPage title="الطلاب والحضور والغياب"
      description="بيانات الطلاب ونسب حضورهم. تُستورد عادةً دفعةً واحدة من ملف Excel، ويمكن تعديل أي سجل يدوياً من هنا."
      action={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={exporting} onClick={() => void doExport()} icon={<FileDown className="h-4 w-4" />}>
            تصدير Excel
          </Button>
          <Button onClick={() => setEditing({ status: 'active' })} icon={<Plus className="h-4 w-4" />}>إضافة طالب</Button>
        </div>
      }>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" aria-hidden />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالاسم أو الكود أو الرقم القومي…" aria-label="بحث"
            className="h-11 w-full rounded-xl border border-steel-300 bg-white pr-10 pl-3 text-[14.5px]" />
        </div>
        <select value={grade ?? ''} onChange={(e) => { setGrade(e.target.value ? Number(e.target.value) : null); setPage(1); }}
          aria-label="الصف" className="h-11 rounded-xl border border-steel-300 bg-white px-3 text-[14.5px]">
          <option value="">كل الصفوف</option>
          {grades.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={spec ?? ''} onChange={(e) => { setSpec(e.target.value || null); setPage(1); }}
          aria-label="التخصص" className="h-11 rounded-xl border border-steel-300 bg-white px-3 text-[14.5px]">
          <option value="">كل التخصصات</option>
          {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {list.isLoading ? <SkeletonRows rows={8} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.rows.length ? (
          <>
            <Table>
              <thead>
                <tr><Th>الكود</Th><Th>الطالب</Th><Th>الصف</Th><Th>التخصص</Th><Th>الحضور</Th><Th>الغياب</Th><Th>نسبة الحضور</Th><Th className="w-32">إجراءات</Th></tr>
              </thead>
              <tbody>
                {list.data.rows.map((s) => {
                  const a = s.attendance_summaries?.[0];
                  const pct = a?.attendance_pct ?? null;
                  return (
                    <tr key={s.id}>
                      <Td><span className="font-mono text-[13px] font-bold" dir="ltr">{s.student_code}</span></Td>
                      <Td className="font-semibold">{s.full_name}</Td>
                      <Td className="text-steel-600">{grades.data?.find((g) => g.id === s.grade_id)?.name ?? '—'}</Td>
                      <Td className="text-steel-600">{specName(s.specialization_id)}</Td>
                      <Td>{a?.attendance_days ?? '—'}</Td>
                      <Td>{a?.absence_days ?? '—'}</Td>
                      <Td>
                        <span className={clsx('rounded-full px-2.5 py-0.5 text-[12.5px] font-bold',
                          pct === null ? 'bg-steel-100 text-steel-600'
                          : pct >= 85 ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-ember-50 text-ember-700')}>
                          {formatPercent(pct)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditing(s)} aria-label={`تعديل ${s.full_name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button onClick={() => setToDelete(s)} aria-label={`حذف ${s.full_name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember-200 text-ember-600 hover:bg-ember-50">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.count} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={<Users className="h-7 w-7" />} title="لا يوجد طلاب"
            description="استورد بيانات الطلاب دفعةً واحدة من ملف Excel، أو أضف طالباً يدوياً." />
        )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل بيانات طالب' : 'إضافة طالب'}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={save.isPending} onClick={() => editing && save.mutate(editing)}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="كود الطالب" required dir="ltr" value={editing.student_code ?? ''}
                onChange={(e) => set({ student_code: e.target.value })} />
              <Input label="الرقم القومي" dir="ltr" inputMode="numeric" value={editing.national_id ?? ''}
                onChange={(e) => set({ national_id: e.target.value })} />
            </div>
            <Input label="اسم الطالب" required value={editing.full_name ?? ''} onChange={(e) => set({ full_name: e.target.value })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="الصف" value={String(editing.grade_id ?? '')}
                onChange={(e) => set({ grade_id: e.target.value ? Number(e.target.value) : null })}>
                <option value="">— غير محدد —</option>
                {grades.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              <Select label="التخصص" value={editing.specialization_id ?? ''}
                onChange={(e) => set({ specialization_id: e.target.value || null })}>
                <option value="">— غير محدد —</option>
                {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input label="اسم ولي الأمر" value={editing.guardian_name ?? ''} onChange={(e) => set({ guardian_name: e.target.value })} />
              <Input label="هاتف ولي الأمر" dir="ltr" value={editing.guardian_phone ?? ''} onChange={(e) => set({ guardian_phone: e.target.value })} />
              <Input label="العام الدراسي" placeholder="2026/2027" value={editing.academic_year ?? ''}
                onChange={(e) => set({ academic_year: e.target.value })} />
              <Select label="حالة القيد" value={editing.status ?? 'active'} onChange={(e) => set({ status: e.target.value })}>
                <option value="active">مقيَّد</option>
                <option value="dismissed">مفصول</option>
                <option value="graduated">متخرّج</option>
                <option value="withdrawn">مسحوب ملفه</option>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف الطالب"
        message={`سيُحذف «${toDelete?.full_name}» وسجلات حضوره وغيابه نهائياً. هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
