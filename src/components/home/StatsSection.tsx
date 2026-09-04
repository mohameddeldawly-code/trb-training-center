import { useQuery } from '@tanstack/react-query';
import { BookOpen, GraduationCap, PlayCircle, Users } from 'lucide-react';
import { fetchPublicStats } from '@/data/api';
import { formatNumber } from '@/lib/format';

export function StatsSection() {
  const { data } = useQuery({ queryKey: ['public-stats'], queryFn: fetchPublicStats, staleTime: 10 * 60_000 });

  const items = [
    { icon: GraduationCap, label: 'تخصص فني',        value: data?.specializations },
    { icon: BookOpen,      label: 'كتاب ومقرر رقمي', value: data?.books },
    { icon: PlayCircle,    label: 'فيديو تعليمي',    value: data?.videos },
    { icon: Users,         label: 'متعلم مقيَّد',      value: data?.students },
  ];

  return (
    <section className="bg-navy-900 py-14 text-white">
      <div className="container-page grid grid-cols-2 gap-8 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <s.icon className="mx-auto mb-3 h-7 w-7 text-brass-400" aria-hidden />
            <p className="font-display text-[32px] font-bold leading-none text-white">
              {s.value === undefined ? '—' : formatNumber(s.value)}
            </p>
            <p className="mt-2 text-[13.5px] text-white/60">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
