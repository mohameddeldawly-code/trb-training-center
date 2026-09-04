import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** جدول متجاوب — يمرَّر أفقياً داخل حاويته ولا يكسر تخطيط الصفحة */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-steel-200 bg-white">
      <table className={clsx('w-full min-w-[720px] border-collapse text-right text-[14px]', className)}>
        {children}
      </table>
    </div>
  );
}

type CellProps = { children?: ReactNode; className?: string } & Omit<HTMLAttributes<HTMLTableCellElement>, 'className' | 'children'>;

export const Th = ({ children, className, ...rest }: CellProps) => (
  <th scope="col" {...rest}
    className={clsx('whitespace-nowrap border-b border-steel-200 bg-steel-50 px-4 py-3 text-[13px] font-bold text-steel-600', className)}>
    {children}
  </th>
);

export const Td = ({ children, className, ...rest }: CellProps) => (
  <td {...rest} className={clsx('border-b border-steel-100 px-4 py-3 align-middle text-navy-800', className)}>{children}</td>
);

export function Pagination({ page, pageSize, total, onChange }: {
  page: number; pageSize: number; total: number; onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 pt-4" aria-label="تصفح الصفحات">
      <p className="text-[13px] text-steel-500">
        صفحة {page} من {pages} — إجمالي {total.toLocaleString('ar-EG')} سجل
      </p>
      <div className="flex gap-2">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="الصفحة السابقة"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel-300 text-navy-700 disabled:opacity-40 hover:bg-steel-50">
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="الصفحة التالية"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel-300 text-navy-700 disabled:opacity-40 hover:bg-steel-50">
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
