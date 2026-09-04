import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { deleteVideo, fetchGrades, fetchSpecializations, fetchSubjects, fetchVideos, saveVideo } from '@/data/api';
import { extractYouTubeId, youtubeThumb } from '@/lib/youtube';
import { useSeo } from '@/hooks/useSeo';
import type { Video } from '@/types/db';

export default function VideosAdmin() {
  useSeo({ title: 'إدارة الفيديوهات', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Video> | null>(null);
  const [toDelete, setToDelete] = useState<Video | null>(null);

  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs  = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const subs   = useQuery({ queryKey: ['subjects', 'admin', editing?.grade_id ?? 0],
    queryFn: () => fetchSubjects(editing?.grade_id ? { gradeId: editing.grade_id } : {}), enabled: !!editing });
  const list   = useQuery({ queryKey: ['videos', 'admin'], queryFn: () => fetchVideos({ includeUnpublished: true }) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['videos'] });

  const save = useMutation({
    mutationFn: (row: Partial<Video>) => saveVideo(row),
    onSuccess: () => { void invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم حفظ الفيديو' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteVideo(id),
    onSuccess: () => { void invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف الفيديو' }); },
  });

  const set = (p: Partial<Video>) => setEditing((e) => ({ ...(e ?? {}), ...p }));
  const previewId = editing?.youtube_url ? extractYouTubeId(editing.youtube_url) : null;

  return (
    <AdminPage title="الفيديوهات التعليمية"
      description="تُرفع الفيديوهات على قناة المركز على يوتيوب، وتُخزَّن هنا الروابط فقط — لا يُخزَّن أي ملف فيديو على الخادم."
      action={<Button onClick={() => setEditing({ is_published: true, sort_order: 99, youtube_url: '' })}
        icon={<Plus className="h-4 w-4" />}>إضافة فيديو</Button>}>

      {list.isLoading ? <SkeletonRows rows={6} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.length ? (
          <Table>
            <thead>
              <tr><Th>الفيديو</Th><Th>الصف</Th><Th>التخصص</Th><Th>الترتيب</Th><Th>الحالة</Th><Th className="w-32">إجراءات</Th></tr>
            </thead>
            <tbody>
              {list.data.map((v) => {
                const id = v.youtube_id ?? extractYouTubeId(v.youtube_url);
                return (
                  <tr key={v.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {id ? <img src={v.thumbnail_url || youtubeThumb(id, 'mq')} alt="" className="h-11 w-20 rounded object-cover" />
                            : <span className="flex h-11 w-20 items-center justify-center rounded bg-steel-100"><PlayCircle className="h-4 w-4 text-steel-400" aria-hidden /></span>}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{v.title}</p>
                          <p className="truncate text-[12px] text-steel-500" dir="ltr">{v.youtube_url}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-steel-600">{grades.data?.find((g) => g.id === v.grade_id)?.name ?? '—'}</Td>
                    <Td className="text-steel-600">{specs.data?.find((s) => s.id === v.specialization_id)?.name ?? '—'}</Td>
                    <Td className="text-steel-500">{v.sort_order}</Td>
                    <Td className="text-[13px]">{v.is_published ? 'منشور' : 'مخفي'}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing(v)} aria-label={`تعديل ${v.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button onClick={() => setToDelete(v)} aria-label={`حذف ${v.title}`}
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
        ) : <EmptyState icon={<PlayCircle className="h-7 w-7" />} title="لا توجد فيديوهات"
              description="أضف رابط فيديو من قناة المركز على يوتيوب." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg"
        title={editing?.id ? 'تعديل فيديو' : 'إضافة فيديو'}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={save.isPending} onClick={() => editing && save.mutate(editing)}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <Input label="عنوان الفيديو" required value={editing.title ?? ''} onChange={(e) => set({ title: e.target.value })} />

            <Input label="رابط YouTube" required dir="ltr" placeholder="https://www.youtube.com/watch?v=..."
              hint="يُقبل أي صيغة: watch أو youtu.be أو embed أو shorts"
              error={editing.youtube_url && !previewId ? 'الرابط غير صالح — تأكد من نسخه كاملاً' : undefined}
              value={editing.youtube_url ?? ''} onChange={(e) => set({ youtube_url: e.target.value })} />

            {previewId && (
              <div className="flex items-center gap-4 rounded-xl border border-steel-200 bg-steel-50 p-3">
                <img src={youtubeThumb(previewId, 'mq')} alt="" className="h-16 w-28 rounded object-cover" />
                <div>
                  <p className="text-[13px] font-semibold text-emerald-700">تم التعرف على الفيديو</p>
                  <p className="text-[12px] text-steel-500" dir="ltr">ID: {previewId}</p>
                </div>
              </div>
            )}

            <Input label="رابط قائمة التشغيل (اختياري)" dir="ltr" placeholder="https://www.youtube.com/playlist?list=..."
              value={editing.playlist_url ?? ''} onChange={(e) => set({ playlist_url: e.target.value })} />

            <Textarea label="وصف الفيديو" rows={3} value={editing.description ?? ''} onChange={(e) => set({ description: e.target.value })} />

            <ImageUpload label="صورة مصغّرة مخصصة (اختياري)" prefix="videos" value={editing.thumbnail_url ?? null}
              hint="إن تُركت فارغة تُستخدم الصورة المصغّرة من يوتيوب تلقائياً"
              onChange={(v) => set({ thumbnail_url: v })} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Select label="الصف" value={String(editing.grade_id ?? '')}
                onChange={(e) => set({ grade_id: e.target.value ? Number(e.target.value) : null, subject_id: null })}>
                <option value="">— غير محدد —</option>
                {grades.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
              <Select label="المادة" value={editing.subject_id ?? ''} onChange={(e) => set({ subject_id: e.target.value || null })}>
                <option value="">— غير محددة —</option>
                {subs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Select label="التخصص" value={editing.specialization_id ?? ''} onChange={(e) => set({ specialization_id: e.target.value || null })}>
                <option value="">— غير محدد —</option>
                {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input label="مدة الفيديو" placeholder="مثال: 12:35" dir="ltr"
                value={editing.duration_text ?? ''} onChange={(e) => set({ duration_text: e.target.value })} />
              <Input label="ترتيب العرض" type="number" value={String(editing.sort_order ?? 99)}
                onChange={(e) => set({ sort_order: Number(e.target.value) })} />
            </div>

            <Switch label="منشور على الموقع" checked={editing.is_published !== false} onChange={(v) => set({ is_published: v })} />

            <Alert tone="info">لا تُرفع أي ملفات فيديو على الخادم — تُخزَّن الروابط فقط، وهو ما يبقي تكلفة التشغيل صفراً.</Alert>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف الفيديو" message={`سيُحذف «${toDelete?.title}» من المنصة (ولن يُحذف من يوتيوب). هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
