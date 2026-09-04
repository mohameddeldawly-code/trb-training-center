import { useState } from 'react';
import { Play } from 'lucide-react';
import { youtubeEmbed, youtubeThumb } from '@/lib/youtube';

/**
 * تضمين يوتيوب بأسلوب "التحميل عند الطلب":
 * تُعرض الصورة المصغّرة فقط، ولا يُحمَّل مشغّل يوتيوب إلا عند الضغط.
 * هذا يوفّر عشرات الكيلوبايتات ويحمي خصوصية الزائر.
 */
export function YouTubeEmbed({ id, title, thumbnail }: { id: string; title: string; thumbnail?: string | null }) {
  const [play, setPlay] = useState(false);

  if (play) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`${youtubeEmbed(id)}&autoplay=1`}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <button onClick={() => setPlay(true)} aria-label={`تشغيل الفيديو: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl bg-navy-950">
      <img src={thumbnail || youtubeThumb(id)} alt="" loading="lazy" decoding="async"
        className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember-600 text-white shadow-lift transition group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" aria-hidden />
        </span>
      </span>
    </button>
  );
}
