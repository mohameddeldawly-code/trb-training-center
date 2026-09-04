import { Link } from 'react-router-dom';
import { Megaphone, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '@/data/api';

/** شريط الإعلان المثبَّت — يظهر فقط عند وجود إعلان مثبَّت منشور */
export function AnnouncementBar() {
  const { data } = useQuery({
    queryKey: ['posts', 'pinned-announcement'],
    queryFn: () => fetchPosts({ kind: 'announcement', limit: 1 }),
    staleTime: 60_000,
  });

  const post = data?.find((p) => p.is_pinned);
  if (!post) return null;

  return (
    <div className="border-b border-brass-200 bg-brass-50">
      <div className="container-page flex flex-wrap items-center gap-3 py-2.5">
        <span className="flex items-center gap-2 rounded-full bg-brass-600 px-3 py-1 text-[12px] font-bold text-white">
          <Megaphone className="h-3.5 w-3.5" aria-hidden /> إعلان مهم
        </span>
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-brass-900">{post.title}</p>
        <Link to={`/news/${post.slug ?? post.id}`}
          className="flex items-center gap-1 text-[13px] font-bold text-brass-800 hover:text-brass-900">
          التفاصيل <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
