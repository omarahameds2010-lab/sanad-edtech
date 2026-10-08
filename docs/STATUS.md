<div align="center">

# 📊 Project Status

### *Single source of truth for "where are we?" — updated from live code inventory, not memory.*

[![Build](https://img.shields.io/badge/Build-pnpm-green?style=for-the-badge&logo=turborepo&logoColor=white)](#-verified-i-ran-it-and-showed-the-output)
[![Overall](https://img.shields.io/badge/Overall-58 Percent-yellow?style=for-the-badge)](#-track-dashboard-verified-2026-10-08)
[![Docs](https://img.shields.io/badge/Docs-World_class-blue?style=for-the-badge&logo=markdown&logoColor=white)](../README.md)

**Overall: ~58% to a live v1.0** (code written ≈ 70% · verified live ≈ 30% — the gap IS the roadmap)

*Last inventoried: 2026-10-08 · Method: file-by-file repo walk (modules, models, pages, packages, CI) · Corrections to previous version marked with 🆕*

</div>

---

## 🗺️ Track Dashboard (Verified 2026-10-08)

| # | Track | % | Signal (evidence, not adjectives) |
|---|-------|---|-----------------------------------|
| 1 | Backend foundation (auth, RBAC, tenants, plans, outbox, audit) | 90% | 13 modules; PolicyEngine 22 actions (`authorization/policy-engine.ts:27`); `redeem` EXISTS 🆕 (old doc said missing — wrong) |
| 2 | Database + RLS | 85% | **41 models** (`schema.prisma`); 178+26 RLS policies; `app_user` cage verified; NOT yet run live |
| 3 | LMS Core (assignments/exams/progression/timers) | 65% | 🆕 Services REAL under `courses/`: assignments/exams/lessons/sections/progress/**progression**/resources + **8 unit specs**; `expiresAt` logic present (`assignments.service.ts:299+`); timers/progression NOT yet proven live |
| 4 | Payments | 75% | 18 files; Paymob SHA512 + Fawry HMAC verified in code; 3 stubs fail-closed; ledger + inbox + idempotency present; no live run |
| 5 | Video + protection | 70% | 13 files (video + video-protection); watermark/token HMAC verified; needs provider keys + live proof |
| 6 | Frontend Web | 50% | 🆕 **17 pages** (builder, preview, publish, exams, grading inbox, analytics, upload/editor components) + vitest config; mostly shells, API wiring partial |
| 7 | Design system | 60% | 🆕 **6 packages** (`config, design-system, motion, types, ui, validation`); **20 components** + full token set (colors, motion, spacing, typography, zindex, breakpoints, border) + theme; stories growing |
| 8 | Testing | 30% | 🆕 8 unit specs (courses domain) + 2 e2e specs (golden-flow, rls-isolation); **nothing run against live DB yet** |
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

### Testing — Specs Exist (Not Yet Run Live)
- [x] 8 unit specs: assignments, enrollments, exams, lessons, progress, progression, resources, sections (courses domain)
- [x] 2 e2e specs: `golden-flow.e2e-spec.ts` (order→pay→enroll), `rls-isolation.e2e-spec.ts` (A⊘B matrix)

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

## 🚧 IN PROGRESS (No Ownerless Rows — Claim One)

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

Expected: build exits 0, e2e green, `/health` ok, teacher discovery renders.

---

<div align="center">

**Overall ~58% — the foundation is real, the proof is next.**

<sub>Inventoried 2026-10-08 · 13 modules · 41 models · 17 pages · 20 components · 6 packages · 10 specs · method: read everything, cite file:line, mark corrections 🆕 · next file to fix: <code>.env.example</code> + seed</sub>

</div>
