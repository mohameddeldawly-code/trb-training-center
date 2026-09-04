import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

const control =
  'w-full rounded-xl border border-steel-300 bg-white px-3.5 py-2.5 text-[15px] text-navy-900 ' +
  'placeholder:text-steel-400 transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 ' +
  'disabled:bg-steel-100 disabled:text-steel-500';

function Wrapper({ id, label, hint, error, required, children }: {
  id: string; label?: ReactNode; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[13.5px] font-semibold text-navy-800">
          {label}
          {required && <span className="text-ember-600" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {error
        ? <p id={`${id}-err`} role="alert" className="text-[12.5px] font-medium text-ember-600">{error}</p>
        : hint ? <p id={`${id}-hint`} className="text-[12.5px] text-steel-500">{hint}</p> : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode; hint?: ReactNode; error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, required, ...rest }, ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} hint={hint} error={error} required={required}>
      <input ref={ref} id={fid} required={required} aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={clsx(control, error && 'border-ember-400 focus:border-ember-500 focus:ring-ember-500/10', className)}
        {...rest} />
    </Wrapper>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode; hint?: ReactNode; error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, required, rows = 5, ...rest }, ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} hint={hint} error={error} required={required}>
      <textarea ref={ref} id={fid} rows={rows} required={required} aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined}
        className={clsx(control, 'leading-8 resize-y', error && 'border-ember-400', className)} {...rest} />
    </Wrapper>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode; hint?: ReactNode; error?: string; children: ReactNode;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, required, children, ...rest }, ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Wrapper id={fid} label={label} hint={hint} error={error} required={required}>
      <select ref={ref} id={fid} required={required} aria-invalid={!!error}
        className={clsx(control, 'pl-9 bg-left bg-no-repeat', error && 'border-ember-400', className)} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
});

/** حقل قائمة نصية (مصفوفة سلاسل) — يُستخدم للأهداف والمهارات ونحوها */
export function ListField({ label, hint, value, onChange }: {
  label: string; hint?: string; value: string[]; onChange: (v: string[]) => void;
}) {
  return (
    <Textarea
      label={label}
      hint={hint ?? 'اكتب عنصراً في كل سطر'}
      value={(value ?? []).join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
    />
  );
}

export function Switch({ label, hint, checked, onChange }: {
  label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3 rounded-xl border border-steel-200 bg-white p-3.5">
      <button
        type="button" role="switch" aria-checked={checked} aria-labelledby={id}
        onClick={() => onChange(!checked)}
        className={clsx('mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-navy-700' : 'bg-steel-300')}
      >
        <span className={clsx('block h-5 w-5 rounded-full bg-white shadow transition-transform mx-0.5',
          checked ? '-translate-x-[20px]' : 'translate-x-0')} />
      </button>
      <div className="min-w-0">
        <span id={id} className="block text-[14px] font-semibold text-navy-800">{label}</span>
        {hint && <span className="block text-[12.5px] text-steel-500">{hint}</span>}
      </div>
    </div>
  );
}
