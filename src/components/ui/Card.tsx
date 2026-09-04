import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ className, children, hover }: { className?: string; children: ReactNode; hover?: boolean }) {
  return <div className={clsx('card', hover && 'card-hover', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, className }: {
  title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 border-b border-steel-200/70 px-5 py-4', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-bold text-navy-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-steel-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
