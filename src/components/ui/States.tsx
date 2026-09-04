import type { ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './Button';

/* ─────────────────── حالة التحميل ─────────────────── */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-navy-600', className)} aria-hidden />;
}

export function LoadingBlock({ label = 'جارٍ التحميل…', className }: { label?: string; className?: string }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3 py-16 text-steel-500', className)}
         role="status" aria-live="polite">
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-40 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-12 w-full" />)}
    </div>
  );
}

/* ─────────────────── حالة الفراغ ─────────────────── */
export function EmptyState({ title, description, icon, action, className }: {
  title: string; description?: string; icon?: ReactNode; action?: ReactNode; className?: string;
}) {
  return (
    <div className={clsx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-white/60 px-6 py-14 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-steel-100 text-steel-400">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden />}
      </div>
      <h3 className="text-base font-bold text-navy-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-7 text-steel-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ─────────────────── حالة الخطأ ─────────────────── */
export function ErrorState({ error, onRetry, className }: {
  error?: unknown; onRetry?: () => void; className?: string;
}) {
  const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء تحميل البيانات.';
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <div className={clsx('flex flex-col items-center justify-center rounded-2xl border border-ember-200 bg-ember-50/60 px-6 py-12 text-center', className)}
         role="alert">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-100 text-ember-600">
        {offline ? <WifiOff className="h-7 w-7" aria-hidden /> : <AlertTriangle className="h-7 w-7" aria-hidden />}
      </div>
      <h3 className="text-base font-bold text-ember-800">
        {offline ? 'لا يوجد اتصال بالإنترنت' : 'تعذّر عرض البيانات'}
      </h3>
      <p className="mt-1.5 max-w-lg text-sm leading-7 text-ember-700/90">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

/* ─────────────────── تنبيه داخل الصفحة ─────────────────── */
export function Alert({ tone = 'info', title, children }: {
  tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: ReactNode;
}) {
  const tones = {
    info:    'border-navy-200 bg-navy-50 text-navy-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-brass-200 bg-brass-50 text-brass-800',
    danger:  'border-ember-200 bg-ember-50 text-ember-800',
  } as const;
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-[14px] leading-7', tones[tone])} role="note">
      {title && <p className="mb-1 font-bold">{title}</p>}
      {children}
    </div>
  );
}
