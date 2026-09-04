import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { SpecIcon } from '@/components/shared/SpecIcon';
import type { Specialization } from '@/types/db';

export function SpecializationCard({ spec, compact }: { spec: Specialization; compact?: boolean }) {
  return (
    <Link to={`/specializations/${spec.slug}`}
      className="card card-hover group flex flex-col overflow-hidden focus-visible:ring-4 focus-visible:ring-navy-500/20">
      <div className="relative h-36 overflow-hidden bg-navy-900">
        {spec.cover_image_url ? (
          <img src={spec.cover_image_url} alt="" loading="lazy" decoding="async"
            className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95" />
        ) : (
          <div className="h-full w-full bg-blueprint" aria-hidden />
        )}
        <span className="absolute bottom-0 right-5 translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lift"
              style={{ backgroundColor: spec.accent_color ?? '#17386a' }}>
          <SpecIcon name={spec.icon} className="h-7 w-7" />
        </span>
      </div>

      <div className={clsx('flex flex-1 flex-col p-5 pt-10', compact && 'pb-4')}>
        <h3 className="text-[17px] leading-snug text-navy-900">{spec.name}</h3>
        {spec.summary && <p className="clamp-3 mt-2.5 flex-1 text-[14px] leading-7 text-steel-600">{spec.summary}</p>}
        <span className="mt-4 flex items-center gap-1.5 text-[13.5px] font-bold text-navy-700 transition group-hover:gap-2.5">
          تفاصيل التخصص <ArrowLeft className="h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function SpecializationsGrid({ items }: { items: Specialization[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => <SpecializationCard key={s.id} spec={s} />)}
    </div>
  );
}
