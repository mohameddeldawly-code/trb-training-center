import { lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AdminLayout } from '@/admin/AdminLayout';
import { ToastProvider } from '@/components/ui/Toast';
import { SettingsContext, useSettingsQuery } from '@/hooks/useSettings';
import { ErrorState } from '@/components/ui/States';
import { isConfigured } from '@/lib/supabase';
import { SetupNotice } from '@/components/shared/SetupNotice';

/* ── تقسيم الحزمة: كل صفحة تُحمَّل عند زيارتها فقط ── */
const Home            = lazy(() => import('@/pages/Home'));
const About           = lazy(() => import('@/pages/About'));
const Specializations = lazy(() => import('@/pages/Specializations'));
const SpecDetail      = lazy(() => import('@/pages/SpecializationDetail'));
const Library         = lazy(() => import('@/pages/Library'));
const BookReader      = lazy(() => import('@/pages/BookReader'));
const Videos          = lazy(() => import('@/pages/Videos'));
const PostsList       = lazy(() => import('@/pages/PostsList'));
const PostDetail      = lazy(() => import('@/pages/PostDetail'));
const Gallery         = lazy(() => import('@/pages/Gallery'));
const Complaints      = lazy(() => import('@/pages/Complaints'));
const ComplaintTrack  = lazy(() => import('@/pages/ComplaintTrack'));
const ParentPortal    = lazy(() => import('@/pages/ParentPortal'));
const Contact         = lazy(() => import('@/pages/Contact'));
const NotFound        = lazy(() => import('@/pages/NotFound'));

const AdminLogin      = lazy(() => import('@/admin/Login'));
const Dashboard       = lazy(() => import('@/admin/Dashboard'));
const SettingsAdmin   = lazy(() => import('@/admin/SettingsAdmin'));
const SpecsAdmin      = lazy(() => import('@/admin/SpecializationsAdmin'));
const SubjectsAdmin   = lazy(() => import('@/admin/SubjectsAdmin'));
const BooksAdmin      = lazy(() => import('@/admin/BooksAdmin'));
const VideosAdmin     = lazy(() => import('@/admin/VideosAdmin'));
const PostsAdmin      = lazy(() => import('@/admin/PostsAdmin'));
const GalleryAdmin    = lazy(() => import('@/admin/GalleryAdmin'));
const ComplaintsAdmin = lazy(() => import('@/admin/ComplaintsAdmin'));
const StudentsAdmin   = lazy(() => import('@/admin/StudentsAdmin'));
const ExcelImport     = lazy(() => import('@/admin/ExcelImport'));
const AdminUsers      = lazy(() => import('@/admin/AdminUsers'));
const ComingSoon      = lazy(() => import('@/admin/ComingSoon'));

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/',                          element: <Home /> },
      { path: '/about',                     element: <About /> },
      { path: '/specializations',           element: <Specializations /> },
      { path: '/specializations/:slug',     element: <SpecDetail /> },
      { path: '/library',                   element: <Library /> },
      { path: '/library/book/:id',          element: <BookReader /> },
      { path: '/videos',                    element: <Videos /> },
      { path: '/news',                      element: <PostsList kind="news" /> },
      { path: '/announcements',             element: <PostsList kind="announcement" /> },
      { path: '/instructions',              element: <PostsList kind="instruction" /> },
      { path: '/news/:slug',                element: <PostDetail /> },
      { path: '/gallery',                   element: <Gallery /> },
      { path: '/complaints',                element: <Complaints /> },
      { path: '/complaints/track',          element: <ComplaintTrack /> },
      { path: '/parent',                    element: <ParentPortal /> },
      { path: '/contact',                   element: <Contact /> },
      { path: '*',                          element: <NotFound /> },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true,              element: <Dashboard /> },
      { path: 'settings',         element: <SettingsAdmin /> },
      { path: 'specializations',  element: <SpecsAdmin /> },
      { path: 'subjects',         element: <SubjectsAdmin /> },
      { path: 'books',            element: <BooksAdmin /> },
      { path: 'videos',           element: <VideosAdmin /> },
      { path: 'news',             element: <PostsAdmin kind="news" /> },
      { path: 'announcements',    element: <PostsAdmin kind="announcement" /> },
      { path: 'instructions',     element: <PostsAdmin kind="instruction" /> },
      { path: 'gallery',          element: <GalleryAdmin /> },
      { path: 'complaints',       element: <ComplaintsAdmin /> },
      { path: 'students',         element: <StudentsAdmin /> },
      { path: 'import',           element: <ExcelImport /> },
      { path: 'users',            element: <AdminUsers /> },
      { path: 'coming-soon',      element: <ComingSoon /> },
    ],
  },
], {
  // مسار الأساس — يطابق base في vite.config حتى يعمل الموقع
  // سواء على نطاق مستقل أو داخل مجلد فرعي (GitHub Pages)
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** مزوّد الإعدادات — يحمّل إعدادات الموقع مرة واحدة ويشاركها مع كل الصفحات */
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error } = useSettingsQuery();
  return (
    <SettingsContext.Provider value={{ map: data?.map ?? {}, rows: data?.rows ?? [], isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

export default function App() {
  if (!isConfigured) return <SetupNotice />;

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SettingsProvider>
          <RouterProvider router={router} fallbackElement={<ErrorState />} />
        </SettingsProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
