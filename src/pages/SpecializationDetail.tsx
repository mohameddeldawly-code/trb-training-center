import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  BookOpen, Briefcase, GraduationCap, HardHat, Lightbulb, ListChecks,
  PlayCircle, Star, Target, Wrench, AlertTriangle,
} from 'lucide-react';
import { SpecIcon } from '@/components/shared/SpecIcon';
import { YouTubeEmbed } from '@/components/shared/YouTubeEmbed';
import { GalleryGrid } from '@/components/home/GallerySection';
import { EmptyState, ErrorState, LoadingBlock } from '@/components/ui/States';
import {
  fetchGallery, fetchGrades, fetchSpecializationBySlug, fetchStudyPlans, fetchSubjects, fetchVideos,
} from '@/data/api';
import { extractYouTubeId } from '@/lib/youtube';
import { useSeo } from '@/hooks/useSeo';
import type { Subject } from '@/types/db';

function Bullets({ items, icon: Icon }: { items: string[]; icon: typeof Star }) {
  if (!items?.length) return <p className="text-[14px] text-steel-500">—</p>;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[14.5px] leading-7 text-steel-700">
          <Icon className="mt-1 h-4 w-4 shrink-0 text-brass-600" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Star; children: React.ReactNode }) {
  return (
    <section className="card p-7">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-[18px]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function SpecializationDetail() {
  const { slug = '' } = useParams();

  const spec    = useQuery({ queryKey: ['spec', slug], queryFn: () => fetchSpecializationBySlug(slug), enabled: !!slug });
  const grades  = useQuery({ queryKey: ['grades'], queryFn: fetchGrades });
  const id      = spec.data?.id;
  const subs    = useQuery({ queryKey: ['subjects', id], queryFn: () => fetchSubjects({ specializationId: id }), enabled: !!id });
  const plans   = useQuery({ queryKey: ['plans', id], queryFn: () => fetchStudyPlans(id!), enabled: !!id });
  const videos  = useQuery({ queryKey: ['videos', 'spec', id], queryFn: () => fetchVideos({ specializationId: id }), enabled: !!id });
  const gallery = useQuery({ queryKey: ['gallery', 'spec', id], queryFn: () => fetchGallery({ specializationId: id }), enabled: !!id });

  useSeo({
    title: spec.data?.meta_title ?? spec.data?.name,
    description: spec.data?.meta_description ?? spec.data?.summary ?? undefined,
    image: spec.data?.cover_image_url ?? undefined,
  });

  if (spec.isLoading) return <LoadingBlock className="py-32" />;
  if (spec.error)     return <div className="container-page py-20"><ErrorState error={spec.error} onRetry={() => void spec.refetch()} /></div>;
  if (!spec.data)     return <div className="container-page py-20"><EmptyState title="التخصص غير موجود" description="ربما تم حذف هذا التخصص أو تغيير رابطه." /></div>;

  const s = spec.data;
  const byGrade = (gid: number) => (subs.data ?? []).filter((x: Subject) => x.grade_id === gid);

  return (
    <>
      {/* غلاف التخصص */}
      <div className="relative overflow-hidden bg-blueprint text-white">
        {s.cover_image_url && (
          <>
            <img src={s.cover_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-l from-navy-950/95 to-navy-950/70" aria-hidden />
          </>
        )}
        <div className="container-page relative py-14 sm:py-16">
          <span className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lift"
                style={{ backgroundColor: s.accent_color ?? '#17386a' }}>
            <SpecIcon name={s.icon} className="h-8 w-8 text-white" />
          </span>
          <h1 className="font-display text-[30px] leading-tight text-white sm:text-[40px]">{s.name}</h1>
          {s.summary && <p className="mt-4 max-w-3xl text-[15.5px] leading-9 text-white/75">{s.summary}</p>}
        </div>
      </div>

      <div className="container-page space-y-6 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="تعريف التخصص" icon={BookOpen}>
            <p className="prose-ar">{s.definition || '—'}</p>
          </Panel>
          <Panel title="أهمية التخصص" icon={Lightbulb}>
            <p className="prose-ar">{s.importance || '—'}</p>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="أهداف التخصص" icon={Target}><Bullets items={s.objectives} icon={Target} /></Panel>
          <Panel title="المهارات التي يكتسبها الطالب" icon={Star}><Bullets items={s.skills} icon={Star} /></Panel>
        </div>

        {/* المواد الدراسية */}
        <Panel title="المواد التي يدرسها الطالب" icon={ListChecks}>
          {subs.isLoading ? <div className="skeleton h-32 w-full" /> : (
            <div className="grid gap-5 lg:grid-cols-3">
              {(grades.data ?? []).map((g) => {
                const rows = byGrade(g.id);
                const common = rows.filter((r) => r.is_common);
                const own    = rows.filter((r) => !r.is_common);
                return (
                  <div key={g.id} className="rounded-2xl border border-steel-200 bg-steel-50/60 p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-[15.5px]">
                      <GraduationCap className="h-[18px] w-[18px] text-navy-700" aria-hidden /> {g.name}
                    </h3>
                    {own.length > 0 && (
                      <>
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-brass-700">مواد تخصصية</p>
                        <ul className="mb-4 flex flex-wrap gap-1.5">
                          {own.map((r) => (
                            <li key={r.id} className="rounded-lg bg-brass-100 px-2.5 py-1 text-[12.5px] font-semibold text-brass-900">{r.name}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {common.length > 0 && (
                      <>
                        <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-steel-500">مواد مشتركة</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {common.map((r) => (
                            <li key={r.id} className="rounded-lg bg-white px-2.5 py-1 text-[12.5px] font-medium text-steel-700 ring-1 ring-steel-200">{r.name}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {rows.length === 0 && <p className="text-[13.5px] text-steel-500">لم تُسجَّل مواد لهذا الصف بعد.</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* خطة الدراسة */}
        {!!plans.data?.length && (
          <Panel title="خطة الدراسة خلال السنوات الثلاث" icon={GraduationCap}>
            <ol className="space-y-4">
              {plans.data.map((p) => {
                const g = grades.data?.find((x) => x.id === p.grade_id);
                return (
                  <li key={p.id} className="rounded-2xl border border-steel-200 p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-navy-700 px-3 py-1 text-[12.5px] font-bold text-white">{g?.name ?? `الصف ${p.grade_id}`}</span>
                      <h3 className="text-[16px]">{p.title}</h3>
                    </div>
                    {p.focus && <p className="mb-4 text-[14px] leading-7 text-steel-600">{p.focus}</p>}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 text-[12.5px] font-bold text-navy-800">الجانب النظري</p>
                        <ul className="space-y-1.5 text-[13.5px] leading-6 text-steel-600">
                          {p.theory_topics?.map((t) => <li key={t}>• {t}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-[12.5px] font-bold text-navy-800">الجانب العملي</p>
                        <ul className="space-y-1.5 text-[13.5px] leading-6 text-steel-600">
                          {p.practical_topics?.map((t) => <li key={t}>• {t}</li>)}
                        </ul>
                      </div>
                    </div>
                    {p.notes && (
                      <p className="mt-4 rounded-xl bg-brass-50 px-4 py-3 text-[13px] leading-6 text-brass-900">{p.notes}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </Panel>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="طبيعة التدريب العملي" icon={Wrench}>
            <p className="prose-ar">{s.training_nature || '—'}</p>
            {!!s.equipment?.length && (
              <>
                <h3 className="mb-3 mt-6 text-[15px]">المعدات والأدوات المستخدمة</h3>
                <Bullets items={s.equipment} icon={Wrench} />
              </>
            )}
          </Panel>

          <Panel title="السلامة داخل ورشة التخصص" icon={HardHat}>
            <h3 className="mb-3 flex items-center gap-2 text-[14.5px] text-ember-700">
              <AlertTriangle className="h-4 w-4" aria-hidden /> المخاطر الرئيسية
            </h3>
            <ul className="mb-6 flex flex-wrap gap-2">
              {s.main_hazards?.map((h) => (
                <li key={h} className="rounded-lg bg-ember-50 px-3 py-1.5 text-[13px] font-semibold text-ember-800">{h}</li>
              ))}
            </ul>
            <h3 className="mb-3 text-[14.5px] text-navy-800">مهمات الوقاية الإلزامية</h3>
            <ul className="flex flex-wrap gap-2">
              {s.safety_ppe?.map((h) => (
                <li key={h} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-800">{h}</li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] leading-6 text-steel-500">
              المصدر: دليل الطالب وولي الأمر (ISO-COM-MN-01) — الفصل السابع.
            </p>
          </Panel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="مخرجات التعلم" icon={ListChecks}><Bullets items={s.learning_outcomes} icon={ListChecks} /></Panel>
          <Panel title="مجالات العمل المستقبلية" icon={Briefcase}><Bullets items={s.career_paths} icon={Briefcase} /></Panel>
        </div>

        {!!videos.data?.length && (
          <Panel title="فيديوهات مرتبطة بالتخصص" icon={PlayCircle}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videos.data.map((v) => {
                const vid = v.youtube_id ?? extractYouTubeId(v.youtube_url);
                return vid ? (
                  <div key={v.id}>
                    <YouTubeEmbed id={vid} title={v.title} thumbnail={v.thumbnail_url} />
                    <h3 className="clamp-2 mt-2.5 text-[14px] font-bold text-navy-900">{v.title}</h3>
                  </div>
                ) : null;
              })}
            </div>
          </Panel>
        )}

        {!!gallery.data?.length && (
          <Panel title="صور التخصص" icon={Star}>
            <GalleryGrid items={gallery.data} />
          </Panel>
        )}
      </div>
    </>
  );
}
