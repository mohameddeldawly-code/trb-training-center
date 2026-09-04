import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** هل تم ضبط متغيرات البيئة؟ تُستخدم لعرض شاشة إرشاد بدل انهيار التطبيق. */
export const isConfigured = Boolean(url && key && !url.includes('xxxxxxxx'));

/* ═══════════════════════════════════════════════════════════════════════
   تخزين الجلسة مع تحصين ضد اختلاف ساعة الجهاز
   ───────────────────────────────────────────────────────────────────────
   خادم المصادقة يُصدر رمز جلسة صالحاً ساعة واحدة بتوقيته هو، ويرسل مع
   الجلسة الحقل expires_at محسوباً على ساعة الخادم. فإذا كانت ساعة جهاز
   المستخدم متقدّمة، تظن مكتبة العميل أن الرمز منتهي الصلاحية لحظة وصوله،
   فتُهمل الجلسة وتعود إلى صلاحية الزائر — فيبدو للمستخدم أنه «لا يملك
   صلاحية الدخول» رغم صحة كلمة المرور.

   الحل: عند حفظ الجلسة نُعيد حساب expires_at بساعة الجهاز نفسه
   (الآن + expires_in). الرمز يظل صالحاً على الخادم مدته الحقيقية،
   ويصبح حساب انتهاء الصلاحية في المتصفح متسقاً مع ساعته، فيُجدَّد
   في وقته الصحيح. هذا يجعل المنصة تعمل على الأجهزة والشاشات التفاعلية
   التي لم تُضبط ساعتها بعد.
   ═══════════════════════════════════════════════════════════════════════ */

const B64_PREFIX = 'base64-';

function toLocalExpiry(json: string): string {
  try {
    const parsed = JSON.parse(json);
    const session = parsed?.currentSession ?? parsed;
    const expiresIn = session?.expires_in;
    if (typeof expiresIn !== 'number' || expiresIn <= 0) return json;

    const local = Math.floor(Date.now() / 1000) + expiresIn;
    if (typeof session.expires_at === 'number' && Math.abs(session.expires_at - local) <= 120) {
      return json; // الساعة مضبوطة — لا تعديل
    }
    session.expires_at = local;
    return JSON.stringify(parsed);
  } catch {
    return json; // ليست جلسة بصيغة JSON
  }
}

function normalize(value: string): string {
  if (value.startsWith(B64_PREFIX)) {
    try {
      const raw = decodeURIComponent(escape(atob(value.slice(B64_PREFIX.length))));
      const fixed = toLocalExpiry(raw);
      if (fixed === raw) return value;
      return B64_PREFIX + btoa(unescape(encodeURIComponent(fixed)));
    } catch {
      return value;
    }
  }
  return toLocalExpiry(value);
}

/** يعمل حتى لو منع المتصفح تخزين الموقع (نافذة خاصة مثلاً) */
function backingStore(): Storage | null {
  try {
    const probe = '__trb_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const disk = typeof window !== 'undefined' ? backingStore() : null;
const memory = new Map<string, string>();

const clockSafeStorage = {
  getItem: (k: string) => (disk ? disk.getItem(k) : memory.get(k) ?? null),
  setItem: (k: string, v: string) => {
    const fixed = normalize(v);
    if (disk) disk.setItem(k, fixed);
    else memory.set(k, fixed);
  },
  removeItem: (k: string) => {
    if (disk) disk.removeItem(k);
    else memory.delete(k);
  },
};

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: clockSafeStorage,
    },
    global: { headers: { 'x-application-name': 'trb-training-center' } },
  },
);

/* ───────────────── قياس فارق ساعة الجهاز (للتنبيه فقط) ───────────────── */

let skewSeconds: number | null = null;

/**
 * يقيس الفارق بين ساعة الجهاز وساعة الخادم مرة واحدة.
 * موجب = ساعة الجهاز متقدّمة. يُستخدم لعرض تنبيه إرشادي للمستخدم.
 */
export async function measureClockSkew(): Promise<number | null> {
  if (skewSeconds !== null) return skewSeconds;
  if (!isConfigured) return null;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key as string } });
    const serverDate = res.headers.get('date');
    if (!serverDate) return null;
    skewSeconds = Math.round((Date.now() - Date.parse(serverDate)) / 1000);
    return skewSeconds;
  } catch {
    return null;
  }
}
