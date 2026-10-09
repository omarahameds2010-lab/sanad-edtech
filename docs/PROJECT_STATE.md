# حالة المشروع الميدانية — Sanad EdTech
### تقرير من داخل الكود (مبني على قراءة مباشرة، لا على الذاكرة)

- **تاريخ التقرير:** 9 أكتوبر 2026
- **الفرع:** `master` — الريموت `github.com/omarahameds2010-lab/sanad-edtech`
- **المنهجية:** كل رقم تحت موثّق بأمر فحص (glob/grep/read/test/build). أي رقم بلا دليل مكتوب جنبه "تقدير".
- **القاعدة:** الحقائق أولًا — حتى لو ضد الانطباع السائد في `STATUS.md` أو `demo-scenario/`.

---

## 1. الصورة في 60 ثانية

| المكوّن | الحالة الحقيقية | الدليل |
|---------|-----------------|--------|
| صفحات الفرونت | **32 صفحة** — صفر روابط ميتة (404) | glob عدّ 32 ملف `page.tsx`؛ فحص كل `href`/`router.push` |
| حلقة الامتحان (طالب → امتحان → محاضرة → تصحيح) | **مكتملة كودًا، 13 commit مرفوعة** | `git log` + `git push` ناجح |
| تستات API | 14 ملف spec — آخر أخضر موثّق **91/91** | سجل تنفيذ jest |
| تستات Web | ملفان — آخر أخضر موثّق **33/33** + build أخضر | سجل vitest و`next build` |
| تشغيل حي ضد DB | **لم يحدث ولا مرة** — مستحيل هنا (لا Postgres ولا Docker) | فحص TCP للمنافذ + غياب Docker |
| مجلد `ai/` (مسار Sanad AI) | **غير موجود إطلاقًا** — لا في الشجرة ولا في أي commit ظاهر | بحث شامل `**/ai-evaluation*` = صفر |
| حزم التصميم | **2 فقط** (`design-system` + `motion`) — وليس 6 كما يقول STATUS | مجلد `packages/` |
| ملف `STATUS.md` | أرقامه قديمة (17 صفحة / 85 تست / 6 حزم) — الواقع تجاوزه | مقارنة مباشرة أعلاه |

---

## 2. خريطة الريبو

```
learning-platform/               monorepo: pnpm 9 + Turborepo
├── apps/api/                    NestJS 10 — المنطق كله هنا (12 موديول)
├── apps/web/                    Next.js 15 + React 19 — 32 صفحة
├── packages/
│   ├── design-system/           ⚠️ إصلاحها متوقف مؤقتًا (تفاصيل §9)
│   └── motion/                  ⚠️ نفس الوضع
├── prisma → apps/api/prisma/    ‏42 موديل + RLS
├── docs/                        ARCHITECTURE / SECURITY / VIDEO_PROTECTION /
│                                VISUAL_IDENTITY / STATUS (قديم جزئيًا) / DEMO (جديد، للديمو)
├── docker-compose.yml           Postgres 15 + Redis 7 (لا يعملان على هذا الجهاز)
├── demo-scenario/README.txt     ⚠️ سيناريو "محاكى" — ادعاءات غير دقيقة (§10.4)
└── ai-module-wip/               غير موجود (كان ركنًا مؤقتًا ثم حُذف مع مجلد ai)
```

**تصحيح مهم:** `STATUS.md` يذكر 6 حزم (`config, types, ui, validation`…). هذه الحزم **غير موجودة** على القرص. إما أنها خطة مستقبلية كُتبت بصيغة الحاضر، أو حُذفت. أي عمل يعتمد عليها يجب أن يتوقف حتى تُحسم.

---

## 3. الباك-إند — 12 موديول (`apps/api/src/modules/`)

`audit` · `auth` · `authorization` · `courses` · `entitlements` · `feature-flags` · `outbox` · `payments` · `plans` · `tenants` · `users` · `video-protection` · `video`

### 3.1 جدول الـroutes (بعد إزالة بادئة `api/` المكررة — commit `b1156cd`)

البادئة العامة `/api` (من `main.ts:52`). كل المسارات أدناه مسبوقة بها. كلها خلف `JwtAuthGuard` + `AuthorizationGuard` إلا المذكور.

**الحلقة (مغطاة بتست عقد `route-paths.spec.ts`):**

