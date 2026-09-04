import { useQuery } from '@tanstack/react-query';
import { PageHeader } from './PageHeader';
import { PostCard } from '@/components/home/PostsSection';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { fetchPosts } from '@/data/api';
import { useSeo } from '@/hooks/useSeo';
import type { ContentKind } from '@/types/db';

const META: Record<ContentKind, { title: string; description: string }> = {
  news:         { title: 'الأخبار',   description: 'آخر أخبار مركز تدريب شركة ترسانة الإسكندرية وأنشطته.' },
  announcement: { title: 'الإعلانات', description: 'الإعلانات الرسمية الموجَّهة للمتعلمين وأولياء الأمور.' },
  instruction:  { title: 'التعليمات', description: 'التعليمات والتنبيهات المعتمدة الصادرة عن إدارات المركز.' },
};

export default function PostsList({ kind }: { kind: ContentKind }) {
  const meta = META[kind];
  useSeo({ title: meta.title, description: meta.description });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['posts', kind, 'all'],
    queryFn: () => fetchPosts({ kind }),
  });

  return (
    <>
      <PageHeader title={meta.title} description={meta.description} breadcrumb={[{ label: meta.title }]} />
      <div className="container-page py-10">
        {isLoading ? <SkeletonGrid count={6} />
          : error ? <ErrorState error={error} onRetry={() => void refetch()} />
          : data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          ) : <EmptyState title={`لا يوجد محتوى في «${meta.title}» حالياً`} description="يُضاف المحتوى وينشر من لوحة الإدارة." />}
      </div>
    </>
  );
}
