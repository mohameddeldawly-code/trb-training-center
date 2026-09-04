import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Download, Filter, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { PageHeader } from './PageHeader';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Table';
import { fetchBooks, fetchGrades, fetchSpecializations, fetchSubjects } from '@/data/api';
import { formatFileSize } from '@/lib/format';
import { useSetting } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';

const PAGE_SIZE = 12;

export default function Library() {
  const intro = useSetting('library.intro', '');
  useSeo({ title: 'المكتبة الإلكترونية', description: intro || 'الكتب والمقررات الرقمية لمركز تدريب شركة ترسانة الإسكندرية.' });

  const [grade, setGrade]   = useState<number | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [spec, setSpec]     = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs  = useQuery({ queryKey: ['specializations'], queryFn: () => fetchSpecializations() });
  const subs   = useQuery({
    queryKey: ['subjects', 'library', grade],
    queryFn: () => fetchSubjects(grade ? { gradeId: grade } : {}),
  });

  const books = useQuery({
    queryKey: ['books', { grade, subject, spec, search, page }],
    queryFn: () => fetchBooks({ gradeId: grade, subjectId: subject, specializationId: spec, search, page, pageSize: PAGE_SIZE }),
  });

  const hasFilters = grade || subject || spec || search;
  const reset = () => { setGrade(null); setSubject(null); setSpec(null); setSearch(''); setPage(1); };

  const subjectOptions = useMemo(
    () => (subs.data ?? []).filter((s) => (spec ? s.specialization_id === spec || s.is_common : true)),
    [subs.data, spec],
  );

  return (
    <>
      <PageHeader title="المكتبة الإلكترونية" description={intro} breadcrumb={[{ label: 'المكتبة الإلكترونية' }]} />

      <div className="container-page py-10">
        {/* التصفية */}
        <div className="card mb-8 p-5">
          <div className="mb-4 flex items-center gap-2 text-[13.5px] font-bold text-navy-800">
            <Filter className="h-4 w-4" aria-hidden /> تصفية الكتب
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => { setGrade(null); setSubject(null); setPage(1); }}
              className={clsx('h-10 rounded-xl px-4 text-[14px] font-semibold transition',
                !grade ? 'bg-navy-700 text-white' : 'border border-steel-300 text-navy-800 hover:bg-steel-50')}>
              كل الصفوف
            </button>
            {grades.data?.map((g) => (
              <button key={g.id} onClick={() => { setGrade(g.id); setSubject(null); setPage(1); }}
                className={clsx('h-10 rounded-xl px-4 text-[14px] font-semibold transition',
                  grade === g.id ? 'bg-navy-700 text-white' : 'border border-steel-300 text-navy-800 hover:bg-steel-50')}>
                {g.name}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" aria-hidden />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ابحث باسم الكتاب أو المؤلف…" aria-label="بحث في المكتبة"
                className="h-11 w-full rounded-xl border border-steel-300 pr-10 pl-3 text-[14.5px] focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10" />
            </div>
            <select value={spec ?? ''} onChange={(e) => { setSpec(e.target.value || null); setPage(1); }}
              aria-label="التخصص"
              className="h-11 rounded-xl border border-steel-300 px-3 text-[14.5px] focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10">
              <option value="">كل التخصصات</option>
              {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={subject ?? ''} onChange={(e) => { setSubject(e.target.value || null); setPage(1); }}
              aria-label="المادة"
              className="h-11 rounded-xl border border-steel-300 px-3 text-[14.5px] focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10">
              <option value="">كل المواد</option>
              {subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button onClick={reset} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ember-700 hover:text-ember-800">
              <X className="h-3.5 w-3.5" aria-hidden /> إلغاء التصفية
            </button>
          )}
        </div>

        {books.isLoading ? <SkeletonGrid count={8} />
          : books.error ? <ErrorState error={books.error} onRetry={() => void books.refetch()} />
          : books.data?.rows.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {books.data.rows.map((b) => (
                  <Link key={b.id} to={`/library/book/${b.id}`} className="card card-hover group flex flex-col overflow-hidden">
                    <div className="relative aspect-[3/4] overflow-hidden bg-steel-100">
                      {b.cover_image_url ? (
                        <img src={b.cover_image_url} alt="" loading="lazy" decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blueprint">
                          <BookOpen className="h-12 w-12 text-white/40" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="clamp-2 text-[15px] leading-snug text-navy-900">{b.title}</h3>
                      {b.author && <p className="mt-1 text-[12.5px] text-steel-500">{b.author}</p>}
                      <div className="mt-auto flex items-center justify-between pt-3 text-[12px] text-steel-500">
                        <span>{grades.data?.find((g) => g.id === b.grade_id)?.name ?? ''}</span>
                        {b.allow_download && (
                          <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5" aria-hidden />{formatFileSize(b.file_size_kb)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={books.data.count} onChange={setPage} />
            </>
          ) : (
            <EmptyState icon={<BookOpen className="h-7 w-7" />}
              title={hasFilters ? 'لا توجد كتب مطابقة' : 'المكتبة فارغة حالياً'}
              description={hasFilters ? 'جرّب تعديل شروط البحث أو إلغاء التصفية.' : 'تُضاف الكتب وملفات PDF من لوحة الإدارة.'}
              action={hasFilters ? <button onClick={reset} className="h-11 rounded-xl border border-steel-300 px-5 text-[14px] font-semibold">إلغاء التصفية</button> : undefined} />
          )}
      </div>
    </>
  );
}
