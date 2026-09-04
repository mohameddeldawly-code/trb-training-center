import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Images, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { deleteGalleryItem, fetchGallery, fetchSpecializations, saveGalleryItem } from '@/data/api';
import { useSeo } from '@/hooks/useSeo';
import type { GalleryItem } from '@/types/db';

export default function GalleryAdmin() {
  useSeo({ title: 'معرض الصور', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<GalleryItem> | null>(null);
  const [toDelete, setToDelete] = useState<GalleryItem | null>(null);

  const specs = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const list  = useQuery({ queryKey: ['gallery', 'admin'], queryFn: () => fetchGallery({ includeUnpublished: true }) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['gallery'] });

  const save = useMutation({
    mutationFn: (row: Partial<GalleryItem>) => saveGalleryItem(row),
    onSuccess: () => { void invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم الحفظ' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteGalleryItem(id),
    onSuccess: () => { void invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف الصورة' }); },
  });

  const set = (p: Partial<GalleryItem>) => setEditing((e) => ({ ...(e ?? {}), ...p }));

  return (
    <AdminPage title="معرض الصور"
      description="ارفع صور المركز والورش والأنشطة. يمكن ربط الصورة بتخصص لتظهر أيضاً داخل صفحته."
      action={<Button onClick={() => setEditing({ is_published: true, album: 'عام', sort_order: 99 })}
        icon={<Plus className="h-4 w-4" />}>إضافة صورة</Button>}>

      {list.isLoading ? <SkeletonGrid count={8} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.length ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.data.map((g) => (
              <li key={g.id} className="card overflow-hidden">
                <img src={g.image_url} alt={g.title ?? ''} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                <div className="p-3">
                  <p className="truncate text-[13.5px] font-semibold text-navy-900">{g.title ?? 'بدون عنوان'}</p>
                  <p className="mt-0.5 truncate text-[12px] text-steel-500">{g.album ?? '—'}{g.is_published ? '' : ' · مخفية'}</p>
                  <div className="mt-3 flex gap-1.5">
                    <button onClick={() => setEditing(g)} aria-label="تعديل"
                      className="flex h-8 flex-1 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button onClick={() => setToDelete(g)} aria-label="حذف"
                      className="flex h-8 flex-1 items-center justify-center rounded-lg border border-ember-200 text-ember-600 hover:bg-ember-50">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : <EmptyState icon={<Images className="h-7 w-7" />} title="لا توجد صور" description="ابدأ برفع أول صورة." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'تعديل صورة' : 'إضافة صورة'}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={save.isPending} disabled={!editing?.image_url}
            onClick={() => editing && save.mutate(editing)}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <ImageUpload label="الصورة" prefix="gallery" value={editing.image_url ?? null}
              onChange={(v) => set({ image_url: v ?? undefined })} />
            <Input label="عنوان الصورة" value={editing.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="وصف مختصر" rows={2} value={editing.caption ?? ''} onChange={(e) => set({ caption: e.target.value })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="الألبوم" value={editing.album ?? ''} onChange={(e) => set({ album: e.target.value })} />
              <Input label="ترتيب العرض" type="number" value={String(editing.sort_order ?? 99)}
                onChange={(e) => set({ sort_order: Number(e.target.value) })} />
            </div>
            <Select label="ربط بتخصص (اختياري)" value={editing.specialization_id ?? ''}
              onChange={(e) => set({ specialization_id: e.target.value || null })}>
              <option value="">— غير مرتبطة —</option>
              {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Switch label="منشورة" checked={editing.is_published !== false} onChange={(v) => set({ is_published: v })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف الصورة" message="سيتم حذف هذه الصورة من المعرض نهائياً. هل تريد المتابعة؟" />
    </AdminPage>
  );
}
