import { Compass, Target, ListChecks } from 'lucide-react';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { useSetting, useSettingList } from '@/hooks/useSettings';

export function AboutSection() {
  const intro   = useSetting('about.intro', '');
  const vision  = useSetting('about.vision', '');
  const mission = useSetting('about.mission', '');
  const values  = useSettingList('about.values');
  const goals   = useSettingList('about.objectives');

  return (
    <section className="container-page py-16 sm:py-20">
      <SectionTitle eyebrow="عن المركز" title="من نحن" description={intro} />

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          { icon: Compass, title: 'الرؤية', body: vision, tone: 'bg-navy-700' },
          { icon: Target,  title: 'الرسالة', body: mission, tone: 'bg-ember-600' },
        ].map((c) => (
          <div key={c.title} className="card card-hover p-7">
            <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white ${c.tone}`}>
              <c.icon className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-[18px]">{c.title}</h3>
            <p className="mt-3 text-[14.5px] leading-8 text-steel-600">{c.body || '—'}</p>
          </div>
        ))}

        <div className="card p-7">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brass-600 text-white">
            <ListChecks className="h-6 w-6" aria-hidden />
          </div>
          <h3 className="text-[18px]">قيمنا</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {values.map((v) => (
              <li key={v} className="rounded-lg bg-steel-100 px-3 py-1.5 text-[13px] font-semibold text-navy-800">{v}</li>
            ))}
          </ul>
        </div>
      </div>

      {goals.length > 0 && (
        <div className="mt-6 card overflow-hidden">
          <div className="border-b border-steel-200 bg-steel-50 px-7 py-4">
            <h3 className="text-[17px]">أهداف الجودة المعتمدة</h3>
            <p className="mt-1 text-[13px] text-steel-500">أهداف سنوية قابلة للقياس وفق وثيقة أهداف النظام</p>
          </div>
          <ol className="grid gap-px bg-steel-200 sm:grid-cols-2">
            {goals.map((g, i) => (
              <li key={g} className="flex gap-3.5 bg-white p-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-[13px] font-bold text-navy-800">
                  {i + 1}
                </span>
                <span className="text-[14.5px] leading-7 text-steel-700">{g}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
