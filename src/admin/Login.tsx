import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/States';
import { signIn, useAuth } from '@/hooks/useAuth';
import { useSetting } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';

export default function AdminLogin() {
  useSeo({ title: 'دخول لوحة الإدارة', noIndex: true });

  const navigate = useNavigate();
  const { admin, loading: authLoading } = useAuth();
  const logo   = useSetting('center.logo_url', '/logo.png');
  const center = useSetting('center.name', 'مركز تدريب شركة ترسانة الإسكندرية');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && admin) navigate('/admin', { replace: true }); }, [admin, authLoading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await signIn(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-blueprint p-4">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <img src={logo} alt="" className="mx-auto h-20 w-20 rounded-full object-contain" />
          <h1 className="mt-4 font-display text-[20px] text-white">{center}</h1>
          <p className="mt-1 text-[13.5px] text-white/55">لوحة الإدارة</p>
        </div>

        <form onSubmit={submit} className="card space-y-5 p-7">
          <Input label="البريد الإلكتروني" type="email" dir="ltr" required autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="كلمة المرور" type="password" dir="ltr" required autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <Alert tone="danger">{error}</Alert>}

          <Button type="submit" size="lg" block loading={loading} icon={<LogIn className="h-[18px] w-[18px]" />}>
            تسجيل الدخول
          </Button>

          <p className="flex items-start gap-2 text-[12.5px] leading-6 text-steel-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            الدخول مقصور على مستخدمي لوحة الإدارة المعتمدين. تُدار الحسابات من Supabase Authentication
            ثم تُضاف إلى جدول مستخدمي الإدارة.
          </p>
        </form>
      </div>
    </div>
  );
}
