import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Pagination, Table, Td, Th } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { deleteBook, fetchBooks, fetchGrades, fetchSpecializations, fetchSubjects, saveBook } from '@/data/api';
import { formatFileSize, slugify } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { Book } from '@/types/db';

const PAGE_SIZE = 20;

export default function BooksAdmin() {
  useSeo({ title: 'إدارة المكتبة', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<Book> | null>(null);
  const [toDelete, setToDelete] = useState<Book | null>(null);

  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs  = useQuery({ queryKey: ['specializations', 'admin'], queryFn: () => fetchSpecializations(true) });
  const subs   = useQuery({ queryKey: ['subjects', 'admin', editing?.grade_id ?? 0],
    queryFn: () => fetchSubjects(editing?.grade_id ? { gradeId: editing.grade_id } : {}), enabled: !!editing });
  const list   = useQuery({ queryKey: ['books', 'admin', { page, search, grade }],
    queryFn: () => fetchBooks({ page, pageSize: PAGE_SIZE, search, gradeId: grade, includeUnpublished: true }) });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['books'] });

  const save = useMutation({
    mutationFn: (row: Partial<Book>) => saveBook(row),
    onSuccess: () => { void invalidate(); setEditing(null); toast.push({ tone: 'success', title: 'تم حفظ الكتاب' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: () => { void invalidate(); setToDelete(null); toast.push({ tone: 'success', title: 'تم حذف الكتاب' }); },
  });

  const set = (p: Partial<Book>) => setEditing((e) => ({ ...(e ?? {}), ...p }));

  return (
    <AdminPage title="المكتبة الإلكترونية — الكتب"
      description="ارفع الكتب والمقررات والمذكرات بصيغة PDF، وحدّد الصف والمادة والتخصص، وتحكّم في السماح بالتحميل."
      action={<Button onClick={() => setEditing({ is_published: true, allow_download: true, sort_order: 99 })}
        icon={<Plus className="h-4 w-4" />}>إضافة كتاب</Button>}>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" aria-hidden />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالعنوان أو المؤلف…" aria-label="بحث"
            className="h-11 w-full rounded-xl border border-steel-300 bg-white pr-10 pl-3 text-[14.5px]" />
        </div>
        <select value={grade ?? ''} onChange={(e) => { setGrade(e.target.value ? Number(e.target.value) : null); setPage(1); }}
          aria-label="الصف" className="h-11 rounded-xl border border-steel-300 bg-white px-3 text-[14.5px]">
          <option value="">كل الصفوف</option>
          {grades.data?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {list.isLoading ? <SkeletonRows rows={8} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.rows.length ? (
          <>
            <Table>
              <thead>
                <tr><Th>الكتاب</Th><Th>الصف</Th><Th>الملف</Th><Th>التحميل</Th><Th>الحالة</Th><Th className="w-32">إجراءات</Th></tr>
              </thead>
              <tbody>
                {list.data.rows.map((b) => (
                  <tr key={b.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {b.cover_image_url
                          ? <img src={b.cover_image_url} alt="" className="h-12 w-9 rounded object-cover" />
                          : <span className="flex h-12 w-9 items-center justify-center rounded bg-steel-100"><BookOpen className="h-4 w-4 text-steel-400" aria-hidden /></span>}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{b.title}</p>
                          {b.author && <p className="text-[12.5px] text-steel-500">{b.author}</p>}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-steel-600">{grades.data?.find((g) => g.id === b.grade_id)?.name ?? '—'}</Td>
                    <Td className="text-[13px] text-steel-600">{b.pdf_url ? formatFileSize(b.file_size_kb) : 'لا يوجد ملف'}</Td>
                    <Td className="text-[13px]">{b.allow_download ? 'مسموح' : 'قراءة فقط'}</Td>
                    <Td className="text-[13px]">{b.is_published ? 'منشور' : 'مخفي'}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditing(b)} aria-label={`تعديل ${b.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-steel-300 text-navy-700 hover:bg-steel-50">
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button onClick={() => setToDelete(b)} aria-label={`حذف ${b.title}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-ember-200 text-ember-600 hover:bg-ember-50">
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.count} onChange={setPage} />
          </>
        ) : <EmptyState icon={<BookOpen className="h-7 w-7" />} title="لا توجد كتب" description="ابدأ برفع أول كتاب PDF." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} size="lg"
        title={editing?.id ? 'تعديل كتاب' : 'إضافة كتاب'}
        footer={<>
          <Button variant="secondary" onClick={() => setEditing(null)}>إلغاء</Button>
          <Button loading={save.isPending}
            onClick={() => editing && save.mutate({ ...editing, slug: editing.slug || slugify(editing.title ?? '') })}>حفظ</Button>
        </>}>
        {editing && (
          <div className="space-y-5">
            <Input label="عنوان الكتاب" required value={editing.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
            <Textarea label="وصف مختصر" rows={3} value={editing.description ?? ''} onChange={(e) => set({ description: e.target.value })} />

            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="المؤلف / الجهة" value={editing.author ?? ''} onChange={(e) => set({ author: e.target.value })} />
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
              <Input label="عدد الصفحات" type="number" value={String(editing.pages ?? '')}
                onChange={(e) => set({ pages: e.target.value ? Number(e.target.value) : null })} />
              <Input label="ترتيب العرض" type="number" value={String(editing.sort_order ?? 99)}
                onChange={(e) => set({ sort_order: Number(e.target.value) })} />
            </div>

            <ImageUpload label="صورة الغلاف" prefix="books/covers" value={editing.cover_image_url ?? null}
              onChange={(v) => set({ cover_image_url: v })} />

            <ImageUpload label="ملف الكتاب (PDF)" bucket="books" prefix="pdf" accept="application/pdf"
              hint="الحد الأقصى 50 ميجابايت للملف الواحد"
              value={editing.pdf_url ?? null} onChange={(v) => set({ pdf_url: v })} />

            <Input label="حجم الملف (كيلوبايت)" type="number" hint="اختياري — يظهر للطالب قبل التحميل"
              value={String(editing.file_size_kb ?? '')}
              onChange={(e) => set({ file_size_kb: e.target.value ? Number(e.target.value) : null })} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Switch label="السماح بتحميل PDF" checked={editing.allow_download !== false}
                hint="إن أُوقف يُقرأ الكتاب داخل الموقع فقط" onChange={(v) => set({ allow_download: v })} />
              <Switch label="منشور على الموقع" checked={editing.is_published !== false}
                onChange={(v) => set({ is_published: v })} />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        title="حذف الكتاب" message={`سيُحذف «${toDelete?.title}» من المكتبة نهائياً. هل تريد المتابعة؟`} />
    </AdminPage>
  );
}
