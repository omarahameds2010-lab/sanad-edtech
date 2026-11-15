# استقرار الديمو المحلي — Sprint 1

> الهدف: الديمو يفضل شغال بعد أي Reboot من غير ما نعدل كود أو نعمل Redeploy على Vercel كل مرة.

## الشكل الحالي

```text
المتصفح
  -> https://sanad-edtech.vercel.app        (Next.js على Vercel)
  -> /api/* rewrite -> API_PROXY_TARGET
  -> https://<tunnel>                        (ngrok / Cloudflare Tunnel)
  -> http://localhost:3002                   (NestJS API على اللابتوب)
  -> PostgreSQL + Redis                      (Docker)
```

- الويب على Vercel.
- الـAPI والـDatabase على اللابتوب.
- الـTunnel هو الجسر بينهم.
- كل `/api/*` يفضل Same-Origin من ناحية المتصفح، فالكوكيز شغالة بدون CORS.

## القرار الموصى به: ngrok Free Static Domain

دي أفضل حل مجاني للديمو الحالي:

- بيعطيك رابط ثابت لا يتغير مع كل Reboot.
- مش محتاج دومين مملوك.
- `API_PROXY_TARGET` على Vercel يتكتب مرة واحدة.
- الـWatchdog يعيد تشغيل الـAPI والـTunnel تلقائياً لو وقعوا.

لو عندك دومين مملوك، Cloudflare Named Tunnel أقوى، لكنه مش شرط دلوقتي.

## 1) تجهيز ngrok مرة واحدة

1. اعمل حساب مجاني على ngrok.
2. من Dashboard اختار **Domains** واعمل Claim لـ Free Static Domain.
3. ثبّت الـAuthtoken محلياً من PowerShell:

```powershell
ngrok config add-authtoken <TOKEN>
```

> لا تضع الـToken في الشات، ولا في `README`، ولا في أي ملف داخل الريبو.
> السكربت بينزّل `ngrok.exe` مؤقتاً في `%TEMP%\sanad-local` لو مش مثبت.

4. حدد الدومين في Environment Variable محلياً أو مرره للسكربت:

```powershell
$env:NGROK_DOMAIN = "sanad-demo.ngrok.app"
```

## 2) تشغيل الديمو

```powershell
pnpm demo:start -- -Tunnel ngrok -NgrokDomain sanad-demo.ngrok.app -Watch
```

السكربت يعمل:

1. يشغّل Docker Desktop لو متوقف.
2. يشغّل PostgreSQL وRedis.
3. يبني الـAPI لو `dist` مش موجود أو لو استخدمت `-Rebuild`.
4. يشغّل الـAPI على `localhost:3002`.
5. يشغّل ngrok مع الـHost header الصحيح:

```text
--host-header=sanad-edtech.vercel.app
```

6. يكتب الحالة واللوجات في:

```text
%TEMP%\sanad-local\
```

7. مع `-Watch` يفضل يراقب:
   - API health كل 30 ثانية.
   - لو الـAPI وقع: يعيد تشغيل Docker/API.
   - لو الـTunnel وقع: يعيد تشغيله.

## 3) ربط Vercel مرة واحدة

في Vercel → Project → Settings → Environment Variables → Production:

```text
API_PROXY_TARGET=https://sanad-demo.ngrok.app
```

بعدها:

1. اعمل Redeploy مرة واحدة.
2. اتأكد من الـHealth:

```powershell
curl.exe -s https://sanad-edtech.vercel.app/api/health
```

المتوقع: `status: ok` و`database: up`.

3. جرّب `/demo` و`/login` وزر الطالب وزر المدرس.

> `API_PROXY_TARGET` هو المتغير الصحيح. لا تستخدم `NEXT_PUBLIC_API_URL`.
> الكود يدعم أيضاً `DEMO_TUNNEL_ORIGIN` كـFallback، لكن `API_PROXY_TARGET` هو الأولوية.

## 4) الـTunnel السريع والـFallback

الوضع الحالي مؤقت: الـAutostart مثبت على Cloudflare quick tunnel مع `-SyncFallback`. الرابط الحالي:

