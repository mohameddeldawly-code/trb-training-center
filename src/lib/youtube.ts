/** استخراج معرّف فيديو YouTube من أي صيغة رابط شائعة */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : null;
}

export const youtubeThumb = (id: string, quality: 'hq' | 'mq' | 'max' = 'hq') =>
  `https://i.ytimg.com/vi/${id}/${quality === 'max' ? 'maxresdefault' : quality === 'mq' ? 'mqdefault' : 'hqdefault'}.jpg`;

/** رابط التضمين — nocookie لتقليل التتبع */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&hl=ar`;

export const youtubeWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export const extractPlaylistId = (url?: string | null): string | null => {
  if (!url) return null;
  const m = url.match(/[?&]list=([\w-]+)/);
  return m ? m[1] : null;
};
