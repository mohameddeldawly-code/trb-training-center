import { useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { uploadFile } from '@/data/api';
import { useToast } from './Toast';

/**
 * رفع صورة أو ملف مع إمكانية إدخال رابط خارجي بدلاً من الرفع.
 * الصور الافتراضية ليست ثابتة — يمكن استبدالها أو حذفها بالكامل من هنا.
 */
export function ImageUpload({ label, hint, value, onChange, bucket = 'media', prefix = '', accept = 'image/*' }: {
  label: string; hint?: string; value: string | null;
  onChange: (url: string | null) => void;
  bucket?: 'media' | 'books'; prefix?: string; accept?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(bucket, file, prefix);
      onChange(url);
      toast.push({ tone: 'success', title: 'تم رفع الملف' });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر الرفع', description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const isPdf = accept.includes('pdf');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-navy-800">{label}</span>
        <button type="button" onClick={() => setManual((v) => !v)}
          className="flex items-center gap-1 text-[12.5px] font-semibold text-navy-600 hover:text-navy-800">
          <Link2 className="h-3.5 w-3.5" aria-hidden /> {manual ? 'رفع ملف' : 'إدخال رابط'}
        </button>
      </div>

      {manual ? (
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} dir="ltr"
          placeholder="https://…"
          className="w-full rounded-xl border border-steel-300 px-3.5 py-2.5 text-[14px]" />
      ) : (
        <div className="flex items-center gap-3">
          {value && !isPdf && (
            <img src={value} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-steel-200 object-cover" />
          )}
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-steel-300 bg-steel-50 px-4 py-4 transition hover:border-navy-400 hover:bg-navy-50/40">
            {busy ? <Loader2 className="h-5 w-5 animate-spin text-navy-600" aria-hidden />
                  : isPdf ? <Upload className="h-5 w-5 text-steel-500" aria-hidden />
                  : <ImagePlus className="h-5 w-5 text-steel-500" aria-hidden />}
            <span className="text-[13.5px] text-steel-600">
              {busy ? 'جارٍ الرفع…' : value ? 'استبدال الملف' : isPdf ? 'اختر ملف PDF' : 'اختر صورة'}
            </span>
            <input type="file" accept={accept} className="sr-only" disabled={busy}
              onChange={(e) => void pick(e.target.files?.[0])} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange(null)} aria-label="حذف الملف"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-ember-200 text-ember-600 hover:bg-ember-50">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}

      {hint && <p className="text-[12.5px] text-steel-500">{hint}</p>}
      {value && isPdf && <p className="truncate text-[12px] text-steel-500" dir="ltr">{value}</p>}
    </div>
  );
}
