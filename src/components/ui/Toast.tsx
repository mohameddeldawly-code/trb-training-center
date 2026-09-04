import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from 'lucide-react';

type Tone = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; tone: Tone; title: string; description?: string }

interface Ctx { push: (t: Omit<Toast, 'id'>) => void }
const ToastCtx = createContext<Ctx>({ push: () => {} });

export const useToast = () => useContext(ToastCtx);

const icons = {
  success: CheckCircle2, error: XCircle, info: Info, warning: AlertTriangle,
} as const;

const tones: Record<Tone, string> = {
  success: 'border-emerald-200 bg-white text-emerald-700',
  error:   'border-ember-200 bg-white text-ember-700',
  info:    'border-navy-200 bg-white text-navy-700',
  warning: 'border-brass-200 bg-white text-brass-700',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { ...t, id }]);
    window.setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 5200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2"
           aria-live="polite" aria-atomic="false">
        {items.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div key={t.id}
                 className={clsx('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lift animate-fade-up', tones[t.tone])}>
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-6 text-steel-600">{t.description}</p>}
              </div>
              <button onClick={() => setItems((s) => s.filter((x) => x.id !== t.id))}
                      className="rounded-lg p-1 text-steel-400 hover:bg-steel-100" aria-label="إغلاق التنبيه">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
