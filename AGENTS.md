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
| Cache/Queue | Redis + BullMQ (⚠️ deps installed; no processors/relay wired)                                                                                                                                |
| Storage     | Cloudflare R2 / S3                                                                                                                                                                           |
| Video       | Bunny Stream / VdoCipher (initial)                                                                                                                                                           |
| Payments    | Paymob, Fawry, Vouchers                                                                                                                                                                      |
| Monorepo    | pnpm + Turborepo                                                                                                                                                                             |
| CI/CD       | GitHub Actions                                                                                                                                                                               |
| Infra       | Docker + Terraform (later)                                                                                                                                                                   |

## ⚠️ Verified Reality (2026-10-16 Audit) — Read Before Building

> Full report: `docs/AUDIT-2026-10-16.md`. The claims above describe the intended architecture, not today's runtime. Everything below was verified by reading the code.

**Railway go-live — 2026-10-20 (API is LIVE).** API live at `https://sanad-edtech-production.up.railway.app` — verified `/api/health` **200** (`{"status":"ok","database":"up"}`), teacher login `01000000001` **200**, `/api/tenants/current` → `sanad-demo`, `/api/v1/teacher/courses` → 3 seeded courses. Two root causes fixed:
1. **Tenant middleware path bug (`9f57ee8`).** `TenantResolverMiddleware` checked `req.path.startsWith("/api/health")` — but Nest mounts `forRoutes("*")` middleware under the global prefix (`app.use("/api/*")`), and Express rewrites `req.path` to `/` inside a wildcard mount. The exemption never matched: every cloud request (including health) hit tenant resolution and 404'd with `Tenant not found` until `tenant_domains` had the host. Fix reads `req.originalUrl` (`apps/api/src/modules/tenants/tenant-resolver.middleware.ts`), regression spec `tenant-resolver.middleware.spec.ts` (4 tests), api suite **311/311**.
2. **Railway build pipeline.** Config-as-code (`railway.json`) is deprecated (Railway docs: sunset 2026-12-01; builder values now RAILPACK/DOCKERFILE only) and the Nixpacks auto-plan for this pnpm monorepo failed with `No start command could be found`. The repo now builds via a root `Dockerfile` (Railway always builds with a Dockerfile when present; `nixpacks.toml` kept as fallback) running the exact local chain: `pnpm install --frozen-lockfile --prod=false` → `pnpm --filter api exec prisma generate` → `pnpm --filter api run build` → `node apps/api/dist/src/main` (`883a853`, `892c557`). Note `tsconfig.base.json` does NOT exist at repo root — do not reference it in Docker COPY.

