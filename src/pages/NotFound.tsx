import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useSeo } from '@/hooks/useSeo';

export default function NotFound() {
  useSeo({ title: 'الصفحة غير موجودة', noIndex: true });
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Compass className="mb-6 h-16 w-16 text-steel-300" aria-hidden />
      <p className="font-display text-[56px] font-bold leading-none text-navy-200">404</p>
      <h1 className="mt-4 text-[24px]">الصفحة غير موجودة</h1>
      <p className="mt-3 max-w-md text-[15px] leading-8 text-steel-600">
        ربما تم نقل الصفحة أو حذفها، أو أن الرابط غير صحيح.
      </p>
      <Link to="/" className="mt-8 inline-flex h-12 items-center rounded-xl bg-navy-700 px-7 text-[15px] font-bold text-white hover:bg-navy-800">
        العودة إلى الصفحة الرئيسية
      </Link>
    </div>
  );
}
