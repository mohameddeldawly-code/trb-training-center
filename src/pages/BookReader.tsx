import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BookOpen, Download } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { PdfViewer } from '@/components/shared/PdfViewer';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { fetchBook, fetchGrades } from '@/data/api';
import { formatFileSize } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';

export default function BookReader() {
  const { id = '' } = useParams();
  const book   = useQuery({ queryKey: ['book', id], queryFn: () => fetchBook(id), enabled: !!id });
  const grades = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });

  useSeo({ title: book.data?.title, description: book.data?.description ?? undefined });

  if (book.isLoading) return <LoadingBlock className="py-32" />;
  if (book.error) return <div className="container-page py-20"><ErrorState error={book.error} onRetry={() => void book.refetch()} /></div>;
  if (!book.data) return <div className="container-page py-20"><EmptyState title="الكتاب غير موجود" /></div>;

  const b = book.data;
  const grade = grades.data?.find((g) => g.id === b.grade_id);

  return (
    <>
      <PageHeader title={b.title} description={b.description ?? undefined}
        breadcrumb={[{ label: 'المكتبة الإلكترونية', to: '/library' }, { label: b.title }]}
        action={b.pdf_url && b.allow_download ? (
          <a href={b.pdf_url} download target="_blank" rel="noopener noreferrer"
             className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-5 text-[14px] font-semibold text-white hover:bg-navy-800">
            <Download className="h-4 w-4" aria-hidden /> تحميل PDF
          </a>
        ) : undefined} />

      <div className="container-page py-8">
        <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-[13.5px] text-steel-600">
          {b.author && <div><dt className="inline font-semibold text-navy-800">المؤلف: </dt><dd className="inline">{b.author}</dd></div>}
          {grade && <div><dt className="inline font-semibold text-navy-800">الصف: </dt><dd className="inline">{grade.name}</dd></div>}
          {b.pages && <div><dt className="inline font-semibold text-navy-800">عدد الصفحات: </dt><dd className="inline">{b.pages}</dd></div>}
          {b.file_size_kb && <div><dt className="inline font-semibold text-navy-800">حجم الملف: </dt><dd className="inline">{formatFileSize(b.file_size_kb)}</dd></div>}
        </dl>

        {b.pdf_url ? (
          <PdfViewer url={b.pdf_url} title={b.title} allowDownload={b.allow_download} />
        ) : (
          <EmptyState icon={<BookOpen className="h-7 w-7" />} title="لم يُرفع ملف الكتاب بعد"
            description="يُرفع ملف PDF لهذا الكتاب من لوحة الإدارة." />
        )}
      </div>
    </>
  );
}
