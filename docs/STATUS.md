# Status — 25 October 2026

> Canonical detail lives in [`CURRENT-STATE.md`](CURRENT-STATE.md). This page is the short dashboard: what is live, what is proven, and what is still missing.

## Release

| Item | Value |
| --- | --- |
| Production branch / verified app commit | `main` / `4951e49` |
| Web | <https://sanad-edtech.vercel.app> |
| API | <https://sanad-edtech-production.up.railway.app> |
| Health | `/api/health` → **200**, database **up** |
| Login page | **200** |
| Demo tenant | `sanad-demo` |
| Migrations | 7/7 applied on Railway PostgreSQL |
| Database models | 43 |
| RLS policies | 138 across 43 application tables |
| RLS runtime enforcement | **Not active** — runtime still uses owner/superuser credentials |

## Evidence

| Check | Result | Command |
| --- | --- | --- |
| API tests | **311/311**, 31 suites | `pnpm --filter api exec jest --config jest.config.js --runInBand` |
| Web tests | **137/137**, 8 files | `pnpm --filter web test` |
| Monorepo build | **4/4** successful | `pnpm build` |
| Live health | **200** / database up | `Invoke-RestMethod https://sanad-edtech.vercel.app/api/health` |
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

## Still open

| Priority | Gap | What “done” means |
| --- | --- | --- |
| P1 | RLS runtime activation | Runtime connects as `app_user`; `MIGRATION_DATABASE_URL` absent from runtime; RLS e2e 5/5 on Railway; isolation re-verified |
| P1 | Outbox dispatcher | Events are delivered, retried, and observable; no longer write-only |
| P1 | Video webhook | Provider callback route verifies the signature and updates video state |
| P2 | Real provider sandbox | One Paymob/Fawry sandbox charge and one refund recorded end to end |
| P2 | Lock enforcement | Locked lessons no longer return content in student API views |
| P2 | Review evidence | Per-word/answer evidence persisted instead of an aggregate bridge |
| P2 | Content versioning | Published course/lesson/exam revisions stored as immutable versions so old attempts keep their source content |
| P2 | Assignment retakes | A real attempt model (separate from the unique submission row) enforcing `maxAttempts` |
| P2 | Server-side exam auto-submit | A scheduled worker expires and submits abandoned attempts without relying on the open tab |
| P2 | Rate limiting / 2FA / secret manager / observability | Controls implemented and tested |
| P3 | Advanced progression | `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, manual unlocks |
| P3 | Reconciliation worker | Live reconciliation run over provider settlements |

## What is not a current claim

- RLS is not enforcing production traffic while the runtime uses the owner URL.
- The transactional outbox is not delivering events.
- There is no video webhook endpoint.
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

Historical audit: [`AUDIT-2026-10-16.md`](AUDIT-2026-10-16.md). It is preserved as a dated snapshot, not rewritten.
