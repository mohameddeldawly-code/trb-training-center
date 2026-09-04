import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'brass' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition ' +
  'disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:   'bg-navy-700 text-white hover:bg-navy-800 active:bg-navy-900 shadow-sm',
  secondary: 'bg-white text-navy-800 border border-steel-300 hover:bg-steel-50 hover:border-navy-300',
  outline:   'bg-transparent text-white border border-white/40 hover:bg-white/10',
  ghost:     'bg-transparent text-navy-700 hover:bg-navy-50',
  danger:    'bg-ember-600 text-white hover:bg-ember-700',
  brass:     'bg-brass-600 text-white hover:bg-brass-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] min-w-[44px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[52px] px-7 text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  to?: string;
  href?: string;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, to, href, block, className, children, disabled, ...rest }, ref,
) {
  const cls = clsx(base, variants[variant], sizes[size], block && 'w-full', className);
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </>
  );

  if (to) return <Link to={to} className={cls}>{content}</Link>;
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>;

  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
});
