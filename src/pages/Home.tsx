import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquareWarning, Phone, Users } from 'lucide-react';
import { Hero } from '@/components/home/Hero';
import { AnnouncementBar } from '@/components/home/AnnouncementBar';
import { AboutSection } from '@/components/home/AboutSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { SpecializationsGrid } from '@/components/home/SpecializationsGrid';
import { PostCard } from '@/components/home/PostsSection';
import { GalleryGrid } from '@/components/home/GallerySection';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { EmptyState, SkeletonGrid } from '@/components/ui/States';
import { fetchGallery, fetchPosts, fetchSpecializations, fetchVideos } from '@/data/api';
import { useSetting, useSettingBool } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';
import { YouTubeEmbed } from '@/components/shared/YouTubeEmbed';
import { extractYouTubeId } from '@/lib/youtube';

export default function Home() {
  useSeo({
    title: undefined,
    description: useSetting('seo.description', ''),
  });

  const showStats   = useSettingBool('home.show_stats', true);
  const showGallery = useSettingBool('home.show_gallery', true);
  const phone       = useSetting('contact.phone', '');
  const address     = useSetting('contact.address', '');

  const specs   = useQuery({ queryKey: ['specializations'], queryFn: () => fetchSpecializations() });
  const news    = useQuery({ queryKey: ['posts', 'news', 3],  queryFn: () => fetchPosts({ kind: 'news', limit: 3 }) });
  const anns    = useQuery({ queryKey: ['posts', 'ann', 3],   queryFn: () => fetchPosts({ kind: 'announcement', limit: 3 }) });
  const instr   = useQuery({ queryKey: ['posts', 'inst', 3],  queryFn: () => fetchPosts({ kind: 'instruction', limit: 3 }) });
  const videos  = useQuery({ queryKey: ['videos', 'home'],    queryFn: () => fetchVideos({ limit: 3 }) });
  const gallery = useQuery({ queryKey: ['gallery', 'home'],   queryFn: () => fetchGallery({ limit: 8 }) });

  return (
    <>
      <AnnouncementBar />
      <Hero />

      <div className="-mt-10 relative z-10">
        <ServicesSection />
      </div>

      <AboutSection />

      {/* التخصصات */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <SectionTitle eyebrow="البرامج التدريبية" title="التخصصات الفنية"
            description="سبعة تخصصات فنية يدرسها المتعلم على ثلاث سنوات، تجمع بين التعليم النظري والتدريب العملي داخل ورش المركز وورش الشركة الإنتاجية."
            actionTo="/specializations" actionLabel="كل التخصصات" />
          {specs.isLoading ? <SkeletonGrid count={6} />
            : specs.data?.length
              ? <SpecializationsGrid items={specs.data.slice(0, 6)} />
              : <EmptyState title="لا توجد تخصصات منشورة" description="تُضاف التخصصات من لوحة الإدارة." />}
        </div>
      </section>

      {showStats && <StatsSection />}

      {/* الأخبار والإعلانات والتعليمات */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-3">
          {[
            { title: 'أحدث الأخبار', to: '/news',          q: news,  empty: 'لا توجد أخبار منشورة حالياً.' },
            { title: 'الإعلانات',     to: '/announcements', q: anns,  empty: 'لا توجد إعلانات حالياً.' },
            { title: 'التعليمات',     to: '/instructions',  q: instr, empty: 'لا توجد تعليمات منشورة.' },
          ].map((col) => (
            <div key={col.to}>
              <div className="mb-5 flex items-center justify-between border-b border-steel-200 pb-3">
                <h2 className="text-[19px]">{col.title}</h2>
                <Link to={col.to} className="flex items-center gap-1 text-[13px] font-bold text-navy-700 hover:text-navy-900">
                  الكل <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              {col.q.isLoading ? (
                <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 w-full" />)}</div>
              ) : col.q.data?.length ? (
                <div className="space-y-3">
                  {col.q.data.map((p) => <PostCard key={p.id} post={p} horizontal />)}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-steel-300 p-6 text-center text-[13.5px] text-steel-500">
                  {col.empty}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* الفيديوهات */}
      {!!videos.data?.length && (
        <section className="bg-navy-950 py-16 text-white sm:py-20">
          <div className="container-page">
            <SectionTitle light eyebrow="قناة المركز" title="الفيديوهات التعليمية"
              description="محتوى تعليمي مصوَّر عبر قناة المركز على يوتيوب."
              actionTo="/videos" actionLabel="كل الفيديوهات" />
            <div className="grid gap-6 lg:grid-cols-3">
              {videos.data.map((v) => {
                const id = v.youtube_id ?? extractYouTubeId(v.youtube_url);
                return id ? (
                  <div key={v.id}>
                    <YouTubeEmbed id={id} title={v.title} thumbnail={v.thumbnail_url} />
                    <h3 className="clamp-2 mt-3 text-[15px] font-bold text-white">{v.title}</h3>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </section>
      )}

      {/* معرض الصور */}
      {showGallery && !!gallery.data?.length && (
        <section className="container-page py-16 sm:py-20">
          <SectionTitle eyebrow="من داخل المركز" title="معرض الصور" actionTo="/gallery" actionLabel="كل الصور" />
          <GalleryGrid items={gallery.data} />
        </section>
      )}

      {/* الشكاوى وبوابة ولي الأمر والتواصل */}
      <section className="container-page pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card overflow-hidden bg-blueprint p-8 text-white">
            <MessageSquareWarning className="mb-4 h-8 w-8 text-brass-400" aria-hidden />
            <h2 className="text-[22px] text-white">الشكاوى والمقترحات والطلبات</h2>
            <p className="mt-3 max-w-lg text-[14.5px] leading-8 text-white/70">
              شكواك ومقترحك مادة للتحسين لا مصدراً للانزعاج. يُقيَّد كل طلب برقم مرجعي فور إرساله،
              ويمكنك متابعته في أي وقت، والتواصل مع المركز عبر واتساب مباشرةً.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/complaints"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-ember-600 px-6 text-[14.5px] font-bold text-white hover:bg-ember-700">
                تقديم طلب جديد
              </Link>
              <Link to="/complaints/track"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 px-6 text-[14.5px] font-bold text-white hover:bg-white/10">
                تتبع طلب سابق
              </Link>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="card p-7">
              <Users className="mb-4 h-8 w-8 text-navy-700" aria-hidden />
              <h2 className="text-[20px]">بوابة ولي الأمر</h2>
              <p className="mt-2.5 text-[14.5px] leading-8 text-steel-600">
                تابع نسبة حضور ابنك وأيام غيابه وسجل التواريخ ببيانات محدَّثة من إدارة شئون الطلاب.
              </p>
              <Link to="/parent"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-navy-700 px-5 text-[14px] font-bold text-white hover:bg-navy-800">
                الدخول إلى البوابة <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="card p-7">
              <Phone className="mb-4 h-8 w-8 text-brass-600" aria-hidden />
              <h2 className="text-[20px]">التواصل مع المركز</h2>
              <dl className="mt-3 space-y-1.5 text-[14px] text-steel-600">
                {address && <div><dt className="inline font-semibold text-navy-800">العنوان: </dt><dd className="inline">{address}</dd></div>}
                {phone && <div><dt className="inline font-semibold text-navy-800">الهاتف: </dt><dd className="inline">{phone}</dd></div>}
              </dl>
              <Link to="/contact" className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-bold text-navy-700 hover:text-navy-900">
                بيانات التواصل كاملة <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
