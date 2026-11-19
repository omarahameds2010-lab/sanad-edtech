# Status — 18 November 2026

> Canonical detail lives in [`CURRENT-STATE.md`](CURRENT-STATE.md). This page is the short dashboard: what is live, what is proven, and what is still missing.

## Release

| Item | Value |
| --- | --- |
| Production branch | `main` |
| Web runtime code | Sprint 2 paid checkout (`aa4d2bc`) + tunnel fallback sync (`1fbc7e8`) + UTF-8 comment cleanup (`7ca1ed3`) + teacher analytics (`665ecc2`) + latest fallback sync (`0fffd90`) — 15–18 November 2026 |
| API runtime | Local compiled NestJS API on `:3002`; runtime `DATABASE_URL` = non-owner `app_user`; RLS active locally; tenant-scoped `exam-expiry` Bull worker and Redis-backed shared rate-limit counters active |
| Demo launcher | `scripts/demo/start.ps1`; Windows Startup entry installed with `-Tunnel cloudflared -Watch -SyncFallback`; healthy API/tunnel are reused |
| Hardening / retakes | **Live** — Redis-backed rate limiting, lock enforcement, authoring-read fixes, and assignment retakes |
| Sprint 2 paid checkout | **Implemented, deployed, and live-verified** — `402` paid-course guard, atomic enrollment, voucher checkout |
| Web | <https://sanad-edtech.vercel.app> |
| API public origin | <https://modes-lender-ind-controlled.trycloudflare.com> — quick tunnel; changes on restart |
| Health | `/api/health` → **200**, database **up** |
| Login page | **200** |
| Demo tenant | `sanad-demo` |
| Migrations | **8/8** applied on the local Docker PostgreSQL |
| Database models | 43 |
| RLS policies | 138 across 43 application tables |
| RLS runtime enforcement | **Active locally** — `app_user` (no SUPERUSER/BYPASSRLS); startup log `DB runtime role: app_user (superuser=off)`; hosted/Railway runtime retired |

## Evidence

