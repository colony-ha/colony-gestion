# COLONY GESTION

منصة إدارة تجارية متعددة اللغات (العربية / الفرنسية / الإنجليزية) مبنية بـ React + Vite، وواجهة API على Cloudflare Workers مع D1.

## الأقسام والوظائف
- لوحة مؤشرات وتقارير بفترات يومية وأسبوعية وشهرية وسنوية.
- المنتجات والمخزون، الموردون والزبائن.
- مشتريات وفواتير ومبيعات وفواتير.
- الخدمات (لا تغيّر المخزون)، المصاريف، الأرباح على السلع المباعة، والديون.
- فاتورة الشراء تزيد المخزون، وفاتورة البيع تخصم منه مع التحقق من توفر الكمية.
- المخزون الأولي ينشئ فاتورة شراء وحركة مخزون في عملية D1 واحدة.
- تعديل الفواتير يعيد حساب حركات المخزون، وحذف المنتج المرتبط بحركات ممنوع حتى لا تتكسر العلاقات.
- حسابات المستخدمين، لوحة المدير، أكواد التفعيل، التجربة بمدة يحددها المدير، التوقيف والحذف، وطلبات استرجاع كلمة المرور.
- مؤسسة واحدة افتراضياً؛ المؤسسات الإضافية تحتاج موافقة المدير.
- نسخة احتياطية JSON، استيراد النسخة، دعم تثبيت التطبيق والعمل بواجهة مخزنة دون اتصال مع قائمة تغييرات للمزامنة عند عودة الاتصال.

## Cloudflare Pages
- Repository: `colony-ha/colony-gestion`
- Production branch: `main`
- Root directory: `/`
- Framework: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- API URL: `https://colony-gestion-api.colonyus666.workers.dev` (أو `VITE_API_BASE_URL`).

## Cloudflare Worker + D1
- Worker name: `colony-gestion-api`
- Source: `worker/index.ts`
- Config: `wrangler.toml`
- D1 binding: `DB`
- D1 database: `colony-gestion-db`
- Database ID: `0be65824-03cc-404d-b16c-9f0b94accf3b`
- الجداول تستخدم بادئة `cgx_`، ويتم إنشاؤها/ترقيتها تلقائياً دون حذف الجداول الأخرى.

## متطلبات النشر
1. أضف GitHub Actions secrets باسم `CLOUDFLARE_API_TOKEN` و`CLOUDFLARE_ACCOUNT_ID`.
2. أضف Worker secret باسم `ADMIN_BOOTSTRAP_SECRET` من إعدادات Worker.
3. بعد تجهيز الأسرار، شغّل Workflow `Deploy COLONY GESTION API` يدوياً من تبويب Actions إذا لم يكن نشر Git الخاص بـ Cloudflare مفعّلاً.
4. شغّل الموقع على Pages. أول مرة، اختر إعداد المدير وأدخل `ADMIN_BOOTSTRAP_SECRET`. البريد الإداري ثابت: `haniMr_hp@hotmail.com`.
5. اختبر `/health` ثم سجّل الدخول كمدير، وفعّل حسابات المستخدمين أو أنشئ أكواد التفعيل.

## التحقق الآلي والنشر
Workflow `Validate COLONY GESTION` يبني الواجهة ويجري dry-run للـ Worker عند كل تحديث على `main`. عند ربط Worker مباشرةً بـ Git، يؤدي كل Commit على الفرع المتصل إلى بدء Build ونشر حسب إعدادات Cloudflare. Workflow النشر اليدوي يبقى بديلاً عند عدم تفعيل النشر المباشر.

## الأمان
- كلمات مرور المستخدمين تُخزّن كـ PBKDF2-SHA256 hashes مع salt عشوائي.
- جلسة المستخدم 30 يوماً، وجلسة المدير 12 ساعة.
- لا تضع مفاتيح API أو كلمات المرور أو أسرار Cloudflare داخل ملفات Git.
