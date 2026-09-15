/** @type {import('tailwindcss').Config} */

/* كل لون مرتبط بمتغيّر CSS حتى ينقلب النظام كاملاً بين الوضع النهاري والليلي
   بتبديل قيم المتغيّرات فقط — بلا تكرار أي صنف في الكود. */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

const scale = (prefix, keys) =>
  Object.fromEntries(keys.map((k) => [k, v(`--${prefix}-${k}`)]));

const FULL = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── الهوية البصرية — كحلي بحري · أحمر الشعار · نحاسي ── */
        navy:  scale('navy',  FULL),
        steel: scale('steel', FULL),
        ember: scale('ember', FULL),
        brass: scale('brass', FULL),
        emerald: scale('emerald', FULL),   // نجاح — متوافق مع الوضع الليلي

        /* ── رموز دلالية: تنقلب تلقائياً مع الوضع الليلي ── */
        surface:  v('--surface'),          // خلفية البطاقات واللوحات
        'surface-2': v('--surface-2'),     // خلفية فرعية/مرتفعة
        'surface-3': v('--surface-3'),     // خلفية غائرة (حقول، أشرطة)
        canvas:   v('--canvas'),           // خلفية الصفحة
        ink:      v('--ink'),              // نص أساسي
        'ink-2':  v('--ink-2'),            // نص ثانوي
        muted:    v('--muted'),            // نص خافت
        line:     v('--line'),             // حدود
        'line-2': v('--line-2'),           // حدود أوضح
        accent:   v('--accent'),           // لون التفاعل الأساسي
        'accent-soft': v('--accent-soft'),
      },
      fontFamily: {
        sans:    ['"IBM Plex Sans Arabic"', '"Noto Kufi Arabic"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Cairo"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.6' }],
      },
      boxShadow: {
        card:  'var(--shadow-card)',
        lift:  'var(--shadow-lift)',
        float: 'var(--shadow-float)',
        glow:  '0 0 0 1px rgb(var(--accent) / .18), 0 12px 34px -14px rgb(var(--accent) / .45)',
        inner_soft: 'inset 0 1px 0 rgb(255 255 255 / .06)',
      },
      borderRadius: {
        lg: '0.625rem', xl: '0.875rem', '2xl': '1.125rem', '3xl': '1.5rem', '4xl': '2rem',
      },
      spacing: { 18: '4.5rem', 22: '5.5rem' },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,1,.36,1)',
        snap:   'cubic-bezier(.34,1.56,.64,1)',
      },
      backgroundImage: {
        'brand-sheen': 'linear-gradient(120deg, rgb(var(--navy-800)) 0%, rgb(var(--navy-600)) 50%, rgb(var(--navy-900)) 100%)',
        'gold-line':   'linear-gradient(90deg, transparent, rgb(var(--brass-400)), transparent)',
      },
      keyframes: {
        'fade-up':   { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'none' } },
        'fade-in':   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in':  { '0%': { opacity: '0', transform: 'scale(.96)' }, '100%': { opacity: '1', transform: 'none' } },
        shimmer:     { '100%': { transform: 'translateX(-100%)' } },
        'float-y':   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-ring':{ '0%': { transform: 'scale(.9)', opacity: '.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        marquee:     { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up':  'fade-up .55s cubic-bezier(.22,1,.36,1) both',
        'fade-in':  'fade-in .4s ease both',
        'scale-in': 'scale-in .35s cubic-bezier(.22,1,.36,1) both',
        'float-y':  'float-y 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(.22,1,.36,1) infinite',
      },
    },
  },
  plugins: [],
};
