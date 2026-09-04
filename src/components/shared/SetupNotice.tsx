import { AlertTriangle, Terminal } from 'lucide-react';

/**
 * تظهر عندما لا تكون متغيرات البيئة مضبوطة — بدلاً من شاشة بيضاء أو انهيار.
 * ترشد المشغّل إلى الخطوات المطلوبة بدقة.
 */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blueprint p-6">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lift">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brass-100 text-brass-700">
            <AlertTriangle className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-[20px]">المنصة غير مربوطة بقاعدة البيانات بعد</h1>
            <p className="mt-0.5 text-[13.5px] text-steel-500">إعداد لمرة واحدة — بضع دقائق</p>
          </div>
        </div>

        <ol className="space-y-4 text-[14.5px] leading-8 text-steel-700">
          <li>
            <strong className="text-navy-900">١ — أنشئ مشروعاً مجانياً على Supabase</strong>
            <p>من <span dir="ltr">supabase.com</span> ← New project (الخطة المجانية).</p>
          </li>
          <li>
            <strong className="text-navy-900">٢ — نفّذ ملفات قاعدة البيانات</strong>
            <p>افتح SQL Editor ونفّذ بالترتيب ملفات <code dir="ltr">supabase/migrations/</code> ثم <code dir="ltr">supabase/seed/</code>.</p>
          </li>
          <li>
            <strong className="text-navy-900">٣ — أنشئ ملف <code dir="ltr">.env</code></strong>
            <p>انسخ <code dir="ltr">.env.example</code> باسم <code dir="ltr">.env</code> واملأ القيمتين من Project Settings ▸ API:</p>
            <pre dir="ltr" className="mt-2 overflow-x-auto rounded-xl bg-navy-950 p-4 text-[12.5px] leading-6 text-white/85">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
            </pre>
          </li>
          <li>
            <strong className="text-navy-900">٤ — أعد تشغيل خادم التطوير</strong>
            <p className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-steel-500" aria-hidden />
              <code dir="ltr">npm run dev</code>
            </p>
          </li>
        </ol>

        <p className="mt-6 rounded-xl bg-steel-100 px-4 py-3 text-[13px] leading-7 text-steel-600">
          الخطوات كاملةً بالصور والتفاصيل في ملف <code dir="ltr">README.md</code> و <code dir="ltr">docs/03-deployment.md</code>.
        </p>
      </div>
    </div>
  );
}
