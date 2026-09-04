import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** هل تم ضبط متغيرات البيئة؟ تُستخدم لعرض شاشة إرشاد بدل انهيار التطبيق. */
export const isConfigured = Boolean(url && key && !url.includes('xxxxxxxx'));

export const supabase: SupabaseClient = createClient(
  url ?? 'http://localhost:54321',
  key ?? 'public-anon-key-placeholder',
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    global: { headers: { 'x-application-name': 'trb-training-center' } },
  },
);