```text
https://manufactured-with-alberta-cable.trycloudflare.com
```

عند كل تغيير في رابط الـQuick Tunnel:

1. `start.ps1` يحدّث `FALLBACK_DEMO_TUNNEL_ORIGIN` في `apps/web/next.config.mjs`.
2. يعمل Commit للملف ده فقط، وبس لو الفرع `main` نظيف ومتزامن مع `origin/main`.
3. يعمل Push؛ Vercel بيعمل Redeploy تلقائي.
4. الـWatchdog بيعيد محاولة `git fetch` / `git push` لو النت مش جاهز وقت الـLogon.

اللوج:

```text
%TEMP%\sanad-local\vercel-sync.log
```

> ده Bridge مؤقت: لسه فيه Vercel Redeploy ووقت قصير بعد الـReboot. الحل النهائي هو ngrok static domain عشان الرابط ما يتغيرش أصلاً.

> الرابط اتغير تاني بعد منتصف 16 نوفمبر 2026، والـWatchdog كتب الـFallback الجديد (`1fbc7e8`) وعمل Push تلقائياً، والموقع رجع **200**. ده تأكيد إضافي إن مسار الـSync شغال من غير تدخل يدوي.

> لو `API_PROXY_TARGET` متظبط في Vercel Production، فهو بياخد أولوية على الـFallback. الوضع الحالي اتحقق منه بعد تغيير الـTunnel في 15 نوفمبر: الموقع رجع **200** بعد تحديث الـFallback، يعني مفيش `API_PROXY_TARGET` قديم بيغطي عليه. مش قادرين نفحص Vercel env مباشرة لأن الـCLI/Token مش موجودين على اللابتوب.

لو عايز تعملها يدوياً بدل الـSync:

1. شغّل `pnpm demo:start -- -Tunnel cloudflared` وسجّل الرابط الجديد من `%TEMP%\sanad-local\tunnel.url`.
2. حدّث `FALLBACK_DEMO_TUNNEL_ORIGIN` في `apps/web/next.config.mjs`.
3. شغّل `pnpm --filter web build` وتأكد إن البناء يطبع الرابط الجديد.
4. اعمل Commit/Push؛ Vercel هيعمل Redeploy تلقائي، وبعدها اتأكد من `/api/health` عبر الدومين.

لو `API_PROXY_TARGET` متظبط في Vercel، غيّره للرابط الجديد بدل تعديل الكود. الكود بيطبع وقت البناء:

```text
[next.config] API proxy target: ...
```

بعد ngrok static domain:

- شغّل بـ `-Tunnel ngrok -NgrokDomain <domain>`.
- اضبط `API_PROXY_TARGET=https://<domain>` في Vercel Production.
- اعمل Redeploy وتحقق من `/api/health` وتسجيل الدخول.
- أعد تثبيت الـAutostart بدون `-SyncFallback`.

## 5) التشغيل التلقائي بعد الـReboot + Logon

### الوضع المؤقت الحالي — Quick Tunnel + Fallback Sync

```powershell
pnpm demo:autostart -- -Tunnel cloudflared -SyncFallback -StartNow
```

السكربت يضيف `SANAD-Demo.cmd` في Startup Folder الخاص بالمستخدم.
عند كل Logon:

- يبدأ `start.ps1 -Tunnel cloudflared -Watch -SyncFallback` مخفي.
- الـWatchdog يعيد تشغيل الـAPI والـTunnel لو وقعوا.
- لو الرابط اتغير، يحدّث الـFallback ويعمل Commit/Push عشان Vercel يعمل Redeploy.

> الـStartup entry بيشتغل عند تسجيل دخول Windows، مش قبل كده. لو اللابتوب واقف على شاشة القفل بعد الـReboot، الديمو مش هيرجع لحد ما تسجل دخول.

> تم اختبار Cold Start كامل: قفلنا الـWatchdog والـTunnel والـAPI وDocker Desktop، وبعدها شغّلنا `SANAD-Demo.cmd` من Startup Folder بنفس طريقة Windows. الـWatchdog شغّل Docker وPostgreSQL والـAPI والـTunnel، وحدّث الـFallback وعمل Push، والموقع رجع **200** في حوالي 70 ثانية. لكن Windows Logoff/Reboot فعلي لسه متجربش.

