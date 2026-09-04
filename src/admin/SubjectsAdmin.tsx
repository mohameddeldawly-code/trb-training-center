import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { AdminPage } from './AdminPage';
import { Input, ListField, Select, Switch, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import {
  deleteSubject, fetchGrades, fetchSpecializations, fetchStudyPlans, fetchSubjects,
  saveStudyPlan, saveSubject,
} from '@/data/api';
import { useSeo } from '@/hooks/useSeo';
import type { StudyPlan, Subject } from '@/types/db';

export default function SubjectsAdmin() {
  useSeo({ title: 'المواد وخطط الدراسة', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'subjects' | 'plans'>('subjects');
  const [grade, setGrade] = useState<number>(1);
  const [spec, setSpec]   = useState<string>('');

  const [editing, setEditing]   = useState<Partial<Subject> | null>(null);
  const [toDelete, setToDelete] = useState<Subject | null>(null);
  const [plan, setPlan]         = useState<Partial<StudyPlan> | null>(null);

  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs  = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const subs   = useQuery({ queryKey: ['subjects', 'admin', grade], queryFn: () => fetchSubjects({ gradeId: grade }) });
  const plans  = useQuery({ queryKey: ['plans', spec], queryFn: () => fetchStudyPlans(spec), enabled: !!spec && tab === 'plans' });

  const invalidate = () => { void qc.invalidateQueries({ queryKey: ['subjects'] }); void qc.invalidateQueries({ queryKey: ['plans'] }); };

  const saveSub = useMutation({
    mutationFn: (row: Partial<Subject>) => saveSubject(row),
    onSuccess: () => { invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم حفظ المادة' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const delSub = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => { invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف المادة' }); },
  });

  const savePlan = useMutation({
    mutationFn: (row: Partial<StudyPlan>) => saveStudyPlan(row),
    onSuccess: () => { invalidate(); setPlan(null); toast.push({ tone: 'success', title: 'تم حفظ خطة الدراسة' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const specName = (id: string | null) => specs.data?.find((s) => s.id === id)?.name ?? '—';
  const rows = (subs.data ?? []).filter((s) => (spec ? s.specialization_id === spec || s.is_common : true));

  return (
    <AdminPage title="المواد الدراسية وخطط الدراسة"
      description="المواد المشتركة تظهر لجميع التخصصات، والمواد التخصصية تُربط بتخصص واحد. وخطة الدراسة تُحدَّد لكل تخصص في كل صف."
      action={tab === 'subjects'
        ? <Button onClick={() => setEditing({ grade_id: grade, is_common: false, is_published: true, sort_order: 99 })}
            icon={<Plus className="h-4 w-4" />}>إضافة مادة</Button>
        : undefined}>

      <div className="flex flex-wrap gap-2">
        {([['subjects', 'المواد الدراسية'], ['plans', 'خطط الدراسة']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={clsx('h-11 rounded-xl px-5 text-[14.5px] font-semibold transition',
              tab === k ? 'bg-navy-700 text-white' : 'border border-steel-300 bg-white text-navy-800 hover:bg-steel-50')}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {tab === 'subjects' && (
          <div className="flex flex-wrap gap-2">
            {grades.data?.map((g) => (
              <button key={g.id} onClick={() => setGrade(g.id)}
                className={clsx('h-10 rounded-xl px-4 text-[14px] font-semibold',
                  grade === g.id ? 'bg-navy-800 text-white' : 'border border-steel-300 bg-white text-navy-800')}>
                {g.name}
              </button>
            ))}
          </div>
        )}
        <select value={spec} onChange={(e) => setSpec(e.target.value)} aria-label="التخصص"
          className="h-10 rounded-xl border border-steel-300 bg-white px-3 text-[14px]">
          <option value="">{tab === 'plans' ? '— اختر التخصص —' : 'كل التخصصات'}</option>
          {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* المواد */}
      {tab === 'subjects' && (
        subs.isLoading ? <SkeletonRows rows={6} />
        : subs.error ? <ErrorState error={subs.error} onRetry={() => void subs.refetch()} />
        : rows.length ? (
          <Table>
            <thead>
              <tr><Th>المادة</Th><Th>النوع</Th><Th>التخصص</Th><Th>الترتيب</Th><Th>الحالة</Th><Th className="w-32">إجراءات</Th></tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <Td className="font-semibold">{s.name}</Td>
                  <Td>
                    <span className={clsx('rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
                      s.is_common ? 'bg-steel-100 text-steel-700' : 'bg-brass-100 text-brass-800')}>
                      {s.is_common ? 'مشتركة' : 'تخصصية'}
                    </span>
                  </Td>
                  <Td className="text-steel-600">{s.is_common ? 'جميع التخصصات' : specName(s.specialization_id)}</Td>
                  <Td className="text-steel-500">{s.sort_order}</Td>
                  <Td className="text-[13px]">{s.is_published ? 'منشورة' : 'مخفية'}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(s)} aria-label={`تعديل ${s.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button onClick={() => setToDelete(s)} aria-label={`حذف ${s.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember-200 text-ember-600 hover:bg-ember-50">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState title="لا توجد مواد لهذا الصف" description="أضف المواد المشتركة والتخصصية من زر «إضافة مادة»." />
      )}

      {/* خطط الدراسة */}
      {tab === 'plans' && (
        !spec ? <EmptyState title="اختر تخصصاً" description="اختر التخصص من القائمة أعلاه لعرض خطة الدراسة الخاصة به وتعديلها." />
        : plans.isLoading ? <SkeletonRows rows={3} />
        : (
          <div className="grid gap-5 lg:grid-cols-3">
            {grades.data?.map((g) => {
              const p = plans.data?.find((x) => x.grade_id === g.id);
              return (
                <div key={g.id} className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[16px]">{g.name}</h3>
                    <Button size="sm" variant="secondary"
                      onClick={() => setPlan(p ?? { specialization_id: spec, grade_id: g.id, theory_topics: [], practical_topics: [] })}>
                      {p ? 'تعديل' : 'إضافة'}
                    </Button>
                  </div>
                  {p ? (
                    <>
                      <p className="text-[14px] font-semibold text-navy-800">{p.title}</p>
                      <p className="mt-1.5 text-[13px] leading-6 text-steel-600">{p.focus}</p>
                      <p className="mt-3 text-[12.5px] text-steel-500">
                        {p.theory_topics?.length ?? 0} بند نظري · {p.practical_topics?.length ?? 0} بند عملي
                      </p>
                    </>
                  ) : <p className="text-[13.5px] text-steel-500">لم تُسجَّل خطة لهذا الصف بعد.</p>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* نموذج المادة */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل مادة' : 'إضافة مادة'}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={saveSub.isPending} onClick={() => editing && saveSub.mutate(editing)}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <Input label="اسم المادة" required value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="الصف" value={String(editing.grade_id ?? 1)}
                onChange={(e) => setEditing({ ...editing, grade_id: Number(e.target.value) })}>
                {grades.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              <Input label="ترتيب العرض" type="number" value={String(editing.sort_order ?? 99)}
                onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <Switch label="مادة مشتركة لجميع التخصصات" checked={!!editing.is_common}
              onChange={(v) => setEditing({ ...editing, is_common: v, specialization_id: v ? null : editing.specialization_id })} />
            {!editing.is_common && (
              <Select label="التخصص" required value={editing.specialization_id ?? ''}
                onChange={(e) => setEditing({ ...editing, specialization_id: e.target.value || null })}>
                <option value="">— اختر التخصص —</option>
                {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            )}
            <Textarea label="وصف المادة (اختياري)" rows={3} value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <Switch label="منشورة" checked={editing.is_published !== false}
              onChange={(v) => setEditing({ ...editing, is_published: v })} />
          </div>
        )}
      </Modal>

      {/* نموذج خطة الدراسة */}
      <Modal open={!!plan} onClose={() => setPlan(null)} size="lg"
        title="خطة الدراسة" description="ما يظهر في قسم «خطة الدراسة خلال السنوات الثلاث» بصفحة التخصص."
        footer={<>
          <Button variant="secondary" onClick={() => setPlan(null)}>إلغاء</Button>
          <Button loading={savePlan.isPending} onClick={() => plan && savePlan.mutate(plan)}>حفظ</Button>
        </>}>
        {plan && (
          <div className="space-y-5">
            <Input label="عنوان الخطة" value={plan.title ?? ''} onChange={(e) => setPlan({ ...plan, title: e.target.value })} />
            <Textarea label="محور السنة" rows={2} value={plan.focus ?? ''} onChange={(e) => setPlan({ ...plan, focus: e.target.value })} />
            <ListField label="بنود الجانب النظري" value={plan.theory_topics ?? []} onChange={(v) => setPlan({ ...plan, theory_topics: v })} />
            <ListField label="بنود الجانب العملي" value={plan.practical_topics ?? []} onChange={(v) => setPlan({ ...plan, practical_topics: v })} />
            <Textarea label="ملاحظات" rows={2} value={plan.notes ?? ''} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={delSub.isPending}
        onConfirm={() => toDelete && delSub.mutate(toDelete.id)}
        title="حذف المادة" message={`سيُحذف «${toDelete?.name}» نهائياً. هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
