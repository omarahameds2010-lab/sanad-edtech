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

## 4) إزالة الـHardcoded Fallback

حالياً `apps/web/next.config.mjs` فيه Fallback مؤقت للـTunnel القديم عشان الموقع الحي ما يقعش.

بعد ما تتأكد إن:

- `API_PROXY_TARGET` وصل فعلاً لبناء Vercel.
- `/api/health` عبر الدومين `200`.
- تسجيل الدخول شغال.

نشيل الـFallback في Commit منفصل. الكود بيطبع وقت البناء:

```text
[next.config] API proxy target: ...
```

راجع اللوج في Vercel build وتأكد إنه الدومين الثابت، مش القديم.

## 5) التشغيل التلقائي بعد الـReboot

```powershell
pnpm demo:autostart -- -Tunnel ngrok -NgrokDomain sanad-demo.ngrok.app -StartNow
```

السكربت يضيف `SANAD-Demo.cmd` في Startup Folder الخاص بالمستخدم.
عند كل Logon:

- يبدأ `start.ps1 -Watch` مخفي.
- الـWatchdog يعيد تشغيل أي جزء وقع.

لإزالة التشغيل التلقائي:

```powershell
pnpm demo:autostart -- -Remove
```

> لو الدومين الثابت مش متظبط، التشغيل التلقائي هيعيد تشغيل Tunnel برابط جديد، والموقع هيفضل مكسور لحد ما Vercel يتحدث. متستخدمهوش قبل تثبيت الدومين.

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

## 7) Backup قبل أي عرض

```powershell
pnpm demo:backup
```

النسخة تتحفظ في:

```text
backups\sanad-demo-<timestamp>.dump
```

المجلد `backups/` متضاف لـ`.gitignore`. النسخة تحتوي بيانات الديمو؛ متترفعش على Git.

## 8) إيقاف الديمو

```powershell
pnpm demo:stop
```

ولو عايز توقف Docker أيضاً:

```powershell
pnpm demo:stop -- -StopDocker
```

## Troubleshooting

| العرض                  | السبب المحتمل                                     | الحل                                                |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------- |
| `404` على `/api/*`     | `API_PROXY_TARGET` غلط أو Vercel لم يعمل Redeploy | صحّح المتغير، أعد النشر، راجع Build Log             |
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
- أوقف الـTunnel بعد انتهاء العرض لو مش محتاجه.
- لو الـAPI اتفتح على الإنترنت، راجع Rate Limits و`ALLOWED_ORIGINS` قبل أي استخدام حقيقي.
