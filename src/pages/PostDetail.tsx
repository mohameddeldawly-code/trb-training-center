import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { KIND_META } from '@/components/home/PostsSection';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import { fetchPost } from '@/data/api';
import { formatDate } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';

export default function PostDetail() {
  const { slug = '' } = useParams();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['post', slug], queryFn: () => fetchPost(slug), enabled: !!slug,
  });

  useSeo({ title: data?.title, description: data?.excerpt ?? undefined, image: data?.image_url ?? undefined });

  if (isLoading) return <LoadingBlock className="py-32" />;
  if (error) return <div className="container-page py-20"><ErrorState error={error} onRetry={() => void refetch()} /></div>;
  if (!data) return <div className="container-page py-20"><EmptyState title="الموضوع غير موجود" /></div>;

  const meta = KIND_META[data.kind];

  return (
    <>
      <PageHeader title={data.title}
        breadcrumb={[{ label: meta.label, to: data.kind === 'news' ? '/news' : data.kind === 'announcement' ? '/announcements' : '/instructions' }, { label: data.title }]}
        description={<span className="flex items-center gap-2 text-[13.5px] text-steel-500">
          <CalendarDays className="h-4 w-4" aria-hidden /> {formatDate(data.published_at)}
        </span>} />

      <article className="container-page max-w-3xl py-10">
        {data.image_url && (
          <img src={data.image_url} alt="" className="mb-8 w-full rounded-2xl object-cover" loading="lazy" />
        )}
        {data.excerpt && <p className="mb-6 border-r-4 border-brass-500 bg-brass-50/60 py-3 pr-4 text-[15.5px] leading-9 text-navy-800">{data.excerpt}</p>}
        {data.body && (
          <div className="prose-ar whitespace-pre-line text-[15.5px] leading-[2.15]">{data.body}</div>
        )}
        {data.link_url && (
          <a href={data.link_url} target="_blank" rel="noopener noreferrer"
             className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-5 text-[14px] font-semibold text-white hover:bg-navy-800">
            {data.link_label || 'رابط ذو صلة'} <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </article>
    </>
  );
}
