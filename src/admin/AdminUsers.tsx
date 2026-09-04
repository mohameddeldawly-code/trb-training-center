import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { AdminPage } from './AdminPage';
import { Alert, EmptyState, ErrorState, SkeletonRows } from '@/components/ui/States';
import { Table, Td, Th } from '@/components/ui/Table';
import { Switch } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { fetchAdminUsers, updateAdminUser } from '@/data/api';
import { useAuth } from '@/hooks/useAuth';
import { useSeo } from '@/hooks/useSeo';
import type { AdminRole, AdminUser } from '@/types/db';

const ROLES: Record<AdminRole, string> = {
  super_admin:        'مدير النظام',
  editor:             'محرّر محتوى',
  complaints_officer: 'مسؤول الشكاوى',
  student_affairs:    'شئون الطلاب',
};

export default function AdminUsers() {
  useSeo({ title: 'مستخدمو الإدارة', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const { admin } = useAuth();
  const isSuper = admin?.role === 'super_admin';

  const list = useQuery({ queryKey: ['admin-users'], queryFn: fetchAdminUsers });

  const save = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AdminUser> }) => updateAdminUser(id, patch),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.push({ tone: 'success', title: 'تم التحديث' }); },
    onError: (e) => toast.push({ tone: 'error', title: 'تعذّر التحديث', description: e instanceof Error ? e.message : undefined }),
  });

  return (
    <AdminPage title="مستخدمو لوحة الإدارة"
      description="الحسابات المصرَّح لها بالدخول إلى لوحة الإدارة وصلاحية كل منها.">

      <Alert tone="info" title="كيف يُضاف مستخدم جديد؟">
        ينشئ مدير النظام الحساب من لوحة Supabase ▸ Authentication ▸ Users ▸ Add user (بريد وكلمة مرور)،
        ثم يضيف صفاً في جدول <code dir="ltr">admin_users</code> بمعرّف المستخدم واسمه وصلاحيته.
        الخطوات بالتفصيل في ملف <code dir="ltr">docs/03-deployment.md</code>.
      </Alert>

      {!isSuper && (
        <Alert tone="warning">
          تعديل المستخدمين وصلاحياتهم مقصور على «مدير النظام». يمكنك الاطلاع فقط.
        </Alert>
      )}

      {list.isLoading ? <SkeletonRows rows={4} />
        : list.error ? <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        : list.data?.length ? (
          <Table>
            <thead>
              <tr><Th>الاسم</Th><Th>البريد الإلكتروني</Th><Th>الصلاحية</Th><Th>الحالة</Th></tr>
            </thead>
            <tbody>
              {list.data.map((u) => (
                <tr key={u.user_id}>
                  <Td className="font-semibold">{u.full_name}</Td>
                  <Td className="text-steel-600" dir="ltr">{u.email ?? '—'}</Td>
                  <Td>
                    {isSuper ? (
                      <select value={u.role} aria-label={`صلاحية ${u.full_name}`}
                        onChange={(e) => save.mutate({ id: u.user_id, patch: { role: e.target.value as AdminRole } })}
                        className="h-10 rounded-xl border border-steel-300 px-3 text-[14px]">
                        {(Object.keys(ROLES) as AdminRole[]).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                      </select>
                    ) : ROLES[u.role]}
                  </Td>
                  <Td>
                    {isSuper ? (
                      <Switch label={u.is_active ? 'مفعَّل' : 'موقوف'} checked={u.is_active}
                        onChange={(v) => save.mutate({ id: u.user_id, patch: { is_active: v } })} />
                    ) : (
                      <span className="text-[13.5px]">{u.is_active ? 'مفعَّل' : 'موقوف'}</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="لا يوجد مستخدمون" />}
    </AdminPage>
  );
}
