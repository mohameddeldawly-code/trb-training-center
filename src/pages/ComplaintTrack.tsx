import { useState } from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from './PageHeader';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert, EmptyState } from '@/components/ui/States';
import { trackComplaint } from '@/data/api';
import { COMPLAINT_FLOW, COMPLAINT_KINDS, COMPLAINT_STATUS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import { useSeo } from '@/hooks/useSeo';
import type { ComplaintStatus, ComplaintKind } from '@/types/db';

interface Result {
  ticket_id: string; kind: ComplaintKind; status: ComplaintStatus;
  subject: string; created_at: string; responded_at: string | null;
  closed_at: string | null; response: string | null;
  updates: Array<{ note: string | null; to_status: ComplaintStatus | null; created_at: string }> | null;
}

export default function ComplaintTrack() {
  useSeo({ title: 'تتبع طلب', description: 'تتبع حالة شكواك أو مقترحك بالرقم المرجعي.', noIndex: true });

  const [ticket, setTicket] = useState('');
  const [phone, setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null); setNotFound(false); setError(null);
    try {
      const r = await trackComplaint(ticket.trim(), phone.trim());
      if (r) setResult(r as Result); else setNotFound(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تنفيذ البحث.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = result ? COMPLAINT_FLOW.indexOf(result.status) : -1;

  return (
    <>
      <PageHeader title="تتبع طلب" breadcrumb={[{ label: 'الشكاوى والمقترحات', to: '/complaints' }, { label: 'تتبع طلب' }]}
        description="أدخل الرقم المرجعي ورقم الهاتف الذي قدّمت به الطلب لعرض حالته." />

      <div className="container-page max-w-2xl py-10">
        <form onSubmit={search} className="card space-y-5 p-6 sm:p-8">
          <Input label="الرقم المرجعي" required dir="ltr" placeholder="TRB-2026-000123"
            value={ticket} onChange={(e) => setTicket(e.target.value)} />
          <Input label="رقم الهاتف" required dir="ltr" type="tel" placeholder="01xxxxxxxxx"
            hint="نفس الرقم المستخدم عند تقديم الطلب"
            value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button type="submit" loading={loading} icon={<Search className="h-4 w-4" />} size="lg">عرض حالة الطلب</Button>
        </form>

        {error && <div className="mt-6"><Alert tone="danger">{error}</Alert></div>}

        {notFound && (
          <div className="mt-6">
            <EmptyState title="لم يُعثر على طلب مطابق"
              description="تأكد من صحة الرقم المرجعي ورقم الهاتف. الرقم المرجعي يبدأ بـ TRB ويظهر لك فور إرسال الطلب." />
          </div>
        )}

        {result && (
          <div className="card mt-6 overflow-hidden">
            <div className="border-b border-steel-200 bg-steel-50 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-widest text-steel-500">الرقم المرجعي</p>
                  <p className="mt-1 font-display text-[22px] font-bold text-navy-900" dir="ltr">{result.ticket_id}</p>
                </div>
                <span className={clsx('rounded-full border px-3.5 py-1.5 text-[13px] font-bold', COMPLAINT_STATUS[result.status].tone)}>
                  {COMPLAINT_STATUS[result.status].label}
                </span>
              </div>
            </div>

            <div className="p-6">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-[12.5px] font-bold text-steel-500">النوع</dt><dd className="mt-1 text-[15px] text-navy-900">{COMPLAINT_KINDS[result.kind]}</dd></div>
                <div><dt className="text-[12.5px] font-bold text-steel-500">الموضوع</dt><dd className="mt-1 text-[15px] text-navy-900">{result.subject}</dd></div>
                <div><dt className="text-[12.5px] font-bold text-steel-500">تاريخ التقديم</dt><dd className="mt-1 text-[14px] text-steel-700">{formatDateTime(result.created_at)}</dd></div>
                {result.responded_at && <div><dt className="text-[12.5px] font-bold text-steel-500">تاريخ الرد</dt><dd className="mt-1 text-[14px] text-steel-700">{formatDateTime(result.responded_at)}</dd></div>}
                {result.closed_at && <div><dt className="text-[12.5px] font-bold text-steel-500">تاريخ الإغلاق</dt><dd className="mt-1 text-[14px] text-steel-700">{formatDateTime(result.closed_at)}</dd></div>}
              </dl>

              {/* شريط المراحل */}
              {stepIndex >= 0 && (
                <ol className="mt-7 flex flex-wrap gap-2" aria-label="مراحل معالجة الطلب">
                  {COMPLAINT_FLOW.map((s, i) => (
                    <li key={s} className={clsx('flex-1 min-w-[92px] rounded-lg border px-2 py-2 text-center text-[12px] font-semibold',
                      i <= stepIndex ? 'border-navy-700 bg-navy-700 text-white' : 'border-steel-200 bg-white text-steel-400')}>
                      {COMPLAINT_STATUS[s].label}
                    </li>
                  ))}
                </ol>
              )}

              {!!result.updates?.length && (
                <div className="mt-7">
                  <h3 className="mb-3 text-[15px]">سجل متابعة الطلب</h3>
                  <ol className="space-y-2">
                    {result.updates.map((u, i) => (
                      <li key={i} className="rounded-xl border border-steel-200 p-3.5 text-[13.5px]">
                        <p className="text-steel-700">
                          {u.note ?? (u.to_status ? `تحديث الحالة إلى «${COMPLAINT_STATUS[u.to_status].label}»` : '—')}
                        </p>
                        <p className="mt-1 text-[12px] text-steel-500">{formatDateTime(u.created_at)}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.response && (
                <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="mb-2 text-[13px] font-bold text-emerald-800">رد المركز</p>
                  <p className="whitespace-pre-line text-[14.5px] leading-8 text-emerald-900">{result.response}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
