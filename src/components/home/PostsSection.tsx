import { Link } from 'react-router-dom';
import { CalendarDays, Megaphone, Newspaper, Pin, ScrollText } from 'lucide-react';
import clsx from 'clsx';
import { formatDate } from '@/lib/format';
import type { ContentKind, Post } from '@/types/db';

const KIND_META: Record<ContentKind, { label: string; icon: typeof Newspaper; tone: string }> = {
  news:         { label: 'خبر',      icon: Newspaper,  tone: 'bg-navy-100 text-navy-800' },
  announcement: { label: 'إعلان',    icon: Megaphone,  tone: 'bg-brass-100 text-brass-800' },
  instruction:  { label: 'تعليمات',  icon: ScrollText, tone: 'bg-ember-50 text-ember-700' },
};

export function PostCard({ post, horizontal }: { post: Post; horizontal?: boolean }) {
  const meta = KIND_META[post.kind];
  return (
    <Link to={`/news/${post.slug ?? post.id}`}
      className={clsx('card card-hover group flex overflow-hidden', horizontal ? 'flex-row' : 'flex-col')}>
      {post.image_url && (
        <div className={clsx('shrink-0 overflow-hidden bg-steel-100', horizontal ? 'w-32 sm:w-44' : 'h-44')}>
          <img src={post.image_url} alt="" loading="lazy" decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold', meta.tone)}>
            <meta.icon className="h-3.5 w-3.5" aria-hidden /> {meta.label}
          </span>
          {post.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ember-50 px-2.5 py-0.5 text-[11.5px] font-bold text-ember-700">
              <Pin className="h-3 w-3" aria-hidden /> مثبَّت
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] text-steel-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {formatDate(post.published_at)}
          </span>
        </div>
        <h3 className="clamp-2 text-[16px] leading-snug text-navy-900">{post.title}</h3>
        {post.excerpt && <p className="clamp-2 mt-2 text-[13.5px] leading-7 text-steel-600">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export { KIND_META };
