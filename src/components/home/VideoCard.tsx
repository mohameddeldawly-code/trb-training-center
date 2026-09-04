import { Play } from 'lucide-react';
import { extractYouTubeId, youtubeThumb } from '@/lib/youtube';
import type { Video } from '@/types/db';

export function VideoCard({ video, onOpen }: { video: Video; onOpen: (v: Video) => void }) {
  const id = video.youtube_id ?? extractYouTubeId(video.youtube_url);

  return (
    <button onClick={() => onOpen(video)}
      className="card card-hover group flex flex-col overflow-hidden text-right">
      <div className="relative aspect-video overflow-hidden bg-navy-950">
        {id ? (
          <img src={video.thumbnail_url || youtubeThumb(id)} alt="" loading="lazy" decoding="async"
            className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
        ) : <div className="h-full w-full bg-blueprint" aria-hidden />}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ember-600/95 text-white transition group-hover:scale-110">
            <Play className="h-6 w-6 translate-x-0.5 fill-current" aria-hidden />
          </span>
        </span>
        {video.duration_text && (
          <span className="absolute bottom-2 left-2 rounded-md bg-navy-950/85 px-2 py-0.5 text-[11.5px] font-semibold text-white">
            {video.duration_text}
          </span>
        )}
      </div>
      <div className="flex-1 p-4">
        <h3 className="clamp-2 text-[15px] leading-snug text-navy-900">{video.title}</h3>
        {video.description && <p className="clamp-2 mt-1.5 text-[13px] leading-6 text-steel-600">{video.description}</p>}
      </div>
    </button>
  );
}
