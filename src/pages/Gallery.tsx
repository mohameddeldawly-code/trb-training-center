import { useQuery } from '@tanstack/react-query';
import { Images } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { GalleryGrid } from '@/components/home/GallerySection';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { fetchGallery } from '@/data/api';
import { useSeo } from '@/hooks/useSeo';

export default function Gallery() {
  useSeo({ title: 'معرض الصور', description: 'صور من داخل مركز تدريب شركة ترسانة الإسكندرية وورشه.' });
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['gallery', 'all'], queryFn: () => fetchGallery() });

  return (
    <>
      <PageHeader title="معرض الصور" breadcrumb={[{ label: 'معرض الصور' }]}
        description="صور من داخل فصول المركز وورشه ومن التدريب داخل ورش الشركة الإنتاجية." />
      <div className="container-page py-10">
        {isLoading ? <SkeletonGrid count={8} />
          : error ? <ErrorState error={error} onRetry={() => void refetch()} />
          : data?.length ? <GalleryGrid items={data} />
          : <EmptyState icon={<Images className="h-7 w-7" />} title="لا توجد صور بعد" description="تُرفع الصور من لوحة الإدارة." />}
      </div>
    </>
  );
}
