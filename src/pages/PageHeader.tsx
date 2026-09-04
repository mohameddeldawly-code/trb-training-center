import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

export function PageHeader({ title, description, breadcrumb, action }: {
  title: string; description?: ReactNode;
  breadcrumb?: Array<{ label: string; to?: string }>; action?: ReactNode;
}) {
  return (
    <div className="border-b border-steel-200 bg-white">
      <div className="container-page py-10 sm:py-12">
        <nav aria-label="مسار التنقل" className="mb-4 flex flex-wrap items-center gap-1.5 text-[12.5px] text-steel-500">
          <Link to="/" className="flex items-center gap-1 hover:text-navy-700">
            <Home className="h-3.5 w-3.5" aria-hidden /> الرئيسية
          </Link>
          {breadcrumb?.map((b) => (
            <span key={b.label} className="flex items-center gap-1.5">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              {b.to ? <Link to={b.to} className="hover:text-navy-700">{b.label}</Link>
                    : <span className="font-semibold text-navy-800">{b.label}</span>}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-[27px] leading-tight sm:text-[34px]">{title}</h1>
            {description && <p className="mt-3 text-[15px] leading-8 text-steel-600">{description}</p>}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
