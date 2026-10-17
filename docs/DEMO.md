# Demo Runbook — مساحة الأستاذ صالح حسين (جوكر اللغة العربية) + Exam Loop

## What this proves (3-minute pitch)

0. المساحة العامة للمعلم (`/teachers/saleh-hussein`) تعرض هويته وكورساته الثلاثة (الأول/الثاني/الثالث الإعدادي).
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

All flows below are clickable in `/teacher/lessons/<lessonId>` after login
as teacher. Lesson shells themselves still come from seed/API for now —
lesson CREATE UI is the next slice, not this one.

1. **YouTube video**: open the VIDEO lesson → paste the UNLISTED video id
   → "ربط فيديو يوتيوب". Verifies via `POST /api/video/youtube`
   `{ lessonId, title, providerVideoId }` (READY immediately, one active
   video per lesson — delete to replace).
2. **Exam**: open the EXAM lesson → fill settings + add questions
   (MCQ with options + correct radio, True/False preset, short/essay)
   → "حفظ ونشر الاختبار". Uses `POST /api/v1/exams/lessons/:lessonId/exams`,
   then `POST /api/v1/exams/:examId/questions` per question,
   then `POST /api/v1/exams/:examId/publish`.
3. **Assignment**: open the ASSIGNMENT lesson → fill + "حفظ ونشر الواجب".
   Uses `POST /api/v1/assignments/lessons/:lessonId/assignments`
   then `POST /api/v1/assignments/:assignmentId/publish`.
4. **Exam after every lecture**: set the next lesson row
   `unlockType=ENTER_EXAM, unlockTargetId=<examId>, lockStatus=LOCKED`
   (one Prisma/API update) — entering the exam unlocks it automatically.
5. **Students + phones**: `/teacher/students` lists every student enrolled
   in your courses with phone numbers (no submission needed).

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
