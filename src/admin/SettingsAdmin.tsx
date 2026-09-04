import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import clsx from 'clsx';
import { AdminPage } from './AdminPage';
import { Input, ListField, Switch, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/Button';
import { Alert, ErrorState, LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { updateSettings } from '@/data/api';
import { useSettings, useSettingsQuery } from '@/hooks/useSettings';
import { useSeo } from '@/hooks/useSeo';

const GROUP_LABELS: Record<string, string> = {
  identity:      'هوية المركز والشعار',
  contact:       'بيانات التواصل',
  social:        'روابط التواصل الاجتماعي',
  home:          'الصفحة الرئيسية',
  about:         'عن المركز — الرؤية والرسالة والأهداف',
  library:       'المكتبة الإلكترونية',
  complaints:    'نظام الشكاوى',
  whatsapp:      'إعدادات WhatsApp',
  parent_portal: 'بوابة ولي الأمر',
  footer:        'التذييل',
  seo:           'تحسين محركات البحث (SEO)',
};

const GROUP_ORDER = ['identity', 'contact', 'social', 'home', 'about', 'library', 'complaints', 'whatsapp', 'parent_portal', 'footer', 'seo'];

export default function SettingsAdmin() {
  useSeo({ title: 'إعدادات الموقع', noIndex: true });

  const toast = useToast();
  const qc = useQueryClient();
  const { rows, isLoading, error } = useSettings();
  const query = useSettingsQuery();

  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [group, setGroup] = useState('identity');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init: Record<string, unknown> = {};
    rows.forEach((r) => { init[r.key] = r.value; });
    setDraft(init);
  }, [rows]);

  const groups = useMemo(() => {
    const set = new Set(rows.map((r) => r.group_name));
    return GROUP_ORDER.filter((g) => set.has(g)).concat([...set].filter((g) => !GROUP_ORDER.includes(g)));
  }, [rows]);

  const visible = rows.filter((r) => r.group_name === group);

  const dirty = rows.filter((r) => JSON.stringify(draft[r.key]) !== JSON.stringify(r.value));

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings(dirty.map((r) => ({ key: r.key, value: draft[r.key] })));
      await qc.invalidateQueries({ queryKey: ['settings'] });
      await query.refetch();
      toast.push({ tone: 'success', title: 'تم حفظ الإعدادات', description: 'ستظهر التعديلات مباشرةً على الموقع.' });
    } catch (e) {
      toast.push({ tone: 'error', title: 'تعذّر الحفظ', description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorState error={error} onRetry={() => void query.refetch()} />;

  const set = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));
  const str = (k: string) => (typeof draft[k] === 'string' ? (draft[k] as string) : draft[k] == null ? '' : String(draft[k]));

  return (
    <AdminPage title="إعدادات الموقع"
      description="كل بيانات الموقع الأساسية تُدار من هنا — لا شيء منها مكتوب داخل الكود. أي تعديل يُحفظ في قاعدة البيانات ويظهر مباشرةً على الموقع."
      action={<Button onClick={() => void save()} loading={saving} disabled={dirty.length === 0}
        icon={<Save className="h-4 w-4" />}>
        حفظ التعديلات{dirty.length ? ` (${dirty.length})` : ''}
      </Button>}>

      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="مجموعات الإعدادات">
          {groups.map((g) => (
            <button key={g} onClick={() => setGroup(g)}
              className={clsx('whitespace-nowrap rounded-xl px-4 py-2.5 text-right text-[14px] font-semibold transition',
                group === g ? 'bg-navy-700 text-white' : 'bg-white text-navy-800 hover:bg-steel-100 border border-steel-200')}>
              {GROUP_LABELS[g] ?? g}
            </button>
          ))}
        </nav>

        <div className="card space-y-6 p-6">
          <h2 className="border-b border-steel-200 pb-4 text-[17px]">{GROUP_LABELS[group] ?? group}</h2>

          {group === 'whatsapp' && (
            <Alert tone="info" title="متغيّرات قالب رسالة WhatsApp">
              استخدم داخل نص القالب: <code dir="ltr">{'{{TICKET_ID}}'}</code> رقم الطلب ·
              <code dir="ltr"> {'{{TYPE}}'}</code> نوعه · <code dir="ltr">{'{{NAME}}'}</code> اسم مقدّمه ·
              <code dir="ltr"> {'{{CENTER}}'}</code> اسم المركز. تُستبدل تلقائياً عند فتح المحادثة.
              الرابط المستخدم مجاني بالكامل (wa.me) ولا يعتمد على أي واجهة برمجية مدفوعة.
            </Alert>
          )}

          {visible.map((r) => {
            switch (r.input_type) {
              case 'image':
                return <ImageUpload key={r.key} label={r.label} value={str(r.key) || null}
                  prefix="settings" onChange={(v) => set(r.key, v)} />;
              case 'textarea':
                return <Textarea key={r.key} label={r.label} value={str(r.key)}
                  onChange={(e) => set(r.key, e.target.value)} rows={4} />;
              case 'list':
                return <ListField key={r.key} label={r.label}
                  value={Array.isArray(draft[r.key]) ? (draft[r.key] as string[]) : []}
                  onChange={(v) => set(r.key, v)} />;
              case 'boolean':
                return <Switch key={r.key} label={r.label} checked={draft[r.key] === true}
                  onChange={(v) => set(r.key, v)} />;
              case 'number':
                return <Input key={r.key} label={r.label} type="number" value={str(r.key)}
                  onChange={(e) => set(r.key, e.target.value === '' ? null : Number(e.target.value))} />;
              case 'url':
              case 'email':
              case 'phone':
                return <Input key={r.key} label={r.label} dir="ltr"
                  type={r.input_type === 'email' ? 'email' : r.input_type === 'phone' ? 'tel' : 'url'}
                  value={str(r.key)} onChange={(e) => set(r.key, e.target.value)} />;
              default:
                return <Input key={r.key} label={r.label} value={str(r.key)}
                  onChange={(e) => set(r.key, e.target.value)} />;
            }
          })}

          {visible.length === 0 && <p className="text-[14px] text-steel-500">لا توجد إعدادات في هذه المجموعة.</p>}
        </div>
      </div>
    </AdminPage>
  );
}
