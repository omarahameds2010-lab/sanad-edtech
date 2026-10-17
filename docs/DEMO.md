# Demo Runbook — مساحة الأستاذ صالح حسين (جوكر اللغة العربية) + Exam Loop

## What this proves (3-minute pitch)

0. المساحة العامة للمعلم (`/teachers/saleh-hussein`) — «The Teacher Space»: هيرو غامق `ink-950` بأورورا زمردي خفيفة + حبيبات ورق (`grain` 2%)، أفاتار وشرائح زجاجية، وشبكة Bento لكورساته الثلاثة (الأول 60% والثاني/الثالث 40%)، ثم «ثالوث الثقة» بفواصل تحريرية وأيقونات SVG، ولحظة تباين ختامية غامقة بدل الصندوق البيج — بظهور متدرج وزر مغناطيسي.
   0.5 المدرس ينشر من `/teacher/publish`: يختار الصف → مساحة الكورس → يضيف درسًا (فيديو/امتحان/واجب) وينشره — والطالب يجد الامتحان في «الاختبارات» والواجب في «الواجبات» فورًا.
1. طالب يدخل امتحانًا بتايمر سيرفر (70 دقيقة)، يحل MCQ وصح/خطأ ومقاليًا، يتنقل بين الأسئلة، ويسلّم (يدويًا أو تلقائيًا عند انتهاء الوقت).
2. دخول الاختبار يفتح الدرس التالي تلقائيًا (ENTER_EXAM progression).
3. الدرس يعرض فيديو YouTube UNLISTED حقيقيًا.
4. المدرس يرى طابور المحاولات ويصحح بالدرجة والملاحظات، والطالب يرى نتيجته.

## Prerequisites

- Docker with Postgres 15 + Redis 7 (see `docker-compose.yml`), **or** any Postgres 15 reachable via `DATABASE_URL`.
- Node 20 + pnpm 9.
- A YouTube UNLISTED video id for the lesson player (`DEMO_YOUTUBE_ID`).

## 1) Start infrastructure

```powershell
docker compose up -d
```

## 2) Migrate + seed (superuser bypasses RLS for seeding only)

```powershell
cd apps/api
$env:MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learning_platform?schema=public"
$env:DATABASE_URL=$env:MIGRATION_DATABASE_URL
npx prisma migrate deploy
$env:DEMO_YOUTUBE_ID="PASTE_UNLISTED_ID_HERE"
pnpm seed:path2
```

The seed prints credentials and ids. Demo accounts:

| Role    | Phone       | Password          |
| ------- | ----------- | ----------------- |
| Teacher | 01000000001 | Joker-Arabic#2026 |
| Student | 01000000002 | Student123!       |

It also registers the `localhost` tenant domain (required: tenant resolution is Host-based).

## 3) Run the apps (two terminals)

```powershell
# Terminal 1 — API on :3002 (canonical lock: API :3002, Web :3001)
cd apps/api
pnpm run dev

# Terminal 2 — Web on :3001 (expects NEXT_PUBLIC_API_URL=http://localhost:3002)
cd apps/web
$env:NEXT_PUBLIC_API_URL="http://localhost:3002"
pnpm dev
```

## 4) Pitch flow (student)

1. Open `http://localhost:3001/login` → login as student.
2. Go to `/student/exams` → open "اختبار: المهارات النحوية".
3. Intro shows question count, server timer, attempts used → "بدء الاختبار".
4. Answer Q1 (MCQ, option `b`), Q2 (True/False), Q3 (essay — this is where Sanad AI grading plugs in later).
5. Use السابق/التالي + palette; watch the server-anchored countdown.
6. "إنهاء الاختبار وتسليم الإجابات" → result screen → "الدرس التالي" (unlocked by ENTER_EXAM).

## 5) Lecture (YouTube UNLISTED)

- The next lesson page embeds `https://www.youtube-nocookie.com/embed/<DEMO_YOUTUBE_ID>`.
- If the lesson shows locked, the exam-enter step did not run — check the API log for `CONTENT_UNLOCKED`.

## 6) Teacher grading

1. Login as teacher → `/teacher/exams` → open the exam → grading queue.
2. Open the student attempt, review answers, set score 0–100 + feedback → "حفظ الدرجة".
3. Back as student: result screen shows الدرجة + ناجح/راسب (passing 60%).

## 7) Teacher authoring (UI, no DB console needed)

