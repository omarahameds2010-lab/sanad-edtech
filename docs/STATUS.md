# Status — 27 October 2026

> Canonical detail lives in [`CURRENT-STATE.md`](CURRENT-STATE.md). This page is the short dashboard: what is live, what is proven, and what is still missing.

## Release

| Item | Value |
| --- | --- |
| Production branch / verified app commit | `main` / `4951e49` |
| Pending hardening branch | `feat/security-quick-wins` — rate limiting + lock enforcement; local only, not deployed |
| Pending retakes branch | `feat/assignment-retakes` — stacked on the hardening branch; local only, not deployed |
| Web | <https://sanad-edtech.vercel.app> |
| API | <https://sanad-edtech-production.up.railway.app> |
| Health | `/api/health` → **200**, database **up** |
| Login page | **200** |
| Demo tenant | `sanad-demo` |
| Migrations | 7/7 applied on Railway PostgreSQL; 8/8 verified locally on the retakes branch |
| Database models | 43 |
| RLS policies | 138 across 43 application tables |
| RLS runtime enforcement | **Not active** — runtime still uses owner/superuser credentials |

## Evidence

| Check | Result | Command |
| --- | --- | --- |
| API tests on `main` | **311/311**, 31 suites | `pnpm --filter api exec jest --config jest.config.js --runInBand` |
| API tests on hardening branch | **324/324**, 33 suites | Same command on `feat/security-quick-wins` |
| API tests on retakes branch | **331/331**, 33 suites | Same command on `feat/assignment-retakes` |
| Web tests | **138/138**, 8 files | `pnpm --filter web test` |
| Monorepo build | **4/4** successful | `pnpm build` |
| Fresh migration chain | **8/8** on local PostgreSQL 15; no schema drift | Docker + `prisma migrate deploy`; `prisma migrate diff` |
| Legacy backfill | Existing submission preserved as attempt #1 with `startedAt = submittedAt` | Legacy-shaped local DB + migration #8 |
| Retake HTTP smoke | Attempt 1 → submit → attempt 2 → max-attempt `400`; teacher queue excludes active | Local API + PostgreSQL |
| Concurrent-start smoke | Two simultaneous starts → **201 + 409**, one active row | Local API + PostgreSQL |
| Retake browser QA | Attempt 1 submit → reload shows «محاولة جديدة» → attempt 2 starts | Local web + API |
| Live health | **200** / database up | `Invoke-RestMethod https://sanad-edtech.vercel.app/api/health` |
| Login-limit smoke (branch) | `401` ×10 → `429` ×2 with `Retry-After` | Local API, one forwarded IP |
| Student redesign | Course, task links, video, exam brief, assignment brief, locked state, theme toggle verified in browser | Manual QA, 24–25 Oct 2026 |

Older counts (86, 179, 229, 276, 307, 393) belong to historical snapshots. Do not use them as the current total.

## Shipped

- Tenant resolution, tenant-scoped users, auth cookies, refresh rotation, session restore.
- Teacher course/section/lesson/resource/assignment/exam authoring and publish workflow.
- Student curriculum board with real section/lesson/task data and direct task links.
- Student lesson workspace for video, exam, and assignment, including locked-video prerequisite state.
- Server-authoritative 300-minute assignment timer and 70-minute exam timer.
- Per-student entry-based progression (`ENTER_ASSIGNMENT`, `ENTER_EXAM`) with idempotent grants.
- Teacher grading queue.
- Student Command Center with server-derived numbers.
- Dark default + optional Academic Light Mode; pre-paint theme restore.
- Paymob/Fawry/voucher payments, signed webhooks, ledger, entitlements, idempotency, refunds.
- Bunny Stream provider code and video-protection primitives; unlisted YouTube demo path.

## Pending hardening branch (not deployed)

`feat/security-quick-wins` adds:

