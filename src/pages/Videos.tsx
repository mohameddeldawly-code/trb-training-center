import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, PlayCircle, Youtube } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from './PageHeader';
import { VideoCard } from '@/components/home/VideoCard';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, SkeletonGrid } from '@/components/ui/States';
import { fetchGrades, fetchSpecializations, fetchVideos } from '@/data/api';
import { extractYouTubeId, youtubeEmbed, youtubeWatch } from '@/lib/youtube';
import { useSetting } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';
import type { Video } from '@/types/db';

export default function Videos() {
  useSeo({ title: 'الفيديوهات التعليمية', description: 'الفيديوهات التعليمية لمركز تدريب شركة ترسانة الإسكندرية عبر قناة المركز على يوتيوب.' });

  const [grade, setGrade] = useState<number | null>(null);
  const [spec, setSpec]   = useState<string | null>(null);
  const [active, setActive] = useState<Video | null>(null);

  const channel = useSetting('social.youtube', '');
  const grades  = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const specs   = useQuery({ queryKey: ['specializations'], queryFn: () => fetchSpecializations() });
  const videos  = useQuery({ queryKey: ['videos', { grade, spec }], queryFn: () => fetchVideos({ gradeId: grade, specializationId: spec }) });

  const activeId = active ? (active.youtube_id ?? extractYouTubeId(active.youtube_url)) : null;

  return (
    <>
      <PageHeader title="الفيديوهات التعليمية" breadcrumb={[{ label: 'الفيديوهات' }]}
        description="محتوى تعليمي مصوَّر يُنشر على قناة المركز على يوتيوب ويُعرض هنا مرتباً حسب الصف والتخصص."
        action={channel ? (
          <a href={channel} target="_blank" rel="noopener noreferrer"
             className="inline-flex h-11 items-center gap-2 rounded-xl bg-ember-600 px-5 text-[14px] font-semibold text-white hover:bg-ember-700">
            <Youtube className="h-4 w-4" aria-hidden /> قناة المركز
          </a>
        ) : undefined} />

      <div className="container-page py-10">
        <div className="mb-8 flex flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setGrade(null)}
              className={clsx('h-10 rounded-xl px-4 text-[14px] font-semibold',
                !grade ? 'bg-navy-700 text-white' : 'border border-steel-300 text-navy-800 hover:bg-steel-50')}>
              كل الصفوف
            </button>
            {grades.data?.map((g) => (
              <button key={g.id} onClick={() => setGrade(g.id)}
                className={clsx('h-10 rounded-xl px-4 text-[14px] font-semibold',
                  grade === g.id ? 'bg-navy-700 text-white' : 'border border-steel-300 text-navy-800 hover:bg-steel-50')}>
                {g.name}
              </button>
            ))}
          </div>
          <select value={spec ?? ''} onChange={(e) => setSpec(e.target.value || null)} aria-label="التخصص"
            className="h-10 rounded-xl border border-steel-300 px-3 text-[14px]">
            <option value="">كل التخصصات</option>
            {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {videos.isLoading ? <SkeletonGrid count={6} />
          : videos.error ? <ErrorState error={videos.error} onRetry={() => void videos.refetch()} />
          : videos.data?.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos.data.map((v) => <VideoCard key={v.id} video={v} onOpen={setActive} />)}
            </div>
          ) : (
            <EmptyState icon={<PlayCircle className="h-7 w-7" />} title="لا توجد فيديوهات"
              description="تُضاف روابط الفيديوهات من لوحة الإدارة، وتُخزَّن الروابط فقط دون رفع أي ملف على الخادم." />
          )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title ?? ''} size="lg"
        footer={activeId ? (
          <a href={youtubeWatch(activeId)} target="_blank" rel="noopener noreferrer"
             className="inline-flex h-10 items-center gap-2 rounded-xl border border-steel-300 px-4 text-[14px] font-semibold text-navy-800 hover:bg-steel-50">
            <ExternalLink className="h-4 w-4" aria-hidden /> فتح على يوتيوب
          </a>
        ) : undefined}>
        {activeId && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe src={`${youtubeEmbed(activeId)}&autoplay=1`} title={active?.title ?? ''} className="h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        )}
        {active?.description && <p className="mt-4 text-[14.5px] leading-8 text-steel-600">{active.description}</p>}
      </Modal>
    </>
  );
}
