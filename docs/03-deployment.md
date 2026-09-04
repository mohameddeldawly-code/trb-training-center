# النشر وإنشاء الحسابات

## الحسابات المجانية المطلوبة

| الخدمة | الغرض | الخطة | الحدود المجانية (تقريبية) |
|---|---|---|---|
| **[Supabase](https://supabase.com)** | قاعدة البيانات والمصادقة والملفات | Free | 500 م.ب قاعدة بيانات · 1 ج.ب تخزين · 5 ج.ب نقل شهرياً |
| **[GitHub](https://github.com)** | مستودع الكود | Free | مستودعات خاصة بلا حد |
| **[Cloudflare](https://dash.cloudflare.com)** | الاستضافة | Pages Free | طلبات غير محدودة · 500 عملية بناء شهرياً |
| **YouTube** | استضافة الفيديوهات | مجاني | — |

**لا حساب مدفوع ولا بطاقة ائتمان مطلوبة لأي منها.**

> **البقاء داخل الحدود المجانية:** الفيديوهات على يوتيوب (لا نطاق ترددي)، والصور
> مضغوطة قبل الرفع، وملفات PDF مضغوطة (5–15 م.ب للكتاب). مركز بحجم متوسط
> (بضع مئات من الطلاب و100–200 كتاب) يظل داخل الخطة المجانية بأريحية.

---

## ١ — إعداد Supabase

1. **supabase.com ▸ New project** — اختر الخطة Free واسم المشروع ومنطقة قريبة
   (مثل *Frankfurt (eu-central-1)*)، واحفظ كلمة مرور قاعدة البيانات.
2. **SQL Editor** ▸ نفّذ الملفات بالترتيب:
   `0001_schema.sql` ← `0002_rls_and_rpc.sql` ← `0003_storage.sql` ← `0004_hardening.sql`
   ← `0005_complaint_submit.sql` ← `seed/0001_seed.sql`
   (انسخ محتوى كل ملف والصقه ثم اضغط **Run**.)
3. **Project Settings ▸ API** — انسخ `Project URL` و `anon public key`.
4. **إنشاء أول حساب إداري:**
   - **Authentication ▸ Users ▸ Add user** — بريد وكلمة مرور، وفعّل *Auto Confirm User*.
   - انسخ `User UID`.
   - **SQL Editor:**
     ```sql
     insert into public.admin_users (user_id, full_name, email, role)
     values ('الـ-UID', 'الاسم الكامل', 'البريد@example.com', 'super_admin');
     ```

### التحقق من عمل الأمان

نفّذ هذه الاستعلامات في SQL Editor للتأكد من أن RLS يعمل:

```sql
-- يجب أن ترجع صفراً من الصفوف عند تنفيذها بصلاحية anon
set role anon;
select count(*) from public.students;          -- متوقع: خطأ صلاحية أو صفر
select count(*) from public.complaints;        -- متوقع: خطأ صلاحية أو صفر
select count(*) from public.specializations;   -- متوقع: 7 (محتوى منشور)
reset role;
```

---

## ٢ — التشغيل محلياً

```bash
npm install
cp .env.example .env     # املأ VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
npm run dev              # http://localhost:5173
```

للتحقق قبل النشر:

```bash
npm run typecheck        # فحص الأنواع
npm run build            # بناء نسخة الإنتاج
npm run preview          # معاينة نسخة الإنتاج محلياً
```

---

## ٣ — الرفع إلى GitHub

```bash
git init
git add .
git commit -m "المنصة الرقمية لمركز تدريب شركة ترسانة الإسكندرية — الإصدار الأول"
git branch -M main
git remote add origin https://github.com/<الحساب>/<المستودع>.git
git push -u origin main
```

> `.gitignore` يمنع رفع `.env` و `node_modules` و `dist`. **تأكد قبل الدفع** أن
> `git status` لا يُظهر ملف `.env`.

---

## ٤ — النشر على Cloudflare Pages

1. **Cloudflare Dashboard ▸ Workers & Pages ▸ Create ▸ Pages ▸ Connect to Git**.
2. اختر المستودع، ثم:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Environment variables ▸ Add variable** (لبيئتي Production و Preview):

   | المتغيّر | القيمة |
   |---|---|
   | `VITE_SUPABASE_URL` | رابط مشروع Supabase |
   | `VITE_SUPABASE_ANON_KEY` | المفتاح العام anon |

4. **Save and Deploy** — يصبح الموقع متاحاً على `<اسم-المشروع>.pages.dev`.

كل دفع (`git push`) إلى `main` يعيد النشر تلقائياً.

### البدائل
**Vercel** و **Netlify**: نفس أمر البناء ومجلد الإخراج ونفس المتغيرين.
**GitHub Pages** يحتاج ضبطاً إضافياً للتوجيه — Cloudflare Pages أبسط وأنسب.

---

## ٥ — ربط نطاق (Domain)

1. **Cloudflare Pages ▸ المشروع ▸ Custom domains ▸ Set up a domain**.
2. أدخل النطاق (مثل `training.alexshipyard.com`).
3. إن كان النطاق مُدَاراً بواسطة Cloudflare يُضبط السجل تلقائياً؛ وإلا أضف سجل `CNAME`
   لدى مزوّد النطاق يشير إلى `<اسم-المشروع>.pages.dev`.
4. شهادة SSL تُصدر تلقائياً خلال دقائق — بلا تكلفة.
5. بعد الربط، حدّث `public/sitemap.xml` ليستخدم النطاق الكامل.

---

## ٦ — قائمة تحقق قبل الإطلاق

- [ ] نُفِّذت ملفات قاعدة البيانات الخمسة وملف البذور بنجاح.
- [ ] تم إنشاء حساب `super_admin` والدخول به إلى `/admin/login`.
- [ ] رُفع الشعار الرسمي وحُدِّث اسم المركز من الإعدادات.
- [ ] استُوفيت بيانات التواصل: العنوان · الهاتف · البريد · **رقم واتساب**.
- [ ] كُتبت **الرؤية** (متروكة كـ Placeholder في البيانات المبدئية).
- [ ] رُوجعت أسماء التخصصات السبعة ومحتوى صفحاتها.
- [ ] رُفعت صور أغلفة التخصصات.
- [ ] حُذف الخبر والإعلان التجريبيان.
- [ ] رُفع كتاب واحد على الأقل واختُبر عارض PDF على الموبايل.
- [ ] أُضيف فيديو واحد على الأقل من قناة المركز.
- [ ] استُورد ملف Excel تجريبي واختُبرت بوابة ولي الأمر بكود طالب حقيقي.
- [ ] أُرسلت شكوى تجريبية واختُبر زر واتساب والتتبع بالرقم المرجعي.
- [ ] اختُبر الموقع على هاتف وتابلت وشاشة تفاعلية.
- [ ] `.env` غير موجود في المستودع.
