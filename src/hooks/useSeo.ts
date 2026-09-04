import { useEffect } from 'react';

interface Seo {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** ضبط عناصر SEO لكل صفحة (عنوان · وصف · Open Graph · canonical) */
export function useSeo({ title, description, image, noIndex }: Seo) {
  useEffect(() => {
    const site = 'مركز تدريب شركة ترسانة الإسكندرية';
    const full = title ? `${title} | ${site}` : site;
    document.title = full;

    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
    }
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', window.location.href);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = window.location.origin + window.location.pathname;
  }, [title, description, image, noIndex]);
}