**Vercel go-live — 2026-10-20 (web is LIVE).** `main` was fast-forwarded to the go-live branch (`main` == `feat/go-live-deploy` == `a6f19ca`), so the Vercel project (`sanad-edtech`, Production Branch `main`) serves it: **`https://sanad-edtech.vercel.app`** — production deployment Ready and public (preview URLs stay behind Vercel Authentication). Verified live from outside: home page **200**; **`/api/health` through the domain → 200** `{"status":"ok","database":"up"}` (the `/api/*` rewrite proxies Vercel → Railway); a browser-shaped login POST through the domain reaches tenant resolution + the CSRF guard and is rejected **403** while `ALLOWED_ORIGINS` is unset — fail-closed, not silent. Root cause fixed (`a6f19ca`): the first production build ran without `API_PROXY_TARGET`, so `next.config.mjs` baked `http://localhost:3002`, and Vercel refuses to proxy to a private host (`X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE`) — every `/api/*` call on the domain 404'd (user-visible as the login screen's connection error). Both web env dependencies now have Vercel-aware fail-safe defaults — `apps/web/next.config.mjs` (proxy target → `https://sanad-edtech-production.up.railway.app`) and `apps/web/app/lib/api.ts` (browser same-origin `""`; server → production origin on Vercel because Node fetch cannot resolve relative URLs; `localhost:3002` elsewhere) — so a Vercel deploy no longer depends on env vars at all (they still override when set). Evidence: web tests **85/85**; `next build` EXIT 0 with and without `VERCEL=1`; the `VERCEL=1` routes manifest bakes destination `https://sanad-edtech-production.up.railway.app/api/:path*`. **Remaining:** none — closed the same day. `ALLOWED_ORIGINS=https://sanad-edtech.vercel.app` is set on the Railway service; note a hand-typed value was rejected until it was deleted and re-created by **pasting the clean ASCII value** (invisible Unicode marks — U+200E/U+200F/U+200B/U+FEFF — survive `.trim()` and kill the guard's exact matching; the dashboard shows them invisibly). Verified through the domain afterwards: `POST /api/auth/login` → **200** (teacher, role `TEACHER`, access token issued), `/api/tenants/current` → **200** `sanad-demo`, `/api/v1/teacher/courses` → **200** with **3** PUBLISHED courses (inside the `data` array).

**Web session persistence — 2026-10-20 (`d2d9258`, `de74f5d`).** The SPA held the access token in React memory only, so every hard reload silently emptied the authenticated pages: the teacher greeting fell back to «أستاذ», KPIs read 0, and the grading queue stayed on «جارٍ قراءة طابور التصحيح…» forever (the effects are gated on `token`). Root cause confirmed in a real browser. `AuthProvider` now restores on mount — `POST /api/auth/refresh` (HttpOnly cookie) → `GET /api/users/me` → state — and exposes a `ready` flag; the teacher layout redirects to `/login` after a failed restore (deny by default) and the student page shows the skeleton until `ready`. The greeting renders `أستاذ ${userName}`. Logout now calls `POST /api/auth/logout` first, because an in-memory logout is undone by the next reload (verified: logout → refresh **401** → `/student` shows «سجّل الدخول أولًا»). Seed names are env-overridable (`DEMO_TEACHER_NAME`, `DEMO_TENANT_NAME`) for a real teacher persona. Browser E2E: login → «صباح الخير، أستاذ صالح حسين» → reload → name + 3 published courses restored; web tests **86/86**; `next build` EXIT 0.

**Student Academic Light Mode — 2026-10-24 (`a60fc3f`, web LIVE).** The student Topbar now has a thin Moon/Sun toggle at the far left. Theme defaults to **dark**, persists in `localStorage` under `sanad:theme`, and is applied pre-paint through `html[data-theme]` (inline bootstrap in `apps/web/app/layout.tsx`, no flash). `ThemeProvider` + `useTheme()` live in `apps/web/app/lib/theme-provider.tsx`; `toggleTheme()` reads the painted DOM attribute before flipping, so the first click after reload works. Every light rule is scoped under `html[data-theme="light"]` in `apps/web/app/globals.css` (parchment `#F7F4EB/#F4EFE3`, emerald `#047857/#065F46`, ivory `#FFFFFF`, hairline `#E4E2DB`, emerald asteroids ≤ 0.04), so the graphite dark register is untouched. No backend, schema, or migration change. Local proof: web tests **101/101**; root `pnpm build` **4/4** after regenerating the stale local Prisma client (no code change); CDP QA at 1440/1000/390 across dashboard, assignment list/runner/result, courses, exams, profile, confirm dialog, and submission theater in both themes with no document-level horizontal overflow. Live: `https://sanad-edtech.vercel.app/login` includes the pre-paint theme script; the deployed production CSS contains `--hl-bg`; `/api/health` **200**.

**Seed state (Railway DB):** `pnpm seed:path2` applied with `PROD_TENANT_DOMAINS=sanad-edtech-production.up.railway.app` (teacher `01000000001` / `Joker-Arabic#2026`, student `01000000002` / `Student123!`, 3 Arabic prep courses, exam + assignment). Local `.env` `DATABASE_URL`/`MIGRATION_DATABASE_URL` reach this DB (7/7 migrations). Runtime still connects as the DB owner — **RLS activation (app_user) remains pending**.

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

- **Progression unlock types beyond ENTER_*** (COMPLETE_*/PASS_EXAM/SCORE_THRESHOLD/TIME_ELAPSED, per-student MANUAL) are still future extension points; locked lessons still return content in student views (the lock is advisory in presentation — audit §6.2).
- **Word-level answer↔review highlighting is not persisted yet.** `AssignmentSubmission` stores only `content`, `score`, and `feedback`; the result review links the student answer and teacher review with an honest aggregate bridge. Real per-word evidence spans require a migration-first change to persist and expose the evaluator's `criteria[].evidence` / `knowledge_gaps`; never simulate highlights.
- **Transactional outbox has no dispatcher** — events are written and never sent.
- **Payment webhooks work now — including the full round trip** (bundle B, `035a838` + `7ebc124`): HMAC-signed callback → PAID → CONFIRMED → ledger + entitlement + intent SUCCEEDED in ONE transaction; PENDING claims resume; orphan paid events FAIL as `INTENT_NOT_FOUND`; queue rejections cannot crash the API. Live smoke **25/25**; api **276/276**. The checkout funnel is open (`ee766e2` — see above) and refunds/refund-callbacks are live (bundle C, `69063d2` + fixes — see the refunds bullet above): live smoke **26/26**; api **307/307**. Still absent: the video webhook route.
- Canonical ports: **web :3001, api :3002** (older docs still say `:3000` in places).
- Dual jest configs: run API tests as `jest --config jest.config.js` inside `apps/api`.

**Rules that follow:**

1. P0 is closed; P1 isolation core has landed and is verified locally. Remaining P1 = **activate on Railway**: rotate the DB password by hand → apply migrations (`migrate resolve --applied` for the 3 pre-baseline histories, then `migrate deploy`) → point the runtime URL at `app_user` → flip the env preference in `prisma.service.ts`.
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
| **Versioned content (courses/lessons/exams)**                   | Published snapshots never mutate; old attempts point to old versions                    |
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

- Shared code → workspace packages under `packages/` (`@lp/ui`, `@lp/auth`, `@lp/types`, `@lp/event-contracts`)
- Each package: `package.json` with `"name"`, `"main"`, `"types"`/`"exports"`
- Root `tsconfig.base.json` + path alias `"@/*": ["apps/api/src/*"]` inside `apps/api`
- **No `../../../` cross-module imports** — use `@/modules/...` or workspace package imports
- Prisma models in `apps/api/prisma/schema.prisma`; RLS migration in `prisma/migrations/`
- Enums in Prisma schema = TypeScript enums (no string unions)

## Commands (PowerShell-safe)

```powershell
# Install deps (run from repo root)
pnpm install

# Generate Prisma client (run from apps/api)
cd apps/api; npx prisma generate

# Build all
pnpm build

# Run API in dev (from apps/api)
cd apps/api; pnpm run dev

# Docker compose (from repo root)
docker compose up -d

# Prisma migrate (from apps/api)
cd apps/api; npx prisma migrate dev --name <name>

# Tests
pnpm test
```

## Working Agreement

- User = high-school student named **Omar** (1 day/week on this project). «صالح حسين / جوكر اللغة العربية» is the **demo teacher persona** of the platform — the user is Omar; never address the user as Salih.
- Work in **small verifiable steps**; commit after each working task
- Explain security-critical code line-by-line when asked
- **Never claim success without `pnpm build` passing and showing output**
- Prefer small PRs over big rewrites

## LMS Core Requirements (New Phase)

### Content Progression System

- **Progression by Entry** (not score-based):
  - ENTER_ASSIGNMENT → unlock EXAM
  - ENTER_EXAM → unlock NEXT LESSON
- **Assignment Timer**: 300 minutes (5 hours) default
- **Exam Timer**: 70 minutes default
- No score-based unlocking, no pass requirements for progression
- Timer is server-authoritative (expiresAt is source of truth)

### Assignment Rules

- Timer starts at `startedAt = server time`, `expiresAt = startedAt + configured duration`
- Frontend only displays remaining time (never source of truth)
- Attempt lifecycle: IN_PROGRESS → SUBMITTED / EXPIRED / CANCELLED → GRADED
- Maximum attempts per assignment configurable
- Teacher grading flow: Submission → Graded (score + feedback)

### Exam Rules

- Default timer: 70 minutes (4200 seconds)
- Server-authoritative timer (expiresAt is authoritative)
- Attempt states: IN_PROGRESS, SUBMITTED, GRADED, EXPIRED, CANCELLED
- Auto-submit on expiration
- Question types: MCQ, TRUE_FALSE, SHORT_ANSWER, ESSAY, MATCHING
- Never expose correct answers to students

### Assignment/Exam Progression Rules

- ENTER_ASSIGNMENT → unlock linked Exam
- ENTER_EXAM → unlock NEXT LESSON
- No score/pass requirements for progression
- Future unlock types: COMPLETE_ASSIGNMENT, COMPLETE_EXAM, PASS_EXAM, SCORE_THRESHOLD, TIME_ELAPSED, MANUAL

### Assignment Timer

- Default: 300 minutes (5 hours / 18000 seconds)
- Server-authoritative: `expiresAt = startedAt + configured duration`
- Frontend displays remaining time only (derived from expiresAt)
- Refresh/browser restart must NOT reset timer

### Exam Timer

- Default: 70 minutes (4200 seconds)
- Server-authoritative: `expiresAt = startedAt + configured duration`
- On refresh: expiresAt unchanged
- On browser clock manipulation: server time authoritative

### Content Progression System

- **Progression by Entry** (not completion):
  - ENTER_ASSIGNMENT → unlock EXAM
  - ENTER_EXAM → unlock NEXT LESSON
- No score-based prerequisites
- No complex prerequisite engine
- Timer starts on ENTER, not on page load

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

```
learning-platform/
├── AGENTS.md                    ← this file
├── docs/
│   ├── ARCHITECTURE.md
│   ├── VIDEO_PROTECTION.md
│   ├── SECURITY.md
│   └── STATUS.md
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
├── .gitignore
├── apps/
│   ├── api/                     ← NestJS API
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   └── web/                     ← Next.js (later)
├── packages/
│   ├── ui/                      ← shared UI components
│   ├── auth/                    ← shared auth utilities
│   ├── types/                   ← shared TypeScript types
│   └── event-contracts/         ← domain event schemas
└── docker-compose.yml
```

## Key Files to Know

| File                                                                 | Purpose                                                                                                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                                      | All Prisma models + enums                                                                                                                                                      |
| `apps/api/prisma/migrations/`                                        | 7 migrations: baseline `0_init` (42 tables) + `lms_rls` + `auth_cookie_sessions` + `rls_hardening` + `tenant_resolution_fn` + `webhook_raw_payload` + `student_lesson_unlocks` |
| `apps/api/src/common/prisma/tenant-context.ts`                       | AsyncLocalStorage tenant scope + `applyTenantContext()` for interactive transactions                                                                                           |
| `apps/api/src/modules/tenants/prisma.service.ts`                     | Prisma `$extends` proxy — injects `app.tenant_id` per operation inside a request scope                                                                                         |
| `apps/api/src/modules/tenants/tenant-resolver.middleware.ts`         | Resolves Host → tenant (SECURITY DEFINER fn) and runs the request in the tenant scope                                                                                          |
| `apps/api/test/rls-isolation.e2e-spec.ts`                            | Isolation proof of record — runs with `RLS_ADMIN_URL` + `RLS_APP_URL` (5/5 green live)                                                                                         |
| `apps/api/src/modules/authorization/policy-engine.ts`                | Central `can(user, action, resource)`                                                                                                                                          |
| `apps/api/src/modules/entitlements/entitlements.service.ts`          | Entitlement grants/checks                                                                                                                                                      |
| `apps/api/src/modules/video-protection/services/watermark-engine.ts` | Deterministic watermark positions                                                                                                                                              |
| `apps/api/src/modules/payments/payment-orchestrator.service.ts`      | Order → Intent → Provider → Ledger flow                                                                                                                                        |
| `docs/AUDIT-2026-10-16.md`                                           | Latest verified reality (2026-10-16) — read before trusting any other doc                                                                                                      |
| `apps/web/app/lib/dashboard.ts`                                      | Pure dashboard math for `/student` (progress, stats, streak, badges, agenda) — 26 unit tests in `dashboard.test.ts`                                                            |
| `apps/web/app/lib/theme.ts` + `theme-provider.tsx`                   | Theme key/bootstrap + provider/toggle; all light rules live in `apps/web/app/globals.css` under `html[data-theme="light"]`                                                     |
| `apps/web/app/student/components/command-center/widgets.tsx`         | Student Command Center widgets — every number derives from server payloads; no mock/fabricated data                                                                            |
| `docs/COMMAND-CENTER.md`                                             | Student Command Center spec — data sources, design rules, focus mode, deferred widgets                                                                                         |

---

**Source of truth for all agents.** Update this file when architecture decisions change.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
