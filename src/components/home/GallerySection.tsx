import { useState } from 'react';
import { X } from 'lucide-react';
import type { GalleryItem } from '@/types/db';

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g) => (
          <li key={g.id}>
            <button onClick={() => setActive(g)}
              className="group block aspect-[4/3] w-full overflow-hidden rounded-xl bg-steel-200"
              aria-label={g.title ?? 'عرض الصورة'}>
              <img src={g.image_url} alt={g.title ?? ''} loading="lazy" decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            </button>
            {g.title && <p className="mt-2 text-center text-[12.5px] text-steel-600">{g.title}</p>}
          </li>
        ))}
      </ul>

      {active && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-navy-950/90 p-4"
             onClick={() => setActive(null)} role="dialog" aria-modal="true" aria-label={active.title ?? 'صورة'}>
          <button onClick={() => setActive(null)} aria-label="إغلاق"
            className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" aria-hidden />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <img src={active.image_url} alt={active.title ?? ''} className="max-h-[80vh] w-auto rounded-xl object-contain" />
            {(active.title || active.caption) && (
              <figcaption className="mt-4 text-center text-white">
                {active.title && <p className="font-bold">{active.title}</p>}
                {active.caption && <p className="mt-1 text-[13.5px] text-white/70">{active.caption}</p>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