مسار النشر كامل من قائمة «النشر» عند المدرس:

1. **مساحة النشر** (`/teacher/publish`): ثلاثة كروت للصفوف (الأول/الثاني/الثالث الإعدادي) بعدادات حقيقية لكل صف (كورسات/دروس/منشور/امتحانات/واجبات).
2. **صفحة الصف** (`/teacher/publish/<prep-1|prep-2|prep-3>`): كورسات الصف + مناهجها، وأزرار «فتح الامتحان» و«تصحيح الواجب» على الدروس. زر «+ كورس جديد للصف» يفتح الإنشاء والصف مُعبَّأ مسبقًا.
3. **مساحة الكورس** (`/teacher/courses/<id>`): نشر/إلغاء نشر الكورس، «+ إضافة وحدة»، و«+ إضافة درس» (النوع: فيديو/امتحان/واجب)، مع نشر/إلغاء نشر/حذف لكل درس (الحذف يشمل الامتحان/الواجب المرتبط تلقائيًا).
4. **محرر الدرس** (`/teacher/lessons/<id>`): بيانات الدرس + محرر حسب النوع —
   - **فيديو**: الصق معرّف يوتيوب UNLISTED → «ربط فيديو يوتيوب» (`POST /api/video/youtube`).
   - **امتحان**: إعدادات + أسئلة (MCQ/صح-خطأ/مقالي) → «حفظ ونشر الاختبار» (`POST /api/v1/exams/lessons/:lessonId/exams` → `.../questions` → `.../publish`).
   - **واجب**: إعدادات → «حفظ ونشر الواجب» (`POST /api/v1/assignments/lessons/:lessonId/assignments` → `.../publish`).
5. بعد النشر: الطالب يجد الامتحان في `/student/exams` والواجب في `/student/assignments` ومحتوى الدرس في صفحة الدرس.
6. **امتحان بعد كل محاضرة**: اضبط صف الدرس التالي `unlockType=ENTER_EXAM, unlockTargetId=<examId>, lockStatus=LOCKED` (تحديث Prisma/API واحد) — دخول الامتحان يفتحه تلقائيًا.
7. **الطلاب + التليفونات**: `/teacher/students` يعرض كل طالب مسجّل في كورساتك بأرقام تليفونه.
8. **الصفحة العامة للكورس** (`/courses/<slug>` من `/courses`): تصميم «Editor's Stage» — خلفية ورقية `paper-50` مع حرف «ع» شبح مقطوع في الكورنر، شبكة 7:5 (المحتوى يمين، الكارت شمال)، كارت تسجيل زجاجي sticky بحواف gleam وزر magnet، المنهج على شكل دفتر (أيقونة نوع + عنوان + قفل + توست للدرس المقفول)، وكل الأرقام (عدد الدروس/مدة المحتوى/السعر) من السيرفر. للزائر: «سجل الدخول للتسجيل» — للطالب المسجل: «أنت مسجل بالفعل ✓».

## Verification already done in CI/local

- `pnpm --filter api run build` + full jest suite (86+ tests incl. `route-paths.spec.ts` locking every URL below).
- `pnpm --filter web test` (18 tests) + `next build`.
- Locked HTTP contract (global prefix `/api`):

| Call                     | Method + Path                                     |
| ------------------------ | ------------------------------------------------- |
| login                    | POST /api/auth/login                              |
| exam view (no answers)   | GET /api/v1/exams/:id/view                        |
| enter (idempotent)       | POST /api/v1/exams/:id/enter + `idempotency-key`  |
| timer (server expiresAt) | GET /api/v1/exams/:id/timer                       |
| submit (idempotent)      | POST /api/v1/exams/:id/submit + `idempotency-key` |
| my attempts              | GET /api/v1/exams/:id/attempts/me                 |
| next lesson              | GET /api/v1/progression/lessons/:id/next          |
| lesson + videos          | GET /api/v1/student/lessons/:id                   |
| grading queue            | GET /api/v1/exams/:id/attempts/grading            |
| grade                    | POST /api/v1/exams/attempts/:attemptId/grade      |

## Next (explicitly out of Path-2 scope)

- Sanad AI essay auto-grading (Path 4) consumes `ExamAttempt.answers` graded here.
- Bunny/VdoCipher upload pipeline (Path 3); YouTube is the demo source.
- BFF session proxy to replace the in-memory web token (demo-grade auth noted in code).
