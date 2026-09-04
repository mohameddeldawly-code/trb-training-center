import { useState } from 'react';
import { CalendarX2, IdCard, LogOut, ShieldCheck, TrendingDown, TrendingUp, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from './PageHeader';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert, EmptyState } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { parentPortalLogin } from '@/data/api';
import { ATTENDANCE_STATUS } from '@/lib/constants';
import { formatDateShort, formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { useSetting, useSettingBool } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';
import type { ParentPortalResult } from '@/types/db';

const ERRORS: Record<string, string> = {
  disabled:           'بوابة ولي الأمر متوقفة مؤقتاً. يُرجى التواصل مع إدارة شئون الطلاب.',
  missing_identifier: 'أدخل كود الطالب أو الرقم القومي.',
  both_required:      'يلزم إدخال كود الطالب والرقم القومي معاً للتحقق من الهوية.',
  too_many_attempts:  'تم تجاوز عدد المحاولات المسموح بها. حاول مرة أخرى بعد 15 دقيقة.',
  not_found:          'لم يُعثر على طالب مطابق للبيانات المُدخلة. تأكد من الكود والرقم القومي، أو راجع إدارة شئون الطلاب.',
};

/** بطاقة رقم كبيرة وواضحة — الواجهة مصممة لتكون بسيطة جداً لولي الأمر */
function StatCard({ label, value, tone, icon: Icon }: {
  label: string; value: string; tone: string; icon: typeof UserRound;
}) {
  return (
    <div className={clsx('rounded-2xl border p-6 text-center', tone)}>
      <Icon className="mx-auto mb-3 h-7 w-7 opacity-80" aria-hidden />
      <p className="font-display text-[34px] font-bold leading-none">{value}</p>
      <p className="mt-2 text-[13.5px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

export default function ParentPortal() {
  useSeo({ title: 'بوابة ولي الأمر', description: 'متابعة حضور الطالب وغيابه.', noIndex: true });

  const enabled     = useSettingBool('parent_portal.enabled', true);
  const requireBoth = useSettingBool('parent_portal.require_both', true);
  const note        = useSetting('parent_portal.note', '');

  const [code, setCode] = useState('');
  const [nid, setNid]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData]   = useState<ParentPortalResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await parentPortalLogin(code.trim(), nid.trim());
      if (res.ok) setData(res);
      else setError(ERRORS[res.error ?? ''] ?? 'تعذّر الدخول.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { setData(null); setCode(''); setNid(''); setError(null); };

  /* ── لوحة الطالب ── */
  if (data?.ok && data.student) {
    const s = data.student;
    const a = data.attendance;
    const attPct = a?.attendance_pct ?? null;
    const low = attPct !== null && attPct < 85;

    return (
      <>
        <PageHeader title={s.full_name} breadcrumb={[{ label: 'بوابة ولي الأمر', to: '/parent' }, { label: 'بيانات الطالب' }]}
          description="بيانات الحضور والغياب مستخرجة من سجلات إدارة شئون الطلاب."
          action={
            <Button variant="secondary" onClick={logout} icon={<LogOut className="h-4 w-4" />}>خروج</Button>
          } />

        <div className="container-page space-y-6 py-10">
          {/* بيانات الطالب */}
          <section className="card overflow-hidden">
            <div className="border-b border-steel-200 bg-steel-50 px-6 py-4">
              <h2 className="flex items-center gap-2 text-[17px]">
                <UserRound className="h-5 w-5 text-navy-700" aria-hidden /> بيانات الطالب
              </h2>
            </div>
            <dl className="grid gap-px bg-steel-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { k: 'الاسم', v: s.full_name },
                { k: 'كود الطالب', v: s.student_code },
                { k: 'الصف', v: s.grade ?? '—' },
                { k: 'التخصص', v: s.specialization ?? '—' },
                { k: 'العام الدراسي', v: s.academic_year ?? '—' },
                { k: 'اسم ولي الأمر', v: s.guardian_name ?? '—' },
                { k: 'حالة القيد', v: s.status === 'active' ? 'مقيَّد' : s.status },
              ].map((f) => (
                <div key={f.k} className="bg-white p-5">
                  <dt className="text-[12.5px] font-bold text-steel-500">{f.k}</dt>
                  <dd className="mt-1.5 text-[15.5px] font-semibold text-navy-900">{f.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* أرقام الحضور */}
          <section>
            <h2 className="mb-4 text-[18px]">الحضور والغياب</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="نسبة الحضور" value={formatPercent(attPct)} icon={TrendingUp}
                tone={low ? 'border-brass-200 bg-brass-50 text-brass-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'} />
              <StatCard label="نسبة الغياب" value={formatPercent(a?.absence_pct ?? null)} icon={TrendingDown}
                tone="border-ember-200 bg-ember-50 text-ember-900" />
              <StatCard label="أيام الحضور" value={formatNumber(a?.attendance_days ?? 0)} icon={ShieldCheck}
                tone="border-navy-200 bg-navy-50 text-navy-900" />
              <StatCard label="أيام الغياب" value={formatNumber(a?.absence_days ?? 0)} icon={CalendarX2}
                tone="border-steel-200 bg-white text-navy-900" />
            </div>

            {low && (
              <div className="mt-4">
                <Alert tone="warning" title="تنبيه بشأن الانتظام">
                  نسبة حضور الطالب أقل من المستهدف المعتمد (85%). يُرجى متابعة انتظامه والتواصل مع إدارة شئون الطلاب،
                  علماً بأن تجاوز حد الغياب المقرر يترتب عليه إخطار ولي الأمر ثم اتخاذ الإجراء طبقاً للائحة وعقد التلمذة.
                </Alert>
              </div>
            )}

            {a?.last_updated && (
              <p className="mt-3 text-[12.5px] text-steel-500">آخر تحديث للبيانات: {formatDateTime(a.last_updated)}</p>
            )}
          </section>

          {/* سجل الغياب */}
          <section>
            <h2 className="mb-4 text-[18px]">سجل الغياب بالتواريخ</h2>
            {data.absences?.length ? (
              <Table>
                <thead>
                  <tr><Th>م</Th><Th>التاريخ</Th><Th>الحالة</Th><Th>القسم</Th><Th>السبب</Th></tr>
                </thead>
                <tbody>
                  {data.absences.map((r, i) => (
                    <tr key={`${r.date}-${r.section ?? i}`}>
                      <Td className="text-steel-500">{i + 1}</Td>
                      <Td className="font-semibold">{formatDateShort(r.date)}</Td>
                      <Td>
                        <span className={clsx('rounded-full border px-2.5 py-0.5 text-[12px] font-semibold',
                          r.status === 'excused' ? 'border-brass-200 bg-brass-50 text-brass-800'
                          : r.status === 'late'  ? 'border-navy-200 bg-navy-50 text-navy-800'
                          : 'border-ember-200 bg-ember-50 text-ember-800')}>
                          {ATTENDANCE_STATUS[r.status] ?? r.status}
                        </span>
                      </Td>
                      <Td className="text-steel-600">{r.section ?? '—'}</Td>
                      <Td className="text-steel-600">{r.reason ?? '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="لا توجد أيام غياب مسجَّلة" description="سجل الطالب خالٍ من أيام الغياب حتى تاريخه." />
            )}
          </section>

          {note && <p className="rounded-xl bg-steel-100 px-5 py-4 text-[13.5px] leading-7 text-steel-600">{note}</p>}
        </div>
      </>
    );
  }

  /* ── شاشة الدخول ── */
  return (
    <>
      <PageHeader title="بوابة ولي الأمر" breadcrumb={[{ label: 'بوابة ولي الأمر' }]}
        description="تابع نسبة حضور ابنك وأيام غيابه وسجل التواريخ. البيانات محدَّثة من سجلات إدارة شئون الطلاب." />

      <div className="container-page max-w-xl py-12">
        {!enabled ? (
          <Alert tone="warning" title="البوابة متوقفة مؤقتاً">{ERRORS.disabled}</Alert>
        ) : (
          <form onSubmit={submit} className="card space-y-6 p-7 sm:p-9">
            <div className="flex items-center gap-3 border-b border-steel-200 pb-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-700 text-white">
                <IdCard className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-[18px]">تسجيل الدخول</h2>
                <p className="mt-0.5 text-[13px] text-steel-500">
                  {requireBoth ? 'أدخل كود الطالب والرقم القومي معاً' : 'أدخل كود الطالب أو الرقم القومي'}
                </p>
              </div>
            </div>

            <Input label="كود الطالب" dir="ltr" inputMode="text" autoComplete="off"
              placeholder="كود القيد بالمركز" required={requireBoth}
              value={code} onChange={(e) => setCode(e.target.value)} />

            <Input label="الرقم القومي للطالب" dir="ltr" inputMode="numeric" autoComplete="off"
              placeholder="14 رقماً" required={requireBoth}
              hint="يُستخدم للتحقق من الهوية فقط ولا يُعرض داخل البوابة"
              value={nid} onChange={(e) => setNid(e.target.value)} />

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" size="lg" block loading={loading}>الدخول إلى بيانات الطالب</Button>

            <p className="flex items-start gap-2 text-[12.5px] leading-6 text-steel-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              بيانات الطلاب محمية ولا تُعرض إلا بعد التحقق من الهوية. ولا يُفصح المركز عن بيانات أي متعلم
              لأي جهة خارجية إلا بموافقة ولي الأمر أو بموجب متطلب قانوني.
            </p>
          </form>
        )}
      </div>
    </>
  );
}
