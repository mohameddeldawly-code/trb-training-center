import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, MessageSquareWarning, PlayCircle, Users } from 'lucide-react';

const SERVICES = [
  { to: '/library',     icon: BookOpen,              title: 'المكتبة الإلكترونية', desc: 'الكتب والمقررات والمذكرات مرتبة حسب الصف والمادة، مع إمكانية القراءة داخل الموقع.', tone: 'bg-navy-700' },
  { to: '/videos',      icon: PlayCircle,            title: 'الفيديوهات التعليمية', desc: 'دروس ومحتوى تعليمي مصوَّر عبر قناة المركز على يوتيوب، مرتبة حسب التخصص والمادة.', tone: 'bg-ember-600' },
  { to: '/complaints',  icon: MessageSquareWarning,  title: 'الشكاوى والمقترحات',   desc: 'قدّم شكواك أو مقترحك أو طلبك، واحصل على رقم مرجعي لمتابعته.', tone: 'bg-brass-600' },
  { to: '/parent',      icon: Users,                 title: 'بوابة ولي الأمر',      desc: 'تابع حضور ابنك وغيابه ونسب الانتظام ببيانات محدَّثة من إدارة شئون الطلاب.', tone: 'bg-steel-700' },
];

export function ServicesSection() {
  return (
    <section className="container-page py-4">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <Link key={s.to} to={s.to} className="card card-hover group p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white ${s.tone}`}>
              <s.icon className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="text-[16.5px]">{s.title}</h3>
            <p className="mt-2 text-[13.5px] leading-7 text-steel-600">{s.desc}</p>
            <span className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-navy-700 transition group-hover:gap-2.5">
              الانتقال <ArrowLeft className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