| النداء | الطريقة والمسار | الدور المسموح |
|--------|-----------------|---------------|
| دخول | POST `/api/auth/login` | عام (phone + password) |
| عرض الامتحان (بلا إجابات) | GET `/api/v1/exams/:id/view` | طالب مسجّل |
| بدء المحاولة (idempotent) | POST `/api/v1/exams/:id/enter` + ترويسة `idempotency-key` | طالب + entitlement |
| التايمر (expiresAt من السيرفر) | GET `/api/v1/exams/:id/timer` | طالب |
| التسليم (idempotent) | POST `/api/v1/exams/:id/submit` | طالب (**أُضيفت صلاحيتها** — كانت ناقصة! §6.1) |
| محاولاتي | GET `/api/v1/exams/:id/attempts/me` | طالب |
| الدرس التالي | GET `/api/v1/progression/lessons/:id/next` | طالب |
| الدرس + فيديوهاته | GET `/api/v1/student/lessons/:id` | طالب مسجّل |
| طابور التصحيح | GET `/api/v1/exams/:id/attempts/grading` | مدرس (`grade`) |
| التصحيح | POST `/api/v1/exams/attempts/:attemptId/grade` | مدرس |
| الواجبات: عرض/بدء/تايمر/تسليم/تسليماتي | نفس الشكل تحت `/api/v1/assignments/:id/...` | طالب (**`attempt` أُضيفت** — كانت ناقصة!) |
| تصحيح الواجبات | GET `.../submissions` + POST `.../submissions/:sid/grade` | مدرس |
| هيكل الكورس (عام) | GET `/api/v1/public/courses/:slug/structure` | عام، بلا auth (**جديد**) |
| هيكل الكورس (طالب) | GET `/api/v1/student/courses/:courseId/structure` | طالب مسجّل (**جديد**) |
| التسجيل في كورس | POST `/api/v1/enrollments/courses/:courseId/enroll` | طالب (**يمنح entitlements الآن** §6.3) |
| ملف الطالب | GET `/api/users/:id` (الطالب يرى نفسه فقط) | مدرس/طالب-نفسه (**جديد**) |

**بقية الموديولز (موجودة، لم تُلمس هذه الجلسة):** payments (طلبات/نوايا/قسائم), video + video-protection (Bunny/HMAC), plans, tenants (حل النطاق من Host), outbox, audit, feature-flags, users (بروفايل ذاتي فقط سابقًا).

### 3.2 حقائق التفويض (مقروءة من `policy-engine.ts` — ليست تخمينًا)

- RBAC roles الخمسة معرفة صراحة؛ `SUPER_ADMIN` يتجاوز الكل.
- **كان مكسورًا وتم إصلاحه:** الطالب لم يملك `submit` على exam ولا `attempt` على assignment → أي دخول/تسليم كان سيُرد بـ403. أُضيفت الصلاحيتان (commit `1d73f06`) + تست `policy-engine.spec.ts`.
- الـentitlement يُشترط لـ: `attempt`/`submit` على exam وassignment، و`watch` على lesson/video. والـfeature flags (`exams`, `assignments`, `videoPlayback`) **مفعّلة افتراضيًا** — لا seed لها مطلوب.
- الـentitlements تُمنح عند **الشراء فقط** (payment-orchestrator + voucher). لذلك أُضيف المنح عند **التسجيل المباشر** أيضًا (وإلا انكسرت الحلقة لأي طالب جديد).
- `grantCourseEntitlement` كان يوزع على (course + lessons + exams) **بدون assignments** → أُضيفت الواجبات (كانت ستُرد 403).

### 3.3 الداتابيز — 42 موديل

Identity (7): Tenant, TenantDomain, TenantConfig, User, Device, Session + enums.
Catalog (4): Course, Section, Lesson, Resource.
LMS (7): Assignment, AssignmentSubmission, Exam, ExamQuestion, ExamAttempt, Enrollment, LessonProgress.
Commerce (17): Order→Refund + Ledger + Voucher + Reconciliation + Settlement + IdempotencyKey + PaymentAuditLog.
Video/Security (7): Video, PlaybackSession, CaptureEvent, SecurityEvent, Entitlement, Subscription, AuditLog, OutboxEvent.
RLS: سياسات init + lms، دور `app_user` بلا BYPASSRLS (موثّق في STATUS — لم يُعَد فحصه هنا).

---

## 4. الفرونت — 32 صفحة (`apps/web/app/`)

### 4.1 الجرد الكامل (الحالة: حقيقي = بيانات API / ساكن = ثابت)

