import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { useSetting } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';
import { buildWhatsAppLink } from '@/lib/whatsapp';

const DEPARTMENTS = [
  { need: 'استخراج بيان قيد أو شهادة أو مستخرج رسمي', dept: 'إدارة شئون الطلاب / شئون الخريجين' },
  { need: 'الاستفسار عن الغياب أو تقديم عذر',           dept: 'إدارة شئون الطلاب' },
  { need: 'تصريح دخول الميناء أو بدل فاقد',             dept: 'إدارة شئون الطلاب' },
  { need: 'الاستفسار عن الجدول أو المستوى الدراسي',     dept: 'إدارة التعليم النظري' },
  { need: 'أمر يخص الورشة أو مهمات الوقاية',            dept: 'إدارة التدريب العملي' },
  { need: 'رقم الجلوس أو النتيجة أو شهادة الدرجات',     dept: 'إدارة الامتحانات والكنترول' },
  { need: 'التنسيق والالتحاق بالجامعات والمعاهد',       dept: 'إدارة شئون الخريجين' },
  { need: 'تقديم شكوى أو مقترح أو تظلم',                dept: 'إدارة جودة وتكنولوجيا التعليم' },
];

export default function Contact() {
  useSeo({ title: 'اتصل بنا', description: 'بيانات التواصل مع مركز تدريب شركة ترسانة الإسكندرية.' });

  const address  = useSetting('contact.address', '');
  const phone    = useSetting('contact.phone', '');
  const phone2   = useSetting('contact.phone2', '');
  const email    = useSetting('contact.email', '');
  const hours    = useSetting('contact.working_hours', '');
  const whatsapp = useSetting('contact.whatsapp', '') || useSetting('whatsapp.number', '');
  const mapUrl   = useSetting('contact.map_url', '');
  const center   = useSetting('center.name', '');

  const clean = (v: string) => (v && !v.startsWith('[') ? v : '');
  const wa = whatsapp ? buildWhatsAppLink(whatsapp, `السلام عليكم، أرغب في الاستفسار عن ${center}.`) : null;

  const cards = [
    clean(address) && { icon: MapPin, label: 'العنوان', value: address, href: mapUrl || undefined },
    clean(phone)   && { icon: Phone,  label: 'الهاتف',  value: phone,   href: `tel:${phone}` },
    clean(phone2)  && { icon: Phone,  label: 'هاتف إضافي', value: phone2, href: `tel:${phone2}` },
    clean(email)   && { icon: Mail,   label: 'البريد الإلكتروني', value: email, href: `mailto:${email}` },
    clean(hours)   && { icon: Clock,  label: 'مواعيد العمل', value: hours },
  ].filter(Boolean) as Array<{ icon: typeof Phone; label: string; value: string; href?: string }>;

  return (
    <>
      <PageHeader title="اتصل بنا" breadcrumb={[{ label: 'اتصل بنا' }]}
        description="بيانات التواصل الرسمية مع مركز تدريب شركة ترسانة الإسكندرية." />

      <div className="container-page py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const inner = (
              <>
                <c.icon className="mb-4 h-6 w-6 text-navy-700" aria-hidden />
                <p className="text-[12.5px] font-bold uppercase tracking-wider text-steel-500">{c.label}</p>
                <p className="mt-1.5 text-[15px] font-semibold leading-8 text-navy-900">{c.value}</p>
              </>
            );
            return c.href
              ? <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="card card-hover p-6">{inner}</a>
              : <div key={c.label} className="card p-6">{inner}</div>;
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="card overflow-hidden bg-blueprint p-8 text-white">
            <h2 className="text-[20px] text-white">هل لديك شكوى أو مقترح؟</h2>
            <p className="mt-3 text-[14.5px] leading-8 text-white/70">
              قدّم شكواك أو مقترحك أو طلبك عبر النموذج المخصص، واحصل على رقم مرجعي لمتابعته.
              وتُقيَّد جميع الطلبات وتُتابع وفق إجراء رصد رضا المستفيدين والتعامل مع الشكاوى.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/complaints" className="inline-flex h-12 items-center rounded-xl bg-ember-600 px-6 text-[14.5px] font-bold text-white hover:bg-ember-700">
                تقديم طلب
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                   className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/25 px-6 text-[14.5px] font-bold text-white hover:bg-white/10">
                  <MessageCircle className="h-4 w-4" aria-hidden /> واتساب
                </a>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-steel-200 bg-steel-50 px-6 py-4">
              <h2 className="text-[17px]">عند الحاجة إلى… توجّه إلى</h2>
            </div>
            <ul className="divide-y divide-steel-100">
              {DEPARTMENTS.map((d) => (
                <li key={d.need} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5">
                  <span className="text-[14px] text-steel-700">{d.need}</span>
                  <span className="text-[13px] font-bold text-navy-800">{d.dept}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
