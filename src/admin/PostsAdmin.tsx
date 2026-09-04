import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Pin, Plus, Trash2 } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Input, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { deletePost, fetchPosts, savePost } from '@/data/api';
import { formatDateShort, slugify } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { ContentKind, Post } from '@/types/db';

const META: Record<ContentKind, { title: string; description: string; addLabel: string }> = {
  news:         { title: 'الأخبار',   addLabel: 'إضافة خبر',   description: 'أخبار المركز وأنشطته — تظهر في الصفحة الرئيسية وصفحة الأخبار.' },
  announcement: { title: 'الإعلانات', addLabel: 'إضافة إعلان', description: 'الإعلانات الرسمية. يمكن تثبيت إعلان مهم ليظهر في شريط أعلى الصفحة الرئيسية.' },
  instruction:  { title: 'التعليمات', addLabel: 'إضافة تعليمات', description: 'التعليمات والتنبيهات الصادرة عن إدارات المركز.' },
};

export default function PostsAdmin({ kind }: { kind: ContentKind }) {
  const meta = META[kind];
  useSeo({ title: `إدارة ${meta.title}`, noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [toDelete, setToDelete] = useState<Post | null>(null);

  const list = useQuery({ queryKey: ['posts', kind, 'admin'], queryFn: () => fetchPosts({ kind, includeUnpublished: true }) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['posts'] });

  const save = useMutation({
    mutationFn: (row: Partial<Post>) => savePost(row),
    onSuccess: () => { void invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم الحفظ' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => { void invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم الحذف' }); },
  });

  const set = (p: Partial<Post>) => setEditing((e) => ({ ...(e ?? {}), ...p }));
  const nowLocal = () => new Date().toISOString().slice(0, 16);

  return (
    <AdminPage title={meta.title} description={meta.description}
      action={<Button icon={<Plus className="h-4 w-4" />}
        onClick={() => setEditing({ kind, is_published: true, is_pinned: false, published_at: new Date().toISOString() })}>
        {meta.addLabel}
      </Button>}>

      {list.isLoading ? <SkeletonRows rows={6} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.length ? (
          <Table>
            <thead>
              <tr><Th>العنوان</Th><Th>تاريخ النشر</Th><Th>مثبَّت</Th><Th>الحالة</Th><Th className="w-32">إجراءات</Th></tr>
            </thead>
            <tbody>
              {list.data.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt="" className="h-11 w-16 rounded object-cover" />}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.title}</p>
                        {p.excerpt && <p className="truncate text-[12.5px] text-steel-500">{p.excerpt}</p>}
                      </div>
                    </div>
                  </Td>
                  <Td className="text-steel-600">{formatDateShort(p.published_at)}</Td>
                  <Td>{p.is_pinned && <Pin className="h-4 w-4 text-ember-600" aria-label="مثبَّت" />}</Td>
                  <Td className="text-[13px]">{p.is_published ? 'منشور' : 'مخفي'}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(p)} aria-label={`تعديل ${p.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button onClick={() => setToDelete(p)} aria-label={`حذف ${p.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember-200 text-ember-600 hover:bg-ember-50">
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState title={`لا يوجد محتوى في ${meta.title}`} description="ابدأ بإضافة أول موضوع." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg"
        title={editing?.id ? 'تعديل' : meta.addLabel}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={save.isPending}
            onClick={() => editing && save.mutate({ ...editing, kind, slug: editing.slug || slugify(editing.title ?? '') })}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <Input label="العنوان" required value={editing.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="مقدمة مختصرة" rows={2} hint="تظهر في بطاقة الموضوع وفي نتائج البحث"
              value={editing.excerpt ?? ''} onChange={(e) => set({ excerpt: e.target.value })} />
            <Textarea label="النص الكامل" rows={10} value={editing.body ?? ''} onChange={(e) => set({ body: e.target.value })} />

            <ImageUpload label="صورة الموضوع" prefix="posts" value={editing.image_url ?? null}
              onChange={(v) => set({ image_url: v })} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="رابط إضافي (اختياري)" dir="ltr" value={editing.link_url ?? ''}
                onChange={(e) => set({ link_url: e.target.value })} />
              <Input label="نص زر الرابط" value={editing.link_label ?? ''}
                onChange={(e) => set({ link_label: e.target.value })} />
              <Input label="تاريخ النشر" type="datetime-local"
                value={editing.published_at ? new Date(editing.published_at).toISOString().slice(0, 16) : nowLocal()}
                onChange={(e) => set({ published_at: new Date(e.target.value).toISOString() })} />
              <Input label="تاريخ الانتهاء (اختياري)" type="datetime-local"
                hint="بعد هذا التاريخ يختفي الموضوع تلقائياً من الموقع"
                value={editing.expires_at ? new Date(editing.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => set({ expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Switch label="تثبيت في الأعلى" checked={!!editing.is_pinned}
                hint="الإعلان المثبَّت يظهر في شريط أعلى الصفحة الرئيسية"
                onChange={(v) => set({ is_pinned: v })} />
              <Switch label="منشور" checked={editing.is_published !== false} onChange={(v) => set({ is_published: v })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف الموضوع" message={`سيُحذف «${toDelete?.title}» نهائياً. هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