| # | المسار | الحالة | يدخل من |
|---|--------|--------|---------|
| 1 | `/` | ساكن (landing) | — |
| 2 | `/login` | **حقيقي** (جديد) | كل الصفحات المحمية |
| 3 | `/courses` | **حقيقي** (أُعيد بناؤه: بحث + قائمة) | landing |
| 4 | `/courses/[slug]` | **حقيقي** (جديد: منهج + تسجيل) | القائمة |
| 5 | `/teachers`, `/teachers/[slug]` | ساكن (واجهة عرض) | — |
| 6 | `/student` | **ساكن فارغ — hub ميت بلا روابط** ⚠️ | login (إجباريًا!) |
| 7 | `/student/courses` | **حقيقي** | القائمة الجانبية |
| 8 | `/student/courses/[id]` | **حقيقي** (جديد: أقفال + روابط) | كورساتي |
| 9 | `/student/lessons/[id]` | **حقيقي** (أُعيد بناؤه: YouTube UNLISTED + دخول امتحان) | تفاصيل الكورس/الواجبات/نهاية الامتحان |
| 10 | `/student/assignments` | **حقيقي** | القائمة |
| 11 | `/student/assignments/[id]` | **حقيقي** (جديد: محرر + تايمر + تسليم تلقائي) | القائمة |
| 12 | `/student/exams` | **حقيقي** | القائمة + زر الدرس القديم |
| 13 | `/student/exams/[id]` | **حقيقي** (جديد: تايمر + تنقل + تسليم) | القائمة/الدرس |
| 14 | `/student/profile` | **حقيقي** (+ خروج) | القائمة |
| 15 | `/teacher` | ساكن بأرقام ثابتة (روابطه سليمة) | login يدوي |
| 16–20 | `/teacher/courses`, `/new`, `/[id]`, `/builder`, `/preview`, `/publish` | ساكن + **`/new` حقيقي** (إنشاء فعلي) | القائمة/الداشبورد |
| 21 | `/teacher/lessons/[id]` | ساكن (موجود مسبقًا) | الـbuilder |
| 22 | `/teacher/assignments` | **حقيقي** (أُعيد بناؤه) | القائمة |
| 23 | `/teacher/assignments/[id]` | **حقيقي** (جديد: طابور + تصحيح) | القائمة |
| 24 | `/teacher/exams` | **حقيقي** (أُعيد بناؤه) | القائمة |
| 25 | `/teacher/exams/[id]` | **حقيقي** (جديد: طابور + تصحيح) | القائمة |
| 26 | `/teacher/students` | **⚠️ mock كامل بأسماء وهمية وبلا روابط** | القائمة |
| 27 | `/teacher/students/[id]` | **حقيقي** (جديد: ملف + متوسط) | طابوري التصحيح فقط |
| 28 | `/teacher/payments` | **حقيقي** (طلبات + إجمالي) | القائمة |
| 29 | `/teacher/analytics` | **⚠️ mock برسوم وهمية** | القائمة |
| 30 | `/teacher/settings` | **حقيقي** (قراءة فقط — لا endpoint للتعديل) | القائمة |

(العد 32 يشمل تجزئة teacher/courses الستة.)

### 4.2 خريطة الربط (مدققة سطرًا سطرًا — صفر 404)

```
landing → courses ⇄ [slug] → enroll → student/courses ⇄ courses/[id] → lessons/[id] → exams/[id] → done → lessons/[next] ✓
                                              ↘ assignments ⇄ assignments/[id] → done → lessons[unlocked] ✓
login → /student (إجباريًا — حتى للمدرس ⚠️) · profile → logout → login ✓
teacher ⇄ courses/new → courses/[id] · exams ⇄ exams/[id] ⇄ students/[id] ⇄ assignments/[id] ⇄ assignments ✓
```

**الثغرات الثلاث الموثقة (ليست 404):**
1. `/student` hub ميت — القادم من login يجد عناوين فارغة بلا أي رابط.
2. `/teacher/students` معزولة — ملف الطالب لا يُفتح إلا من طابوري التصحيح.
3. روابط احتياطية بIDs وهمية: `/student/lessons/l1` (fallback نهاية الامتحان — يعطي خطأ API أنيقًا لا كراش) و`/teacher/courses/c2` (صفحات الـbuilder الساكنة).

### 4.3 بنية الـclient (`app/lib/`)

