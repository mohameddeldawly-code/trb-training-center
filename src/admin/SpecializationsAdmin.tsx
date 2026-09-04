import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Input, ListField, Select, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { SpecIcon, SPEC_ICON_OPTIONS } from '@/components/shared/SpecIcon';
import { deleteSpecialization, fetchSpecializations, reorder, saveSpecialization } from '@/data/api';
import { slugify } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { Specialization } from '@/types/db';

const EMPTY: Partial<Specialization> = {
  name: '', slug: '', summary: '', definition: '', importance: '', training_nature: '',
  objectives: [], skills: [], equipment: [], career_paths: [], learning_outcomes: [],
  safety_ppe: [], main_hazards: [], icon: 'wrench', accent_color: '#17386a',
  is_published: true, sort_order: 99,
};

export default function SpecializationsAdmin() {
  useSeo({ title: 'إدارة التخصصات', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Specialization> | null>(null);
  const [toDelete, setToDelete] = useState<Specialization | null>(null);

  const list = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['specializations'] });

  const save = useMutation({
    mutationFn: (row: Partial<Specialization>) => saveSpecialization(row),
    onSuccess: () => { void invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم الحفظ' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSpecialization(id),
    onSuccess: () => { void invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف التخصص' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحذف', description: e instanceof Error ? e.message : undefined }),
  });

  const move = async (index: number, dir: -1 | 1) => {
    const rows = [...(list.data ?? [])];
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    [rows[index], rows[target]] = [rows[target], rows[index]];
    await reorder('specializations', rows.map((r, i) => ({ id: r.id, sort_order: i + 1 })));
    void invalidate();
  };

  const set = (patch: Partial<Specialization>) => setEditing((e) => ({ ...(e ?? {}), ...patch }));

  return (
    <AdminPage title="التخصصات"
      description="أضف التخصصات وعدّلها واحذفها ورتّبها. كل حقل هنا يظهر مباشرةً في صفحة التخصص على الموقع."
      action={<Button onClick={() => setEditing({ ...EMPTY })} icon={<Plus className="h-4 w-4" />}>إضافة تخصص</Button>}>

      {list.isLoading ? <SkeletonRows rows={6} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.length ? (
          <Table>
            <thead>
              <tr><Th className="w-20">الترتيب</Th><Th>التخصص</Th><Th>الرابط</Th><Th>الحالة</Th><Th className="w-32">إجراءات</Th></tr>
            </thead>
            <tbody>
              {list.data.map((s, i) => (
                <tr key={s.id}>
                  <Td>
                    <div className="flex gap-1">
                      <button onClick={() => void move(i, -1)} disabled={i === 0} aria-label="تحريك لأعلى"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel-300 disabled:opacity-30">
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button onClick={() => void move(i, 1)} disabled={i === list.data.length - 1} aria-label="تحريك لأسفل"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel-300 disabled:opacity-30">
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: s.accent_color ?? '#17386a' }}>
                        <SpecIcon name={s.icon} className="h-[18px] w-[18px]" />
                      </span>
                      <span className="font-semibold">{s.name}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-[12.5px] text-steel-500" dir="ltr">{s.slug}</Td>
                  <Td>
                    <span className={s.is_published ? 'flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700' : 'flex items-center gap-1.5 text-[13px] font-semibold text-steel-500'}>
                      {s.is_published ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <EyeOff className="h-3.5 w-3.5" aria-hidden />}
                      {s.is_published ? 'منشور' : 'مخفي'}
                    </span>
                  </Td>
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
        ) : <EmptyState title="لا توجد تخصصات" description="ابدأ بإضافة أول تخصص."
              action={<Button onClick={() => setEditing({ ...EMPTY })} icon={<Plus className="h-4 w-4" />}>إضافة تخصص</Button>} />}

      {/* نموذج التحرير */}
      <Modal open={!!editing} onClose={() => setEditing(null)} size="xl"
        title={editing?.id ? `تعديل: ${editing.name}` : 'إضافة تخصص جديد'}
        description="املأ البيانات ثم اضغط حفظ — ستظهر على الموقع فوراً."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button loading={save.isPending}
              onClick={() => editing && save.mutate({ ...editing, slug: editing.slug || slugify(editing.name ?? '') })}>
              حفظ
            </Button>
          </>
        }>
        {editing && (
          <div className="space-y-6">
            <section className="grid gap-5 sm:grid-cols-2">
              <Input label="اسم التخصص" required value={editing.name ?? ''} onChange={(e) => set({ name: e.target.value })} />
              <Input label="الاسم المختصر" value={editing.short_name ?? ''} onChange={(e) => set({ short_name: e.target.value })} />
              <Input label="الرابط (slug)" dir="ltr" hint="يُترك فارغاً ليُولَّد تلقائياً من الاسم"
                value={editing.slug ?? ''} onChange={(e) => set({ slug: e.target.value })} />
              <Select label="الأيقونة" value={editing.icon ?? 'wrench'} onChange={(e) => set({ icon: e.target.value })}>
                {SPEC_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </Select>
              <Input label="لون التخصص" type="color" className="h-11 p-1"
                value={editing.accent_color ?? '#17386a'} onChange={(e) => set({ accent_color: e.target.value })} />
              <Input label="ترتيب العرض" type="number" value={String(editing.sort_order ?? 99)}
                onChange={(e) => set({ sort_order: Number(e.target.value) })} />
            </section>

            <ImageUpload label="صورة الغلاف" prefix="specializations" value={editing.cover_image_url ?? null}
              hint="صورة عرضية تظهر أعلى صفحة التخصص وفي بطاقته"
              onChange={(v) => set({ cover_image_url: v })} />

            <Textarea label="نبذة تعريفية مختصرة" rows={2} value={editing.summary ?? ''} onChange={(e) => set({ summary: e.target.value })} />
            <Textarea label="تعريف التخصص" rows={4} value={editing.definition ?? ''} onChange={(e) => set({ definition: e.target.value })} />
            <Textarea label="أهمية التخصص" rows={3} value={editing.importance ?? ''} onChange={(e) => set({ importance: e.target.value })} />
            <Textarea label="طبيعة التدريب العملي" rows={3} value={editing.training_nature ?? ''} onChange={(e) => set({ training_nature: e.target.value })} />

            <div className="grid gap-5 sm:grid-cols-2">
              <ListField label="أهداف التخصص" value={editing.objectives ?? []} onChange={(v) => set({ objectives: v })} />
              <ListField label="المهارات المكتسبة" value={editing.skills ?? []} onChange={(v) => set({ skills: v })} />
              <ListField label="المعدات والأدوات" value={editing.equipment ?? []} onChange={(v) => set({ equipment: v })} />
              <ListField label="مجالات العمل" value={editing.career_paths ?? []} onChange={(v) => set({ career_paths: v })} />
              <ListField label="مخرجات التعلم" value={editing.learning_outcomes ?? []} onChange={(v) => set({ learning_outcomes: v })} />
              <ListField label="المخاطر الرئيسية" value={editing.main_hazards ?? []} onChange={(v) => set({ main_hazards: v })} />
              <ListField label="مهمات الوقاية الإلزامية" value={editing.safety_ppe ?? []} onChange={(v) => set({ safety_ppe: v })} />
            </div>

            <section className="grid gap-5 sm:grid-cols-2">
              <Input label="عنوان SEO" value={editing.meta_title ?? ''} onChange={(e) => set({ meta_title: e.target.value })} />
              <Input label="وصف SEO" value={editing.meta_description ?? ''} onChange={(e) => set({ meta_description: e.target.value })} />
            </section>

            <Switch label="منشور على الموقع" checked={editing.is_published !== false}
              onChange={(v) => set({ is_published: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف التخصص"
        message={`سيُحذف التخصص «${toDelete?.name}» نهائياً، ومعه مواده الدراسية وخطط دراسته المرتبطة به. هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
