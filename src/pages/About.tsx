import { Building2, Compass, ListChecks, ShieldCheck, Target, Users2 } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { useSetting, useSettingList } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';

const DEPARTMENTS = [
  { name: 'إدارة شئون الطلاب',  role: 'التقديم والقبول والقيد والملفات والغياب والتصاريح وإعادة القيد' },
  { name: 'إدارة التعليم النظري', role: 'الحصص النظرية وجداولها وتحضير الدروس وأعمال السنة' },
  { name: 'إدارة التدريب العملي', role: 'التدريب بورش المركز وورش الشركة والخامات والتقييم اليومي' },
  { name: 'إدارة الامتحانات والمشاريع وشئون الخريجين', role: 'جداول الامتحانات والكنترول والنتيجة والشهادات والتنسيق' },
  { name: 'إدارة جودة وتكنولوجيا التعليم', role: 'تخطيط الجودة وقياس الأداء والمقررات ومجلس أولياء الأمور والشكاوى' },
];

export default function About() {
  const intro   = useSetting('about.intro', '');
  const vision  = useSetting('about.vision', '');
  const mission = useSetting('about.mission', '');
  const scope   = useSetting('about.scope', '');
  const isoNote = useSetting('about.iso_note', '');
  const values  = useSettingList('about.values');
  const goals   = useSettingList('about.objectives');

  useSeo({ title: 'عن المركز', description: intro.slice(0, 160) });

  return (
    <>
      <PageHeader title="عن المركز" description={intro} breadcrumb={[{ label: 'عن المركز' }]} />

      <div className="container-page grid gap-6 py-12 lg:grid-cols-3">
        {[
          { icon: Compass, title: 'الرؤية', body: vision },
          { icon: Target,  title: 'الرسالة', body: mission },
          { icon: Building2, title: 'نطاق الخدمة التعليمية', body: scope },
        ].map((c) => (
          <section key={c.title} className="card p-7">
            <c.icon className="mb-4 h-7 w-7 text-navy-700" aria-hidden />
            <h2 className="text-[18px]">{c.title}</h2>
            <p className="mt-3 text-[14.5px] leading-8 text-steel-600">{c.body || '—'}</p>
          </section>
        ))}
      </div>

      <div className="container-page grid gap-6 pb-12 lg:grid-cols-2">
        <section className="card p-7">
          <ShieldCheck className="mb-4 h-7 w-7 text-brass-600" aria-hidden />
          <h2 className="text-[18px]">قيمنا</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {values.map((v) => (
              <li key={v} className="flex items-center gap-2.5 rounded-xl bg-steel-50 px-4 py-3 text-[14px] font-semibold text-navy-800">
                <span className="h-1.5 w-1.5 rounded-full bg-brass-500" aria-hidden />{v}
              </li>
            ))}
          </ul>
          {isoNote && <p className="mt-5 rounded-xl bg-navy-50 px-4 py-3 text-[13.5px] leading-7 text-navy-800">{isoNote}</p>}
        </section>

        <section className="card p-7">
          <ListChecks className="mb-4 h-7 w-7 text-ember-600" aria-hidden />
          <h2 className="text-[18px]">أهداف الجودة المعتمدة</h2>
          <ol className="mt-4 space-y-3">
            {goals.map((g, i) => (
              <li key={g} className="flex gap-3 text-[14px] leading-7 text-steel-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-800">{i + 1}</span>
                {g}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="container-page pb-16">
        <section className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-steel-200 bg-steel-50 px-7 py-4">
            <Users2 className="h-6 w-6 text-navy-700" aria-hidden />
            <div>
              <h2 className="text-[18px]">إدارات المركز</h2>
              <p className="mt-0.5 text-[13px] text-steel-500">إلى أي إدارة تتوجّه عند كل حاجة</p>
            </div>
          </div>
          <ul className="grid gap-px bg-steel-200 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((d) => (
              <li key={d.name} className="bg-white p-6">
                <h3 className="text-[15.5px] leading-snug">{d.name}</h3>
                <p className="mt-2 text-[13.5px] leading-7 text-steel-600">{d.role}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