- `api.ts`: كل endpoints أعلاه + `ApiError` + مفاتيح idempotency + فكّ `{data}` — **مغطى بـ33 تست**.
- `auth.tsx`: التوكن **في ذاكرة React فقط** (لا localStorage — التزامًا بالقواعد). تنبيه صريح: نسخة ديمو، الإنتاج يحتاج BFF proxy.
- `exam.ts` + `useCountdown.ts`: التايمر **مشتق من `expiresAt` السيرفر** — الساعة الأمامية للعرض فقط.
- `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).

---

## 5. الحلقة الكاملة (التجربة المقصودة للديمو)

```
طالب: login → /student/exams → intro → [POST enter + idempotency-key]
     → أسئلة بلا إجابات (السيرفر يحذف correctAnswer) → إجابة/تنقل
     → تسليم يدوي أو تلقائي عند الصفر → ENTER_EXAM يفتح الدرس التالي
     → محاضرة YouTube UNLISTED → مدرس: طابور → درجة+ملاحظات → الطالب يرى نتيجته
```

- **التايمر:** `startedAt + timerMinutes` على السيرفر (افتراضي 70 امتحان / 300 واجب). إعادة التحميل لا تصفّره (يُعاد الجلب). انتهاء → `TIMED_OUT`/`LATE` بقواعد `allowLateSubmission`.
- **التقدم:** `ENTER_ASSIGNMENT → فتح امتحان`، `ENTER_EXAM → فتح الدرس التالي` — idempotent بمفاتيح + قيود DB.
- **Seed الديمو** (`pnpm seed:path2` + `docs/DEMO.md`): tenant + نطاق `localhost` (إجباري — حل المستأجر من Host) + مدرس `01000000001` + طالب `01000000002` + كورس/وحدات/فيديو YouTube/امتحان 3 أسئلة/واجب + تسجيل + **entitlements لكل الموارد** (بدونها 403).

---

## 6. إصلاحات حرجة اكتُشفت وسُدّت (كانت ستُسقط الديمو)

| # | الخلل | الأثر | الإصلاح |
|---|-------|-------|---------|
| 1 | `req.user.sub` دائمًا `undefined` (الـstrategy ترجع `id` فقط) وكل الـcontrollers تستخدم `sub` | كل calls الامتحانات تعمل بمستخدم مجهول | `jwt.strategy.ts` + تست |
| 2 | مسارات مزدوجة `/api/api/...` (بادئة عامة + بادئة controllers) | عناوين قبيحة/مربكة في الديمو والتوثيق | تجريد البادئة من 16 controller |
| 3 | RBAC بلا `submit/exam` و`attempt/assignment` للطالب | 403 على التسليم والدخول | سياسة + 4 تستات |
| 4 | entitlements تُمنح عند الشراء فقط + بدون واجبات | أي طالب مسجّل مباشرة يُرفض | منح عند التسجيل + fan-out للواجبات |
| 5 | `getStudentLesson` بلا فيديوهات | صفحة الدرس عمياء | include مفلتر READY/PUBLISHED + تست |

---

## 7. التستات — الجرد الصادق

- **API: 14 ملف spec.** آخر أخضر كامل موثّق: **91/91**. يشمل: auth/strategy، policy (RBAC)، entitlements (fan-out)، courses/structure، users/file، enrollments (grant)، lessons (videos)، exams/assignments/progression/enrollments/sections/resources/progress (قديمة).
- **Web: ملفان (33/33)** يغطيان كل دوال الـclient (URLs/methods/bodies/envelopes).
- **عقد الطرق `route-paths.spec.ts`**: قفل كل مسارات الحلقة — مرّ (4/4) قبل كسر الشجرة، +3 routes جديدة بانتظار شجرة سليمة.
- **E2E:** `golden-flow` + `rls-isolation` موجودة — تعمل في CI فقط (تحتاج DB حية). محليًا: مستحيل (لا Docker).
- **⚠️ فخ الإعداد:** يوجد إعدادا jest معًا (`jest.config.js` + مفتاح `jest` في `package.json`) → التشغيل **يجب** أن يكون `jest --config jest.config.js` وإلا فشل "Multiple configurations". يجب حذف أحدهما.

---

## 8. CI/CD والبنية

- Jobs: typecheck (api+web builds فقط — **لا يفحص الحزم!**)، lint، test-unit، build، e2e، deploy-preview، release.
- **Bugs موثقة بالقراءة:** (1) `e2e` و`release` تشترط `refs/heads/main` والفرع الافتراضي `master` → لا تعملان أبدًا؛ (2) مفاتيح `runs-on` مكررة في 3 jobs؛ (3) `pnpm --filter web test` كان بلا سكربت (أُضيف الآن).
- المنافذ: API `:3000` افتراضيًا (يتعارض مع web — الديمو يستخدم `:3001`)، web `:3000`، Postgres `:5432`، Redis `:6379`.
- التشغيل: `docker compose up -d` → migrate بالمستخدم الخارق → seed → API → web (التفاصيل `docs/DEMO.md`).

---

## 9. مناطق الزملاء والملفات المتسخة (ممنوع اللمس دون تنسيق)

- **تعديلات غير مثبتة الآن (نشطة):** `policy-engine.ts`، `assignments.controller/service`، `lessons.module.ts`، `idempotency.service.ts` (**يكسر 3 suites + الـbuild حاليًا**)، و7 ملفات design-system.
- **مخبأ مركون:** `stash@{0}` = إصلاح design-system/motion (30 ملفًا) — احتياطي، لا يُمس.
- **مخلفات مبعثرة (غير مؤذية للبناء):** عشرات `*-out.txt` و`build*.txt` و`STATUS-fixed.txt` و`service_backup.txt` و`*.bak` و`tsbuildinfo` و`.storybook` و`stories/` — تستحق تنظيفًا جماعيًا متفقًا عليه.
- **`ai/` محذوف:** مجلد Path-4 أزاله أحد الزملاء من الشجرة تمامًا — أي خطة AI تبدأ من الصفر.
- **`demo-scenario/README.txt` مضلل جزئيًا:** يدّعي HttpOnly cookies (الواقع: Bearer + ذاكرة)، و"85 تست / 18 صفحة" (قديم)، و"AI evaluation (mock)" (لا وجود له)، و"register (conceptual)" (لا endpoint). المرجع الصحيح للديمو هو `docs/DEMO.md`.

---

## 10. المخاطر مرتبة (الأعلى أولًا)

1. **لا إثبات حي لأي شيء** — كل ما سبق static/tests. أول `docker up` قد يكشف مفاجآت (RLS مع seed، سياسات، CORS).
2. **تعارض التحرير المتزامن** — ثلاثة أطراف على `master` بلا فروع؛ كسر `idempotency` الآن مثال حي. **مقترح:** فروع قصيرة + PR.
3. **الحزم (design-system/motion) مكسورة البناء** — الـweb لا يحتاجها اليوم (CSS فقط)، لكن أي استيراد مكونات منها سيُسقط البناء.
4. **الدخول دائمًا → `/student`** حتى للمدرس — تجربة ديمو ناقصة.
5. **الإعدادات قراءة فقط + analytics/mock + students/mock** — صفحات حقيقية الشكل فارغة الجوهر.
6. **الأسرار في `apps/api/.env`** (ملف حقيقي على القرص، خارج git — صحيح، لكن قيم ديمو ضعيفة).

---

## 11. الخطوات التالية المقترحة (صغيرة، بالترتيب)

1. إحضار Postgres (Docker أو سحابي) + أول تشغيل حي من `docs/DEMO.md` وتسجيل الفروقات.
2. إصلاح `idempotency.service.ts` الجاري + حذف أحد إعدادي jest + تنظيف `*.txt` المبعثرة (جلسة نظافة واحدة).
3. توحيد الهبوط حسب الدور (`/login` → طالب/مدرس) + إحياء `/student` بروابط وبيانات حقيقية.
4. ربط قائمة الطلاب والتحليلات (تحتاج endpoint قائمة + فحص باك-إند التحليلات).
5. بدء Path-4 (AI) على `ExamAttempt.answers` الجاهزة — بعد تثبيت مفتاح Gemini وإعادة مجلد `ai/` بقرار جماعي.
6. فروع + PR بدل الدفع المباشر على `master`.

---

## ملحق: سجل الجلسة (13 commit مرفوعة)

`3c6d728` sub · `b1156cd` routes · `e0ac9f3` client/auth/login · `1ae10b9` exam runner · `ce1a1f7` lesson+YouTube · `c277033` exam grading · `c5e92d2` contract+seed+DEMO · `e52a497` + `cf2c712` الصفحات الست · `1d73f06` أساسات API · `c79c852`/`1eb4a5d`/`4230fe8`/`a6baf6e`/`0bac878` الصفحات الخمس.