| Check | Result | Command |
| --- | --- | --- |
| API tests on Sprint 2 + RLS activation + video webhook + teacher analytics + exam-expiry worker + Redis throttler | **384/384**, 40 suites; re-run 18 Nov 2026 | `pnpm --filter api exec jest --config jest.config.js --runInBand` |
| Web tests | **159/159**, 12 files; re-run 18 Nov 2026 | `pnpm --filter web test` |
| Monorepo build | **4/4** successful; re-run 18 Nov 2026 after the exam-expiry worker | `pnpm build` |
| RLS runtime activation | **passed 16 Nov 2026**: `app_user` (no SUPERUSER/BYPASSRLS); startup log `DB runtime role: app_user (superuser=off)`; health 200 | Local compiled API |
| RLS isolation proof | **5/5 passed 16 Nov 2026**: scoped SELECT; cross-tenant UPDATE/DELETE = 0 rows; cross-tenant INSERT rejected; empty context = 0 rows | `jest --config ./test/jest-e2e.json --runInBand rls-isolation` |
| Voucher checkout under RLS | **passed 16 Nov 2026**: order for `arabic-3-prep`, `SANAD-2026` → `success: true`, one ACTIVE paid enrollment; reset restored the clean state | Local HTTP flow through the API |
| Signed Paymob webhook under RLS | **passed 16 Nov 2026**: HMAC-SHA512 callback → async event PROCESSED with tenant ID; order CONFIRMED, intent SUCCEEDED, payment PAID, 2 ledger rows, enrollment created; reset restored the clean state | Local signed webhook + DB checks |
| Video webhook route | **6/6 unit tests**: raw-body HMAC before parsing, tenant-scoped lookup, transactional video update + outbox, stale/replayed callback handling, malformed body rejection; route is CSRF-exempt like payment webhooks. No real Bunny library/key in the demo. | `video.service.spec.ts` |
| Teacher analytics | **implemented, deployed, and live-verified 17 Nov 2026**: `GET /api/v1/teacher/analytics/overview?days=7\|30\|90` returns tenant-scoped totals, trend, per-course completion, assessment averages, pending grading, and recent activity; starter retention caps 90 at 30; `/teacher/analytics` is a real Arabic page. Analytics service **4/4**. | Live HTTP + browser QA |
| Server-side exam expiry | **implemented and live-proven 18 Nov 2026**: a delayed Bull job is scheduled from `startExamAttempt`; the tenant/RLS-scoped processor CAS-updates a still-`IN_PROGRESS` attempt to `TIMED_OUT` after `expiresAt`. Live temporary 1-minute exam expired at 65s (`timeRemainingSeconds = 0`); job failures are non-fatal. 6 worker tests; submit-race fallback covered. | Redis + DB + HTTP proof |
| Redis-backed rate limiting | **implemented and live-proven 18 Nov 2026**: atomic INCR/PEXPIRE Lua counter at `sanad:throttle:*` shared across API instances; fallback to per-instance memory on Redis failure. Live proof: 12 invalid logins from one synthetic forwarded IP → **401×10 → 429×2** with `Retry-After`, ~59s PTTL, key deleted. 8 storage/config tests. | Redis + HTTP proof |
| Destructive demo reset | **passed twice 16 Nov 2026**, exit 0: backup → migrate → truncate → seed free + paid demo → verify; preserves `tenants`, `tenant_domains`, `_prisma_migrations` and the tenant ID | `pnpm demo:reset -Force` |
| Paid checkout HTTP smoke | **passed**: paid direct enroll 402, invalid voucher 400, valid voucher 201, enrollment `source=voucher`, replay one redemption | Local HTTP smoke, 14 Nov 2026 |
| Paid checkout browser QA | **passed live**: paid CTA → checkout → `SANAD-2026` → order/intent **201** → “تم تفعيل الكورس”; cleanup restored the demo state | Live browser, 14 Nov 2026 |
| Live judge path | **passed 15 Nov 2026**: `/demo`, one-click student/teacher, demo banner, checkout **200**, direct paid enroll **402**; **re-verified 17 Nov** with the live analytics workspace (real data, 7/30 range, disabled 90, no overflow) | Browser + HTTP through the web domain |
| Live authenticated smoke | **8/8 passed** 15 Nov, **8/8** again 16 Nov after RLS + reset, **8/8** through the live domain 17 Nov, **8/8** on 18 Nov after the exam-expiry deploy, and **8/8** again after the Redis throttler change: health, public catalog, teacher login/tenant/courses, student login/assignments/enrollments | `pnpm demo:smoke -- -BaseUrl https://sanad-edtech.vercel.app` |
| Demo doctor preflight | **10/10 passed 16 Nov 2026** after the RLS commit, **10/10 again 17 Nov** after the analytics deploy, and **10/10 on 18 Nov** after the exam-expiry push: Docker/containers, local API, tunnel, live health/database, `/demo` + checkout, watchdog, Startup entry, git sync, fallback match, demo DB state (including 1 voucher) | `pnpm demo:doctor` |
| Autostart + fallback sync | **passed 15–16 Nov 2026**: hidden watchdog restarted the tunnel twice, wrote the new fallback (`14a82df` after the full logon simulation; `1fbc7e8` after the overnight restart), pushed, and live health returned **200** each time | Installed Startup entry + sync log |
| Cold Docker recovery | **passed 15 Nov 2026**: stopped Docker Desktop → health **503** → watchdog restarted Docker/PostgreSQL/API → health **200** in about 40 seconds | Hidden watchdog, no manual step |
| Full logon simulation | **passed 15 Nov 2026**: stopped watchdog/tunnel/API/Docker → launched Startup `SANAD-Demo.cmd` → services restarted, fallback `14a82df` pushed, health **200** in about 70 seconds | Startup entry, no manual step; real Windows logoff not performed |
| Local migration chain | **8/8**; schema up to date | `prisma migrate status` against Docker |
| Backup/restore proof | Custom dump + globals restored into local PostgreSQL 18: 44 tables, 3 courses, 1 submission, 7 migrations at backup time | Docker `pg_dump` / `pg_restore` |
| Local demo backup restore | **passed 16 Nov 2026**: restored `backups/sanad-demo-20261115-134916.dump` into a temporary DB: 44 tables, 138 RLS policies, 43 RLS-enabled tables, 8 migrations, 2 users, 3 published courses, 1 enrollment, 0 orders/payments/redemptions, 1 voucher; temporary DB dropped. New 16 Nov backups: `sanad-demo-20261116-010851.dump`, `sanad-demo-20261116-012118.dump`. | Docker `pg_restore` |
| Power/sleep | **configured 16 Nov 2026**: AC sleep and hibernate **Never**; battery sleep 10 minutes; keep the demo laptop plugged in and its lid open | `powercfg` |
| Vercel proxy target | After the tunnel URL changed, live recovery followed the fallback commit; no stale `API_PROXY_TARGET` override was observed. Vercel env could not be inspected (CLI/token absent). | Full-logon simulation |
| Production retake smoke (historical) | **31/31**: concurrent start 201+409, attempt 1 submit, attempt 2 submit, third 400, teacher queue excludes active, health 200 | Node script through the production web domain |
| Live health | **200** / database up | `Invoke-RestMethod https://sanad-edtech.vercel.app/api/health` |
| Historical branch evidence | API 344/344 and 353/353; web 145/145; local retake/concurrency/lock QA | Pre-merge local runs, 26–27 Oct 2026 |

