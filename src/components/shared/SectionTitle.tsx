import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

export function SectionTitle({ eyebrow, title, description, action, actionTo, actionLabel, center, light }: {
  eyebrow?: string; title: string; description?: ReactNode;
  action?: ReactNode; actionTo?: string; actionLabel?: string; center?: boolean; light?: boolean;
}) {
  return (
    <div className={clsx('mb-8 flex flex-wrap items-end justify-between gap-4', center && 'flex-col items-center text-center')}>
      <div className={clsx('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && (
          <p className={clsx('mb-2 flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[.14em]',
            center && 'justify-center', light ? 'text-brass-400' : 'text-brass-600')}>
            <span className={clsx('h-px w-6', light ? 'bg-brass-400/60' : 'bg-brass-500/60')} aria-hidden />
            {eyebrow}
          </p>
        )}
        <h2 className={clsx('font-display text-[26px] leading-tight sm:text-[32px]', light && 'text-white')}>{title}</h2>
        {description && (
          <p className={clsx('mt-3 text-[15px] leading-8', light ? 'text-white/70' : 'text-steel-600')}>{description}</p>
        )}
      </div>
      {action ?? (actionTo && (
        <Link to={actionTo}
          className={clsx('flex items-center gap-1 text-[14px] font-bold transition',
            light ? 'text-white/80 hover:text-white' : 'text-navy-700 hover:text-navy-900')}>
          {actionLabel ?? 'عرض الكل'} <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