> **الطاقة (16 نوفمبر 2026):** السكون على الكهرباء (AC) = **Never**، والهيبرنيت = **Never**، والسكون على البطارية = 10 دقائق. سيب اللابتوب على الشاحن ومفتوح أثناء فترة التحكيم. قفل الشاشة مش بيوقف الـAPI أو الـTunnel.

> ده الحل المؤقت. متستخدمهوش كبديل نهائي لو تقدر تظبط ngrok static domain.

### بعد ngrok — الرابط الثابت

```powershell
pnpm demo:autostart -- -Tunnel ngrok -NgrokDomain sanad-demo.ngrok.app -StartNow
```

هنا الرابط ثابت، ومش محتاج `-SyncFallback`.

لإزالة التشغيل التلقائي:

```powershell
pnpm demo:autostart -- -Remove
```

## 6) Smoke Test

الـSmoke بيختبر:

- `/api/health`
- كتالوج الكورسات العام
- تسجيل دخول المدرس
- `/api/tenants/current`
- قائمة كورسات المدرس
- تسجيل دخول الطالب
- قائمة واجبات الطالب
- تسجيلات الطالب

بيانات الدخول تُقرأ من Environment Variables فقط:

```powershell
$env:DEMO_TEACHER_PHONE = "<teacher phone>"
$env:DEMO_TEACHER_PASSWORD = "..."
$env:DEMO_STUDENT_PHONE = "<student phone>"
$env:DEMO_STUDENT_PASSWORD = "..."
```

محلياً:

```powershell
pnpm demo:smoke
```

على الدومين الحي:

```powershell
pnpm demo:smoke -- -BaseUrl https://sanad-edtech.vercel.app
```

لو بيانات الدخول مش متظبطة، السكربت يختبر الـHealth والكورسات العامة ويكتب `SKIP` للاختبارات المحمية.

### فحص البنية قبل العرض

```powershell
pnpm demo:doctor
```

الفحص يشمل: Docker والكونتينرز، الـAPI المحلي، الـTunnel، الـHealth الحي، صفحات `/demo` والـCheckout، الـWatchdog، تزامن `main` مع `origin/main`، تطابق الـFallback مع رابط الـTunnel الحالي، وحالة قاعدة الديمو (3 كورسات منشورة، تسجيل واحد، الكورس المدفوع غير مسجل، 0 أوردر/دفع/استخدام كوبون). أي `FAIL` يرجّع Exit Code 1. آخر فحص: **16 نوفمبر 2026 — 9/9 PASS**.

## 7) Backup قبل أي عرض

```powershell
pnpm demo:backup
```

النسخة تتحفظ في:

```text
backups\sanad-demo-<timestamp>.dump
```

المجلد `backups/` متضاف لـ`.gitignore`. النسخة تحتوي بيانات الديمو؛ متترفعش على Git.

> تم اختبار استرجاع النسخة `backups/sanad-demo-20261115-134916.dump` في 16 نوفمبر 2026 داخل قاعدة مؤقتة: **44 جدول، 138 سياسة RLS، 43 جدول عليه RLS، 8 migrations، 2 مستخدمين، 3 كورسات منشورة، تسجيل واحد، 0 أوردر/دفع/استخدام كوبون**. القاعدة المؤقتة اتحذفت، وقاعدة الديمو الأصلية لم تتأثر.

## 8) إيقاف الديمو

```powershell
pnpm demo:stop
```

ولو عايز توقف Docker أيضاً:

```powershell
pnpm demo:stop -- -StopDocker
```

## 9) بيانات الدفع والكوبون (Sprint 2)

الديمو فيه كورس مدفوع واحد مخصص لإظهار الـCheckout:

- الكورس: `arabic-3-prep` — **199.00 EGP**
- الكوبون: **`SANAD-2026`** — مربوط بالكورس، وصالح حتى 31 ديسمبر 2027
- الطالب التجريبي مش مسجل في الكورس المدفوع، عشان تقدر تعرض الشراء لايف