Older counts (86, 179, 229, 276, 307, 311, 344, 353, 393) belong to historical snapshots. Do not use them as the current total.

## Shipped

- Tenant resolution, tenant-scoped users, auth cookies, refresh rotation, session restore.
- Teacher course/section/lesson/resource/assignment/exam authoring and publish workflow.
- Student curriculum board with real section/lesson/task data and direct task links.
- Student lesson workspace for video, exam, and assignment, including locked-video prerequisite state.
- Server-authoritative 300-minute assignment timer and 70-minute exam timer.
- Server-side exam expiry through a tenant-scoped delayed Bull worker, with the client timer as the normal path.
- Redis-backed shared rate limiting, with per-instance fallback during a Redis outage.
- Per-student entry-based progression (`ENTER_ASSIGNMENT`, `ENTER_EXAM`) with idempotent grants.
- Teacher grading queue.
- Student Command Center with server-derived numbers.
- Dark default + optional Academic Light Mode; pre-paint theme restore.
- Paymob/Fawry/voucher payments, signed webhooks, ledger, entitlements, idempotency, refunds.
- Server-side paid-course guard (`402 PAYMENT_REQUIRED`) and atomic enrollment on payment/voucher settlement.
- Voucher checkout page with Arabic error states and a stable payment-intent retry key.
- Bunny Stream provider code and video-protection primitives; unlisted YouTube demo path.
- Real teacher analytics workspace with tenant-scoped KPIs, enrollment trend, per-course lesson completion, assessment averages, pending grading, recent activity, and plan-aware history retention.

## Deployed 28 October 2026 (historical)

The hardening and assignment-retakes branches were merged and live on the then-production Railway API. That deployment included:

