# Current State — 18 November 2026

> **This is the canonical snapshot for the repository.** If another document disagrees with this file, this file wins. The Sprint 2 paid-checkout release was deployed on 14 November 2026; the live deployment was rechecked on 15–18 November 2026 after the Cloudflare quick tunnel changed several times. On 16 November 2026 the local API runtime was switched to the non-owner `app_user` role, so PostgreSQL RLS now enforces isolation locally (verified by the RLS isolation suite, the voucher checkout, and a signed Paymob webhook round trip). On 17 November 2026 a real tenant-scoped teacher analytics workspace replaced the old `/teacher/analytics` redirect. On 18 November 2026 a delayed Bull worker was added to expire abandoned exam attempts server-side. The destructive reset was exercised twice and restored the clean demo state. The 16 November preflight passed **10/10** and the authenticated smoke passed **8/8** after the RLS activation was committed.
>
> Historical reports keep their original date and evidence. They are not silently rewritten; they carry a banner pointing here.

## Release

| Item | Value |
| --- | --- |
| Production branch | `main` (GitHub's default branch is `master`; Vercel follows `main`) |
| Web runtime code | Sprint 2 paid checkout (`aa4d2bc`) + tunnel fallback sync (`1fbc7e8`, config only) + UTF-8 comment cleanup (`7ca1ed3`, config only) + teacher analytics workspace (`665ecc2`) + latest fallback sync (`0fffd90`, config only) — 14–18 November 2026 |
| API code | Sprint 2 paid checkout (`aa4d2bc`) + local RLS runtime activation and destructive-reset tooling + video webhook + teacher analytics endpoint (`665ecc2`) + server-side exam-expiry worker (`bacce7e`) — 16–18 November 2026; no schema or migration change |
| API runtime | Local compiled NestJS API on `:3002`; runtime `DATABASE_URL` is the non-owner `app_user`; start with `pnpm demo:start` |
| RLS runtime | **Active locally**: `app_user` (no SUPERUSER, no BYPASSRLS); startup log `DB runtime role: app_user (superuser=off)`; tenant context injected per request |
| Demo reset | `pnpm demo:reset` = destructive reset (backup → migrate → truncate → seed free + paid demo → verify); `pnpm demo:seed` = idempotent backfill; `pnpm demo:paid` = paid data only |
| Demo launcher | `scripts/demo/start.ps1`; Windows Startup entry installed with `-Tunnel cloudflared -Watch -SyncFallback`; a healthy API/tunnel is reused instead of rotated |
| API public origin | <https://modes-lender-ind-controlled.trycloudflare.com> — Cloudflare quick tunnel; the URL changes on restart until a stable ngrok domain is configured |
| Web | <https://sanad-edtech.vercel.app> |
| API through the web domain | <https://sanad-edtech.vercel.app/api/health> (Vercel rewrite to the current tunnel) |
| Health check | `/api/health` → **200** `{"status":"ok","database":"up"}` (18 November 2026) |
| Login page | `/login` → **200** |
| Database | Local Docker PostgreSQL `learning_platform`; **8/8** Prisma migrations, 3 published courses (one paid: `arabic-3-prep`, 199 EGP), 1 enrollment, 0 orders/payments/voucher redemptions at final verification |
| Demo tenant | `sanad-demo`, plan `starter` (enables the analytics feature; 30-day analytics retention) |

The quick tunnel changed several times. During the 15 November 2026 full logon simulation the launcher obtained `https://both-suites-worldwide-weekends.trycloudflare.com` and synced `14a82df`; overnight on 16 November it restarted again, obtained `https://manufactured-with-alberta-cable.trycloudflare.com`, and the watchdog synced `1fbc7e8` automatically. In the afternoon of 16 November the cloudflared process died; the watchdog started a new tunnel (`https://longest-order-ham-membrane.trycloudflare.com`) and synced `3dab53e` automatically after the uncommitted RLS work was pushed. Vercel redeployed after each change and `/api/health` returned **200**. A Windows Startup entry now runs the launcher hidden at logon with `-Watch -SyncFallback`, and the watchdog retries `git fetch`/`git push` if the network is not ready. A later launcher restart reused the healthy API and tunnel, kept the newest URL, and did not cause an extra Vercel redeploy. On 18 November 2026 the quick tunnel changed again to `https://modes-lender-ind-controlled.trycloudflare.com`; the launcher synced the fallback in `0fffd90` and Vercel redeployed, with live health back at **200**. This is still a temporary bridge: it causes a Vercel redeploy after a URL change, so a stable ngrok static domain remains the target.

The Railway API endpoint (`https://sanad-edtech-production.up.railway.app`) currently returns **404 `Application not found`**; treat it as retired. The current demo web app is proxied to the laptop tunnel. At the 18 November 2026 check the local Docker database had 0 assignment submissions and 1 submitted exam attempt, not the Railway demo state (3 assignment submissions). Railway's GitHub-linked service also did **not** auto-deploy the 28 October push; do not assume a push to `main` redeploys that API until the integration is fixed.

The production demo seed contains **3 published Arabic prep courses**, one exam and one assignment. The student curriculum screen shows the real task counts from the API; do not hardcode the demo's current numbers into marketing copy.

Sprint 2 makes `arabic-3-prep` a paid course (**199.00 EGP**) and adds the demo voucher **`SANAD-2026`**, scoped to that course. `arabic-1-prep` remains free and enrolled for the 90-second judge path. The paid data can be reapplied with `pnpm demo:paid`; the demo student is left unenrolled from the paid course so checkout can be demonstrated live.

### Demo accounts

These are seeded demo accounts, not production customer accounts.

| Role | Phone | Password |
| --- | --- | --- |
| Teacher | `01000000001` | `Joker-Arabic#2026` |
| Student | `01000000002` | `Student123!` |

The demo assignment was set to `maxAttempts = 2` for the production retake smoke. The Railway production demo had two submitted attempts (1 and 2); the current local demo database has **0 assignment submissions** and one submitted exam attempt. This is demo data, not a guarantee of the generic seed.

## Verification evidence

| Check | Result |
| --- | --- |
| API unit suite on Sprint 2 + RLS activation + video webhook + teacher analytics + exam-expiry worker | **376 / 376 passed**, 38 suites, re-run 18 November 2026 (`pnpm --filter api exec jest --config jest.config.js --runInBand`) |
| Server-side exam expiry | **implemented and live-proven 18 November 2026**: `startExamAttempt` schedules a delayed Bull job (`exam-expiry`) about 5 seconds after `expiresAt`; the processor runs in the job tenant’s ALS/RLS scope and CAS-updates only a still-`IN_PROGRESS` attempt to `TIMED_OUT` (`submittedAt` set, `timeRemainingSeconds = 0`). A temporary 1-minute exam returned `expiresAt = startedAt + 60s`, the delayed job was visible in Redis, and the attempt became `TIMED_OUT` at 65 seconds. Queue failures do not fail exam start; the client timer remains the normal path. `submitExamAttempt` returns a timed-out result rather than a 404 when the worker wins the close race. **6** worker tests + scheduling/race assertions in the exams service suite. Temporary lesson/exam/entitlement/idempotency rows were removed; demo counts were unchanged. |
| Video webhook | **6/6 unit tests** on `handleProviderWebhook`: raw-body signature verification before parsing, tenant-scoped video lookup, READY/PROCESSING update in one transaction with the outbox event, stale/replayed callbacks, unknown videos, and malformed bodies. The HTTP route exists at `POST /api/video/webhooks/:provider` and is CSRF-exempt like the payment webhooks; no real Bunny library/key is configured, so a live provider callback is still pending. |
| Teacher analytics | **implemented, deployed, and live-verified 17 November 2026**: `GET /api/v1/teacher/analytics/overview?days=7\|30\|90` under `AnalyticsModule` (`@CanReadAnalytics()`) returns tenant-scoped totals, enrollment trend, per-course completion, assignment/exam averages, pending grading, and recent activity. The plan-aware window caps `starter` at 30 days, so requests for 90 return 30 and the UI disables the 90-day button. **4/4** service tests; the Arabic page at `/teacher/analytics` replaced the old redirect. Local and live browser QA at 1000px: nav active, real tenant data, 7/30 switch works, 90 disabled, no horizontal overflow. Live smoke **8/8** and demo doctor **10/10** after the deploy. No schema or migration change. |
| Web unit suite | **159 / 159 passed**, 12 files, re-run 18 November 2026 (`pnpm --filter web test`) |
| Monorepo build | **4/4 tasks successful** (`pnpm build`); re-run 17 November 2026 after the analytics workspace |
| RLS runtime activation | **passed 16 November 2026**: the compiled API started with `DATABASE_URL` = `app_user` and logged `DB runtime role: app_user (superuser=off)`; `app_user` has no SUPERUSER and no BYPASSRLS; health **200** |
| RLS isolation proof | **5/5 passed 16 November 2026** against PostgreSQL with `RLS_ADMIN_URL` + `RLS_APP_URL`: own-tenant SELECT, cross-tenant UPDATE/DELETE = 0 rows, cross-tenant INSERT rejected, empty context returns 0 rows |
| Voucher checkout under RLS | **passed 16 November 2026**: logged in as the demo student, created an order for `arabic-3-prep` (19900 minor units), redeemed `SANAD-2026`, got `success: true`, and `GET /api/v1/enrollments/me` returned one ACTIVE paid enrollment. Reset afterward restored the clean demo state. |
| Signed Paymob webhook under RLS | **passed 16 November 2026**: a manually seeded PROCESSING intent plus an HMAC-SHA512-signed callback returned `{"received":true}`; async processing (inside `setImmediate`) completed in the tenant scope: order **CONFIRMED**, intent **SUCCEEDED**, payment **PAID**, paid enrollment created, 2 balanced ledger rows, webhook event **PROCESSED** with the demo tenant ID. Reset afterward restored the clean demo state. |
| Destructive demo reset | **passed twice on 16 November 2026** (`pnpm demo:reset -Force`, exit **0**): backup → `prisma migrate deploy` → delete known RLS test tenants → truncate demo tables → seed free + paid demo → verify invariants. It preserves `tenants`, `tenant_domains`, and `_prisma_migrations`, so the tenant ID and API cache stay valid. Final state: 8 migrations, 1 tenant, 2 users, 3 published courses, 1 free enrollment, paid course unenrolled, 0 orders/payments/redemptions, 1 voucher, 1 video. |
| Paid checkout HTTP smoke | **passed**: paid direct enroll **402 `PAYMENT_REQUIRED`**; invalid voucher **400 `VOUCHER_NOT_FOUND`**; valid voucher **201**, `success: true`, enrollment `source=voucher`, replay stays one redemption; temporary user and rows removed |
| Paid checkout browser QA | **passed locally and live**: paid CTA → `/checkout/arabic-3-prep`; live voucher `SANAD-2026` created the order and intent (**201**) and showed “تم تفعيل الكورس”; the temporary purchase was removed so the demo remains unenrolled for checkout |
| Live judge path | **passed 15 November 2026** after the fallback sync: `/demo` **200**; one-click student and teacher access reached `/student` and `/teacher`; demo banner present; `/checkout/arabic-3-prep` **200**; direct paid enrollment **402 `PAYMENT_REQUIRED`**; `/api/health` **200**. Re-verified 17 November 2026: the live `/teacher/analytics` page rendered real tenant data, the 7/30 controls changed the window, the 90-day control was disabled by the Starter cap, and the page had no horizontal overflow at 1000px; live smoke **8/8** through the web domain. |
| Live authenticated smoke | **8/8 passed** on 15 November, re-run **8/8** on 16 November 2026 through `https://sanad-edtech.vercel.app` after the RLS activation and reset, **8/8** on 17 November after analytics, and **8/8** on 18 November after the exam-expiry deploy: health/database, public course catalog, teacher login, tenant resolution, teacher course list, student login, student assignments, student enrollments (`pnpm demo:smoke` with `DEMO_*` variables; credentials not printed) |
| Demo doctor preflight | **10/10 passed 16 November 2026** (`pnpm demo:doctor`): Docker + demo containers, local API health, tunnel health, live health/database, `/demo` + checkout pages, watchdog, Startup entry, clean/synced `main`, fallback matches the live tunnel, and demo DB state (3 published courses, 1 enrollment, paid course unenrolled, 1 voucher, 0 orders/payments/redemptions). Before the RLS commit the only failure was the intentionally dirty working tree; it passed after the commit. **10/10 again on 17 November 2026** after the analytics deploy, and **10/10 on 18 November 2026** after the exam-expiry worker and docs were pushed. |
| Autostart + fallback sync | **passed 15–16 November 2026**: the installed hidden watchdog restarted the quick tunnel twice (full logon simulation → `14a82df`; overnight restart → `1fbc7e8`), wrote the new fallback, pushed, and Vercel redeployed each time; the sync log recorded both changes and live health returned **200**. `4ec4546` adds a retry when the logon network is not ready. |
| Cold Docker recovery | **passed 15 November 2026**: stopping Docker Desktop made `/api/health` return **503**; the hidden watchdog started Docker, PostgreSQL, and the API again, and live health returned **200** within about 40 seconds. The demo tenant, 3 courses, 1 enrollment, and 0 orders/payments were intact. |
| Full logon simulation | **passed 15 November 2026**: stopped the watchdog, tunnel, API, and Docker Desktop; launched the installed Startup `SANAD-Demo.cmd`; the hidden watchdog started Docker/PostgreSQL/API/tunnel, wrote the new fallback, committed `14a82df`, pushed, and live health returned **200** in about 70 seconds. An actual Windows logoff/reboot was not performed. |
| Local database | **8/8** migrations, 43 models, 138 RLS policies on 43 tables, 1 tenant, 2 users, 3 published courses, 1 free enrollment, paid course unenrolled, 0 assignment submissions, 1 submitted exam attempt, 0 orders/payments/redemptions, 1 voucher, 1 video (`learning-platform-db`) |
| Local backup | **created 16 November 2026**: `backups/sanad-demo-20261116-012118.dump` (266,109 bytes), written automatically before the post-RLS destructive reset; the earlier `backups/sanad-demo-20261116-010851.dump` (273,544 bytes) and `backups/sanad-demo-20261115-134916.dump` (0.26 MB) are also present. All are gitignored. The 15 November dump was **restore-tested 16 November 2026** into a temporary database: 44 tables, 138 RLS policies, 43 RLS-enabled tables, 8 migrations, 2 users, 3 published courses, 1 enrollment, 0 orders/payments/redemptions, 1 voucher. The temporary database was dropped. |
| Power/sleep | **configured 16 November 2026**: AC sleep = **Never**, hibernate = **Never**, battery sleep = 10 minutes. Keep the demo laptop plugged in and its lid open; a closed lid may still follow the OEM sleep policy. |
| Vercel proxy target | The 15 November full logon simulation changed the tunnel URL and the live site recovered after the fallback commit, so the Production rewrite is following `FALLBACK_DEMO_TUNNEL_ORIGIN`; no stale `API_PROXY_TARGET` override was observed. Vercel environment variables could not be inspected because the Vercel CLI/token is absent. |
| Production migration chain | **8/8**; `prisma migrate status` reports “Database schema is up to date!” |
| Migration #8 schema checks | `attemptNumber` NOT NULL default 1; `startedAt` NOT NULL default CURRENT_TIMESTAMP; `submittedAt` nullable; unique key `(assignmentId, studentId, attemptNumber)`; `SubmissionStatus` includes `IN_PROGRESS` |
| Migration backfill | Existing production row preserved as attempt #1 with `startedAt = submittedAt`; no null content |
| Backup before migration | Custom-format dump + globals, restore-tested into a local PostgreSQL 18 container: **44 tables, 3 courses, 1 submission, 7 migrations** at backup time |
| Production retake smoke | **31/31 checks passed**: metadata-only list, `maxAttempts=2`, concurrent start **201 + 409**, attempt 1 submit, attempt 2 start/submit, third attempt **400**, teacher queue excludes `IN_PROGRESS` and includes both submitted attempts, health **200** |
| Production lock-card QA | Assignment lesson temporarily set to `LOCKED` with `ENTER_ASSIGNMENT`; the student page rendered «الواجب مقفل» and «لفتح هذا الواجب، سلّم الواجب السابق أولًا.» in dark and light themes with no horizontal overflow; the lesson was restored to `UNLOCKED`/`NONE` |
| Live health | Web `/api/health` returns **200**, database **up**, through the current laptop tunnel (`modes-lender-ind-controlled.trycloudflare.com`) on 18 November 2026; the direct Railway endpoint remains a separate historical deployment |
| Fresh local chain (historical) | Local PostgreSQL 15: **8/8** migrations and `prisma migrate diff` no drift |
| Pre-merge branch evidence (historical) | API **344/344** on `feat/security-quick-wins`; API **353/353**, web **145/145** on `feat/assignment-retakes`; local retake, concurrent-start, and lock-card QA |

Production final database state after the 28 October smoke: **3 submissions** (2 at attempt 1, 1 at attempt 2), **0** in progress, **0** null `startedAt`/`submittedAt`; demo assignment `maxAttempts=2`. That is the Railway state and is not the current local demo state. Older documents that mention 86, 179, 229, 276, 307, 311, 344, 353, or 393 tests are historical snapshots, not the current count.

## Sprint 1 demo hardening — 2026-11-13

Sprint 1 makes the judge path survive a laptop reboot after Windows logon without changing the Vercel frontend or the API code.

- Added `scripts/demo/start.ps1` (Docker, compiled API, tunnel, optional watchdog), `stop.ps1`, `smoke.ps1`, `backup.ps1`, and `install-autostart.ps1`, exposed as `pnpm demo:start`, `demo:start:watch`, `demo:stop`, `demo:smoke`, `demo:backup`, and `demo:autostart`.
- `start.ps1` now probes API health with `Invoke-WebRequest` instead of `curl.exe`. The old probe could abort the retry loop because native stderr became a terminating error under `$ErrorActionPreference = "Stop"`, which made startup look failed even though the API was still binding. Verified on 15 November: the launcher reused the healthy API on `:3002` and started the new tunnel.
- A Windows Startup entry is installed and runs the launcher hidden with `-Tunnel cloudflared -Watch -SyncFallback`. On a URL change, the launcher updates the fallback, commits only that file on clean `main`, and pushes so Vercel redeploys. The watchdog retries `git fetch`/`git push` when the logon network is not ready. This is a temporary bridge, not a stable URL.
- Added the runbook in [`DEMO-STABILITY.md`](DEMO-STABILITY.md): stable ngrok domain setup, Cloudflare quick-tunnel fallback, watchdog, smoke, backup, autostart, and troubleshooting.
- `apps/web/next.config.mjs` resolves the API proxy from `API_PROXY_TARGET` or `DEMO_TUNNEL_ORIGIN`, strips invisible Unicode marks (LRM/RLM/ZWSP/BOM), validates the origin, and logs the target during the Vercel build. The quick-tunnel fallback is currently kept in sync by `-SyncFallback`; a stable domain remains the target.
- Removed the four fabricated teacher screens: `/teacher/analytics` then redirected to `/teacher` (superseded 17 November 2026 by the real analytics workspace); course `builder`, `preview`, and `publish` redirect to the real course workspace. Analytics was later restored to the teacher nav. Dead creation commands were replaced with real publish/payments commands.
- Added branded Arabic `not-found.tsx`, `error.tsx`, and `loading.tsx` with dark/light styles in `apps/web/app/system-pages.css`.
- Verified locally: start/stop on an isolated `:3099` API, public smoke **2/2**, backup dump **0.25 MB**, autostart install/remove, browser QA of student and teacher one-click access, redirects, and the 404 in dark/light themes. The live deployment then verified `/demo`, both one-click logins, the teacher dashboard, the analytics redirect, and the branded 404.
- Remaining: install ngrok, claim a free static domain, set its authtoken locally, start with `pnpm demo:start -- -Tunnel ngrok -NgrokDomain <domain> -Watch`, set Vercel Production `API_PROXY_TARGET=https://<domain>`, redeploy once, and verify before removing the quick-tunnel sync. The current autostart keeps the demo alive across a reboot once Windows logs in, but it still redeploys Vercel when the quick-tunnel URL changes.

## Sprint 2 paid checkout — 2026-11-14

Sprint 2 closes the free-enrollment hole for paid courses and adds the student-facing checkout path. There is no schema or migration change.

- **API guard:** `EnrollmentsService.enroll` now checks the course price. A paid course without an ACTIVE course entitlement returns **`402 PAYMENT_REQUIRED`** with code `PAYMENT_REQUIRED`; a paid buyer reuses the entitlement source (`purchase` or `voucher`) and does not mint a second `admin_grant`. Free courses keep the existing `admin_grant` behavior.
- **Enrollment on settlement:** payment settlement and voucher redemption call the shared `ensureCourseEnrollment` helper inside their existing transactions. Paid students therefore get an enrollment row (`source: "purchase"` or `source: "voucher"`) in the same transaction as the entitlement and ledger. The helper is an idempotent upsert on `(userId, courseId)`, so webhook retries and voucher crash-resumes do not duplicate rows.
- **Structured voucher errors:** rejected vouchers now return a `{ code, message }` `BadRequestException`, allowing the web client to show a specific Arabic message instead of a raw English string.
- **Web checkout:** paid courses route to `/checkout/[slug]`; free courses keep the existing direct-enroll button. The checkout page validates the voucher server-side, creates the order, then creates a `VOUCHER` payment intent with a stable retry key. It handles success, already-enrolled, free, unauthenticated, loading, and error states.
- **Demo data:** `arabic-3-prep` is **199.00 EGP**; the course-scoped voucher is **`SANAD-2026`**. Apply it with `pnpm demo:paid`. `arabic-1-prep` remains free and enrolled for the 90-second path.
- **Local proof:** API **359/359** at Sprint 2 time (now **376/376** after the RLS, video-webhook, analytics, and exam-expiry work), web **158/158** at Sprint 2 time (now **159/159**), API/web `tsc --noEmit` clean, root build **4/4**, HTTP paid-checkout smoke passed, and browser QA reached “تم تفعيل الكورس” then showed the paid course in the student's course list. The test purchase was removed afterward; the demo database is back to 1 enrollment, 0 orders, 0 payments, and an unused voucher.
- **Live proof:** on 14 November 2026, `/checkout/arabic-3-prep` was **200**; the live voucher flow accepted **`SANAD-2026`**, created the order and intent (**201**), and showed “تم تفعيل الكورس”. The test purchase was then removed, restoring 1 free enrollment, 0 orders/payments, and an unused voucher. After the 15 November fallback sync (`14a82df`), `/demo`, one-click student/teacher access, the analytics redirect, the checkout page, and the direct-enroll **402** guard were re-verified through `https://sanad-edtech.vercel.app`.
- **Still open:** the checkout page is voucher-only for the demo. A real Paymob/Fawry card sandbox charge and refund remain on the P2 list. The demo autostart is installed with a temporary quick-tunnel sync; a stable ngrok domain and a pinned `API_PROXY_TARGET` remain the next stability step.

## RLS runtime activation and destructive reset — 2026-11-16

The local demo no longer runs on the database owner. The API runtime now connects as `app_user`, and the destructive reset makes the demo state reproducible.

- **Runtime URL split:** `apps/api/src/modules/tenants/prisma.service.ts` reads `DATABASE_URL` only; it does not silently fall back to `MIGRATION_DATABASE_URL`. `scripts/demo/start.ps1` passes `app_user` to the API and keeps the owner URL for `prisma migrate deploy` and seeds. Startup logs the connected role and warns if it is a superuser. `.env.local` was updated to the `app_user` runtime URL; the owner URL remains in `MIGRATION_DATABASE_URL` for migrations and seeding.
- **Startup evidence:** the compiled API logged `DB runtime role: app_user (superuser=off)`; `/api/health` returned **200**; `app_user` has no SUPERUSER and no BYPASSRLS. The isolation suite passed **5/5** (own-tenant SELECT; cross-tenant UPDATE/DELETE = 0 rows; cross-tenant INSERT rejected; empty context = 0 rows).
- **Webhook tenant context:** `WebhookInboxService` now stores the request tenant ID on the webhook event, wraps the asynchronous `setImmediate()` processing in `runWithTenantId()`, and re-enters the event tenant scope on retry. Without this, async webhook work would run with no tenant context under RLS and see zero rows.
- **Webhook proof:** a manually seeded `PROCESSING` Paymob intent plus an HMAC-SHA512-signed callback returned `{"received":true}`. Async processing completed under `app_user`: order **CONFIRMED**, intent **SUCCEEDED**, payment **PAID**, paid enrollment created, **2** balanced ledger rows, webhook event **PROCESSED** with the demo tenant ID. The database was reset afterward.
- **Voucher proof:** the demo student created an order for `arabic-3-prep` and redeemed `SANAD-2026`; the intent returned `success: true`, and `/api/v1/enrollments/me` returned one ACTIVE paid enrollment. Reset afterward restored the paid course to unenrolled.
- **Destructive reset:** `pnpm demo:reset` writes a backup, runs `prisma migrate deploy`, deletes known RLS test tenants, truncates the demo tables, re-seeds the free and paid demo, and verifies the invariants. It preserves `tenants`, `tenant_domains`, and `_prisma_migrations` so the demo tenant ID (`05587220-79b3-4f8f-9a66-b7bf5338c176`) and the API tenant cache stay valid. It exited **0** twice. `pnpm demo:seed` remains the idempotent backfill; `pnpm demo:paid` applies only the paid course + voucher.
- **Watchdog/tunnel reuse:** starting the hidden watchdog with a healthy API and quick tunnel reuses both (`API already healthy...`, `Cloudflare quick tunnel already healthy...`). The first restart on 16 November kept the then-current URL without a redeploy; later the cloudflared process died, the watchdog started `https://longest-order-ham-membrane.trycloudflare.com`, and the fallback sync committed/pushed `3dab53e`. A stale in-memory tunnel PID made the watchdog think the reused tunnel was dead and retry every cycle; the launcher now reads the PID back from `tunnel.pid`, and the fallback sync stays pending across a dirty tree or unpushed commits so it retries after they are resolved.
- **Remaining:** hosted/Railway runtime is retired and was not migrated to `app_user`; the evidence above is local. A stable ngrok static domain, a real Paymob/Fawry sandbox charge/refund, and removing the temporary fallback sync remain open.

## Teacher analytics workspace — 2026-11-17

The old `/teacher/analytics` redirect is gone. The teacher nav now opens a real Arabic analytics page backed by a new tenant-scoped API module.

- **API:** `GET /api/v1/teacher/analytics/overview?days=7|30|90` is served by `AnalyticsModule` (`apps/api/src/modules/analytics/`) and guarded by `@CanReadAnalytics()`. It queries only the request tenant's published courses, active enrollments, lesson progress, assignment submissions, exam attempts, and published assessment counts. No fabricated or cross-tenant data is used.
- **Response:** totals (active/new students, active enrollments, published courses/assignments/exams, completed lessons, lesson-completion rate, pending grading), a day-by-day enrollment trend, per-course enrollment/completion, assignment and exam averages, exam pass rate, and the eight most recent submissions/attempts.
- **Plan-aware retention:** the window is clamped to the tenant plan's `retentionDays`. The demo tenant is seeded as plan `starter` (analytics enabled, 30-day retention), so `days=7` and `days=30` are honored and `days=90` returns 30; the web UI disables the 90-day option and explains the limit. `maxWindowDays` is part of the response so clients do not guess.
- **Web:** `/teacher/analytics` is a real page with KPI cards, the existing course-enrollment chart, per-course lesson progress, an enrollment-trend sparkline, and recent activity. It has loading, error, unauthenticated, empty-course, and no-activity states; Arabic error mapping covers `FEATURE_DISABLED` and `403`.
- **Verification:** API **369/369** (36 suites; analytics service 4/4), web **159/159**, `tsc --noEmit` clean for API and web, root build **4/4**. Local HTTP checks returned `windowDays=7/30/30` for requests `7/30/90` and the correct tenant totals; browser QA at 1000px showed the nav item active, the 30-day range selected, the 90-day range disabled, and no horizontal overflow. The 17 November Vercel deploy was live-verified: real tenant data, working 7/30 range buttons, disabled 90-day button, no console errors, live smoke **8/8**, and demo doctor **10/10**. No schema or migration changed.
- **Demo seed:** `seed-path2.ts` sets the demo tenant's `planId` to `starter` on both create and update, so `pnpm demo:seed`/`demo:reset` keep analytics enabled without a manual database edit.

## Server-side exam expiry — 2026-11-18

The exam timer no longer depends only on the open browser tab. `bacce7e` adds a delayed Bull queue inside the exams module; there is no schema or migration change.

- **Scheduling:** `ExamsService.startExamAttempt` creates the `IN_PROGRESS` attempt, derives `expiresAt` from the server clock, then calls `ExamExpiryScheduler.scheduleAttemptExpiry()`. The job delay is `max(0, expiresAt - now) + 5s`; the 5-second grace lets the normal client auto-submit win first. Job id is the attempt id, with 3 attempts and exponential backoff.
- **Failure behavior:** the scheduler catches queue/Redis errors and logs them. Exam start still succeeds; the client timer and the API’s late-submit `TIMED_OUT` behavior remain the fallback.
- **Processing:** `ExamExpiryProcessor` re-enters `runWithTenantId(tenantId)` because Bull jobs have no request ALS scope. It loads the attempt by `(id, tenantId, examId)`, re-derives expiry from `startedAt + timerMinutes`, and CAS-updates only `IN_PROGRESS` rows to `TIMED_OUT` with `submittedAt` and `timeRemainingSeconds = 0`. A stale/duplicate job is a no-op; a job that arrives early throws so Bull retries.
- **Submit race:** if the worker closes the attempt just before the client’s submit request, `submitExamAttempt` finds the recent `TIMED_OUT` row (last 60 seconds, same tenant/exam/student) and returns the timed-out result instead of `404`.
- **Configuration:** `REDIS_URL` is preferred; otherwise `REDIS_HOST`, `REDIS_PORT`, and optional `REDIS_PASSWORD` are used. The worker is registered by importing `ExamExpiryModule` from `ExamsModule`; no other Bull processors exist.
- **Verification:** API **376/376** (38 suites), web **159/159**, root build **4/4**. Live proof used a temporary 1-minute exam: `expiresAt = startedAt + 60s`, a delayed `bull:exam-expiry` job with the attempt id, `IN_PROGRESS` at 0 seconds, then `TIMED_OUT` with `timeRemainingSeconds = 0` at 65 seconds; all temporary rows were removed and the demo counts stayed unchanged.

## Stack and repository facts

| Layer | Current implementation |
| --- | --- |
| Web | Next.js `^15.0.0`, React `^19.0.0`, App Router, TypeScript |
| API | NestJS 10 modular monolith, 14 domain modules |
| Database | PostgreSQL 18.6 + Prisma `5.22.0`; **43 models**, 35 enums, **8 production migrations** (migration #8 applied 28 October 2026) |
| Auth | JWT access token in an HttpOnly cookie + rotating opaque refresh token; refresh-on-mount in the SPA |
| Cache/jobs | Redis + Bull; the tenant-scoped `exam-expiry` delayed worker is active, while the outbox relay and reconciliation worker are still missing |
| Storage | R2/S3 signing helpers exist; not part of the verified demo flow |
| Video | Bunny Stream provider, VdoCipher scaffold, unlisted YouTube attach path; student player uses the YouTube IFrame API |
| Payments | Paymob, Fawry, and voucher providers; Instapay, Vodafone Cash, and e&money are scaffolding |
| Monorepo | pnpm `9.15.0` + Turborepo 2 |
| Web pages | 35 App Router pages plus root loading/error/not-found states |
| Node | Node 20 in the API Docker image; `.nvmrc` is 20 |

The repository does **not** have a root `tsconfig.base.json` or a root `.env.example`; the API template lives at `apps/api/.env.example`.

## What is shipped

- Host-based tenant resolution with `tenant_domains`; the production demo resolves `sanad-demo`.
- Teacher authoring for courses, sections, lessons, resources, assignments, and exams, including a publish workspace.
- Student curriculum view with section/lesson/task breakdown, progress, available/locked tasks, and direct task links.
- Student lesson workspace with video/exam/assignment briefs, server-derived state, locked-video prerequisite state, and responsive layouts.
- Server-authoritative assignment and exam timers (300 minutes and 70 minutes by default); refresh does not reset the derived expiry.
- Per-student progression: `ENTER_ASSIGNMENT` unlocks the linked exam, and `ENTER_EXAM` unlocks the next lesson. Grants are idempotent and stored in `student_lesson_unlocks`.
- Teacher grading queue for exam attempts and assignment submissions.
- Server-side exam expiry: a delayed Bull job closes abandoned `IN_PROGRESS` attempts to `TIMED_OUT` after the derived expiry, in the tenant/RLS scope, without depending on the open tab.
- Real teacher analytics workspace at `/teacher/analytics`, backed by tenant-scoped totals, an enrollment trend, per-course lesson completion, assignment/exam averages, pending grading, and recent activity; the history window follows the tenant plan's analytics retention.
- Cookie-based sessions that survive a hard reload: `AuthProvider` calls `POST /api/auth/refresh`, then `GET /api/users/me`, and exposes a `ready` flag before rendering protected pages.
- Dark theme by default and an optional Academic Light Mode (“Heritage Manuscript”) across the student surfaces, persisted under `sanad:theme` and applied before paint.
- Student Command Center on `/student`, with every displayed number derived from server responses.
- Paymob/Fawry webhook verification with raw payloads, replay/deduplication, atomic settlement, ledger entries, entitlements, and refund settlement.
- Server-side paid-course guard (`402 PAYMENT_REQUIRED`) plus atomic paid enrollment on payment/voucher settlement.
- Voucher checkout at `/checkout/[slug]` with Arabic error states, already-enrolled/free handling, and a stable payment-intent retry key.
- Admin refund flow with idempotency, provider rejection handling, ledger reversal, and surgical entitlement revocation.
- Bunny Stream upload/signing code and video-protection primitives (signed playback token, watermark engine, playback sessions).
- Unlisted YouTube attachment for lessons, which is the path used by the current demo content.

## Deployed hardening — 2026-10-28

`feat/security-quick-wins` is merged and deployed. It adds:

- A global `@nestjs/throttler` guard keyed by the forwarded client IP: **120 requests/minute per route** by default, with stricter auth limits (`login` 10/min, `register` 5/min, `refresh` 30/min). Health/readiness and Paymob/Fawry webhook routes opt out.
- In-memory throttler storage. It is per API instance; a multi-replica deployment needs shared storage (for example Redis) before limits are cluster-wide.
- Forwarded-IP extraction (`X-Forwarded-For` first, then `X-Real-IP`, then the socket address). This is a best-effort rate-limit key, not an authorization boundary; a direct caller can spoof the header.
- Locked-lesson payload redaction: `GET /api/v1/student/lessons/:lessonId` returns title/description/access metadata but `assignment: null`, `exam: null`, and `videos: []` while locked.
- Assessment lock enforcement: student assignment/exam view and enter endpoints return **403 `LESSON_LOCKED`** when the lesson is locked and the student has no per-student unlock grant.
- Authoring-read bypass fixes: `GET /api/v1/exams/:examId`, the generic `GET /api/v1/assignments/:assignmentId`, teacher lesson routes, and legacy lesson routes now require the `update` action, not student `read`.
- Pre-start exam protection: the student exam view withholds the question paper until an attempt is active; `questionCount` remains available for the intro screen.
- Student assignment/exam lists return navigation metadata only. Descriptions, instructions, questions, attempts, and grading fields stay behind the locked `/view` routes.

Production now enforces these paths. The production smoke verified the metadata-only student list, `LESSON_LOCKED` lock-card rendering in dark/light themes, and the retake flow. Distributed rate-limit storage and hostile-proxy tuning remain open.

## Deployed assignment retakes — 2026-10-28

`feat/assignment-retakes` is merged and deployed on top of the hardening branch. It adds:

- Migration #8 `20261027000001_assignment_retakes`: `attemptNumber`, `startedAt`, nullable `submittedAt`, the `IN_PROGRESS` submission status, and a unique `(assignmentId, studentId, attemptNumber)` key replacing the one-row unique key.
- Safe backfill of existing rows as submitted attempt #1; `startedAt` is backfilled from the old `submittedAt`. No existing row is deleted or rewritten.
- Active-attempt semantics: `IN_PROGRESS` + `submittedAt = null` while the student writes; submit sets the final timestamp. Timers derive from `startedAt`, not `submittedAt`.
- Server-side `maxAttempts` enforcement, attempt N+1 after a completed attempt, and a `409` for concurrent duplicate starts. An active attempt is checked before the max-attempt count, so an open final attempt returns `409`, not a misleading `400`.
- The next attempt number is `max(count, highest stored attemptNumber) + 1`, tolerating gaps in legacy history.
- Teacher grading queue and teacher student-file history exclude in-progress attempts. Student history includes them with `submittedAt: null`.
- Assignment list/runner and dashboard types handle nullable timestamps; the teacher queue shows the attempt number.
- Student overview fixes: completion counts any submission with a non-null `submittedAt`; an active `IN_PROGRESS` attempt outranks an older grade; result review scans all attempts; and a `LESSON_LOCKED` response renders the prerequisite lock card instead of a failure state.

Migration #8 is applied to Railway (**8/8**). The production smoke created attempt 1 and attempt 2 for the demo student, then rejected attempt 3 with **400**; the teacher queue excluded the active attempt and showed both submitted attempts.

## Known limits and absent features

Do not overstate the following controls; each row is the current limit.

| Area | Current reality |
| --- | --- |
| RLS enforcement | **Active locally**: the API runtime connects as `app_user` (no SUPERUSER, no BYPASSRLS), tenant context is injected per request, and the 5/5 isolation suite plus voucher/webhook round trips pass. The retired Railway runtime was not migrated; do not claim RLS enforcement there. Every query still carries `tenantId`. |
| Transactional outbox | Events are written to `OutboxEvent`; there is **no dispatcher/relay** delivering them. |
| Background jobs | Redis + Bull are active for one queue: the tenant-scoped `exam-expiry` delayed worker. There is no outbox relay, reconciliation worker, or other scheduled processor. |
| Video provider webhook | `POST /api/video/webhooks/:provider` verifies the raw-body HMAC before parsing, resolves the tenant from the callback Host, updates the `Video` row and writes the outbox event in one transaction, and ignores stale/replayed callbacks. Unit-tested 6/6; **not yet exercised with a real Bunny library/key**, and VdoCipher remains a stub. |
| Advanced progression | Only `ENTER_ASSIGNMENT` and `ENTER_EXAM` are active. `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, and manual unlocks are future extension points. |
| Locked lesson content | The student lesson payload and assessment view/enter paths now enforce locks; a temporarily locked assignment rendered the lock card in production. Other content types still need their own enforcement review. |
| Rate limiting | Live in production as an in-memory per-IP/per-route guard. It is per API instance; distributed/shared storage and hostile-proxy tuning remain open. |
| Word-level review highlighting | `AssignmentSubmission` stores `content`, `score`, and `feedback`; per-word evidence spans are not persisted. The result screen uses an aggregate bridge, not fabricated highlights. |
| Content versioning | Courses, lessons, and exams do not have a separate version/snapshot table. Publishing updates the current row; old attempts are not guaranteed to point at an immutable content version. |
| Assignment retakes | Live with migration #8; `maxAttempts` is server-enforced and concurrent starts are serialized to one `201` and one `409`. The demo assignment is configured with `maxAttempts=2`. |
| Railway auto-deploy | The GitHub-linked Railway service did not create a deployment for the 28 October push. The API was deployed manually with `railway up`; verify the deployment status after each push until the integration is fixed. |
| Demo tunnel | The live web app uses a Cloudflare quick tunnel. The URL changed on 15 November (full logon simulation → `14a82df`), overnight on 16 November (restart → `1fbc7e8`), again in the afternoon of 16 November after the cloudflared process died (restart → `3dab53e`), and on 18 November (restart → `0fffd90`); the launcher wrote each new fallback and Vercel redeployed. The current URL is `https://modes-lender-ind-controlled.trycloudflare.com`. `-SyncFallback` keeps the fallback current across a reboot after Windows logon, but it still causes a Vercel redeploy and a short outage. A free ngrok static domain remains the next step; see `docs/DEMO-STABILITY.md`. |
| Demo autostart | Installed: the Windows Startup entry runs `start.ps1 -Tunnel cloudflared -Watch -SyncFallback` hidden at logon. It was exercised on 15 November 2026 with a full component cold start (watchdog, tunnel, API, and Docker stopped; Startup `SANAD-Demo.cmd` launched; new tunnel, fallback commit/push, live health **200** in about 70 seconds), but an actual Windows logoff/reboot was not performed. The sync is a temporary bridge until the URL is stable. |
| Vercel proxy environment | The local machine does not have the Vercel CLI, so the production `API_PROXY_TARGET` value has not been inspected directly. The 15–16 November tunnel changes recovered through the synced hardcoded fallback, so no stale Production override was observed; confirm the env value when the stable domain is configured. |
| SETH-9 advanced security | Post-quantum signing, zero-knowledge delivery, homomorphic grading, active deception, and crypto-shredding are **not implemented**. A dependency-ordered, phased roadmap/ADR is recorded in [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md). |
| Exam auto-submit | The client submits at zero, and a delayed Bull worker (`exam-expiry`, added 18 November 2026) closes abandoned `IN_PROGRESS` attempts to `TIMED_OUT` after the server-derived expiry. The worker is tenant/RLS-scoped and idempotent; queue failure leaves the client timer/API late-submit path in place. |
| Reconciliation | `ReconciliationRun`, `ReconciliationItem`, and settlement models exist, but there is no live reconciliation worker or route. |
| Provider sandbox proof | Paymob/Fawry code and local webhook smokes are present; a real provider sandbox run remains pending. |
| Instapay / Vodafone Cash / e&money | Provider classes are scaffolding/stubs. They are not live payment methods. |
| VdoCipher | Explicit stub. Use Bunny Stream or the unlisted YouTube demo path. |
| AI claims | The web client and API contain a SANAD evaluation endpoint/client. The external RAG service, Qdrant/BM25 stack, benchmark numbers, and the “393 achievements” claims from older demo copy are not in this repository and are not verified here. |
| CI as release proof | `.github/workflows/ci.yml` exists, but the release evidence for this commit is the local test/build run above. Do not cite CI as green until it has actually run successfully on `main`. |

## Tenancy and isolation model

1. `TenantResolverMiddleware` resolves the request host through the `SECURITY DEFINER` function `app_resolve_tenant_by_domain`.
2. The request runs inside `AsyncLocalStorage` tenant scope.
3. `PrismaService` wraps operations in a short transaction and calls `set_config('app.tenant_id', <id>, true)`.
4. RLS policies compare `current_setting('app.tenant_id', true)` with the row's `tenantId`.
5. Interactive `$transaction` sites call `applyTenantContext(tx)` explicitly.

The database side is complete, and the local demo runtime is now active:

- `PrismaService` reads `DATABASE_URL` only; the runtime points it at the non-owner `app_user` and does not fall back to the migration owner.
- Migrations and seeds use `MIGRATION_DATABASE_URL` (owner) explicitly through the demo wrappers; the runtime process does not need it.
- `app_user` has no SUPERUSER and no BYPASSRLS; startup logs `DB runtime role: app_user (superuser=off)` and warns on a superuser.
- The isolation proof is `apps/api/test/rls-isolation.e2e-spec.ts` (**5/5**), plus the voucher and signed-webhook flows that exercise real request scopes.

Hosted activation is still pending: the Railway API endpoint is retired (`404 Application not found`), so its runtime was not migrated. If the API is redeployed to a host, point its `DATABASE_URL` at `app_user` and repeat the RLS e2e before claiming isolation. The application-level `tenantId` filters remain in every query as defense in depth, not as a replacement for RLS.

## Payment truth

The money path is implemented as **order → payment intent → provider → ledger + entitlement**, inside a transaction where possible.

- Money crosses the API as JSON strings; minor units are canonicalized with `toBigIntMinor`.
- Idempotency keys renew in place and store a stable completed payload.
- Webhooks verify the provider signature before any state change; raw bodies are retained for replay.
- A paid event with no matching `PROCESSING` intent fails visibly as `INTENT_NOT_FOUND` and is retryable.
- Refunds claim an idempotency key before validation, use CAS transitions, reverse ledger entries, and revoke the matching entitlement in the same settlement transaction.
- A second paid transaction for an already-settled order raises `SECOND_CHARGE_DETECTED`; it is not auto-settled.

See `docs/STATUS.md` and `docs/SECURITY.md` for the detailed state and evidence.

## Student experience — Heritage Manuscript

The student side is a warm-paper/ink register in light mode and a graphite register in dark mode, with emerald as the action accent.

- Light mode tokens are scoped under `html[data-theme="light"]` in `apps/web/app/globals.css`.
- The theme is applied pre-paint from `apps/web/app/layout.tsx`; the default is dark.
- `ThemeProvider` and `useTheme()` live in `apps/web/app/lib/theme-provider.tsx`.
- The toggle is in the student dock (`StudentDock.tsx`); the saved key is `sanad:theme`.
- The redesigned curriculum board and lesson workspace use the `lc-*` surface family in `globals.css`.
- The student course page, task links, lesson player, exam brief, assignment brief, and locked-video state were browser-verified in both themes at desktop and mobile widths.

## How to reproduce the evidence

```powershell
# From the repository root
pnpm install
pnpm --filter api exec prisma generate
pnpm --filter web test
pnpm --filter api exec jest --config jest.config.js --runInBand
pnpm build

# Local demo lifecycle (see docs/DEMO-STABILITY.md)
pnpm demo:start -- -Tunnel none
pnpm demo:smoke
pnpm demo:backup
pnpm demo:reset -Force   # destructive: backup → migrate → truncate → seed → verify
pnpm demo:seed           # idempotent backfill only
pnpm demo:stop

# RLS proof (requires RLS_ADMIN_URL and RLS_APP_URL)
pnpm --filter api exec jest --config ./test/jest-e2e.json --runInBand rls-isolation

# Live check
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

## Documentation map

| Document | Purpose |
| --- | --- |
| `README.md` | Public overview and setup |
| `docs/CURRENT-STATE.md` | This canonical snapshot |
| `docs/STATUS.md` | Concise status and evidence |
| `docs/ARCHITECTURE.md` | Current runtime architecture |
| `docs/DEPLOY.md` | Deployment/runbook and RLS activation |
| `docs/SECURITY.md` | Threat model and security controls (with current-state banner) |
| `docs/VISUAL_IDENTITY.md` | Design system and Heritage Manuscript specification |
| `docs/COMMAND-CENTER.md` | Student dashboard data/design contract |
| `docs/VIDEO_PROTECTION.md` | Video protection specification and current limits |
| `docs/DEMO.md` | Demo runbook |
| `docs/DEMO-SCRIPT.md` | Honest demo script |
| `docs/DEMO-STABILITY.md` | Stable tunnel, watchdog, smoke, backup, and autostart runbook |
| `docs/AUDIT-2026-10-16.md` | Historical audit, preserved as a dated snapshot |
| `docs/GOVERNANCE.md` | Repository workflow and gates |
