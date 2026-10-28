# Learning Platform — Agent Memory & Rules

## Project Overview

**Multi-tenant white-label learning platform for Egyptian teachers.** One core platform → many teachers (tenants). Each teacher gets their own domain, branding, courses, students, payments, analytics, without forking code.

## Stack

| Layer       | Technology                                                                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web         | Next.js 15 (pinned `^15.0.0`) + App Router + TypeScript                                                                                                                                      |
| API         | NestJS 10 (modular monolith)                                                                                                                                                                 |
| DB          | PostgreSQL + Prisma ORM                                                                                                                                                                      |
| Auth        | JWT (short access) + rotating refresh tokens (HttpOnly cookies)                                                                                                                              |
| Isolation   | Shared DB + `tenant_id` + **PostgreSQL RLS (FORCE ROW LEVEL SECURITY)** — ✅ DB-side complete + runtime injection landed; activation = runtime connects as `app_user` (see Verified Reality) |
| Cache/Queue | Redis + Bull (deps installed; no processors/relay wired)                                                                                                                                     |
| Storage     | Cloudflare R2 / S3 (signing helpers; not part of verified demo)                                                                                                                              |
| Video       | Bunny Stream (implemented) / VdoCipher (stub) / unlisted YouTube (current demo)                                                                                                              |
| Payments    | Paymob, Fawry, Vouchers (live code + local smokes); Instapay/Vodafone/e&money are scaffolding                                                                                                |
| Monorepo    | pnpm + Turborepo                                                                                                                                                                             |
| CI/CD       | GitHub Actions workflow exists; local tests/build are the release evidence                                                                                                                     |
| Infra       | Docker + Terraform (later)                                                                                                                                                                   |

## Current verified release — 2026-10-28

> Canonical document: `docs/CURRENT-STATE.md`. This is the state to use for answers and documentation. Older entries below are an audit trail.