- global per-IP rate limiting (120/min per route; login 10/min, register 5/min, refresh 30/min), with health/readiness and payment webhooks exempt;
- in-memory throttler storage and forwarded-IP keying;
- metadata-only responses for locked lessons and `403 LESSON_LOCKED` from locked assignment/exam view and enter endpoints.

## Pending assignment-retakes branch (not deployed)

`feat/assignment-retakes` is stacked on `feat/security-quick-wins` and adds:

- migration #8 with `attemptNumber`, `startedAt`, nullable `submittedAt`, and the `IN_PROGRESS` status;
- one row per attempt, unique on `(assignmentId, studentId, attemptNumber)`;
- server-side `maxAttempts` enforcement and `409` for concurrent duplicate starts;
- grading/history filters that keep in-progress attempts out of teacher queues while preserving student resume;
- retake-aware student runner, assignment list, result review, and teacher attempt column.

Production `4951e49` still has the old one-row model and does not enforce retakes.

## Still open

| Priority | Gap | What “done” means |
| --- | --- | --- |
| P1 | RLS runtime activation | Runtime connects as `app_user`; `MIGRATION_DATABASE_URL` absent from runtime; RLS e2e 5/5 on Railway; isolation re-verified |
| P1 | Outbox dispatcher | Events are delivered, retried, and observable; no longer write-only |
| P1 | Video webhook | Provider callback route verifies the signature and updates video state |
| P1 | Deploy hardening branch | Rate limiting and lock enforcement reach production; live smoke repeats the local evidence |
| P1 | Deploy retakes branch | Merge the stacked branch, apply migration #8 to Railway, and repeat the retake + concurrent-start smokes against production |
| P2 | Real provider sandbox | One Paymob/Fawry sandbox charge and one refund recorded end to end |
| P2 | Distributed rate limiting | The pending branch’s in-memory limits are backed by shared storage and proxy-IP handling is verified under production traffic |
| P2 | Review evidence | Per-word/answer evidence persisted instead of an aggregate bridge |
| P2 | Content versioning | Published course/lesson/exam revisions stored as immutable versions so old attempts keep their source content |
| P2 | Server-side exam auto-submit | A scheduled worker expires and submits abandoned attempts without relying on the open tab |
| P2 | 2FA / secret manager / observability | Controls implemented and tested |
| P3 | Advanced progression | `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, manual unlocks |
| P3 | Reconciliation worker | Live reconciliation run over provider settlements |

## What is not a current claim

- RLS is not enforcing production traffic while the runtime uses the owner URL.
- The transactional outbox is not delivering events.
- There is no video webhook endpoint.
- Production does not yet enforce assignment retakes; the attempt model is on a pending local branch.
- Instapay, Vodafone Cash, and e&money are not live payment methods.
- VdoCipher is a stub.
- The SANAD RAG/benchmark/393-achievement story from older demo material is not verified in this repository.
- CI is not cited as green for this release; local test/build evidence is.

## History

| Date | Milestone |
| --- | --- |
| 2026-10-16 | Production API go-live; tenant middleware and Railway/Docker build fixed |
| 2026-10-16 | RLS migrations + runtime tenant injection; JWT tenant binding; feature flags; webhook revival |
| 2026-10-17 | Per-student progression; checkout funnel; payment webhook round trip; refunds |
| 2026-10-20 | Vercel web go-live; session restore; all production URLs health-verified |
| 2026-10-24 | Academic Light Mode + student redesign QA |
| 2026-10-25 | Heritage Manuscript curriculum/lesson workspace redesign; docs aligned to verified state |
| 2026-10-26 | Pending hardening branch: per-IP/auth rate limiting + server-side lock enforcement; 324/324 API tests |
| 2026-10-27 | Pending retakes branch: attempt model + migration #8, 331/331 API and 138/138 web tests, 8/8 migration chain |

Historical audit: [`AUDIT-2026-10-16.md`](AUDIT-2026-10-16.md). It is preserved as a dated snapshot, not rewritten.
