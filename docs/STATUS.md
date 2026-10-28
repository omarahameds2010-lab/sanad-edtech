# Status — 28 October 2026

> Canonical detail lives in [`CURRENT-STATE.md`](CURRENT-STATE.md). This page is the short dashboard: what is live, what is proven, and what is still missing.

## Release

| Item | Value |
| --- | --- |
| Production branch | `main` |
| Web runtime code | `cd03fb0` — web-only SANAD grading-selector commit on top of `5ac122d`; later docs-only commits do not change it |
| API deployment | `5ac122d` — `railway up` deployment `16a33f07-f1dd-404f-b110-ba4497ac7408`, SUCCESS |
| Hardening / retakes | **Deployed** — rate limiting, lock enforcement, authoring-read fixes, and assignment retakes are live |
| Web | <https://sanad-edtech.vercel.app> |
| API | <https://sanad-edtech-production.up.railway.app> |
| Health | `/api/health` → **200**, database **up** |
| Login page | **200** |
| Demo tenant | `sanad-demo` |
| Migrations | **8/8** applied on Railway PostgreSQL |
| Database models | 43 |
| RLS policies | 138 across 43 application tables |
| RLS runtime enforcement | **Not active** — runtime still uses owner/superuser credentials |

## Evidence

| Check | Result | Command |
| --- | --- | --- |
| API tests on production code (`5ac122d`) | **357/357**, 35 suites | `pnpm --filter api exec jest --config jest.config.js --runInBand` |
| Web tests on `cd03fb0` | **147/147**, 10 files | `pnpm --filter web test` |
| Monorepo build on `cd03fb0` | **4/4** successful | `pnpm build` |
| Production migration chain | **8/8**; schema up to date | `prisma migrate status` against Railway |
| Backup/restore proof | Custom dump + globals restored into local PostgreSQL 18: 44 tables, 3 courses, 1 submission, 7 migrations at backup time | Docker `pg_dump` / `pg_restore` |
| Production retake smoke | **31/31**: concurrent start 201+409, attempt 1 submit, attempt 2 submit, third 400, teacher queue excludes active, health 200 | Node script through the production web domain |
| Production lock-card QA | «الواجب مقفل» + «لفتح هذا الواجب، سلّم الواجب السابق أولًا.» in dark and light, no overflow; lesson restored | Browser against production |
| Live health | **200** / database up | `Invoke-RestMethod https://sanad-edtech.vercel.app/api/health` |
| Historical branch evidence | API 344/344 and 353/353; web 145/145; local retake/concurrency/lock QA | Pre-merge local runs, 26–27 Oct 2026 |

Older counts (86, 179, 229, 276, 307, 311, 344, 353, 393) belong to historical snapshots. Do not use them as the current total.

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

## Deployed 28 October 2026

The hardening and assignment-retakes branches are merged and live. Production now includes:

- global per-IP rate limiting (120/min per route; login 10/min, register 5/min, refresh 30/min), with health/readiness and payment webhooks exempt;
- in-memory throttler storage and forwarded-IP keying;
- metadata-only responses for locked lessons and `403 LESSON_LOCKED` from locked assignment/exam view and enter endpoints;
- `update`-only authoring reads for the generic exam/assignment routes and teacher/legacy lesson routes;
- no exam question paper before an attempt is active; student lists expose navigation metadata only;
- migration #8 with `attemptNumber`, `startedAt`, nullable `submittedAt`, and `IN_PROGRESS`;
- one row per attempt, unique on `(assignmentId, studentId, attemptNumber)`;
- server-side `maxAttempts`, `409` for concurrent duplicate starts, gap-tolerant attempt numbering, and active-attempt-first ordering;
- teacher queue/history filters that keep in-progress attempts out of grading while preserving student resume;
- retake-aware student runner, assignment list/result review, teacher attempt column, and the prerequisite lock card.

Production retake smoke passed **31/31**; the demo assignment is set to `maxAttempts=2` and the demo student has attempts 1 and 2 submitted. Migration #8 is applied (**8/8**).

## Still open

| Priority | Gap | What “done” means |
| --- | --- | --- |
| P1 | RLS runtime activation | Runtime connects as `app_user`; `MIGRATION_DATABASE_URL` absent from runtime; RLS e2e 5/5 on Railway; isolation re-verified |
| P1 | Outbox dispatcher | Events are delivered, retried, and observable; no longer write-only |
| P1 | Video webhook | Provider callback route verifies the signature and updates video state |
| P2 | Railway auto-deploy | A main push creates and reports an API deployment automatically; no manual `railway up` required |
| P2 | Real provider sandbox | One Paymob/Fawry sandbox charge and one refund recorded end to end |
| P2 | Distributed rate limiting | The live in-memory limits are backed by shared storage and proxy-IP handling is verified under production traffic |
| P2 | Review evidence | Per-word/answer evidence persisted instead of an aggregate bridge |
| P2 | Content versioning | Published course/lesson/exam revisions stored as immutable versions so old attempts keep their source content |
| P2 | Server-side exam auto-submit | A scheduled worker expires and submits abandoned attempts without relying on the open tab |
| P2 | 2FA / secret manager / observability | Controls implemented and tested |
| P3 | Advanced progression | `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, manual unlocks |
| P3 | Reconciliation worker | Live reconciliation run over provider settlements |
| P3 | SETH-9 roadmap | Phased review of PQC, ZK delivery, homomorphic grading, active deception, and crypto-shredding; see [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md) |

## What is not a current claim

- RLS is not enforcing production traffic while the runtime uses the owner URL.
- The transactional outbox is not delivering events.
- There is no video webhook endpoint.
- Railway did not auto-deploy the 28 October API push; the API was deployed manually with `railway up`.
- Instapay, Vodafone Cash, and e&money are not live payment methods.
- VdoCipher is a stub.
- SETH-9 post-quantum signing, ZK delivery, homomorphic grading, active deception, and crypto-shredding are not implemented; only the roadmap exists.
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
| 2026-10-26 | Hardening branch: per-IP/auth rate limiting, server-side lock enforcement, authoring-read bypass fixes; 344/344 API tests |
| 2026-10-27 | Retakes branch: attempt model + migration #8, active-attempt ordering, lock/retake UI; 353/353 API and 145/145 web tests, 8/8 local migration chain |
| 2026-10-28 | Hardening + retakes merged; Railway backup restore-tested; migration #8 applied (8/8); API deployed manually; production retake smoke 31/31; lock card verified dark/light |

Historical audit: [`AUDIT-2026-10-16.md`](AUDIT-2026-10-16.md). It is preserved as a dated snapshot, not rewritten.
