import { Suspense, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  BarChart3, BookOpen, Building2, ClipboardList, FileSpreadsheet, Images, LayoutDashboard,
  LogOut, Megaphone, Menu, MessageSquareWarning, PlayCircle, Rocket, ScrollText,
  Settings, ShieldCheck, Users, X, Newspaper, GraduationCap,
} from 'lucide-react';
import { useAuth, signOut } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';
import { LoadingBlock } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';

const GROUPS: Array<{ title: string; items: Array<{ to: string; label: string; icon: typeof Users; end?: boolean }> }> = [
  {
    title: 'عام',
    items: [
      { to: '/admin', label: 'لوحة المعلومات', icon: LayoutDashboard, end: true },
      { to: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
    ],
  },
  {
    title: 'المحتوى التعليمي',
    items: [
      { to: '/admin/specializations', label: 'التخصصات', icon: Building2 },
      { to: '/admin/subjects', label: 'المواد وخطط الدراسة', icon: GraduationCap },
      { to: '/admin/books', label: 'المكتبة والكتب', icon: BookOpen },
      { to: '/admin/videos', label: 'الفيديوهات', icon: PlayCircle },
    ],
  },
  {
    title: 'محتوى الموقع',
    items: [
      { to: '/admin/news', label: 'الأخبار', icon: Newspaper },
      { to: '/admin/announcements', label: 'الإعلانات', icon: Megaphone },
      { to: '/admin/instructions', label: 'التعليمات', icon: ScrollText },
      { to: '/admin/gallery', label: 'معرض الصور', icon: Images },
    ],
  },
  {
    title: 'الخدمات',
    items: [
      { to: '/admin/complaints', label: 'الشكاوى والمقترحات', icon: MessageSquareWarning },
      { to: '/admin/students', label: 'الطلاب والحضور', icon: Users },
      { to: '/admin/import', label: 'استيراد وتصدير Excel', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'النظام',
    items: [
      { to: '/admin/users', label: 'مستخدمو الإدارة', icon: ShieldCheck },
      { to: '/admin/coming-soon', label: 'ميزات قادمة', icon: Rocket },
    ],
  },
];

export function AdminLayout() {
  const { loading, admin, email } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const logo = useSetting('center.logo_url', '/logo.png');

  if (loading) return <LoadingBlock className="min-h-screen" label="جارٍ التحقق من الصلاحيات…" />;

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-steel-100 p-6">
        <div className="card max-w-md p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-ember-600" aria-hidden />
          <h1 className="text-[20px]">لا تملك صلاحية الدخول</h1>
          <p className="mt-3 text-[14.5px] leading-8 text-steel-600">
            {email
              ? 'حسابك مسجَّل لكنه غير مُضاف إلى مستخدمي لوحة الإدارة، أو تم إيقافه. راجع مدير النظام.'
              : 'يلزم تسجيل الدخول بحساب إداري للوصول إلى لوحة الإدارة.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => navigate('/admin/login')}>تسجيل الدخول</Button>
            {email && <Button variant="secondary" onClick={() => void signOut()}>خروج</Button>}
          </div>
        </div>
      </div>
    );
  }

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="تنقل لوحة الإدارة">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <img src={logo} alt="" className="h-10 w-10 rounded-full object-contain" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-white">لوحة الإدارة</p>
          <p className="truncate text-[11.5px] text-white/50">{admin.full_name}</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-white/35">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink to={it.to} end={it.end} onClick={() => setOpen(false)}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition',
                      isActive ? 'bg-white/12 text-white' : 'text-white/60 hover:bg-white/6 hover:text-white',
                    )}>
                    <it.icon className="h-[18px] w-[18px]" aria-hidden /> {it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <NavLink to="/" className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white/60 hover:bg-white/6 hover:text-white">
          <BarChart3 className="h-[18px] w-[18px]" aria-hidden /> عرض الموقع
        </NavLink>
        <button onClick={() => void signOut().then(() => navigate('/admin/login'))}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white/60 hover:bg-ember-600/20 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" aria-hidden /> تسجيل الخروج
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-steel-100">
      {/* الشريط الجانبي — ثابت على الشاشات الكبيرة */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-[264px] bg-navy-950 lg:block">{sidebar}</aside>

      {/* الشريط الجانبي على الموبايل */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[280px] bg-navy-950">
            <button onClick={() => setOpen(false)} aria-label="إغلاق القائمة"
              className="absolute left-3 top-4 rounded-lg p-2 text-white/70 hover:bg-white/10">
              <X className="h-5 w-5" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:mr-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-steel-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="فتح القائمة"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-steel-300">
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="flex items-center gap-2 font-bold text-navy-900">
            <ClipboardList className="h-5 w-5" aria-hidden /> لوحة الإدارة
          </span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<LoadingBlock />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
