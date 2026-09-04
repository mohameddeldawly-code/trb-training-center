import { Link } from 'react-router-dom';
import { Facebook, Linkedin, Mail, MapPin, Phone, Youtube, Globe } from 'lucide-react';
import { useSetting } from '@/hooks/useSettings';

const COLS = [
  {
    title: 'المنصة',
    links: [
      { to: '/about', label: 'عن المركز' },
      { to: '/specializations', label: 'التخصصات' },
      { to: '/library', label: 'المكتبة الإلكترونية' },
      { to: '/videos', label: 'الفيديوهات التعليمية' },
    ],
  },
  {
    title: 'الخدمات',
    links: [
      { to: '/complaints', label: 'الشكاوى والمقترحات' },
      { to: '/complaints/track', label: 'تتبع طلب' },
      { to: '/parent', label: 'بوابة ولي الأمر' },
      { to: '/instructions', label: 'التعليمات' },
    ],
  },
  {
    title: 'المستجدات',
    links: [
      { to: '/news', label: 'الأخبار' },
      { to: '/announcements', label: 'الإعلانات' },
      { to: '/gallery', label: 'معرض الصور' },
      { to: '/contact', label: 'اتصل بنا' },
    ],
  },
];

export function Footer() {
  const name      = useSetting('center.name', 'مركز تدريب شركة ترسانة الإسكندرية');
  const logo      = useSetting('center.logo_url', '/logo.png');
  const about     = useSetting('footer.about', '');
  const copyright = useSetting('footer.copyright', '© جميع الحقوق محفوظة');
  const address   = useSetting('contact.address', '');
  const phone     = useSetting('contact.phone', '');
  const email     = useSetting('contact.email', '');
  const facebook  = useSetting('social.facebook', '');
  const youtube   = useSetting('social.youtube', '');
  const linkedin  = useSetting('social.linkedin', '');
  const website   = useSetting('social.website', '');

  const socials = [
    { url: facebook, Icon: Facebook, label: 'فيسبوك' },
    { url: youtube,  Icon: Youtube,  label: 'يوتيوب' },
    { url: linkedin, Icon: Linkedin, label: 'لينكدإن' },
    { url: website,  Icon: Globe,    label: 'الموقع الرسمي' },
  ].filter((s) => s.url);

  const clean = (v: string) => (v && !v.startsWith('[') ? v : '');

  return (
    <footer className="mt-20 bg-blueprint text-white/80">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-14 w-14 rounded-full bg-white/5 object-contain p-1" />
              <div>
                <p className="font-display text-[16px] font-bold text-white">{name}</p>
                <p className="text-[12.5px] text-white/55">Alexandria Shipyard Training Centre</p>
              </div>
            </div>
            {about && <p className="mt-5 max-w-sm text-[14px] leading-8 text-white/65">{about}</p>}
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map(({ url, Icon, label }) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 transition hover:border-white/40 hover:bg-white/10">
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </a>
                ))}
              </div>
            )}
          </div>

          {COLS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h3 className="mb-4 text-[14px] font-bold text-white">{c.title}</h3>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-[14px] text-white/65 transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 text-[13.5px] sm:grid-cols-3">
          {clean(address) && (
            <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brass-400" aria-hidden />{address}</p>
          )}
          {clean(phone) && (
            <p className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-brass-400" aria-hidden />
              <a href={`tel:${phone}`} className="hover:text-white">{phone}</a></p>
          )}
          {clean(email) && (
            <p className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-brass-400" aria-hidden />
              <a href={`mailto:${email}`} className="hover:text-white">{email}</a></p>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-navy-950/60">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-[12.5px] text-white/50 sm:flex-row">
          <p>{copyright}</p>
          <p>يطبّق المركز نظام إدارة المؤسسات التعليمية ISO 21001:2018</p>
        </div>
      </div>
    </footer>
  );
}
