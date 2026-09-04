import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Badge({ children, tone, className }: { children: ReactNode; tone?: string; className?: string }) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap',
      tone ?? 'bg-steel-100 text-steel-700 border-steel-200',
      className,
    )}>
      {children}
    </span>
  );
}
