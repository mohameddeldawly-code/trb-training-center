import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; description?: string;
  children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' } as const;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-navy-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
         onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
           className={clsx('w-full rounded-t-3xl bg-white shadow-lift outline-none sm:rounded-2xl animate-fade-up', widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-steel-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-navy-900">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-steel-500">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="إغلاق"
                  className="rounded-lg p-2 text-steel-500 transition hover:bg-steel-100 hover:text-navy-800">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-steel-200 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'تأكيد الحذف', danger = true, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose}
            className="h-10 rounded-xl border border-steel-300 px-4 text-sm font-semibold text-navy-800 hover:bg-steel-50">
            إلغاء
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={clsx('h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50',
              danger ? 'bg-ember-600 hover:bg-ember-700' : 'bg-navy-700 hover:bg-navy-800')}>
            {loading ? 'جارٍ التنفيذ…' : confirmLabel}
          </button>
        </>
      }>
      <p className="text-[15px] leading-8 text-steel-700">{message}</p>
    </Modal>
  );
}