- Production branch `main`. Web runtime code `cd03fb0` (web-only SANAD grading selector on top of `5ac122d`; Vercel auto-deploy; later docs-only commits do not change runtime code). API deployment `5ac122d` via manual `railway up` (deployment `16a33f07-f1dd-404f-b110-ba4497ac7408`, status SUCCESS). Web `https://sanad-edtech.vercel.app`; API `https://sanad-edtech-production.up.railway.app`.
- `/api/health` = **200**, database **up**; `sanad-demo` has 3 published Arabic prep courses + exam/assignment. The demo assignment is now `maxAttempts=2`; the demo student has submitted attempts 1 and 2 from the production smoke.
- Tests: **357/357 API** (35 suites) on production code, **147/147 web** (10 files) on `cd03fb0`, build **4/4**.
- 43 Prisma models, **8 migrations** (migration #8 applied 28 October 2026), 138 RLS policies / 43 tables.
- RLS runtime **inactive** (runtime uses owner/superuser URL); outbox has no dispatcher; no video webhook; no Bull processors. Railway did not auto-deploy the 28 October push; the API deploy was manual and remains manual until the integration is fixed.
- Student curriculum/lesson redesign shipped (Heritage Manuscript); dark default + light mode; session restore on reload.
- Demo passwords remain in `docs/CURRENT-STATE.md`; this file intentionally does not repeat them.
- SETH-9 advanced controls (post-quantum signing, ZK delivery, homomorphic grading, active deception, crypto-shredding) are **roadmap-only**, not implemented; see `docs/SETH-9-ROADMAP.md`.

### Deployed hardening — 2026-10-28

- Branch `feat/security-quick-wins` adds a global per-IP `@nestjs/throttler` guard: 120/min per route, login 10/min, register 5/min, refresh 30/min; health/readiness and payment webhooks opt out.
- It also redacts `assignment`/`exam`/`videos` from locked student lesson payloads and returns `403 LESSON_LOCKED` from student assignment/exam view/enter endpoints unless a per-student grant exists.
- Authoring reads now require `update`: `GET /api/v1/exams/:examId`, the generic assignment read, teacher lesson routes, and legacy lesson routes. Student lists return navigation metadata only; pre-start exam views withhold the question paper but expose `questionCount`.
- Throttler storage is in-memory per API instance; forwarded-header client IPs are best-effort, not an authorization boundary.
- Deployed in production on 28 October 2026. Pre-merge evidence: API **344/344** (34 suites), web **137/137**, build **4/4**, login-limit smoke `401`×10 → `429` with `Retry-After`. Production evidence: student assignment list is metadata-only, the locked-assignment card renders in dark/light, and `403 LESSON_LOCKED` guards the assessment view/enter paths. Rate limits are in-memory per API instance; distributed storage and hostile-proxy tuning remain open.

### Deployed assignment retakes — 2026-10-28

- Branch `feat/assignment-retakes` merges `feat/security-quick-wins` (merge commit `a26d946`) and carries the retake lifecycle.
- Migration #8 (`20261027000001_assignment_retakes`) adds `attemptNumber`, `startedAt`, nullable `submittedAt`, the `IN_PROGRESS` submission status, and replaces the one-row unique key with `(assignmentId, studentId, attemptNumber)`. Existing rows are backfilled as submitted attempt #1 with `startedAt = submittedAt`.
- Active work is an `IN_PROGRESS` row with `submittedAt = null`; submitting sets the final timestamp. The student view/timer and teacher queue use the active marker, and teacher/student history excludes in-progress rows from grading.
- The API enforces `maxAttempts`, starts attempt N+1 after a completed attempt, checks an active attempt before the max-attempt count (`409`, not `400`), derives the next number from the highest stored attempt (gap-tolerant), and converts a concurrent duplicate insert into `409`. The web runner labels the next start as a new attempt; the teacher queue displays the attempt number.
- Student overview fixes: completion uses `submissions.some((s) => s.submittedAt !== null)`, an active attempt outranks an older grade in status/CTA, result review scans every attempt, and `LESSON_LOCKED` renders a prerequisite lock card instead of a failure state.
- Deployed in production on 28 October 2026. Pre-merge evidence: API **353/353** (34 suites), web **145/145** (9 files), API/web `tsc --noEmit` clean, build **4/4**, fresh local PostgreSQL migration chain **8/8**, a legacy-shaped database backfilled as attempt #1 (`startedAt = submittedAt`), `prisma migrate diff` no drift, retake HTTP smoke (attempt 1 → submit → attempt 2 → max-attempt 400 → teacher queue excludes active), concurrent-start smoke **201/409** with one active row, and browser QA: active attempt #2 with a prior grade showed «قيد الحل», «متابعة الحل», secondary «مراجعة المحاولة السابقة», and 100% completion; a locked assignment showed «مقفل» and «سلّم الواجب السابق أولًا» in dark and light themes with no horizontal overflow.
- Production evidence: a custom-format dump + globals was restore-tested into local PostgreSQL 18 (44 tables, 3 courses, 1 submission, 7 migrations at backup time); migration #8 applied (**8/8**); production retake smoke **31/31** (metadata-only list, concurrent start **201/409**, attempts 1 and 2 submitted, third start **400**, teacher queue excludes `IN_PROGRESS`, health **200**). Final DB state: 3 submissions (2 at attempt 1, 1 at attempt 2), 0 in progress, 0 null timestamps; demo assignment `maxAttempts=2`.

## ⚠️ Verified Reality (audit trail — current release is above)

> Full report: `docs/AUDIT-2026-10-16.md`. The dated entries below are kept as an audit trail. Use the **Current verified release — 2026-10-28** block above for today's runtime.

**Railway go-live — 2026-10-20 (API is LIVE).** API live at `https://sanad-edtech-production.up.railway.app` — verified `/api/health` **200** (`{"status":"ok","database":"up"}`), teacher login `01000000001` **200**, `/api/tenants/current` → `sanad-demo`, `/api/v1/teacher/courses` → 3 seeded courses. Two root causes fixed:
1. **Tenant middleware path bug (`9f57ee8`).** `TenantResolverMiddleware` checked `req.path.startsWith("/api/health")` — but Nest mounts `forRoutes("*")` middleware under the global prefix (`app.use("/api/*")`), and Express rewrites `req.path` to `/` inside a wildcard mount. The exemption never matched: every cloud request (including health) hit tenant resolution and 404'd with `Tenant not found` until `tenant_domains` had the host. Fix reads `req.originalUrl` (`apps/api/src/modules/tenants/tenant-resolver.middleware.ts`), regression spec `tenant-resolver.middleware.spec.ts` (4 tests), api suite **311/311**.
2. **Railway build pipeline.** Config-as-code (`railway.json`) is deprecated (Railway docs: sunset 2026-12-01; builder values now RAILPACK/DOCKERFILE only) and the Nixpacks auto-plan for this pnpm monorepo failed with `No start command could be found`. The repo now builds via a root `Dockerfile` (Railway always builds with a Dockerfile when present; `nixpacks.toml` kept as fallback) running the exact local chain: `pnpm install --frozen-lockfile --prod=false` → `pnpm --filter api exec prisma generate` → `pnpm --filter api run build` → `node apps/api/dist/src/main` (`883a853`, `892c557`). Note `tsconfig.base.json` does NOT exist at repo root — do not reference it in Docker COPY.

**Vercel go-live — 2026-10-20 (web is LIVE).** `main` was fast-forwarded to the go-live branch (`main` == `feat/go-live-deploy` == `a6f19ca`), so the Vercel project (`sanad-edtech`, Production Branch `main`) serves it: **`https://sanad-edtech.vercel.app`** — production deployment Ready and public (preview URLs stay behind Vercel Authentication). Verified live from outside: home page **200**; **`/api/health` through the domain → 200** `{"status":"ok","database":"up"}` (the `/api/*` rewrite proxies Vercel → Railway); a browser-shaped login POST through the domain reaches tenant resolution + the CSRF guard and is rejected **403** while `ALLOWED_ORIGINS` is unset — fail-closed, not silent. Root cause fixed (`a6f19ca`): the first production build ran without `API_PROXY_TARGET`, so `next.config.mjs` baked `http://localhost:3002`, and Vercel refuses to proxy to a private host (`X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE`) — every `/api/*` call on the domain 404'd (user-visible as the login screen's connection error). Both web env dependencies now have Vercel-aware fail-safe defaults — `apps/web/next.config.mjs` (proxy target → `https://sanad-edtech-production.up.railway.app`) and `apps/web/app/lib/api.ts` (browser same-origin `""`; server → production origin on Vercel because Node fetch cannot resolve relative URLs; `localhost:3002` elsewhere) — so a Vercel deploy no longer depends on env vars at all (they still override when set). Evidence: web tests **85/85**; `next build` EXIT 0 with and without `VERCEL=1`; the `VERCEL=1` routes manifest bakes destination `https://sanad-edtech-production.up.railway.app/api/:path*`. **Remaining:** none — closed the same day. `ALLOWED_ORIGINS=https://sanad-edtech.vercel.app` is set on the Railway service; note a hand-typed value was rejected until it was deleted and re-created by **pasting the clean ASCII value** (invisible Unicode marks — U+200E/U+200F/U+200B/U+FEFF — survive `.trim()` and kill the guard's exact matching; the dashboard shows them invisibly). Verified through the domain afterwards: `POST /api/auth/login` → **200** (teacher, role `TEACHER`, access token issued), `/api/tenants/current` → **200** `sanad-demo`, `/api/v1/teacher/courses` → **200** with **3** PUBLISHED courses (inside the `data` array).

**Web session persistence — 2026-10-20 (`d2d9258`, `de74f5d`).** The SPA held the access token in React memory only, so every hard reload silently emptied the authenticated pages: the teacher greeting fell back to «أستاذ», KPIs read 0, and the grading queue stayed on «جارٍ قراءة طابور التصحيح…» forever (the effects are gated on `token`). Root cause confirmed in a real browser. `AuthProvider` now restores on mount — `POST /api/auth/refresh` (HttpOnly cookie) → `GET /api/users/me` → state — and exposes a `ready` flag; the teacher layout redirects to `/login` after a failed restore (deny by default) and the student page shows the skeleton until `ready`. The greeting renders `أستاذ ${userName}`. Logout now calls `POST /api/auth/logout` first, because an in-memory logout is undone by the next reload (verified: logout → refresh **401** → `/student` shows «سجّل الدخول أولًا»). Seed names are env-overridable (`DEMO_TEACHER_NAME`, `DEMO_TENANT_NAME`) for a real teacher persona. Browser E2E: login → «صباح الخير، أستاذ صالح حسين» → reload → name + 3 published courses restored; web tests **86/86**; `next build` EXIT 0.

**Student Academic Light Mode — 2026-10-24 (`a60fc3f`, web LIVE).** The student Topbar now has a thin Moon/Sun toggle at the far left. Theme defaults to **dark**, persists in `localStorage` under `sanad:theme`, and is applied pre-paint through `html[data-theme]` (inline bootstrap in `apps/web/app/layout.tsx`, no flash). `ThemeProvider` + `useTheme()` live in `apps/web/app/lib/theme-provider.tsx`; `toggleTheme()` reads the painted DOM attribute before flipping, so the first click after reload works. Every light rule is scoped under `html[data-theme="light"]` in `apps/web/app/globals.css` (parchment `#F7F4EB/#F4EFE3`, emerald `#047857/#065F46`, ivory `#FFFFFF`, hairline `#E4E2DB`, emerald asteroids ≤ 0.04), so the graphite dark register is untouched. No backend, schema, or migration change. Local proof: web tests **101/101**; root `pnpm build` **4/4** after regenerating the stale local Prisma client (no code change); CDP QA at 1440/1000/390 across dashboard, assignment list/runner/result, courses, exams, profile, confirm dialog, and submission theater in both themes with no document-level horizontal overflow. Live: `https://sanad-edtech.vercel.app/login` includes the pre-paint theme script; the deployed production CSS contains `--hl-bg`; `/api/health` **200**.

**Student curriculum / lesson redesign — 2026-10-25 (`4951e49`, web LIVE).** The student course page is now a manuscript-like curriculum board (`/student/courses/[id]`) with real task counts, section/lesson rows, task chips, progress, and direct assignment/exam/lesson links. The lesson workspace (`/student/lessons/[id]`) handles video, exam brief, assignment brief, and locked-video prerequisite state, with dark/light parity and mobile layouts. Browser QA at 1440/1000/390 verified course tasks/links, video lesson, exam brief, assignment brief, locked-video state, and theme toggle; final local evidence: `tsc --noEmit` EXIT 0, web **137/137**, root build **4/4**. This replaces the old “cards on a dark stage” description in earlier notes.

**Seed state (Railway DB):** `pnpm seed:path2` applied with `PROD_TENANT_DOMAINS=sanad-edtech-production.up.railway.app` (teacher `01000000001` / `Joker-Arabic#2026`, student `01000000002` / `Student123!`, 3 Arabic prep courses, exam + assignment). Local `.env` `DATABASE_URL`/`MIGRATION_DATABASE_URL` reach this DB (**8/8 migrations**). The demo assignment is set to `maxAttempts=2`; the demo student has submitted attempts 1 and 2. Runtime still connects as the DB owner — **RLS activation (app_user) remains pending**.

**Credential incident — resolved; rotation pending (2026-10-16 evening).** Commit `78b9d69` (pushed) fixed `apps/api/src/modules/tenants/prisma.service.ts` to read `MIGRATION_DATABASE_URL` / `DATABASE_URL` from env. Same day: the working-tree leak in `apps/api/prisma/seed-path2.ts` was reverted and `apps/api/srv.txt` deleted — `git status` clean, git history never contained the secret. **By hand only:** rotate the Railway DB password in the dashboard. Never paste credentials into source, logs, or chat.

**Migrations + RLS + token binding — landed 2026-10-16 evening:**

- **`prisma migrate deploy` on a fresh DB — FIXED (`618aa0a`).** Real baseline `0_init` (42 tables) + `migration_lock.toml` committed; verified 5/5 migrations on a clean PostgreSQL 17.
- **RLS — DB-side complete + runtime injection wired (`cb23a97`, `95020fe`).** `20261016000000_rls_hardening` installs camelCase policies on all 42 application tables + FORCE (only `_prisma_migrations` exempt) + creates the `app_user` role behind a superuser check; the broken loose `init_rls.sql` was deleted (never applied — wrong column names). `20261016000001_tenant_resolution_fn` adds `app_resolve_tenant_by_domain` (SECURITY DEFINER) used by the pre-auth middleware. Runtime: `TenantResolverMiddleware` wraps each request in AsyncLocalStorage; `PrismaService` returns a `$extends` proxy that executes every op in a short transaction right after `set_config('app.tenant_id', <id>, true)`; interactive `$transaction` sites call `applyTenantContext(tx)` explicitly.
- **Live proof (local PostgreSQL 17, as `app_user`):** repo's own `test/rls-isolation.e2e-spec.ts` green **5/5** (scoped SELECT; cross-tenant UPDATE/DELETE = 0 rows; cross-tenant INSERT rejected; empty context = 0 rows) after fixing the spec's stale Prisma array-args form; 134 policies / FORCE on 42 tables verified via SQL; compiled-service E2E 7/7; api suite **187/187**.
- **JWT `tenantId` vs request Host — FIXED (`f1aaa58`).** `passReqToCallback` rejects tokens whose `tenantId` mismatches the host-resolved tenant, or when host context is absent; 5 regression tests.
- **Feature flags — FIXED (`e9227bc`).** `checkFeatureFlags` accepts both raw booleans and `{enabled,value}` objects. Regression tests cover both shapes.
- **Payment webhooks — revived (`d22379b`) and round trip closed (bundle B, `035a838` + `7ebc124`).** `rawBody: true` + `rawPayload` column (migration #6) + dedup keyed on the provider event id + Paymob field-concatenation HMAC + `timingSafeEqual` length guards + paymob/fawry registered from env credentials. **Bundle B:** completion runs in ONE transaction — `EntitlementsService.grantEntitlement/grantCourseEntitlement` and `OutboxService.publish` accept an optional `Prisma.TransactionClient`, so a mid-flight failure rolls back atomically and a retry resumes; PENDING idempotency claims **resume** (only a stored `response` means completed); a paid delivery with no `PROCESSING` intent and nothing settled **FAILS visibly** (`INTENT_NOT_FOUND`, retryable via `retryFailedWebhooks`, which now skips `SIGNATURE_INVALID` rows); and a queue rejection can no longer kill the process. Live proof: bundle-B round-trip smoke **25/25** (HMAC-signed callback → PAID → CONFIRMED → ledger + entitlement + intent SUCCEEDED; replay no-op; forged hmac recorded; crashed-attempt resume; orphan FAIL; API survives), api **276/276** (28 suites), RLS e2e **5/5**. Remaining: video webhook.
- **Per-student progression — landed 2026-10-17 (`e0ab627`).** New table `student_lesson_unlocks` (43rd) + UNIQUE (tenantId,userId,lessonId) + its own 4-policy RLS set + grants (migration `20261017000001`; totals now **138 policies / 43 tables**); ENTER_ASSIGNMENT/ENTER_EXAM write grants for the acting student inside ONE `$transaction` (`createMany`+`skipDuplicates` → idempotent under retries); progression runs once and the enter response carries the real `unlocked`; student views overlay the grant; `getNextLesson` is tenant-scoped. Live: DB checks **15/15** as `app_user` (direct duplicate → 23505), RLS e2e **5/5**, fresh chain **7/7**, api **229/229**, build **4/4**.
- **Payment funnel — reopened 2026-10-17 (`ee766e2`, audit bundle A).** `POST /orders` accepted nothing (the old check compared `number !== bigint` — always true — and answered 400): pricing is canonicalized by `toBigIntMinor` (`apps/api/src/common/money/minor-units.ts`), and **money leaves the API as JSON strings** (`patchBigIntSerialization()` in `apps/api/src/common/serialization/json.ts`, called from `main.ts`). Idempotency keys **renew in place** on retry (no more P2002), `markFailed` flips only PENDING rows, `markCompleted` stores a stable sorted-key payload; `createPaymentIntent` replays stored responses, finds the prior intent by `(tenantId, idempotencyKey)`, resumes FAILED rows, 409s EXPIRED/CANCELLED; `completePayment` settles the intent to `SUCCEEDED` in the same transaction; the voucher path guards already-paid and marks FAILED only on explicit decline. Live proof: HTTP smoke **23/23** on a fresh PG17 from zero (number/digit-string/mismatch pricing → voucher create → cached replay → FAILED-key retry 400-not-500 → expired-key renew with no second charge; single payment/ledger/entitlement), api **268/268** (28 suites), RLS e2e **5/5**. Bundle B (webhook round trip) and bundle C (refunds) landed 17 Oct — see the bullets above and below; remaining funnel work = bundle D (LMS).
- **Refunds / money-out — landed 2026-10-17 (bundle C, `69063d2` + live-proof fixes `e131b42` + `ab544e3` + `fe0cd41`).** Explicit `refund` action in the policy engine (ADMIN only; teachers keep `payment: ["read"]`) and `POST /payments/:paymentId/refunds` with a mandatory `idempotencyKey` and optional `amountMinor` (defaults to the full remaining amount). `processRefund` **claims the idempotency key before any validation** (raw fingerprint `{paymentId, amountMinor, reason}`) so a replay after a _completed_ refund still replays the stored response; branches: stored response → replay, PENDING → resume, PROCESSING → 409 "outcome unknown", SUCCEEDED → markCompleted + replay, FAILED → markFailed + rethrow. The **only money guards** are the CAS claim `PENDING→PROCESSING` before the provider call and the settle CAS `(PENDING|PROCESSING)→SUCCEEDED` in `applyRefundSettlement` — the API route and the provider-refund webhook share the latter. Settlement is ONE transaction: reversing ledger entries (now linked by `paymentId` — `fe0cd41`), payment `REFUNDED`+`refundedAt`, order `REFUNDED`, **surgical entitlement revoke** via `metadata.orderId` (purchase) and/or `metadata.voucherId` (voucher), then `restoreVoucherRedemption`. Partial refunds keep access. Paymob: `is_refunded/is_voided` classified **before** `success`, `refund()` verifies `response.ok` and `success !== false` (else `REFUND_REJECTED`), multi-shape refund callbacks funnel into `settleRefundFromProvider`. A second paid transaction for an already-settled order raises `SECOND_CHARGE_DETECTED` (severity HIGH) + a visible FAILED webhook — deliberately no auto-settlement. Voucher checkout crash-resume matches on `metadata.intentId` (no double consumption) — `e131b42` moved the resume check before the exhaustion check, and `ab544e3` added the missing built-in `payments` flag (its absence 403'd every non-voucher checkout). Live proof: bundle-C refund smoke **26/26** (full refund → SUCCEEDED → REFUNDED + 4 balanced ledger rows + entitlement REVOKED + outbox + key COMPLETED; replay no-op; refund callback structural no-op; provider rejection retryable; voucher refund restores the code; un-refunded order keeps its entitlement; API survives), api **307/307** (30 suites), RLS e2e **5/5**. Remaining: video webhook; simultaneous-claim race; real Paymob sandbox run (bundle D).
- ⚠️ **RLS enforcement is still INACTIVE wherever the runtime connects as a superuser/table owner** (FORCE RLS never applies to superusers) — it activates when the runtime URL points at `app_user` (pending on Railway; rotate the DB password first). Until then: **every query must still carry `tenantId`.**

**Still not true in runtime code (despite this file):**

- **Progression unlock types beyond ENTER_*** (COMPLETE_*/PASS_EXAM/SCORE_THRESHOLD/TIME_ELAPSED, per-student MANUAL) are still future extension points. The locked-lesson payload and assessment-entry paths are now deployed; other content types may still need their own enforcement review.
- **Rate limiting** is live as in-memory per-instance limits only. Distributed/shared storage and hostile-proxy tuning remain open.
- **Assignment retakes** are deployed with migration #8; `maxAttempts` is server-enforced and concurrent starts return `201`/`409`. The demo assignment is configured with `maxAttempts=2`.
- **Word-level answer↔review highlighting is not persisted yet.** `AssignmentSubmission` stores only `content`, `score`, and `feedback`; the result review links the student answer and teacher review with an honest aggregate bridge. Real per-word evidence spans require a migration-first change to persist and expose the evaluator's `criteria[].evidence` / `knowledge_gaps`; never simulate highlights.
- **Transactional outbox has no dispatcher** — events are written and never sent.
- **No Bull processors** — Redis/Bull dependencies exist, but no `@Processor`/worker is registered. Reconciliation has models but no live worker.
- **No video webhook route** — Bunny has a webhook verification helper, not an HTTP endpoint. VdoCipher is a stub. The current demo uses unlisted YouTube, which does not exercise the Bunny token/watermark pipeline.
- **Payment webhooks work now — including the full round trip** (bundle B, `035a838` + `7ebc124`): HMAC-signed callback → PAID → CONFIRMED → ledger + entitlement + intent SUCCEEDED in ONE transaction; PENDING claims resume; orphan paid events FAIL as `INTENT_NOT_FOUND`; queue rejections cannot crash the API. At the time of bundle B: live smoke **25/25**; api **276/276**. Checkout (`ee766e2`) and refunds (bundle C, `69063d2` + fixes) also landed: live smoke **26/26**. Current suite on production API code (`5ac122d`): **357/357** (35 suites). Still absent: the video webhook route.
- Canonical ports: **web :3001, api :3002** (older docs still say `:3000` in places).
- Dual jest configs: run API tests as `jest --config jest.config.js` inside `apps/api`.

**Rules that follow:**

1. P1 isolation core has landed and is verified locally. Remaining P1 = **activate on Railway**: rotate the DB password by hand → keep all migrations at **8/8** (`migrate resolve --applied` only for pre-baseline histories) → point the runtime `DATABASE_URL` at `app_user` → remove/avoid `MIGRATION_DATABASE_URL` in runtime → flip the preference in `prisma.service.ts` → re-run RLS e2e 5/5.
2. Claims about RLS / flags / outbox / webhooks / progression / funnel & idempotency must cite working code — not intent.
3. Secrets live only in `.env` (gitignored). Never paste credentials into source, logs, or chat.

## Environment Rules (Windows + PowerShell + pnpm ONLY)

- **Never** use `npm`, `head`, `tail`, `grep`, `cat`, `&&`, `||`, `>`, `<`, `|`
- **Use** `;`, `Get-Content`, `Select-String`, `Select-Object`, `>`, `tee`
- Redirect output to file first, then read: `command 2>&1 > out.txt; gc out.txt -TotalCount 50`
- pnpm only: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm dev`
- `pnpm` runs from repo root; `apps/api` scripts run inside `apps/api`

## Architecture Decisions & Why

| Decision                                                        | Reason                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Modular Monolith first**                                      | Faster to build, easier to extract services later when operationally justified          |
| **Shared DB + `tenant_id` + RLS**                               | Low cost, simple migrations, single source of truth; RLS = last line of defense         |
| **`app_user` role (non-owner, non-superuser)**                  | Prevents `BYPASSRLS`; runtime code cannot bypass isolation                              |
| **`set_config('app.tenant_id', ..., true)` inside transaction** | Transaction-local tenant context; no leakage via connection pooling                     |
| **Host-header tenant resolution**                               | No hardcoded domains; `tenant_domains` table maps domain → `tenant_id`                  |
| **Transactional Outbox**                                        | DB commit + event in same transaction → no lost events                                  |
| **Idempotency keys**                                            | Every financial mutation has unique key → safe retries                                  |
| **Content versioning (planned — not implemented)**             | Publishing currently updates the live row; there is no separate course/lesson/exam version table yet              |
| **Entitlements separate from feature flags**                    | Entitlements = resource access (per-student); Flags = feature toggles (per-tenant/plan) |
| **Config over code for tenant customization**                   | Branding, limits, feature toggles via JSON config; no per-tenant code forks             |
| **Transaction = source of truth**                               | Payment confirmed → ledger + enrollment + outbox in SAME transaction                    |

## Security Rules (Non-Negotiable)

1. **Deny by default** — every endpoint guarded by `AuthorizationGuard` + `RequirePermission`
2. **Fetch by (tenant_id, id)** — never trust client-provided IDs alone
3. **HMAC-verified webhooks** — every provider callback verified before state change
4. **Atomic vouchers** — `codeHash`, `FOR UPDATE`, single redemption per user
5. **HttpOnly Secure cookies** — no `localStorage` for tokens
6. **No secrets in git** — `.env` in `.gitignore`; secrets in Vault/Secret Manager
7. **Never log PII** — structured logs with `tenantId`, `userId`, `requestId` only
8. **Audit every sensitive action** — `payment_audit_logs`, `audit_logs`, `security_events`

## Code Rules

- Shared code → workspace packages under `packages/` (`@lp/design-system`, `@lp/motion`).
- Each package: `package.json` with `"name"`, `"main"`, `"types"`/`"exports"`.
- Each workspace owns its TypeScript config; there is **no root `tsconfig.base.json`**.
- The API path alias `"@/*": ["src/*"]` lives in `apps/api/tsconfig.json`.
- **No `../../../` cross-module imports** — use `@/modules/...` or workspace package imports.
- Prisma models in `apps/api/prisma/schema.prisma`; RLS migration in `prisma/migrations/`.
- Enums in Prisma schema = TypeScript enums (no string unions).

## Commands (PowerShell-safe)

```powershell
# Install deps (repo root)
pnpm install

# Generate Prisma client (from apps/api)
cd apps/api; pnpm exec prisma generate

# Build all (repo root)
pnpm build

# Run API in dev (from apps/api)
cd apps/api; pnpm run dev

# Docker compose (repo root)
docker compose up -d

# Prisma migrate (from apps/api)
cd apps/api; pnpm exec prisma migrate dev --name <name>

# Tests
pnpm --filter web test
pnpm --filter api exec jest --config jest.config.js --runInBand
```

## Working Agreement

- User = high-school student named **Omar** (1 day/week on this project). «صالح حسين / جوكر اللغة العربية» is the **demo teacher persona** of the platform — the user is Omar; never address the user as Salih.
- Work in **small verifiable steps**; commit after each working task
- Explain security-critical code line-by-line when asked
- **Never claim success without `pnpm build` passing and showing output**
- Prefer small PRs over big rewrites

## LMS Core — Verified Behavior

### Progression by entry

- **ENTER_ASSIGNMENT** unlocks the linked exam lesson.
- **ENTER_EXAM** unlocks the next lesson.
- No score-based prerequisite and no pass requirement.
- Only these two unlock types are active. `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, and manual unlocks are extension points.
- Grants are server-side, per student, stored in `student_lesson_unlocks`, and protected by `@@unique([tenantId, userId, lessonId])`.
- The frontend never decides lock state and the API never accepts a client-supplied unlocked state.

### Assignment timer and submission

- Default timer: **300 minutes (5 hours)**; configurable per assignment, maximum 10,080 minutes.
- Starting an assignment creates an `AssignmentSubmission` row with status `IN_PROGRESS`, a server-set `startedAt`, and `submittedAt = null`.
- `expiresAt` is derived as `startedAt + timerMinutes`; it is not a stored column.
- The frontend displays only derived remaining time. Refresh/resume returns the same active row.
- Submitting sets `submittedAt` and moves the status to `SUBMITTED` (on time), `LATE` (allowed late), or `REJECTED` (late disallowed); teacher grading writes score + feedback and `GRADED`/`RETURNED`.
- Each attempt is unique by `(assignmentId, studentId, attemptNumber)`; `maxAttempts` is enforced server-side. A student may have one active attempt at a time; a concurrent duplicate start returns `409`.
- In-progress attempts never enter the teacher grading queue, and the student history includes them with `submittedAt: null`.
- **Production uses the attempt model** (migration #8, applied 28 October 2026): unique on `(assignmentId, studentId, attemptNumber)`, `startedAt` is the timer start, and `submittedAt` is nullable while in progress. The production smoke verified attempt 1 → submit → attempt 2 → submit → third start `400` at `maxAttempts=2`; concurrent starts returned `201`/`409`.

### Exam timer and attempt

- Default timer: **70 minutes (4,200 seconds)**.
- `expiresAt` is derived from `startedAt + timerMinutes`; no `expiresAt` column exists on `ExamAttempt`.
- Actual states: `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `TIMED_OUT`, `CANCELLED`.
- The student client auto-submits when the timer reaches zero. The API records a late submission as `TIMED_OUT`; there is no background auto-submit worker.
- Question types: MCQ, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING.
- Correct answers are never returned in the student exam view.
- On refresh, the timer is recomputed from `startedAt`; the server clock is authoritative.

### Assignment/exam progression rules

- `ENTER_ASSIGNMENT` unlocks the linked exam.
- `ENTER_EXAM` unlocks the next lesson.
- No score or pass requirement is attached to progression.

### Content Unlock Security

- Frontend MUST NOT control unlock state
- Never accept `lockStatus: "UNLOCKED"` from student
- Unlock decisions happen on server:
  - Student Request → Auth → Tenant → Authorization → Enrollment → Entitlement → Business Rule → Transaction → Progression Update → Audit/Event

### Idempotency for Progression

- Progression updates must be idempotent
- Use idempotency keys for unlock operations
- Database constraints prevent duplicate unlocks
- Transaction + database constraints protect against concurrent requests

### Content Unlock Types (Active vs Future)

- **Active now**: ENTER_ASSIGNMENT, ENTER_EXAM
- **Future extension points**: COMPLETE_ASSIGNMENT, COMPLETE_EXAM, PASS_EXAM, SCORE_THRESHOLD, TIME_ELAPSED, MANUAL

## Repo Structure

```text
learning-platform/
├── AGENTS.md                    ← this file
├── README.md                    ← public overview
├── SECURITY.md                  ← vulnerability reporting
├── docs/
│   ├── CURRENT-STATE.md         ← canonical verified snapshot
│   ├── STATUS.md                ← short status dashboard
│   ├── ARCHITECTURE.md          ← current runtime architecture
│   ├── DEPLOY.md                ← Vercel/Railway/RLS runbook
│   ├── SECURITY.md              ← threat model and controls
│   ├── VISUAL_IDENTITY.md       ← design system / Heritage Manuscript
│   ├── COMMAND-CENTER.md        ← student dashboard contract
│   ├── VIDEO_PROTECTION.md      ← video protection spec + limits
│   ├── DEMO.md                  ← demo runbook
│   ├── DEMO-SCRIPT.md           ← honest demo script
│   ├── GOVERNANCE.md            ← ports/branches/commit gates
│   ├── PROJECT_STATE.md         ← Arabic status brief
│   └── AUDIT-2026-10-16.md      ← historical audit (dated snapshot)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── Dockerfile                   ← Railway API build
├── railway.json                 ← DOCKERFILE builder
├── docker-compose.yml           ← local PostgreSQL + Redis
├── apps/
│   ├── api/                     ← NestJS 10 API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/      ← 7 on production; 8 on the retakes branch
│   │   └── src/modules/         ← 13 domain modules
│   └── web/                     ← Next.js 15 App Router
│       └── app/                 ← 35 pages, student/teacher/public
├── packages/
│   ├── design-system/           ← @lp/design-system tokens
│   └── motion/                  ← @lp/motion tokens
├── docker/postgres/init/        ← local app_user bootstrap
└── scripts/                     ← ports/dev helpers
```

## Key Files to Know

| File                                                                 | Purpose                                                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                                      | All Prisma models + enums                                                                                                                                                      |
| `apps/api/prisma/migrations/`                                        | 7 production migrations: baseline `0_init` (42 tables) + `lms_rls` + `auth_cookie_sessions` + `rls_hardening` + `tenant_resolution_fn` + `webhook_raw_payload` + `student_lesson_unlocks`; the retakes branch adds `assignment_retakes` as #8 |
| `apps/api/src/common/prisma/tenant-context.ts`                       | AsyncLocalStorage tenant scope + `applyTenantContext()` for interactive transactions                                                                                           |
| `apps/api/src/modules/tenants/prisma.service.ts`                     | Prisma `$extends` proxy — injects `app.tenant_id` per operation inside a request scope                                                                                         |
| `apps/api/src/modules/tenants/tenant-resolver.middleware.ts`         | Resolves Host → tenant (SECURITY DEFINER fn) and runs the request in the tenant scope                                                                                          |
| `apps/api/test/rls-isolation.e2e-spec.ts`                            | Isolation proof of record — runs with `RLS_ADMIN_URL` + `RLS_APP_URL` (5/5 green live)                                                                                         |
| `apps/api/src/modules/authorization/policy-engine.ts`                | Central `can(user, action, resource)`                                                                                                                                          |
| `apps/api/src/modules/entitlements/entitlements.service.ts`          | Entitlement grants/checks                                                                                                                                                      |
| `apps/api/src/modules/video-protection/services/watermark-engine.ts` | Deterministic watermark positions                                                                                                                                              |
| `apps/api/src/modules/payments/payment-orchestrator.service.ts`      | Order → Intent → Provider → Ledger flow                                                                                                                                        |
| `docs/CURRENT-STATE.md`                                              | Canonical current state — release, tests, shipped surface, known gaps                                                                                                          |
| `docs/STATUS.md`                                                     | Short status dashboard and acceptance criteria for open gaps                                                                                                                  |
| `docs/DEPLOY.md`                                                     | Vercel/Railway deployment, migrations, RLS activation runbook                                                                                                                 |
| `docs/AUDIT-2026-10-16.md`                                           | Historical audit (dated snapshot) — use `CURRENT-STATE.md` for current claims                                                                                                 |
| `apps/web/app/lib/dashboard.ts`                                      | Pure dashboard math for `/student` (progress, stats, streak, badges, agenda) — 26 unit tests in `dashboard.test.ts`                                                            |
| `apps/web/app/lib/theme.ts` + `theme-provider.tsx`                   | Theme key/bootstrap + provider/toggle; all light rules live in `apps/web/app/globals.css` under `html[data-theme="light"]`                                                     |
| `apps/web/app/student/components/command-center/widgets.tsx`         | Student Command Center widgets — every number derives from server payloads; no mock/fabricated data                                                                            |
| `apps/web/app/student/courses/[id]/`                                 | Heritage Manuscript curriculum board — real task counts, task chips, progress, direct links                                                                                    |
| `apps/web/app/student/lessons/[id]/`                                 | Lesson workspace — video, exam brief, assignment brief, locked-video prerequisite state                                                                                       |
| `docs/COMMAND-CENTER.md`                                             | Student Command Center spec — data sources, design rules, focus mode, deferred widgets                                                                                         |

---

**Source of truth for all agents.** Update this file when architecture decisions change.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