لتطبيق بيانات الدفع على قاعدة الديمو المحلية:

```powershell
pnpm demo:paid
```

المسار اللي تعرضه:

1. ادخل كطالب من `/demo`.
2. افتح `/courses/arabic-3-prep`.
3. اضغط **اشترِ الكورس**.
4. اكتب الكوبون `SANAD-2026` واضغط تأكيد.
5. الصفحة تعرض **تم تفعيل الكورس**، والكورس يظهر في **كورساتي**.

الكورس المدفوع محمي على السيرفر: أي محاولة تسجيل مباشرة بدون Entitlement ترجع **402 `PAYMENT_REQUIRED`**. الاشتراك بيتكتب في نفس معاملة الـEntitlement، ومصدره `purchase` أو `voucher`.

> الكوبون ده بيانات ديمو، مش كلمة سر. متحطهوش في README أو أي ملف عام غير مخصص للديمو.

لو محتاج ترجع بيانات الديمو الأساسية: `pnpm demo:reset` ثم `pnpm demo:paid`. ولو عندك Backup حديث، استرجعه بدل إعادة البناء.

## Troubleshooting

| العرض                  | السبب المحتمل                                     | الحل                                                |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------- |
| `404` على `/api/*`     | `API_PROXY_TARGET` غلط أو Vercel لم يعمل Redeploy | صحّح المتغير، أعد النشر، راجع Build Log             |
| `502 Bad Gateway`      | الـQuick Tunnel اتغير أو الـAPI وقع               | راجع `tunnel.url` واللوج، شغّل `start.ps1`، حدّث الـFallback أو `API_PROXY_TARGET` وأعد النشر |
| الـFallback مش بيتحدث تلقائياً | Sync متخطي: فرع مش `main`، شغل متغير، أو نت/صلاحيات Git | راجع `%TEMP%\sanad-local\vercel-sync.log`، نظّف الـWorking Tree، وتأكد إن `main` متزامن مع `origin/main` |
| الموقع واقع دقائق بعد الـReboot | Quick Tunnel + Vercel Redeploy | ده متوقع في الوضع المؤقت؛ استخدم ngrok static domain للرابط الثابت |
| `pnpm demo:start` يفضل ماسك التيرمنال بعد الملخص | الـAPI والـTunnel عمليات طويلة العمر | ده متوقع؛ استخدم `-Watch` أو شغّله مخفي عبر Autostart، ومتقفلش العملية بالغلط |
| `Tenant not found`     | الـHost header أو `tenant_domains` ناقص           | شغّل السكربت، وتأكد من `PROD_TENANT_DOMAINS`        |
| `403 ORIGIN_REJECTED`  | `ALLOWED_ORIGINS` لا يحتوي دومين Vercel           | راجع `start.ps1` أو أعد تشغيله                      |
| الصفحة تعمل ثم تقف     | اللابتوب نام أو Tunnel وقع                        | الـWatchdog يعيد التشغيل؛ راجع `%TEMP%\sanad-local` |
| API لا يبدأ            | Docker/DB مش جاهزين                               | راجع `api.out.log` و`api.err.log`                   |
| ngrok لا يبدأ          | Authtoken مش متظبط                                | `ngrok config add-authtoken <token>` مرة واحدة      |
| الدومين الثابت لا يعمل | Free Static Domain لم يتم Claim                   | اعمل Claim من ngrok Dashboard                       |

## ملاحظات أمان

- الـTunnel يفتح الـAPI على الإنترنت. للديمو فقط.
- لا تضع بيانات طلاب حقيقيين على اللابتوب.
- لا ترفع `.env.local` أو `ngrok` token أو Backup إلى Git.
- الـ`-SyncFallback` بيعمل Commit للملف `apps/web/next.config.mjs` فقط، وبس على `main` نظيف ومتزامن مع `origin/main`. لو فيه تغييرات تانية، بيتخطى ويكتب السبب في اللوج.
- أوقف الـTunnel بعد انتهاء العرض لو مش محتاجه.
- لو الـAPI اتفتح على الإنترنت، راجع Rate Limits و`ALLOWED_ORIGINS` قبل أي استخدام حقيقي.
