import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { BookOpen, Menu, MessageSquareWarning, Phone, Users, X } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

const NAV = [
  { to: '/',                label: 'الرئيسية' },
  { to: '/about',           label: 'عن المركز' },
  { to: '/specializations', label: 'التخصصات' },
  { to: '/library',         label: 'المكتبة الإلكترونية' },
  { to: '/videos',          label: 'الفيديوهات' },
  { to: '/news',            label: 'الأخبار والإعلانات' },
  { to: '/gallery',         label: 'معرض الصور' },
  { to: '/contact',         label: 'اتصل بنا' },
];

const QUICK = [
  { to: '/complaints', label: 'الشكاوى والمقترحات', icon: MessageSquareWarning },
  { to: '/parent',     label: 'بوابة ولي الأمر',     icon: Users },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  const name  = useSetting('center.name', 'مركز تدريب شركة ترسانة الإسكندرية');
  const logo  = useSetting('center.logo_url', '/logo.png');
  const company = useSetting('center.company', 'شركة ترسانة الإسكندرية');
  const phone = useSetting('contact.phone', '');

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={clsx('sticky top-0 z-50 transition-shadow', scrolled && 'shadow-lg shadow-navy-900/5')}>
      <div className="brand-rule h-1" aria-hidden />

      {/* شريط علوي — مخفي على الموبايل */}
      <div className="hidden bg-navy-900 text-white/80 lg:block">
        <div className="container-page flex h-9 items-center justify-between text-[12.5px]">
          <p className="font-medium">{company} — الإدارة العامة لمركز التدريب</p>
          <div className="flex items-center gap-5">
            {phone && !phone.startsWith('[') && (
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" aria-hidden /> {phone}
              </a>
            )}
            <Link to="/complaints" className="hover:text-white">تقديم شكوى أو مقترح</Link>
          </div>
        </div>
      </div>

      {/* الشريط الرئيسي */}
      <div className="border-b border-steel-200 bg-white/95 backdrop-blur">
        <div className="container-page flex h-[68px] items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-full object-contain" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-bold leading-tight text-navy-900 sm:text-[16.5px]">
                {name}
              </span>
              <span className="hidden text-[12px] text-steel-500 sm:block">Alexandria Shipyard Training Centre</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="التنقل الرئيسي">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => clsx(
                  'rounded-lg px-3 py-2 text-[14px] font-semibold transition',
                  isActive ? 'bg-navy-50 text-navy-800' : 'text-steel-600 hover:bg-steel-100 hover:text-navy-800',
                )}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/library"
              className="hidden h-10 items-center gap-2 rounded-xl border border-steel-300 px-3.5 text-[14px] font-semibold text-navy-800 hover:bg-steel-50 lg:flex xl:hidden">
              <BookOpen className="h-4 w-4" aria-hidden /> المكتبة
            </Link>
            <Link to="/parent"
              className="hidden h-10 items-center gap-2 rounded-xl bg-navy-700 px-4 text-[14px] font-semibold text-white hover:bg-navy-800 sm:flex">
              <Users className="h-4 w-4" aria-hidden /> بوابة ولي الأمر
            </Link>
            <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu"
              aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-steel-300 text-navy-800 xl:hidden">
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {open && (
        <div id="mobile-menu" className="border-b border-steel-200 bg-white shadow-lift xl:hidden">
          <nav className="container-page grid gap-1 py-3" aria-label="التنقل على الأجهزة الصغيرة">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === '/'}
                className={({ isActive }) => clsx(
                  'rounded-xl px-4 py-3 text-[15px] font-semibold',
                  isActive ? 'bg-navy-50 text-navy-800' : 'text-steel-700 hover:bg-steel-100',
                )}>
                {n.label}
              </NavLink>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-steel-200 pt-3">
              {QUICK.map((q) => (
                <Link key={q.to} to={q.to}
                  className="flex items-center justify-center gap-2 rounded-xl bg-navy-700 px-3 py-3 text-[14px] font-semibold text-white">
                  <q.icon className="h-4 w-4" aria-hidden /> {q.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
