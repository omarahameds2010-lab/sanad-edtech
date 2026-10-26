# Demo Runbook — Sanad EdTech

> **Verified 25 October 2026.** This runbook uses only shipped flows. Do not improvise claims about RLS enforcement, RAG benchmarks, or live payment providers.
> Current state: [`CURRENT-STATE.md`](CURRENT-STATE.md).

## 1. What the demo proves

In three minutes:

1. A teacher owns a branded space with real courses.
2. A student sees a real curriculum, not a card mock.
3. The student enters an assignment, then an exam, and progression unlocks the next lesson.
4. The teacher grades the work.
5. The UI works in Arabic RTL, dark and light, on desktop and mobile.

That is the honest core. Payments and AI can be shown as code paths, but not as a live provider transaction unless one has actually been run.

## 2. Live demo

| Surface | URL |
| --- | --- |
| Web | <https://sanad-edtech.vercel.app> |
| Health | <https://sanad-edtech.vercel.app/api/health> |

| Role | Phone | Password |
| --- | --- | --- |
| Teacher | `01000000001` | `Joker-Arabic#2026` |
| Student | `01000000002` | `Student123!` |

The production tenant is `sanad-demo` with three published Arabic prep courses.

### Pre-flight

```powershell
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

Expected: `status: ok`, `database: up`. If health is down, stop; do not demo around a broken API.

## 3. Three-minute flow

### 0:00 — Teacher space

1. Open `/login`, sign in as the teacher.
2. Show `/teacher` and `/teacher/courses`: three published courses.
3. Open a course builder or the publish workspace and point out sections, lessons, assignment, and exam — all authored in the UI.

Do not claim the platform auto-generates content. The teacher authored it.

### 0:40 — Student curriculum

1. Log out (or use a private window) and sign in as the student.
2. Open `/student/courses` → the Arabic course.
3. Show the curriculum board:
   - sections and lessons;
   - task chips for video, assignment, exam;
   - progress and available/locked counts from the API;
   - direct links into each task.

Point out that the counts are not hardcoded: they come from the curriculum response.

### 1:20 — Lesson and prerequisite

1. Open a video lesson. Show the player and the lesson rail.
2. Open the lesson whose video is gated by the assignment. Show the locked-video state.
3. Explain the active rule: `ENTER_ASSIGNMENT` unlocks the linked exam; `ENTER_EXAM` unlocks the next lesson.

Do not claim score-based unlocking or server-enforced lock confidentiality. Only entry-based progression is active.

### 1:50 — Assignment + exam

1. Open the assignment. Show the 300-minute server timer and the brief.
2. Enter the assignment, submit (or show an already-submitted attempt).
3. Open the exam. Show the 70-minute timer, question types, and no correct answers in the student view.
4. Submit the exam.

### 2:30 — Grading

1. Sign back in as the teacher.
2. Open the grading queue for the exam or the assignment submission.
3. Show score + feedback.
4. Return to the student result screen and show the teacher's feedback.

### 2:50 — Theme and responsive check

1. Toggle the student dock's Moon/Sun control.
2. Reload: the theme persists (`sanad:theme`), and the session restores from the refresh cookie.
3. Resize to mobile width; show the curriculum and lesson layout.

## 4. Optional: payments

Show the payment state machine in code or docs:

```text
Order → PaymentIntent → Provider → Payment → LedgerEntry → Entitlement
```

What is true:

- Paymob/Fawry/voucher integrations and signed webhooks exist;
- idempotency and refund settlement are implemented;
- local webhook/refund smokes passed.

What is not proven:

- a real Paymob/Fawry sandbox charge in this release;
- Instapay/Vodafone Cash/e&money as live methods.

Say “implemented and locally proven” — not “live with every provider.”

## 5. Optional: AI evaluation

The client calls `/api/v1/assignments/:id/evaluate-ai`; the API has a SANAD client configured through `SANAD_BASE_URL` / `SANAD_API_KEY`.

That is all this repo proves. Do not present:

- Qdrant/BM25/RRF;
- `38.8ms`;
- `Recall@5 = 0.75`;
- “393 achievements”;
- auto-grading as a replacement for teacher review.

If the external SANAD service is not configured, say so and skip the AI segment.

## 6. Local demo

```powershell
docker compose up -d
Copy-Item apps/api/.env.example apps/api/.env
cd apps/api
pnpm exec prisma generate
pnpm exec prisma migrate deploy
$env:DEMO_YOUTUBE_ID="<unlisted-id>"
pnpm seed:path2
pnpm run dev
```

In a second terminal:

```powershell
cd apps/web
pnpm dev
```

Open `http://localhost:3001/login`.

The seed registers the localhost tenant domain; tenant resolution is Host-based, so use `localhost:3001`, not a random IP.

## 7. Known limitations to mention if asked

- RLS policies exist but production still connects with the owner/superuser URL; RLS is not enforcing yet.
- Outbox events are written but not dispatched.
- No video webhook endpoint.
- Locked lessons can still return content in student API views.
- Word-level review highlights are not persisted.
- Advanced progression types are future work.
- CI is not the release evidence for this commit; local runs are.

Honesty is part of the demo. The shipped loop is strong enough without invented numbers.
