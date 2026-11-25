# COLONY GESTION

واجهة إدارة تجارية متعددة اللغات (العربية / الفرنسية / الإنجليزية) مبنية بـ React + Vite، وخدمة API على Cloudflare Workers مع D1.

## Cloudflare Pages
- Root directory: `/`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

## Worker
ملف الخدمة: `worker/index.ts`
اسم Worker: `colony-gestion-api`
D1 binding: `DB` → قاعدة البيانات الحالية `colony-gestion-db`.

يتم إنشاء جداول جديدة بأسماء تبدأ بـ `cgx_` دون حذف أو تعديل الجداول القديمة.

## GitHub Actions secrets
أضف في إعدادات المستودع:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

احتفظ بسر Worker الموجود `ADMIN_BOOTSTRAP_SECRET` كما هو. بعد نشر Worker، افتح الموقع واختر إعداد حساب المدير لأول مرة، وأدخل هذا السر وأنشئ كلمة مرور قوية. البريد الإداري مثبت في الخادم: `haniMr_hp@hotmail.com`.

## Registration
إنشاء حساب العميل لا يحتاج إلى كود تفعيل. الحساب الجديد يدخل في حالة انتظار التفعيل ويستطيع معاينة الواجهة. لا تُفتح عمليات إدارة البيانات قبل إضافة صلاحية التفعيل من الإدارة في مرحلة لوحة الإدارة القادمة.
