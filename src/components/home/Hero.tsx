import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

export function Hero() {
  const title    = useSetting('home.hero_title', 'مركز تدريب شركة ترسانة الإسكندرية');
  const subtitle = useSetting('home.hero_subtitle', '');
  const image    = useSetting('home.hero_image', '');
  const ctaLabel = useSetting('home.hero_cta_label', 'تعرّف على التخصصات');
  const ctaUrl   = useSetting('home.hero_cta_url', '/specializations');
  const logo     = useSetting('center.logo_url', '/logo.png');

  return (
    <section className="relative overflow-hidden bg-blueprint text-white">
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-l from-navy-950/95 via-navy-950/80 to-navy-950/60" aria-hidden />
        </>
      )}

      <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div className="animate-fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold text-brass-300">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            نظام إدارة المؤسسات التعليمية ISO 21001:2018
          </p>

          <h1 className="font-display text-[30px] leading-[1.25] text-white text-balance sm:text-[42px] lg:text-[48px]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-5 max-w-2xl text-[15.5px] leading-9 text-white/75 sm:text-[17px]">{subtitle}</p>
          )}

          <div className="mt-9 flex flex-wrap gap-3">
            <Link to={ctaUrl || '/specializations'}
              className="inline-flex h-[52px] items-center gap-2 rounded-xl bg-ember-600 px-7 text-[15px] font-bold text-white shadow-lift transition hover:bg-ember-700">
              {ctaLabel} <ArrowLeft className="h-[18px] w-[18px]" aria-hidden />
            </Link>
            <Link to="/library"
              className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-white/25 px-7 text-[15px] font-bold text-white transition hover:bg-white/10">
              <BookOpen className="h-[18px] w-[18px]" aria-hidden /> المكتبة الإلكترونية
            </Link>
          </div>

          <dl className="mt-11 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-7">
            {[
              { k: '٣', v: 'سنوات دراسية' },
              { k: '٧', v: 'تخصصات فنية' },
              { k: 'دبلوم', v: 'فني معادَل' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="font-display text-[26px] font-bold text-brass-400">{s.k}</dt>
                <dd className="mt-0.5 text-[13px] text-white/60">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* البطاقة البصرية */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-ember-600/25 via-transparent to-brass-500/20 blur-2xl" aria-hidden />
          <div className="relative rounded-3xl border border-white/12 bg-white/[.06] p-9 backdrop-blur">
            <img src={logo} alt="شعار شركة ترسانة الإسكندرية" className="mx-auto h-36 w-36 object-contain drop-shadow-2xl" />
            <p className="mt-7 text-center font-display text-[19px] font-bold text-white">
              تعليم فني منضبط وتدريب عملي حقيقي
            </p>
            <p className="mt-2 text-center text-[13.5px] leading-7 text-white/60">
              داخل ورش المركز وورش الشركة الإنتاجية العاملة
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                { icon: GraduationCap, label: 'دبلوم معادَل بقرار وزاري' },
                { icon: ShieldCheck,   label: 'سلامة أولاً — صفر إصابة' },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <f.icon className="mb-2 h-5 w-5 text-brass-400" aria-hidden />
                  <p className="text-[12.5px] leading-6 text-white/75">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
