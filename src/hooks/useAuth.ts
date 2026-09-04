import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchAdminByUserId } from '@/data/api';
import type { AdminUser } from '@/types/db';

export interface AuthState {
  loading: boolean;
  admin: AdminUser | null;
  email: string | null;
}

/**
 * حالة جلسة الإدارة.
 *
 * ملاحظة مهمة: لا تُستدعى أي دالة من `supabase.auth` داخل معالج
 * `onAuthStateChange` — فالمعالج يعمل داخل قفل المكتبة، واستدعاء
 * `getSession()` أو `getUser()` بداخله يوقع النظام في حلقة تحديث
 * لا نهائية ويمنع حفظ الجلسة. لذلك نعتمد على كائن الجلسة الممرَّر
 * إلى المعالج، ونؤجّل أي عمل إضافي خارجه.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, admin: null, email: null });

  useEffect(() => {
    let alive = true;

    const resolve = async (session: Session | null) => {
      if (!session?.user) {
        if (alive) setState({ loading: false, admin: null, email: null });
        return;
      }
      const admin = await fetchAdminByUserId(session.user.id);
      if (alive) setState({ loading: false, admin, email: session.user.email ?? null });
    };

    void supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // التأجيل خارج قفل المكتبة
      setTimeout(() => { void resolve(session); }, 0);
    });

    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(
    error.message.includes('Invalid login')
      ? 'بيانات الدخول غير صحيحة.'
      : `تعذّر تسجيل الدخول: ${error.message}`,
  );
}

export async function signOut() {
  await supabase.auth.signOut();
}