- global per-IP rate limiting (120/min per route; login 10/min, register 5/min, refresh 30/min), with health/readiness and payment webhooks exempt;
- (historical) in-memory throttler storage, replaced by Redis-backed shared storage on 18 November 2026; forwarded-IP keying remains best effort;
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
| P1 | Hosted RLS activation | Local demo runs as `app_user` with RLS active. If the API is redeployed, point its `DATABASE_URL` at `app_user`, omit `MIGRATION_DATABASE_URL` from the runtime, and re-run RLS e2e 5/5. Railway is retired. |
| P1 | Stable demo tunnel | ngrok static domain or pinned `API_PROXY_TARGET`; URL survives a reboot without a fallback commit/redeploy (autostart is installed and the quick-tunnel sync is tested) |
| P1 | Outbox dispatcher | Events are delivered, retried, and observable; no longer write-only |
| P1 | Real Bunny webhook round trip | The route exists and is unit-tested (HMAC, tenant scope, transactional update). Closure requires a configured Bunny library/key and one signed provider callback that flips a video to READY. |
| P2 | Hosted API (optional) | If the Railway endpoint is revived, a `main` push creates and reports an API deployment automatically; no manual `railway up` required |
| P2 | Real provider sandbox | One Paymob/Fawry sandbox charge and one refund recorded end to end |
| P2 | Proxy-IP tuning | Forwarded client IPs are validated/limited at the edge so a direct caller cannot spoof the rate-limit key |
| P2 | Review evidence | Per-word/answer evidence persisted instead of an aggregate bridge |
| P2 | Content versioning | Published course/lesson/exam revisions stored as immutable versions so old attempts keep their source content |
| P2 | 2FA / secret manager / observability | Controls implemented and tested |
| P3 | Advanced progression | `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, manual unlocks |
| P3 | Reconciliation worker | Live reconciliation run over provider settlements |
| P3 | SETH-9 roadmap | Phased review of PQC, ZK delivery, homomorphic grading, active deception, and crypto-shredding; see [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md) |

## What is not a current claim

- RLS is active on the local demo runtime (`app_user`); the retired Railway runtime is not migrated, so do not claim hosted RLS enforcement.
- The transactional outbox is not delivering events.
- Only one Bull processor exists (`exam-expiry`); there is no outbox relay or live reconciliation worker.
- The video webhook route exists and is unit-tested; a real Bunny callback is not yet recorded.
- Rate-limit counters are shared through Redis, but forwarded-header client IPs remain best-effort and are not an authorization boundary; during a Redis outage the fallback is per API instance.
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
| 2026-11-14 | Sprint 2 paid checkout deployed (`aa4d2bc`); live voucher flow, order/intent 201, `402` guard, and demo-state cleanup verified |
| 2026-11-15 | Autostart installed with `-SyncFallback`; full cold start (watchdog/tunnel/API/Docker stopped, Startup cmd launched) synced the fallback (`14a82df`) and live health returned 200 in about 70 seconds; one-click paths and `402` re-verified; authenticated live smoke 8/8 |
| 2026-11-16 | Overnight tunnel restart auto-synced the fallback (`1fbc7e8`, `manufactured-with-alberta-cable`) and live health returned 200; restore-tested the local demo backup into a temporary DB (44 tables, 138 RLS policies, 8 migrations, demo data intact); set AC sleep/hibernate to Never; added `pnpm demo:doctor` preflight (10/10) and re-ran the authenticated smoke (8/8) |
| 2026-11-16 | RLS runtime activated locally as `app_user` (no SUPERUSER/BYPASSRLS); destructive `pnpm demo:reset` with automatic backup; RLS e2e 5/5; voucher and signed Paymob webhook round trips under RLS; video webhook route added with 6 unit tests (raw-body HMAC, tenant scope, transactional update + outbox, stale/replay handling); 365/365 API, 158/158 web, build 4/4; watchdog resumed and reused the healthy tunnel/API; doctor 10/10 after commit |
| 2026-11-16 | Afternoon: cloudflared process died; the watchdog started `longest-order-ham-membrane`, synced the fallback (`3dab53e`) after the RLS commit was pushed, and Vercel redeployed; live health returned 200. Fixed the watchdog reuse path to read `tunnel.pid` back and to keep retrying fallback sync after a dirty tree or unpushed commits. |
| 2026-11-17 | Real teacher analytics workspace: tenant-scoped `GET /api/v1/teacher/analytics/overview`, plan-aware 30/90-day retention, Arabic `/teacher/analytics` page replacing the redirect, nav item restored; demo tenant seeded as `starter`; API 369/369, web 159/159, build 4/4; deployed via `665ecc2`, live browser QA passed, live smoke 8/8, doctor 10/10 |
| 2026-11-18 | Server-side exam expiry (`bacce7e`): delayed Bull job at `expiresAt + 5s`, tenant/RLS-scoped processor, `TIMED_OUT` CAS update, submit-race fallback; live 1-minute proof expired at 65s. Redis-backed shared rate limiting (`85ffc62`): atomic INCR/PEXPIRE, fallback store; live 401×10 → 429×2. API 384/384 (40 suites), web 159/159, build 4/4; quick tunnel changed and fallback synced via `0fffd90`, live health 200, smoke 8/8, doctor 10/10 |

Historical audit: [`AUDIT-2026-10-16.md`](AUDIT-2026-10-16.md). It is preserved as a dated snapshot, not rewritten.
