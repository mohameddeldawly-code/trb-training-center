import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen, Building2, Images, Megaphone, MessageSquareWarning, Newspaper,
  PlayCircle, ScrollText, TrendingUp, Users, CalendarX2, CheckCircle2, GraduationCap,
} from 'lucide-react';
import { fetchAdminStats, fetchComplaints } from '@/data/api';
import { formatDateShort, formatNumber, formatPercent } from '@/lib/format';
import { COMPLAINT_KINDS, COMPLAINT_STATUS } from '@/lib/constants';
import { ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { useSeo } from '@/hooks/useSeo';
import clsx from 'clsx';

function Stat({ label, value, icon: Icon, to, tone }: {
  label: string; value: string; icon: typeof Users; to?: string; tone?: string;
}) {
  const body = (
    <>
      <div className={clsx('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', tone ?? 'bg-navy-50 text-navy-700')}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-display text-[26px] font-bold leading-none text-navy-900">{value}</p>
      <p className="mt-1.5 text-[13px] text-steel-500">{label}</p>
    </>
  );
  return to
    ? <Link to={to} className="card card-hover p-5">{body}</Link>
    : <div className="card p-5">{body}</div>;
}

export default function Dashboard() {
  useSeo({ title: 'لوحة المعلومات', noIndex: true });

  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: fetchAdminStats });
  const latest = useQuery({
    queryKey: ['complaints', 'latest'],
    queryFn: () => fetchComplaints({ page: 1, pageSize: 8 }),
  });

  const s = stats.data ?? {};

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-[26px]">لوحة المعلومات</h1>
        <p className="mt-1.5 text-[14.5px] text-steel-600">نظرة سريعة على محتوى المنصة وحالة الطلبات والحضور.</p>
      </header>

      {stats.error ? <ErrorState error={stats.error} onRetry={() => void stats.refetch()} /> : (
        <>
          <section>
            <h2 className="mb-4 text-[16px]">المحتوى</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <Stat label="التخصصات"  value={formatNumber(s.specializations)} icon={Building2}   to="/admin/specializations" />
              <Stat label="المواد الدراسية" value={formatNumber(s.subjects)}   icon={GraduationCap} to="/admin/subjects" />
              <Stat label="الكتب"      value={formatNumber(s.books)}          icon={BookOpen}    to="/admin/books" />
              <Stat label="الفيديوهات" value={formatNumber(s.videos)}         icon={PlayCircle}  to="/admin/videos" />
              <Stat label="صور المعرض" value={formatNumber(s.gallery)}        icon={Images}      to="/admin/gallery" />
              <Stat label="الأخبار"    value={formatNumber(s.news)}           icon={Newspaper}   to="/admin/news" />
              <Stat label="الإعلانات"  value={formatNumber(s.announcements)}  icon={Megaphone}   to="/admin/announcements" />
              <Stat label="التعليمات"  value={formatNumber(s.instructions)}   icon={ScrollText}  to="/admin/instructions" />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[16px]">الطلاب والحضور</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="الطلاب المقيَّدون" value={formatNumber(s.students)} icon={Users} to="/admin/students" />
              <Stat label="متوسط نسبة الحضور" value={formatPercent(s.avg_attendance_pct)} icon={TrendingUp}
                tone="bg-emerald-50 text-emerald-700" />
              <Stat label="أيام غياب هذا الشهر" value={formatNumber(s.absences_this_month)} icon={CalendarX2}
                tone="bg-ember-50 text-ember-700" />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-[16px]">الشكاوى والمقترحات</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="إجمالي الطلبات" value={formatNumber(s.complaints_total)} icon={MessageSquareWarning} to="/admin/complaints" />
              <Stat label="طلبات جديدة"   value={formatNumber(s.complaints_new)}   icon={MessageSquareWarning}
                tone="bg-brass-50 text-brass-700" to="/admin/complaints" />
              <Stat label="قيد المعالجة"  value={formatNumber(s.complaints_open)}  icon={MessageSquareWarning}
                tone="bg-navy-50 text-navy-700" to="/admin/complaints" />
              <Stat label="مغلقة"         value={formatNumber(s.complaints_closed)} icon={CheckCircle2}
                tone="bg-emerald-50 text-emerald-700" to="/admin/complaints" />
            </div>
          </section>
        </>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px]">أحدث الطلبات</h2>
          <Link to="/admin/complaints" className="text-[13.5px] font-bold text-navy-700 hover:text-navy-900">عرض الكل</Link>
        </div>
        {latest.isLoading ? <SkeletonRows rows={5} /> : latest.data?.rows.length ? (
          <Table>
            <thead>
              <tr><Th>الرقم المرجعي</Th><Th>النوع</Th><Th>مقدّم الطلب</Th><Th>الموضوع</Th><Th>الحالة</Th><Th>التاريخ</Th></tr>
            </thead>
            <tbody>
              {latest.data.rows.map((c) => (
                <tr key={c.id}>
                  <Td><Link to="/admin/complaints" className="font-mono text-[13px] font-bold text-navy-700" dir="ltr">{c.ticket_id}</Link></Td>
                  <Td>{COMPLAINT_KINDS[c.kind]}</Td>
                  <Td>{c.submitter_name}</Td>
                  <Td className="max-w-[260px] truncate">{c.subject}</Td>
                  <Td>
                    <span className={clsx('rounded-full border px-2.5 py-0.5 text-[12px] font-semibold', COMPLAINT_STATUS[c.status].tone)}>
                      {COMPLAINT_STATUS[c.status].label}
                    </span>
                  </Td>
                  <Td className="text-steel-500">{formatDateShort(c.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="rounded-2xl border border-dashed border-steel-300 bg-white p-8 text-center text-[14px] text-steel-500">
            لا توجد طلبات مسجَّلة بعد.
          </p>
        )}
      </section>
    </div>
  );
}
