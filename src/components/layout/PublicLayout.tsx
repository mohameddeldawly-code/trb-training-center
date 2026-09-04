import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { LoadingBlock } from '@/components/ui/States';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">تخطَّ إلى المحتوى الرئيسي</a>
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<LoadingBlock className="py-32" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
