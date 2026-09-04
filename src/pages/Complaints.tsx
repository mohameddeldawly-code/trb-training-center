import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Copy, MessageCircle, Paperclip, Search, Send } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { fetchSpecializations, submitComplaint, uploadFile } from '@/data/api';
import { COMPLAINT_KINDS, SUBMITTER_ROLES } from '@/lib/constants';
import { buildWhatsAppLink, renderTemplate } from '@/lib/whatsapp';
import { useSetting, useSettingBool, useSettingNumber } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';
import { digitsOnly } from '@/lib/format';
import type { ComplaintKind, SubmitterRole } from '@/types/db';

interface FormValues {
  kind: ComplaintKind;
  submitter_name: string;
  submitter_role: SubmitterRole;
  student_name: string;
  student_code: string;
  phone: string;
  email: string;
  specialization_id: string;
  subject: string;
  details: string;
}

export default function Complaints() {
  const intro    = useSetting('complaints.intro', '');
  const slaDays  = useSettingNumber('complaints.sla_days', 5);
  const allowAtt = useSettingBool('complaints.allow_attachments', true);
  const waOn     = useSettingBool('whatsapp.enabled', true);
  const waNumber = useSetting('whatsapp.number', '');
  const waTpl    = useSetting('whatsapp.template', '');
  const center   = useSetting('center.name', 'مركز تدريب شركة ترسانة الإسكندرية');

  useSeo({ title: 'الشكاوى والمقترحات والطلبات', description: intro || 'قدّم شكواك أو مقترحك أو طلبك واحصل على رقم مرجعي لمتابعته.' });

  const toast = useToast();
  const specs = useQuery({ queryKey: ['specializations'], queryFn: () => fetchSpecializations() });

  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ ticket: string; name: string; kind: ComplaintKind } | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { kind: 'complaint', submitter_role: 'parent' },
  });

  const role = watch('submitter_role');
  const needsStudent = role === 'parent' || role === 'student';

  const onSubmit = handleSubmit(async (v) => {
    setSending(true);
    try {
      let attachment_url: string | null = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error('حجم الملف يتجاوز 10 ميجابايت.');
        // المجلد باسم الشهر الحالي — تشترطه سياسة التخزين
        const folder = new Date().toISOString().slice(0, 7);
        attachment_url = await uploadFile('attachments', file, folder);
      }
      const res = await submitComplaint({
        kind: v.kind,
        submitter_name: v.submitter_name.trim(),
        submitter_role: v.submitter_role,
        student_name: v.student_name?.trim() || null,
        student_code: v.student_code?.trim() || null,
        phone: digitsOnly(v.phone),
        email: v.email?.trim() || null,
        specialization_id: v.specialization_id || null,
        subject: v.subject.trim(),
        details: v.details.trim(),
        attachment_url,
      });
      setDone({ ticket: res.ticket_id, name: v.submitter_name.trim(), kind: v.kind });
      reset(); setFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر إرسال الطلب', description: e instanceof Error ? e.message : undefined });
    } finally {
      setSending(false);
    }
  });

  /* ── شاشة النجاح ── */
  if (done) {
    const waLink = waOn && waNumber
      ? buildWhatsAppLink(waNumber, renderTemplate(waTpl || 'رقم الطلب: {{TICKET_ID}}', {
          ticketId: done.ticket, type: COMPLAINT_KINDS[done.kind], name: done.name, center,
        }))
      : null;

    return (
      <>
        <PageHeader title="تم استلام طلبك بنجاح" breadcrumb={[{ label: 'الشكاوى والمقترحات', to: '/complaints' }, { label: 'تأكيد الإرسال' }]} />
        <div className="container-page max-w-2xl py-12">
          <div className="card overflow-hidden text-center">
            <div className="bg-emerald-50 px-8 py-10">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" aria-hidden />
              <h2 className="text-[22px] text-emerald-900">تم تسجيل طلبك وقيده بنجاح</h2>
              <p className="mt-2 text-[14.5px] leading-8 text-emerald-800/80">
                احتفظ بالرقم المرجعي التالي — تحتاجه لمتابعة طلبك في أي وقت.
              </p>
            </div>

            <div className="p-8">
              <p className="text-[12.5px] font-bold uppercase tracking-widest text-steel-500">الرقم المرجعي</p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <p className="font-display text-[30px] font-bold tracking-wider text-navy-900" dir="ltr">{done.ticket}</p>
                <button onClick={() => { void navigator.clipboard.writeText(done.ticket); toast.push({ tone: 'success', title: 'تم نسخ الرقم المرجعي' }); }}
                  aria-label="نسخ الرقم المرجعي"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-steel-300 text-navy-700 hover:bg-steel-50">
                  <Copy className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="mt-7">
                <Alert tone="info">
                  تُدرَس الطلبات ويُرد عليها خلال <strong>{slaDays} أيام عمل</strong> كحد أقصى وفق إجراء رصد رضا
                  المستفيدين والتعامل مع الشكاوى والتظلمات المعتمد بالمركز.
                </Alert>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                     className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-[14.5px] font-bold text-white hover:bg-emerald-700">
                    <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> التواصل مع المركز عبر WhatsApp
                  </a>
                )}
                <Link to="/complaints/track"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-steel-300 px-6 text-[14.5px] font-bold text-navy-800 hover:bg-steel-50">
                  <Search className="h-4 w-4" aria-hidden /> تتبع الطلب
                </Link>
                <button onClick={() => setDone(null)}
                  className="inline-flex h-12 items-center rounded-xl border border-steel-300 px-6 text-[14.5px] font-bold text-navy-800 hover:bg-steel-50">
                  تقديم طلب آخر
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── النموذج ── */
  return (
    <>
      <PageHeader title="الشكاوى والمقترحات والطلبات" description={intro}
        breadcrumb={[{ label: 'الشكاوى والمقترحات' }]}
        action={
          <Link to="/complaints/track"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-steel-300 px-5 text-[14px] font-semibold text-navy-800 hover:bg-steel-50">
            <Search className="h-4 w-4" aria-hidden /> تتبع طلب سابق
          </Link>
        } />

      <div className="container-page max-w-3xl py-10">
        <Alert tone="info" title="ضمانتان لك">
          لا يترتب على تقديم الشكوى أي إجراء سلبي تجاه مقدمها، وتُعامل بياناتك بسرية.
          ويُقيَّد كل طلب برقم مرجعي فور إرساله ويُرد عليه خلال {slaDays} أيام عمل كحد أقصى.
        </Alert>

        <form onSubmit={onSubmit} className="card mt-6 space-y-6 p-6 sm:p-8" noValidate>
          <fieldset className="space-y-5">
            <legend className="mb-4 text-[16px] font-bold text-navy-900">١ — نوع الطلب</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(COMPLAINT_KINDS) as ComplaintKind[]).map((k) => (
                <label key={k} className="relative cursor-pointer">
                  <input type="radio" value={k} {...register('kind', { required: true })} className="peer sr-only" />
                  <span className="flex h-12 items-center justify-center rounded-xl border border-steel-300 text-[14.5px] font-semibold text-navy-800 transition peer-checked:border-navy-700 peer-checked:bg-navy-700 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-navy-500/20">
                    {COMPLAINT_KINDS[k]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-5 border-t border-steel-200 pt-6">
            <legend className="mb-4 text-[16px] font-bold text-navy-900">٢ — بيانات مقدّم الطلب</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="اسم مقدّم الطلب" required placeholder="الاسم رباعياً"
                error={errors.submitter_name?.message}
                {...register('submitter_name', { required: 'الاسم مطلوب', minLength: { value: 3, message: 'الاسم قصير جداً' } })} />

              <Select label="صفة مقدّم الطلب" required {...register('submitter_role', { required: true })}>
                {(Object.keys(SUBMITTER_ROLES) as SubmitterRole[]).map((r) => (
                  <option key={r} value={r}>{SUBMITTER_ROLES[r]}</option>
                ))}
              </Select>

              <Input label="رقم الهاتف" required type="tel" inputMode="tel" placeholder="01xxxxxxxxx" dir="ltr"
                hint="يُستخدم للرد عليك ولتتبع الطلب لاحقاً"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'رقم الهاتف مطلوب',
                  validate: (v) => digitsOnly(v).length >= 8 || 'رقم الهاتف غير صحيح',
                })} />

              <Input label="البريد الإلكتروني (اختياري)" type="email" dir="ltr" placeholder="name@example.com"
                {...register('email')} />

              {needsStudent && (
                <>
                  <Input label="اسم الطالب" placeholder="اسم الطالب رباعياً" {...register('student_name')} />
                  <Input label="كود الطالب" placeholder="كود القيد بالمركز" dir="ltr" {...register('student_code')} />
                </>
              )}

              <Select label="القسم / التخصص (اختياري)" {...register('specialization_id')}>
                <option value="">— غير محدد —</option>
                {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </fieldset>

          <fieldset className="space-y-5 border-t border-steel-200 pt-6">
            <legend className="mb-4 text-[16px] font-bold text-navy-900">٣ — تفاصيل الطلب</legend>

            <Input label="موضوع الرسالة" required placeholder="عنوان مختصر يوضّح موضوع طلبك"
              error={errors.subject?.message}
              {...register('subject', { required: 'موضوع الرسالة مطلوب', minLength: { value: 5, message: 'الموضوع قصير جداً' } })} />

            <Textarea label="التفاصيل" required rows={7}
              placeholder="اشرح طلبك أو شكواك بوضوح، مع ذكر التواريخ والأسماء عند الحاجة."
              hint="كلما كانت التفاصيل أوضح كان الرد أدق وأسرع"
              error={errors.details?.message}
              {...register('details', { required: 'التفاصيل مطلوبة', minLength: { value: 20, message: 'التفاصيل قصيرة جداً — اكتب 20 حرفاً على الأقل' } })} />

            {allowAtt && (
              <div>
                <label htmlFor="attachment" className="mb-1.5 block text-[13.5px] font-semibold text-navy-800">
                  إرفاق ملف أو صورة (اختياري)
                </label>
                <label htmlFor="attachment"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-steel-300 bg-steel-50 px-4 py-4 transition hover:border-navy-400 hover:bg-navy-50/40">
                  <Paperclip className="h-5 w-5 text-steel-500" aria-hidden />
                  <span className="text-[14px] text-steel-600">
                    {file ? file.name : 'اختر ملفاً — صورة أو PDF بحد أقصى 10 ميجابايت'}
                  </span>
                </label>
                <input id="attachment" type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
              </div>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3 border-t border-steel-200 pt-6">
            <Button type="submit" size="lg" loading={sending} icon={<Send className="h-[18px] w-[18px]" />}>
              إرسال الطلب
            </Button>
            <p className="text-[12.5px] text-steel-500">سيظهر لك رقم مرجعي فور الإرسال — احتفظ به للمتابعة.</p>
          </div>
        </form>
      </div>
    </>
  );
}
