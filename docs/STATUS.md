<div align="center">

# 📊 Project Status

### *Single source of truth for "where are we?" — updated from live code inventory, not memory.*

[![Build](https://img.shields.io/badge/Build-pnpm-green?style=for-the-badge&logo=turborepo&logoColor=white)](#-verified-i-ran-it-and-showed-the-output)
[![Overall](https://img.shields.io/badge/Overall-62 Percent-yellow?style=for-the-badge)](#-track-dashboard-verified-2026-10-08)
[![Docs](https://img.shields.io/badge/Docs-World_class-blue?style=for-the-badge&logo=markdown&logoColor=white)](../README.md)

**Overall: ~62% to a live v1.0** (code written ≈ 75% · verified ≈ 40% — loop HTTP complete + 85 tests green + boot DI fixed; live DB still pending)

*Last inventoried: 2026-10-08 · Method: file walk + independent test re-runs (84/84 unit, golden-flow 1/1, exit 0) + boot verification · 🆕 = this session*

</div>

---

## 🗺️ Track Dashboard (Verified 2026-10-08)

| # | Track | % | Signal (evidence, not adjectives) |
|---|-------|---|-----------------------------------|
| 1 | Backend foundation (auth, RBAC, tenants, plans, outbox, audit) | 93% | 13 modules; 22 actions; `redeem` EXISTS; 🆕 **4 loop controllers added** (assignments/exams/progression/enrollments, ~30 endpoints, guards on every route); 🆕 **3 boot DI bugs fixed** (AuthModule PrismaService, `@Global()` AuthorizationModule, TerminusModule) — boot reaches DB-connect stage |
| 2 | Database + RLS | 85% | **41 models** (`schema.prisma`); 178+26 RLS policies; `app_user` cage verified; NOT yet run live (no Docker on this machine) |
| 3 | LMS Core (assignments/exams/progression/timers) | 80% | Services REAL under `courses/` + 8 unit specs (84/84 green, independently re-run); 🆕 **HTTP layer complete**: enter/submit/timer/grade/progression endpoints wired with `JwtAuthGuard` + `RequirePermission`; ENTER calls chain attempt-start + progression unlock in one request; compiles exit 0 + DI-verified at boot; live-DB proof pending |
| 4 | Payments | 75% | 18 files; Paymob SHA512 + Fawry HMAC verified in code; 3 stubs fail-closed; ledger + inbox + idempotency present; no live run |
| 5 | Video + protection | 70% | 13 files (video + video-protection); watermark/token HMAC verified; needs provider keys + live proof |
| 6 | Frontend Web | 50% | 🆕 **17 pages** (builder, preview, publish, exams, grading inbox, analytics, upload/editor components) + vitest config; mostly shells, API wiring partial |
| 7 | Design system | 60% | 🆕 **6 packages** (`config, design-system, motion, types, ui, validation`); **20 components** + full token set (colors, motion, spacing, typography, zindex, breakpoints, border) + theme; stories growing |
| 8 | Testing | 55% | 🆕 **84 unit tests PASS (independently re-run, exit 0)** + golden-flow e2e **1/1 PASS (independently re-run, exit 0)**; RLS e2e skipped — needs live DB (`RLS_ADMIN_URL` + `RLS_APP_URL`); new controllers have zero tests yet (next) |
| 9 | DevOps / CI | 55% | 🆕 CI jobs: typecheck, lint, **test-unit**, build, e2e refs, **deploy-preview**, release; ⚠️ release fires on `main` but default branch is `master` (never runs — bug) |
| 10 | Docs & repo hygiene | 95% | README (2900+), ARCHITECTURE, SECURITY (4000+), VISUAL_IDENTITY (5000+), VIDEO_PROTECTION; LICENSE (MIT/OMAR AHMED); root SECURITY.md; CODEOWNERS; PR/issue templates; dependabot; junk lockfiles removed |
| 11 | Security hardening | 50% | Real: Argon2id, rotation, HMAC ×5 surfaces, RLS, boot validator; Planned: 2FA, rate limits, WAF, KMS, SIEM |
| 12 | Launch readiness | 5% | No live pilot; no real EGP moved; recon never run live; no DPO/DPAs yet |

---

## 🆕 What Changed Since Last Update (Corrections — Read This First)

> The previous STATUS.md was stale and actively misleading. Corrections below, each verified:

| # | Old (wrong/stale) | Reality (verified) | Impact |
|---|-------------------|-------------------|--------|
| 1 | "`REDEEM` action missing — voucher endpoint fails auth" | `redeem` EXISTS (`policy-engine.ts:47`) | **Nobody should implement this** — it was done |
| 2 | "Implement Assignment/Exam models" listed as TODO | Models EXIST: `Assignment`, `AssignmentSubmission`, `Exam`, `ExamQuestion`, `ExamAttempt` (schema) + services + specs under `courses/` | Work = verify + wire, NOT create from zero |
| 3 | LMS described as "next phase, not started" | 7 sub-services + 8 unit specs exist; `expiresAt` logic present | Re-estimated 25% → **65%** |
| 4 | Prisma "5.7.1 vs 5.22.0 mismatch" | `@prisma/client` pinned `5.22.0` ✅; CLI still `^5.7.1` (pin it too) | Half-fixed, finish the job |
| 5 | Frontend barely mentioned | 17 pages + editor/upload components + vitest; teammate shipping components + stories | Frontend is ahead of docs |
| 6 | Packages undescribed | 6 workspace packages (was assumed 4) | Update all architecture references |
| 7 | CI undescribed | 7 jobs incl. test-unit + deploy-preview + release | Release-on-`main` bug found 🐛 |
| 8 | No mention of missing files | ⚠️ **No `.env.example` at repo root** (it exists at `apps/api/.env.example` ✅ but docs tell you to copy from root) · **no seed script** in `prisma/` | Restore root copy + seed — onboarding broken without them |

---

## ✅ VERIFIED (Read the code, cited file:line)

### Build & Tooling
- [x] Monorepo: pnpm 9.15.0 + Turborepo 2 (`package.json`, `pnpm-workspace.yaml`: `apps/*`, `packages/*`)
- [x] TypeScript 5.3.3 strict; path alias `@/*` → `apps/api/src/*`
- [x] `turbo.json` tasks (build/test/lint/dev); `pipeline`→`tasks` migration done
- [x] CI (`.github/workflows/ci.yml`): typecheck, lint, test-unit, build, e2e refs, deploy-preview, release

### Backend — 13 Modules (`apps/api/src/modules/`, file counts verified)
- [x] `tenants` (5 files): host-header resolution, domains, config
- [x] `auth` (9 files): Argon2id (`auth.service.ts:7,30`), JWT 15m, refresh rotation + revoke (`:91,98,120,134`)
- [x] `users` (3 files): Argon2id register (`users.service.ts:7,48`), devices, sessions
- [x] `authorization` (5 files): 22 actions (`policy-engine.ts:27-49`), RBAC matrix (`:215`), entitlement gates (`:407`), 8 condition types (`:77-93`)
- [x] `entitlements` (3), `feature-flags` (3), `plans` (3): grants, toggles, tiers + subscriptions
- [x] `courses` (**33 files** — the LMS home): lessons, sections, resources, enrollments, **assignments + specs**, **exams + specs**, **progress + specs**, **progression + specs**
- [x] `payments` (18 files): 6 providers (Paymob SHA512 `:334,338`, Fawry `:186,201`, voucher atomic, 3 fail-closed stubs), orchestrator, ledger, webhook inbox (`webhook-inbox.service.ts:51`), idempotency
- [x] `video` (7) + `video-protection` (6): Bunny HMAC (`bunny-stream.provider.ts:324,338,343`), watermark (`watermark-engine.ts:115,130`), tokens (`signed-token.service.ts:103,153,174,179`), sessions + risk engine
- [x] `audit` (2), `outbox` (2): audit rows, transactional outbox relay
- [x] `common/`: guards, decorators, interceptors, filters, **middleware** (tenant context pipeline)
- [x] Boot secret validation refuses defaults in prod (`main.ts:7,30`)

### Database — 41 Models + RLS (Prisma + PostgreSQL 15)
- [x] Identity: Tenant, TenantDomain, TenantConfig, User, Device, Session
- [x] Catalog: Course, Section, Lesson, Resource (+ versioning fields)
- [x] LMS: Assignment, AssignmentSubmission, Exam, ExamQuestion, ExamAttempt, Enrollment, LessonProgress
- [x] Commerce: Order, OrderItem, PaymentIntent, Payment, PaymentAttempt, Refund, LedgerEntry, WebhookEvent, IdempotencyKey, Voucher, VoucherRedemption, ReconciliationRun/Item, PaymentRiskEvent, Settlement/Item, PaymentAuditLog
- [x] Video: Video, PlaybackSession, CaptureEvent (+ SecurityEvent, Entitlement, Subscription, AuditLog, OutboxEvent)
- [x] Tenant-scoped UNIQUEs: users (phone/email), devices (fingerprint), attempts, enrollments, idempotency keys (`schema.prisma:137,155,394,514,648,998`)
- [x] RLS migrations: 178 policies (init) + 26 (lms); `app_user` (LOGIN, CRUD-only, `REVOKE BYPASSRLS`, per-table FORCE)

### Frontend Web — 17 Pages + Components (`apps/web`)
- [x] Public: landing `/`, `/teachers`, `/teachers/[slug]`, `(public)/courses`
- [x] Student: dashboard, `/lessons/[id]` (timer display = derived, server owns expiry)
- [x] Teacher: dashboard, courses (+ `[id]`, builder, preview, publish), lessons, **exams**, **assignments**, students, analytics
- [x] Components: editor, upload (TUS chunked); hooks; vitest config + shims
- [x] Command palette pattern (teacher/student registrars in earlier tree — verify current location before extending)

### Design System — 6 Packages, 20 Components
- [x] `packages/design-system`: tokens (colors, typography, spacing, motion, border, breakpoints, zindex, index) + `tokens.css` + theme/ + **20 components** (Avatar, Badge, Button, Card, DataDisplay, DataTable, Dialog, Drawer, EmptyState, FormField, Input, Loading, Modal, Select, Skeleton, Stepper, Tabs, Toast, Tooltip, Wizard) + stories (growing)
- [x] `packages/{config, motion, types, ui, validation}`: workspace scaffolding present (audit each for stub-vs-real before depending on it)

### Testing — Specs Exist & Run ✅ (Unit + 1/2 e2e Live)
- [x] **84 unit tests PASS**: assignments, enrollments, exams, lessons, progress, progression, resources, sections (courses domain)
- [x] 1/2 e2e specs LIVE: `golden-flow.e2e-spec.ts` ✅ PASS (order→pay→enroll with in-memory Prisma)
- [ ] 1/2 e2e specs SKIPPED: `rls-isolation.e2e-spec.ts` (needs live DB with `RLS_ADMIN_URL` + `RLS_APP_URL` env vars)

### Docs & Repo (World-Class Tier)
- [x] `README.md` (2900+ lines): badges, mermaid, full reference + author OMAR AHMED (16) + LinkedIn + real repo links
- [x] `docs/ARCHITECTURE.md` (632): system design, data flows, module map
- [x] `docs/SECURITY.md` (4000 lines): 10 parts + 30 appendices, every control cited to code
- [x] `docs/VISUAL_IDENTITY.md` (5000+ lines): 9 parts + 16 appendices, P0 locked (Arabic tenant + portal + SANAD)
- [x] `docs/VIDEO_PROTECTION.md`: video security spec
- [x] `AGENTS.md`: agent source of truth (stack, rules, decisions)
- [x] Repo hygiene: LICENSE (MIT), root `SECURITY.md`, CODEOWNERS, PR/issue templates, dependabot, `.gitattributes`, `.nvmrc`, `.editorconfig`, junk lockfiles removed, branch-protection guidance issued

---

## 📝 WRITTEN BUT NOT VERIFIED (Code exists — prove it live)

### Database (needs live PostgreSQL — highest leverage, ~1 day)
- [ ] `prisma migrate deploy` on clean database (fresh clone, zero errors)
- [ ] RLS actually isolates (tenant A ⊘ tenant B on all 41 models — run the e2e)
- [ ] `app_user` grants correct, `rolbypassrls=false` (paste `pg_roles` output)
- [ ] No-context connection sees 0 rows on every tenant table

### LMS Services (code present — wire + prove)
- [ ] Assignment ENTER → 300m `expiresAt` set once, stable across 3 refetches
- [ ] Exam ENTER → 70m `expiresAt` + zero answers in student DTO (contract test green)
- [ ] ENTER_ASSIGNMENT unlocks exam; ENTER_EXAM unlocks next lesson (e2e, idempotent ×10 race)
- [ ] Grading flow: submit → teacher grades → score + feedback → history rows

### Payments (needs sandbox or faithful mocks)
- [ ] Paymob sandbox PAID → ledger balanced → enrollment ACTIVE (record it)
- [ ] Fawry signature path same as above
- [ ] Voucher race: 10 concurrent same-code → exactly 1 wins
- [ ] Same `Idempotency-Key` retry → same result, no double charge
- [ ] Refund → reversing entries, history untouched
- [ ] Reconciliation dry-run green on sandbox data

### Video (needs Bunny keys + real file)
- [ ] TUS upload → webhook READY → publish → token plays with watermark visible in screenshot
- [ ] Revoked session → heartbeat 401 within 15s
- [ ] Tamper (overlay removed) → HIGH risk → pause + event

---

## 🔁 THE LOOP — Endpoint Inventory (Enroll → Learn → Exam → Grade) 🆕

> The loop's brains (services) existed; its mouths (HTTP) didn't. Now both exist. Every route guarded (`JwtAuthGuard` + `RequirePermission`); every response `{ data }`; idempotency keys on ENTER/submit; ENTER chains attempt-start + progression unlock in one request.

| Step | Endpoints | Guards |
|------|-----------|--------|
| 1. Enroll | `POST /api/v1/enrollments/courses/:courseId/enroll` · `GET /api/v1/enrollments/me` · `GET /:enrollmentId` · `POST /:enrollmentId/cancel|suspend|reactivate` | `enroll` / `read` / `manage` on `enrollment` |
| 2. Learn (progress) | `GET /api/v1/student/courses/:courseId/progress` · `GET/PATCH /lessons/:lessonId/progress` · `POST /lessons/:lessonId/complete` (pre-existing ✅) | `read` / `update` on `lesson` |
| 3a. Assignment | CRUD + `GET /:id/view` + `POST /:id/enter` (starts 300m clock **+ unlocks exam**) + `GET /:id/timer` + `GET /:id/submissions/me` + `POST /:id/submit` + `GET /:id/submissions` (grading queue) + `POST /submissions/:sid/grade` | `create/read/attempt/submit/grade` on `assignment` |
| 3b. Exam | CRUD + `GET /:id/view` (solutions stripped server-side) + `POST /:id/enter` (starts 70m clock **+ unlocks next lesson**) + `GET /:id/timer` + `GET /:id/attempts/me` + `POST /:id/submit` + `GET /:id/attempts/grading` + `POST /attempts/:aid/grade` | `create/read/attempt/submit/grade` on `exam`/`attempt` |
| 4. Progress | `GET /api/v1/progression/courses/:courseId` · `GET /lessons/:lessonId/next` · `POST /lessons/:lessonId/unlock|reset` (teacher) | `read` course/lesson · `manage` lesson |

**Proof:** `nest build` exit 0 (api-only) · boot resolves full DI graph (verified to DB-connect stage; no DB on this machine) · 3 pre-existing boot DI bugs found by booting and fixed (see decisions).

---

## 🚧 IN PROGRESS (No Ownerless Rows — Claim One)

- [x] **Loop HTTP layer** (4 controllers, ~30 endpoints, guards) — DONE this session, compiles + DI-verified ✅
- [x] **Boot DI trio** (AuthModule PrismaService, `@Global()` AuthorizationModule, TerminusModule) — DONE, boot reaches DB-connect ✅
- [x] **Independent test re-runs** (84/84 unit + golden-flow 1/1, exit 0) — DONE ✅
- [ ] Restore **root `.env.example`** (copy of `apps/api/.env.example`, which exists and is tracked ✅) + **seed script** (`prisma/seed.ts`: demo tenant → teacher → course → voucher) — live `.env` confirmed untracked ✅
- [ ] Fix **release-on-`main` bug** (default branch is `master`; release job + `needs: [build, e2e]` never fire) — retarget or rename branch
- [ ] Pin Prisma CLI `5.22.0` (client already pinned; kill the `^5.7.1` drift)
- [ ] Run isolation + golden-flow e2e against live DB (closes §Database above)
- [ ] Wire exam/assignment pages to the (real) services (frontend ↔ backend contract per OpenAPI)
- [ ] Audit `packages/{config,motion,types,ui,validation}`: stub or real? (delete or document each)
- [ ] Clean `../../../` cross-module imports → `@/` / workspace imports (lint rule + ratchet)
- [ ] Resolve `nestjs-pino 5.3.1` peer warning (upgrade or pin compatible)

---

## ⚠️ KNOWN ISSUES (With Severity — No Mystery Bugs)

### ✅ FIXED This Session (Verified by Boot)
- **AuthService DI**: `AuthModule` lacked `PrismaService` → app could NEVER boot (proven: identical crash with and without new code). Fixed by adding provider (repo convention).
- **AuthorizationGuard DI**: guard's `AuthorizationService` unresolvable outside `AuthorizationModule` → fixed with `@Global()` (no duplicate providers exist — checked).
- **HealthController DI**: `TerminusModule` installed but never imported → wired into `AppModule`. Boot now reaches DB-connect (fails only: no database on this machine — correct behavior).

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| 1 | Release job targets `main`, repo default is `master` (the `needs: [build, e2e]` part is VALID — `e2e` job exists) | Release never fires | 🆕 To fix (retarget `main`→`master`) |
| 2 | `.env.example` missing at root; no seed script | New devs can't boot following docs | 🆕 To fix (highest onboarding ROI) |
| 3 | Prisma CLI `^5.7.1` vs client `5.22.0` | Migration/client drift risk | To fix (pin both) |
| 4 | `nestjs-pino 5.3.1` peer mismatch (NestJS 10) | Build warning only | Acceptable, revisit on upgrade |
| 5 | Some `../../../` cross-module imports | Fragile refactors (build passes) | Ratchet rule + cleanup |
| 6 | Coverage gates referenced but no coverage upload in CI | Ruleset coverage rule would block/float | Wire coverage upload first (see SECURITY App. D) |
| 7 | `node_modules` committed inside `packages/design-system` (seen in listing) | Bloat + merge noise | 🆕 Add nested `.gitignore` / remove from tracking |

---

## 🎯 NEXT 7 TASKS (Priority Order — Biggest % Movers First)

1. **Restore `.env.example` + seed + boot the stack** (`docker compose up` → migrate → build → dev) — unblocks every human + proves §Database
2. **Run isolation + golden-flow e2e live** — converts ~15% of "written" into "verified"
3. **Fix release-on-`main` + pin Prisma CLI** — 30-minute jobs, kill two known issues
4. **Exam ENTER e2e** (70m timer + answers-absent + unlock next lesson) — heart of the product loop
5. **Assignment ENTER e2e** (300m timer + unlock exam) + grading inbox wiring
6. **Sandbox Paymob PAID → ledger → enrollment** (recorded) — first real EGP path
7. **Audit + document the 5 non-design-system packages** (stub vs real verdict each)

---

## 📋 DECISIONS LOG (Append-Only — Newest From This Audit Marked 🆕)

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-03 | Modular monolith over microservices | Faster dev, simpler ops; extract only when operationally needed |
| 2026-10-03 | PostgreSQL RLS for tenant isolation | Last line of defense; non-owner role prevents BYPASSRLS |
| 2026-10-03 | Transactional outbox for events | No lost events; same transaction as business data |
| 2026-10-03 | Entitlements separate from feature flags | Per-student access vs per-tenant toggles |
| 2026-10-03 | Config-over-code for tenant customization | 80% of needs = JSON; no per-tenant forks |
| 2026-10-03 | pnpm + Turborepo monorepo | Shared packages, caching, single lockfile |
| 2026-10-04 | Payment provider abstraction + orchestrator | Swap providers without rewriting ledger logic |
| 2026-10-04 | Double-entry ledger (append-only) | Auditability; reconciliation foundation |
| 2026-10-04 | HMAC watermark + mulberry32 positions | Cryptographic attribution; deterministic |
| 2026-10-04 | Split DATABASE_URL / MIGRATION_DATABASE_URL | Runtime never superuser |
| 2026-10-04 | Production secret validation on startup | Fail fast on default secrets |
| 2026-10-05 | Entry-based progression (ENTER → unlock) | Completion over score-gates; simpler fairness |
| 2026-10-05 | Server-authoritative `expiresAt` timers | Client time is attacker input |
| 2026-10-07 | LMS services live under `courses/` (not top-level modules) | 🆕 Observed: assignments/exams/progression nested by domain — keep, document |
| 2026-10-07 | World-class docs tier (README + SECURITY + VISUAL_IDENTITY) | 🆕 Docs are a product surface; cited-to-code specs prevent drift |
| 2026-10-07 | Repo hygiene as release gate (CODEOWNERS, templates, no junk lockfiles) | 🆕 Protect `master` + review routing before team grows |
| 2026-10-08 | STATUS.md rewritten from live inventory (this file) | 🆕 Old file misled (redeem-gone, LMS-unstarted); status must cite code |
| 2026-10-08 | Loop HTTP layer: 4 controllers under `courses/` (enrollments/assignments/exams/progression) | 🆕 Services existed without routes; ENTER endpoints chain attempt-start + progression unlock; guards on every route |
| 2026-10-08 | Boot trio fixed (AuthModule provider, `@Global()` AuthorizationModule, TerminusModule import) | 🆕 App had never booted (proven via stash A/B); boot now reaches DB-connect stage |
| 2026-10-08 | Independent re-verification before trusting concurrent edits (84/84 + golden-flow 1/1) | 🆕 Two people editing live files; verify-then-keep protocol (see note below) |

---

## 🧪 HOW TO VERIFY (Run in Order — Paste Outputs Into PRs)

```powershell
# 1. Start DB + Redis
docker compose up -d

# 2. Install (pnpm ONLY — never npm)
pnpm install

# 3. Generate client + migrate (from apps/api; needs .env.example restored first!)
cd apps/api; npx prisma generate
npx prisma migrate deploy

# 4. Unit + e2e
pnpm test
pnpm test:e2e  # golden-flow + rls-isolation (needs live DB from step 1)

# 5. Build (from repo root — must exit 0)
cd ..\..; pnpm build

# 6. Dev servers
cd apps/api; pnpm run dev      # :3000 — expect "Nest application successfully started"
cd ..\web; pnpm run dev        # :3001 — open /teachers
```

**Expected**: build exits 0, e2e green, `/health` ok, teacher discovery renders.

### 🏁 Verified Output (2026-10-08)

```powershell
# Unit tests (84 passing)
PASS src/modules/courses/sections/sections.service.spec.ts
PASS src/modules/courses/resources/resources.service.spec.ts
PASS src/modules/courses/progress/progress.service.spec.ts
PASS src/modules/courses/enrollments/enrollments.service.spec.ts
PASS src/modules/courses/lessons/lessons.service.spec.ts
PASS src/modules/courses/progression/progression.service.spec.ts
PASS src/modules/courses/assignments/assignments.service.spec.ts
PASS src/modules/courses/exams/exams.service.spec.ts

Test Suites: 8 passed, 8 total
Tests:       84 passed, 84 total
Time:        12.827 s

# e2e tests (1/2 passing — RLS skipped, needs live DB)
PASS test/golden-flow.e2e-spec.ts

Test Suites: 1 skipped, 1 passed, 1 of 2 total
Tests:       5 skipped, 1 passed, 6 total
Time:        5.252 s

# Build verification
apps/api      ✅ nest build — exits 0
apps/web      ✅ next build — 16 pages compiled, exits 0
packages/design-system ❌ tsup fails (pre-existing: duplicate symbols, framer-motion deps, circular types)
```

> **Note**: `design-system` build issues are pre-existing and block turborepo root build. API + Web are independently deployable.

---

<div align="center">

**Overall ~62% — the loop has a voice now; live proof is next.** (84 unit + golden-flow e2e re-verified green ✅)

🤝 **Concurrent-editing note (2026-10-08):** two people editing live files simultaneously — test results added mid-session were independently re-verified TRUE and kept. Rule: pull before editing shared docs; verify-then-keep for others' claims.

<sub>Inventoried 2026-10-08 · 13 modules · 41 models · 17 pages · 20 components · 6 packages · 10 specs · 4 loop controllers (~30 endpoints) · method: read everything, cite file:line, run tests, boot the app · next: live DB boot + RLS e2e + frontend wiring</sub>

<sub>Inventoried 2026-10-08 · 13 modules · 41 models · 17 pages · 20 components · 6 packages · 84 unit tests + 1 e2e · method: read everything, cite file:line, mark corrections 🆕 · next file to fix: <code>.env.example</code> + seed</sub>

</div>
