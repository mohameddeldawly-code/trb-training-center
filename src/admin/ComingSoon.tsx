import {
  Award, BarChart3, Bell, BookMarked, CalendarDays, ClipboardCheck, FileBarChart,
  GraduationCap, ListChecks, Smartphone, Star, UserCircle,
} from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Alert } from '@/components/ui/States';
import { useSeo } from '@/hooks/useSeo';

const FEATURES = [
  { icon: UserCircle,     title: 'بوابة الطالب',          desc: 'حساب شخصي للطالب يعرض بياناته ومقرراته وجدوله.' },
  { icon: GraduationCap,  title: 'نتائج الطلاب',           desc: 'إعلان النتائج وشهادات الدرجات إلكترونياً بعد اعتمادها.' },
  { icon: ClipboardCheck, title: 'الاختبارات الإلكترونية', desc: 'اختبارات قصيرة داخل المنصة مع تصحيح آلي.' },
  { icon: BookMarked,     title: 'بنك الأسئلة',            desc: 'مستودع أسئلة مصنَّف حسب المادة والمستوى.' },
  { icon: ListChecks,     title: 'الواجبات',               desc: 'تكليفات ومتابعة تسليمها وتقييمها.' },
  { icon: CalendarDays,   title: 'الجداول الدراسية',       desc: 'جداول الحصص والتدريب العملي لكل صف ومجموعة.' },
  { icon: Bell,           title: 'الإشعارات الشخصية',      desc: 'تنبيهات موجَّهة لولي الأمر والطالب.' },
  { icon: Award,          title: 'الشهادات الإلكترونية',   desc: 'إصدار الشهادات إلكترونياً مع رمز تحقق.' },
  { icon: Star,           title: 'تقييم المدرسين والمقررات', desc: 'استبيانات تقييم دورية ونتائجها.' },
  { icon: BarChart3,      title: 'نظام حضور متقدم',        desc: 'رصد يومي مباشر بدل الاستيراد الدوري.' },
  { icon: FileBarChart,   title: 'تقارير الجودة ISO 21001', desc: 'مؤشرات الأداء وتقارير مراجعة الإدارة آلياً.' },
  { icon: Smartphone,     title: 'تطبيق الهاتف والإشعارات', desc: 'تطبيق مخصص وإشعارات فورية.' },
];

export default function ComingSoon() {
  useSeo({ title: 'ميزات قادمة', noIndex: true });

  return (
    <AdminPage title="ميزات قادمة"
      description="ميزات مخطَّط لها في الإصدارات القادمة. بنية قاعدة البيانات والكود مصمَّمة لاستيعابها دون إعادة بناء النظام.">

      <Alert tone="info" title="لماذا تظهر هنا؟">
        حتى تكون خارطة الطريق واضحة أمام الإدارة. هذه الميزات غير مفعَّلة حالياً ولا تؤثر على عمل الإصدار الأول.
      </Alert>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="card relative p-5 opacity-90">
            <span className="absolute left-4 top-4 rounded-full bg-brass-100 px-2.5 py-0.5 text-[11.5px] font-bold text-brass-800">
              قريباً
            </span>
            <f.icon className="mb-4 h-7 w-7 text-steel-400" aria-hidden />
            <h3 className="text-[15.5px]">{f.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-7 text-steel-600">{f.desc}</p>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
