import { useQuery } from '@tanstack/react-query';
import { PageHeader } from './PageHeader';
import { SpecializationsGrid } from '@/components/home/SpecializationsGrid';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { fetchSpecializations } from '@/data/api';
import { useSeo } from '@/hooks/useSeo';

export default function Specializations() {
  useSeo({
    title: 'التخصصات الفنية',
    description: 'التخصصات الفنية بمركز تدريب شركة ترسانة الإسكندرية — دراسة ثلاث سنوات تجمع بين التعليم النظري والتدريب العملي.',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['specializations'], queryFn: () => fetchSpecializations(),
  });

  return (
    <>
      <PageHeader title="التخصصات الفنية" breadcrumb={[{ label: 'التخصصات' }]}
        description="يضم المركز سبعة تخصصات فنية يدرسها المتعلم على ثلاث سنوات، ويجمع فيها بين التعليم النظري داخل الفصول والتدريب العملي داخل ورش المركز وورش الشركة الإنتاجية." />

      <div className="container-page py-12">
        {isLoading ? <SkeletonGrid count={6} />
          : error ? <ErrorState error={error} onRetry={() => void refetch()} />
          : data?.length ? <SpecializationsGrid items={data} />
          : <EmptyState title="لا توجد تخصصات منشورة" description="تُضاف التخصصات وتُنشر من لوحة الإدارة." />}
      </div>
    </>
  );
}
