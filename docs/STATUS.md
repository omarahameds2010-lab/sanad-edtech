<div align="center">

# 📊 Project Status

### _Single source of truth for "where are we?" — updated from live code inventory, not memory._

[![Build](https://img.shields.io/badge/Build-pnpm-green?style=for-the-badge&logo=turborepo&logoColor=white)](#-verified-i-ran-it-and-showed-the-output)
[![Overall](https://img.shields.io/badge/Overall-68_Percent-yellow?style=for-the-badge)](#-track-dashboard-verified-2026-10-08)
[![Docs](https://img.shields.io/badge/Docs-World_class-blue?style=for-the-badge&logo=markdown&logoColor=white)](../README.md)

**Overall: ~70% to a live v1.0 — still a judgment figure; the audit table below is the verified truth. (Night 17 Oct: `pnpm build` green 4/4; suites **276/276 api** (28 suites) + 51/51 web; P0 closed; **P1 isolation core + payment webhooks + per-student progression + payment funnel (A) + webhook round trip (B) landed and live-proven on local PostgreSQL 17** — baseline migrations (7/7 from scratch), 138-policy RLS + runtime injection, JWT↔Host binding, webhook HTTP smoke 11/11, funnel HTTP smoke 23/23, bundle-B round-trip smoke 25/25.)** (code written ≈ 84% · verified ≈ 66% — first live DB + HTTP runs done locally; Railway activation still pending)

_Last inventoried: 2026-10-10 · Method: glob/grep/read + full jest runs (api 164/165 — 1 failure is teammate rotation WIP; web 43/43) + tsc green both packages · Overall = mean of 12 tracks (801/12 ≈ 67) · 🆕 = this session_

</div>

---

## 🚨 2026-10-16 FIELD AUDIT — READ FIRST (supersedes status claims below)

> Full report: [`docs/AUDIT-2026-10-16.md`](AUDIT-2026-10-16.md) · Method: full code read (5 parallel deep-dives) + `tsc --noEmit` + git history checks. Nothing re-run live (no DB). No files changed during the audit.

**Verified blockers — do not demo before fixing these:**

| #   | Blocker                                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 🟡 Rotation pending (disk cleaned)        | ✅ `prisma.service.ts` fixed & pushed in `78b9d69` (env-based, escapes fixed). ✅ Cleaned same day: seed-file working copy reverted (rlwy = 0), `apps/api/srv.txt` + junk file deleted — `git status` clean. Git history was never compromised (`git log -S` = 0). **Rotate the Railway password by hand (dashboard).**                                                                                                                                                                                                                                                                                                                                                          |
| 2   | ✅ Feature flags — FIXED (e9227bc)        | `PolicyEngine.checkFeatureFlags` now accepts both raw booleans and `{enabled,value}` objects (fix `e9227bc`); regression tests added — 179/179 api.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3   | ✅ RLS landed + live-proven (local)       | `cb23a97` + `95020fe`: 134 camelCase policies on all 42 app tables then — **138/43** after #6 (FORCE; only `_prisma_migrations` exempt); broken `init_rls.sql` deleted; `app_resolve_tenant_by_domain` SECURITY DEFINER; runtime injects `app.tenant_id` per op (ALS + Prisma `$extends`). Repo `rls-isolation.e2e-spec.ts` green **5/5 as `app_user`** on live PG17. ⏳ Enforcement activates when the runtime URL points at `app_user` — pending on Railway.                                                                                                                                                                                                                   |
| 4   | ✅ `migrate deploy` — fixed (`618aa0a`)   | real baseline `0_init` (42 tables) + `migration_lock.toml` committed; verified from a fresh PostgreSQL 17 (5/5 then; 6/6 after `webhook_raw_payload`; **7/7** after `student_lesson_unlocks` — re-verified from scratch 17 Oct) (closes audit §8).                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5   | ✅ Payment webhooks — FIXED 17 Oct        | `d22379b`: rawBody + rawPayload column; dedup keyed on the provider event id; Buffer-body parsing + documented Paymob field-HMAC + length guards; providers register from env credentials. Live HTTP smoke **11/11** (compiled app + PG17); api 224/224; fresh chain 6/6; RLS 5/5. **Round trip closed by bundle B (`035a838`+`7ebc124`)**: HMAC-signed callback → PAID → CONFIRMED → ledger + entitlement + intent SUCCEEDED in ONE transaction; PENDING claims resume; orphan paid events FAIL as `INTENT_NOT_FOUND`; a processing rejection no longer crashes the API. Bundle-B smoke 25/25; api 276/276 (audit §13, §16). Remaining: refund/callback routes + video webhook. |
| 6   | ✅ Per-student progression — FIXED 17 Oct | `e0ab627`: new `student_lesson_unlocks` (43rd table) with UNIQUE (tenantId,userId,lessonId) + 4 RLS policies; ENTER writes per-student grants in ONE `$transaction` (`skipDuplicates` = idempotent); single progression call (service) with the real `unlocked`; `getNextLesson` tenant-scoped. Live DB checks 15/15 as `app_user`; api 229/229; fresh chain 7/7.                                                                                                                                                                                                                                                                                                                |
| 7   | ✅ Student data leaks — FIXED 16 Oct      | `58aee23`: student views now query ONLY the caller's rows (parent fetched without the collection include + scoped `findMany` with `studentId`); 6 regression tests fail on the old code, pass on the new; full api 193/193.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 8   | ✅ Enroll route — FIXED 16 Oct            | `84db5e1`: `STUDENT` now carries `enroll` in the RBAC matrix; the unguarded duplicate `/v1/student/enrollments` route is deleted — the official guarded route is the only path. 8 new tests (2 fail on old code / green on new); api 201/201; build 4/4.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 9   | ✅ Payment funnel — FIXED 17 Oct          | `ee766e2` (bundle A): `POST /orders` was 400-always (`number !== bigint` — always true) → BigInt-safe `toBigIntMinor`; money leaves JSON as **strings** (`BigInt.prototype.toJSON` patch); idempotency keys **renew in place** instead of P2002; intent looked up by `(tenantId, idempotencyKey)` + replay/resume; intent settles to `SUCCEEDED` in-transaction. Live HTTP smoke **23/23**; api **268/268**; RLS 5/5. Remaining: bundles B (webhook round-trip) / C (money consistency) / D (LMS).                                                                                                                                                                               |

**Status number:** updated 17 Oct night: `pnpm build` green 4/4; suites — **276/276 api** (28 suites) + **51/51 web**. **P0 closed** (build, flags `e9227bc`, secret cleanup) and **P1 isolation core landed**: baseline `618aa0a`, RLS hardening + domain resolver `cb23a97`, JWT↔Host binding `f1aaa58`, runtime tenant injection `95020fe` — all live-verified on local PostgreSQL 17 (migrate deploy 7/7 fresh · **isolation e2e 5/5 as `app_user`** · 138 policies / 43 tables FORCE). Remaining: **activate on Railway** (rotate DB password by hand → apply migrations → runtime URL as `app_user`). **Audit #6 (per-student progression) fixed 17 Oct (`e0ab627`)** — `student_lesson_unlocks` (43rd table) + UNIQUE (tenantId,userId,lessonId) + 4 RLS policies; ENTER grants inside one `$transaction` (`skipDuplicates`); single progression call with real `unlocked`; live DB checks 15/15; fresh chain 7/7. **Audit #5 (payment webhooks) fixed 17 Oct (`d22379b`)** — rawBody + rawPayload + provider-keyed dedup + Paymob field-HMAC + env-derived registration; live HTTP smoke 11/11. **Audit #8 (enroll) fixed 16 Oct (`84db5e1`)** — matrix grant + unguarded duplicate removed, 8 new regression tests. **Payment funnel reopened 17 Oct (`ee766e2`, bundle A)** — BigInt-safe pricing + money-as-strings JSON + idempotency lifecycle (renew-in-place, replay, markFailed); live HTTP smoke 23/23. **Webhook round trip (bundle B) closed 17 Oct (`035a838` + `7ebc124`)** — completion is ONE transaction (entitlements + outbox join it), PENDING claims resume, orphan paid events FAIL visibly, and the live smoke's first run caught (then fixed) a queue rejection that killed the whole API; re-verified **25/25** from a clean DB. See audit §10/§12/§13/§14/§15/§16.

**Known stale claims below:** build-green statements, "RLS enforced", API port `:3000` (canonical: web `:3001` / api `:3002`), test totals.

---

## 🗺️ Track Dashboard (Verified 2026-10-09)

| #   | Track                                                          | %   | Signal (evidence, not adjectives)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | -------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend foundation (auth, RBAC, tenants, plans, outbox, audit) | 94% | 13 modules; 23 actions (`evaluate` added); `redeem` EXISTS; 🆕 **register endpoint** (`POST /api/auth/register`, STUDENT/TEACHER-only) + **course-structure** (public slug / student) + **student file** (`GET /api/users/:id`, self-scoped) + RBAC grants (`submit/exam`, `attempt+submit+evaluate/assignment`) + enroll grants entitlements; boot reaches DB-connect stage                                                                                                                                                                                                                                                                                                                         |
| 2   | Database + RLS                                                 | 90% | **42 models**; baseline `0_init` + `migration_lock.toml` (6 migrations); **134 policies live-verified** (FORCE on all 42 app tables; only `_prisma_migrations` exempt); **isolation e2e 5/5 as `app_user`** (scoped SELECT, cross-tenant writes blocked, empty context = 0 rows); runtime injection wired (ALS + `$extends`); ⏳ activation on Railway = runtime URL as `app_user`                                                                                                                                                                                                                                                                                                                   |
| 3   | LMS Core (assignments/exams/progression/timers)                | 82% | Services REAL under `courses/` + specs; HTTP layer complete (enter/submit/timer/grade/progression, guards); 🆕 course-structure service, assignment entitlement fan-out, enroll-time grants; ⚠️ `evaluate-ai` route exists but impl WIP (random scores, duplicate methods) + tree has in-progress idempotency edit — full suite green except 1 teammate rotation test; live-DB proof pending                                                                                                                                                                                                                                                                                                         |
| 4   | Payments                                                       | 84% | 22 files; 🆕 webhook receive path revived & live-smoked 11/11; 🆕 funnel reopened 17 Oct (`ee766e2`, bundle A): BigInt-safe pricing + money-as-strings JSON + intent idempotency lifecycle — HTTP smoke 23/23 (voucher create→replay→FAILED-renew→expired-renew; single payment/ledger/entitlement; no second charge on replay); Paymob field-concat HMAC + env-derived registration; 🆕 **round trip closed (bundle B `035a838`+`7ebc124`)**: HMAC-signed callback → PAID → CONFIRMED → ledger + entitlement + intent SUCCEEDED in ONE transaction; PENDING claims resume; orphan paid events FAIL visibly; queue-crash fixed; smoke 25/25; 3 stubs fail-closed; sandbox EGP run pending (bundle C) |
| 5   | Video + protection                                             | 70% | 13 files (video + video-protection); watermark/token HMAC verified; needs provider keys + live proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6   | Frontend Web                                                   | 70% | **32 `page.tsx`**, zero dead links: login + **two-step signup** (split 45/55, i18n ar/en) + **student dashboard bento** (real progress %) + exam/assignment runners + **both grading queues** + student file + lesson YouTube + public catalog/detail/enroll + teacher payments/settings/course-new; 🆕 auth-aware nav/hero (conditional CTA); remaining mocks: students LIST, analytics, teacher dashboard static                                                                                                                                                                                                                                                                                   |
| 7   | Design system                                                  | 50% | **2 packages on disk** (`design-system`, `motion`) — NOT 6 (config/types/ui/validation absent); **20 components** + full token set (colors, motion, spacing, typography, zindex, breakpoints, border) + theme; stories growing; ⚠️ `design-system` tsup build has 24 pre-existing JSX/duplicate-symbol errors — web currently consumes embedded CSS tokens in `globals.css` instead; 7 component files + `tsup.config.ts` modified uncommitted                                                                                                                                                                                                                                                       |
| 8   | Testing                                                        | 70% | **28 api spec files + 3 web test files**; **276/276 api** (17 Oct bundle B, `jest --config jest.config.js` — 39 new in bundle A + 8 in bundle B: resume/queue/entitlement-tx) + **51/51 web**; tsc green api + web; `route-paths.spec.ts` locks loop URLs; golden-flow e2e 1/1; **RLS e2e now LIVE — 5/5 as `app_user`** on PG17 (spec args bug fixed; was skipped before); ⚠️ dual jest configs — must run `jest --config jest.config.js`                                                                                                                                                                                                                                                           |
| 9   | DevOps / CI                                                    | 58% | CI jobs: typecheck, lint, **test-unit**, build, e2e refs, **deploy-preview**, release; 🆕 governance in review (`feat/governance-*`): canonical ports (web :3001, api :3002), pre-commit gates (prettier + tsc), pre-push blocks master, gitignore hardened; ⚠️ release fires on `main` but default is `master` (never runs — bug, still open)                                                                                                                                                                                                                                                                                                                                                       |
| 10  | Docs & repo hygiene                                            | 96% | README (2900+), ARCHITECTURE, SECURITY (4000+), VISUAL_IDENTITY (5000+), VIDEO_PROTECTION, 🆕 DEMO runbook + PROJECT_STATE field report (+deep); LICENSE (MIT/OMAR AHMED); root SECURITY.md; CODEOWNERS; PR/issue templates; dependabot; junk lockfiles removed                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 11  | Security hardening                                             | 52% | Real: Argon2id, rotation, HMAC ×5 surfaces, RLS, boot validator; 🆕 register validation (EG phone, role whitelist) + evaluate granted demo-only + student-file self-scoping; Open: no throttle on public auth, teacher self-register, students-list endpoint missing                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 12  | Launch readiness                                               | 5%  | No live pilot; no real EGP moved; recon never run live; no DPO/DPAs yet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

---

## 🆕 What Changed Since Last Update (Corrections — Read This First)

> The previous STATUS.md was stale and actively misleading. Corrections below, each verified:

| #   | Old (wrong/stale)                                           | Reality (verified)                                                                                                                                                                                                                                                               | Impact                                                                                                                                                          |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "`REDEEM` action missing — voucher endpoint fails auth"     | `redeem` EXISTS (`policy-engine.ts:47`)                                                                                                                                                                                                                                          | **Nobody should implement this** — it was done                                                                                                                  |
| 2   | "Implement Assignment/Exam models" listed as TODO           | Models EXIST: `Assignment`, `AssignmentSubmission`, `Exam`, `ExamQuestion`, `ExamAttempt` (schema) + services + specs under `courses/`                                                                                                                                           | Work = verify + wire, NOT create from zero                                                                                                                      |
| 3   | LMS described as "next phase, not started"                  | 7 sub-services + 8 unit specs exist; `expiresAt` logic present                                                                                                                                                                                                                   | Re-estimated 25% → **65%**                                                                                                                                      |
| 4   | Prisma "5.7.1 vs 5.22.0 mismatch"                           | `@prisma/client` pinned `5.22.0` ✅; CLI still `^5.7.1` (pin it too)                                                                                                                                                                                                             | Half-fixed, finish the job                                                                                                                                      |
| 5   | Frontend barely mentioned                                   | 17 pages + editor/upload components + vitest; teammate shipping components + stories                                                                                                                                                                                             | Frontend is ahead of docs                                                                                                                                       |
| 6   | Packages undescribed                                        | 6 workspace packages (was assumed 4)                                                                                                                                                                                                                                             | Update all architecture references                                                                                                                              |
| 7   | CI undescribed                                              | 7 jobs incl. test-unit + deploy-preview + release                                                                                                                                                                                                                                | Release-on-`main` bug found 🐛                                                                                                                                  |
| 8   | No mention of missing files                                 | ⚠️ **No `.env.example` at repo root** (`apps/api/.env.example` ✅ exists, verified with hidden-glob) · **seed script `prisma/seed-path2.ts` EXISTS** (tracked) but no `prisma/seed.ts`; `prisma.seed` config added uncommitted in `apps/api/package.json` (ts-node → seed-path2) | Restore root copy — onboarding broken without it; converge seed naming                                                                                          |
| 9   | Stale counts (pages/packages/tests/models)                  | `docs/PROJECT_STATE.md` field report (2026-10-09, `891a4fb` + `3a804af`) re-inventoried from code: **32 pages** (not 17), **2 packages** (not 6), **91/91 api + 33/33 web** (not 85), **42 models** (not 41)                                                                     | This STATUS update adopts the field-report numbers where re-verified today (pages/packages/models/specs); test totals cited as field-report history, NOT re-run |
| 10  | `evaluate-ai` 403 for all non-admin                         | `evaluate` granted to TEACHER + STUDENT (`dd0b6ee`) for demo; service still dev-random + duplicate impl                                                                                                                                                                          | Don't demo AI scores as real until Path-4 lands                                                                                                                 |
| 11  | No public registration; login routes everyone to `/student` | `POST /api/auth/register` (role-guarded) + `/signup` two-step + role-aware landing + auth-aware nav/hero                                                                                                                                                                         | Close the loop for new users                                                                                                                                    |
| 12  | Port chaos (:3000/:3001/:3002 floating)                     | Canonical lock in review: web :3001, api :3002 (config + DEMO); client default already :3002                                                                                                                                                                                     | Set `NEXT_PUBLIC_API_URL` to the api port, always                                                                                                               |
| 13  | `node_modules` "committed" claim                            | Disproven: `git ls-files` = 0 in both package node_modules dirs                                                                                                                                                                                                                  | Drop from issue list                                                                                                                                            |
| 14  | `ai/` folder vanished                                       | Was untracked — git cannot track who removed it; no code anywhere (`**/ai-evaluation*` = 0)                                                                                                                                                                                      | WIP must live on branches same-day                                                                                                                              |

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
- [x] `payments` (22 files): 6 providers (Paymob field-concat HMAC, Fawry HMAC + length guards, voucher atomic, 3 fail-closed stubs), orchestrator, ledger, webhook inbox (rawBody + rawPayload + provider-keyed dedup — live-smoked), env-derived registration, idempotency
- [x] `video` (7) + `video-protection` (6): Bunny HMAC (`bunny-stream.provider.ts:324,338,343`), watermark (`watermark-engine.ts:115,130`), tokens (`signed-token.service.ts:103,153,174,179`), sessions + risk engine
- [x] `audit` (2), `outbox` (2): audit rows, transactional outbox relay
- [x] `common/`: guards, decorators, interceptors, filters, **middleware** (tenant context pipeline)
- [x] Boot secret validation refuses defaults in prod (`main.ts:7,30`)

### Database — 42 Models + RLS (Prisma + PostgreSQL 15)

- [x] Identity: Tenant, TenantDomain, TenantConfig, User, Device, Session
- [x] Catalog: Course, Section, Lesson, Resource (+ versioning fields)
- [x] LMS: Assignment, AssignmentSubmission, Exam, ExamQuestion, ExamAttempt, Enrollment, LessonProgress
- [x] Commerce: Order, OrderItem, PaymentIntent, Payment, PaymentAttempt, Refund, LedgerEntry, WebhookEvent, IdempotencyKey, Voucher, VoucherRedemption, ReconciliationRun/Item, PaymentRiskEvent, Settlement/Item, PaymentAuditLog
- [x] Video: Video, PlaybackSession, CaptureEvent (+ SecurityEvent, Entitlement, Subscription, AuditLog, OutboxEvent)
- [x] Tenant-scoped UNIQUEs: users (phone/email), devices (fingerprint), attempts, enrollments, idempotency keys (`schema.prisma:137,155,394,514,648,998`)
- [x] RLS migrations: 178 policies (init) + 26 (lms); `app_user` (LOGIN, CRUD-only, `REVOKE BYPASSRLS`, per-table FORCE)

### Frontend Web — 32 Pages + Components (`apps/web`)

- [x] Public: landing `/`, `/teachers`, `/teachers/[slug]`, `(public)/courses`
- [x] Student: dashboard, `/lessons/[id]` (timer display = derived, server owns expiry)
- [x] Teacher: dashboard, courses (+ `[id]`, builder, preview, publish), lessons, **exams**, **assignments**, students, analytics
- [x] Components: editor, upload (TUS chunked); hooks; vitest config + shims
- [x] Command palette pattern (teacher/student registrars in earlier tree — verify current location before extending)

### Design System — 2 Packages on Disk, 20 Components

- [x] `packages/design-system`: tokens (colors, typography, spacing, motion, border, breakpoints, zindex, index) + `tokens.css` + theme/ + **20 components** (Avatar, Badge, Button, Card, DataDisplay, DataTable, Dialog, Drawer, EmptyState, FormField, Input, Loading, Modal, Select, Skeleton, Stepper, Tabs, Toast, Tooltip, Wizard) + stories (growing)
- [x] `packages/{config, motion, types, ui, validation}`: workspace scaffolding present (audit each for stub-vs-real before depending on it)

### Testing — Specs Exist & Run ✅ (Unit + 1/2 e2e Live)

- [x] **28 api spec files — 276/276 green** (`jest --config jest.config.js`, 17 Oct evening; 224 after #5, 268 after bundle A, 276 after bundle B)
- [x] **2 web test files** (`api.test.ts`, `exam.test.ts`) — 51/51 (16 Oct)
- [x] 2/2 e2e specs LIVE: `golden-flow.e2e-spec.ts` ✅ PASS (order→pay→enroll); `rls-isolation.e2e-spec.ts` ✅ **PASS 5/5 as `app_user`** on live PostgreSQL 17 (set `RLS_ADMIN_URL` + `RLS_APP_URL` against a migrated DB)

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

### Database — ✅ CLOSED 2026-10-16 locally (re-run on Railway before go-live)

- [x] `prisma migrate deploy` on clean database — **6/6 migrations, zero errors** (local PostgreSQL 17; 5/5 at `618aa0a`, re-verified 6/6 from scratch 17 Oct)
- [x] RLS actually isolates — repo `rls-isolation.e2e-spec.ts` green **5/5 as `app_user`** (scoped SELECT; cross-tenant UPDATE/DELETE = 0; cross-tenant INSERT rejected; empty context = 0 rows); policy coverage on all 42 tables verified via SQL (134 policies, FORCE)
- [x] `app_user` — non-superuser, `rolbypassrls=false` (created by `rls_hardening` behind a superuser check)
- [x] No-context connection sees 0 rows — covered by the e2e's empty-context case

### LMS Services (code present — wire + prove)

- [ ] Assignment ENTER → 300m `expiresAt` set once, stable across 3 refetches
- [ ] Exam ENTER → 70m `expiresAt` + zero answers in student DTO (contract test green)
- [ ] ENTER_ASSIGNMENT unlocks exam; ENTER_EXAM unlocks next lesson (e2e, idempotent ×10 race)
- [ ] Grading flow: submit → teacher grades → score + feedback → history rows

### Payments (webhook round trip + voucher funnel verified live; card sandbox money-path pending)

- [x] Webhook receive pipeline (rawBody → HMAC → persist rawPayload → async process → replay/dedup) — **live HTTP smoke 11/11** against the compiled API on PG17 (17 Oct, `d22379b`)
- [x] Funnel + idempotency (bundle A): number/digit-string pricing, money-as-strings JSON, same `Idempotency-Key` retry → same result with **no double charge**, FAILED-key retry renews in place (no P2002) — **live HTTP smoke 23/23** (17 Oct, `ee766e2`)
- [x] Webhook ROUND TRIP (bundle B): HMAC-signed Paymob callback → payment PAID → order CONFIRMED → double-entry ledger (2 rows) + purchase entitlement + intent SUCCEEDED, all in ONE transaction — **live smoke 25/25** incl. replay no-op, forged-signature record, crashed-attempt resume without duplicate rows, orphan `INTENT_NOT_FOUND`, and post-failure process survival (17 Oct, `035a838` + `7ebc124`)
- [ ] Paymob sandbox PAID → ledger balanced → enrollment ACTIVE (record it)
- [ ] Fawry signature path same as above
- [ ] Voucher race: 10 concurrent same-code → exactly 1 wins
- [ ] Refund → reversing entries, history untouched
- [ ] Reconciliation dry-run green on sandbox data

### Video (needs Bunny keys + real file)

- [ ] TUS upload → webhook READY → publish → token plays with watermark visible in screenshot
- [ ] Revoked session → heartbeat 401 within 15s
- [ ] Tamper (overlay removed) → HIGH risk → pause + event

---

## 🔁 THE LOOP — Endpoint Inventory (Enroll → Learn → Exam → Grade) 🆕

> The loop's brains (services) existed; its mouths (HTTP) didn't. Now both exist. Every route guarded (`JwtAuthGuard` + `RequirePermission`); every response `{ data }`; idempotency keys on ENTER/submit; ENTER chains attempt-start + progression unlock in one request.

| Step                | Endpoints                                                                                                                                                                                                                                             | Guards                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1. Enroll           | `POST /api/v1/enrollments/courses/:courseId/enroll` · `GET /api/v1/enrollments/me` · `GET /:enrollmentId` · `POST /:enrollmentId/cancel                                                                                                               | suspend                                                | reactivate`                            | `enroll` / `read` / `manage` on `enrollment` |
| 2. Learn (progress) | `GET /api/v1/student/courses/:courseId/progress` · `GET/PATCH /lessons/:lessonId/progress` · `POST /lessons/:lessonId/complete` (pre-existing ✅)                                                                                                     | `read` / `update` on `lesson`                          |
| 3a. Assignment      | CRUD + `GET /:id/view` + `POST /:id/enter` (starts 300m clock **+ unlocks exam**) + `GET /:id/timer` + `GET /:id/submissions/me` + `POST /:id/submit` + `GET /:id/submissions` (grading queue) + `POST /submissions/:sid/grade`                       | `create/read/attempt/submit/grade` on `assignment`     |
| 3b. Exam            | CRUD + `GET /:id/view` (solutions stripped server-side) + `POST /:id/enter` (starts 70m clock **+ unlocks next lesson**) + `GET /:id/timer` + `GET /:id/attempts/me` + `POST /:id/submit` + `GET /:id/attempts/grading` + `POST /attempts/:aid/grade` | `create/read/attempt/submit/grade` on `exam`/`attempt` |
| 4. Progress         | `GET /api/v1/progression/courses/:courseId` · `GET /lessons/:lessonId/next` · `POST /lessons/:lessonId/unlock                                                                                                                                         | reset` (teacher)                                       | `read` course/lesson · `manage` lesson |

**Proof:** `nest build` exit 0 (api-only) · boot resolves full DI graph (verified to DB-connect stage; no DB on this machine) · 3 pre-existing boot DI bugs found by booting and fixed (see decisions).

---

## 🚧 IN PROGRESS (No Ownerless Rows — Claim One)

- [x] **Loop HTTP layer** (4 controllers, ~30 endpoints, guards) — DONE this session, compiles + DI-verified ✅
- [x] **Boot DI trio** (AuthModule PrismaService, `@Global()` AuthorizationModule, TerminusModule) — DONE, boot reaches DB-connect ✅
- [x] **Independent test re-runs** (84/84 unit + golden-flow 1/1, exit 0) — DONE ✅
- [ ] Restore **root `.env.example`** (copy of `apps/api/.env.example`, which exists and is tracked ✅) — `prisma/seed-path2.ts` + `seed:path2` COMMITTED (`c5e92d2`); remaining: root copy + live DB boot
- [ ] Fix **release-on-`main` bug** (default branch is `master`; release job + `needs: [build, e2e]` never fire) — retarget or rename branch
- [ ] Pin Prisma CLI `5.22.0` (client already pinned; kill the `^5.7.1` drift)
- [x] Run isolation + golden-flow e2e against live DB — DONE 16 Oct (RLS **5/5 as `app_user`** on PG17; golden-flow 1/1) ✅
- [x] **Wire exam/assignment pages to the (real) services** — DONE: runners + both grading queues + student file + lesson videos + public catalog/enroll + signup + dashboard bento (frontend ↔ backend, 43 web tests) ✅
- [x] **Seed config committed** (`seed:path2` in `apps/api/package.json`, commit `c5e92d2`) — remaining: root `.env.example` copy + live DB boot
- [x] **Ports standardized** (web :3001, api :3002) — in review on `feat/governance-*` branch, NOT merged
- [ ] Audit `packages/{config,motion,types,ui,validation}`: stub or real? (delete or document each)
- [ ] Clean `../../../` cross-module imports → `@/` / workspace imports (lint rule + ratchet)
- [ ] Resolve `nestjs-pino 5.3.1` peer warning (upgrade or pin compatible)

---

## ⚠️ KNOWN ISSUES (With Severity — No Mystery Bugs)

### ✅ FIXED This Session (Verified by Boot)

- **AuthService DI**: `AuthModule` lacked `PrismaService` → app could NEVER boot (proven: identical crash with and without new code). Fixed by adding provider (repo convention).
- **AuthorizationGuard DI**: guard's `AuthorizationService` unresolvable outside `AuthorizationModule` → fixed with `@Global()` (no duplicate providers exist — checked).
- **HealthController DI**: `TerminusModule` installed but never imported → wired into `AppModule`. Boot now reaches DB-connect (fails only: no database on this machine — correct behavior).

| #   | Issue                                                                                                                                                                                                                                                                                               | Impact                                                                                                | Status                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Release job targets `main`, repo default is `master` (the `needs: [build, e2e]` part is VALID — `e2e` job exists)                                                                                                                                                                                   | Release never fires                                                                                   | 🆕 To fix (retarget `main`→`master`)                                                                                                                        |
| 2   | `.env.example` missing at root; seed naming                                                                                                                                                                                                                                                         | Root copy still missing; `seed-path2` + script COMMITTED — converge naming + restore root copy        | To fix                                                                                                                                                      |
| 3   | Prisma CLI `^5.7.1` vs client `5.22.0`                                                                                                                                                                                                                                                              | Migration/client drift risk                                                                           | To fix (pin both)                                                                                                                                           |
| 3   | Prisma CLI `^5.7.1` vs client `5.22.0`                                                                                                                                                                                                                                                              | Migration/client drift risk                                                                           | To fix (pin both)                                                                                                                                           |
| 4   | `nestjs-pino 5.3.1` peer mismatch (NestJS 10)                                                                                                                                                                                                                                                       | Build warning only                                                                                    | Acceptable, revisit on upgrade                                                                                                                              |
| 5   | Some `../../../` cross-module imports                                                                                                                                                                                                                                                               | Fragile refactors (build passes)                                                                      | Ratchet rule + cleanup                                                                                                                                      |
| 6   | Coverage gates referenced but no coverage upload in CI                                                                                                                                                                                                                                              | Ruleset coverage rule would block/float                                                               | Wire coverage upload first (see SECURITY App. D)                                                                                                            |
| 7   | ~~`node_modules` committed inside `packages/design-system`~~ — disproven 2026-10-10 (`git ls-files` = 0)                                                                                                                                                                                            | —                                                                                                     | Dropped                                                                                                                                                     |
| 8   | `evaluate-ai` half-built (uncommitted): `POST :assignmentId/evaluate-ai` route EXISTS (`assignments.controller.ts:224`), `evaluate` granted to TEACHER + STUDENT (`policy-engine.ts:50,295,320`, commit `dd0b6ee`) — but NO `modules/ai/` on disk, service is dev-mode random 70–100, zero AI tests | Demo showing AI scores today shows random numbers, not analysis                                       | Finish Path-4: fix duplicate `evaluateAssignmentWithAI` impl + real Gemini wiring + persist to grading + "قيّم بالذكاء" button (see `PROJECT_STATE.md` §13) |
| 8   | `evaluate-ai` half-built (uncommitted): `POST :assignmentId/evaluate-ai` route EXISTS (`assignments.controller.ts:224`), `evaluate` granted to TEACHER + STUDENT (`policy-engine.ts:50,295,320`, commit `dd0b6ee`) — but NO `modules/ai/` on disk, service is dev-mode random 70–100, zero AI tests | Demo showing AI scores today shows random numbers, not analysis                                       | Finish Path-4: fix duplicate `evaluateAssignmentWithAI` impl + real Gemini wiring + persist to grading + "قيّم بالذكاء" button (see `PROJECT_STATE.md` §13) |
| 9   | Dirty tree + junk logs: 16 modified files (controllers, services, layouts, `package.json`, 7 design-system files) + ~40 untracked `*-out.txt`/`build*.txt`/`.bak`/storybook WIP                                                                                                                     | Review noise; some txt logs may hold secrets                                                          | Commit-or-revert per file, then one agreed `git clean` (review before delete)                                                                               |
| 10  | P0 visual tokens applied UNCOMMITTED (`globals.css` paper/emerald, teacher/student layouts, `package.json` seed config)                                                                                                                                                                             | Looks done locally, invisible to team/CI until committed                                              | Commit as one "P0 visual + seed config" change after a green build                                                                                          |
| 11  | Uncommitted `*.txt` gitignore rule in tree                                                                                                                                                                                                                                                          | Would silently ignore `demo-scenario/README.txt` + any doc txt; lethal combined with `git clean -fdX` | Scope to explicit junk names instead                                                                                                                        |

---

## 🎯 NEXT 7 TASKS (Priority Order — Biggest % Movers First)

1. **Activate on Railway** — rotate DB password by hand → `migrate resolve --applied` (3 pre-baseline histories) → `migrate deploy` → runtime `DATABASE_URL` as `app_user` (+ flip env preference) → boot the stack there
2. ✅ **Isolation + golden-flow e2e live — DONE 16 Oct** (RLS 5/5 as `app_user` on PG17; golden-flow 1/1)
3. **Fix release-on-`main` + pin Prisma CLI** — 30-minute jobs, kill two known issues
4. **Exam ENTER e2e** (70m timer + answers-absent + unlock next lesson) — heart of the product loop
5. **Assignment ENTER e2e** (300m timer + unlock exam) + grading inbox wiring
6. **Sandbox Paymob PAID → ledger → enrollment** (recorded) — first real EGP path
7. **Audit + document the 5 non-design-system packages** (stub vs real verdict each)

---

## 📋 DECISIONS LOG (Append-Only — Newest From This Audit Marked 🆕)

| Date       | Decision                                                                                                                                                                                                         | Reason                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-03 | Modular monolith over microservices                                                                                                                                                                              | Faster dev, simpler ops; extract only when operationally needed                                                                      |
| 2026-10-03 | PostgreSQL RLS for tenant isolation                                                                                                                                                                              | Last line of defense; non-owner role prevents BYPASSRLS                                                                              |
| 2026-10-03 | Transactional outbox for events                                                                                                                                                                                  | No lost events; same transaction as business data                                                                                    |
| 2026-10-03 | Entitlements separate from feature flags                                                                                                                                                                         | Per-student access vs per-tenant toggles                                                                                             |
| 2026-10-03 | Config-over-code for tenant customization                                                                                                                                                                        | 80% of needs = JSON; no per-tenant forks                                                                                             |
| 2026-10-03 | pnpm + Turborepo monorepo                                                                                                                                                                                        | Shared packages, caching, single lockfile                                                                                            |
| 2026-10-04 | Payment provider abstraction + orchestrator                                                                                                                                                                      | Swap providers without rewriting ledger logic                                                                                        |
| 2026-10-04 | Double-entry ledger (append-only)                                                                                                                                                                                | Auditability; reconciliation foundation                                                                                              |
| 2026-10-04 | HMAC watermark + mulberry32 positions                                                                                                                                                                            | Cryptographic attribution; deterministic                                                                                             |
| 2026-10-04 | Split DATABASE_URL / MIGRATION_DATABASE_URL                                                                                                                                                                      | Runtime never superuser                                                                                                              |
| 2026-10-04 | Production secret validation on startup                                                                                                                                                                          | Fail fast on default secrets                                                                                                         |
| 2026-10-05 | Entry-based progression (ENTER → unlock)                                                                                                                                                                         | Completion over score-gates; simpler fairness                                                                                        |
| 2026-10-05 | Server-authoritative `expiresAt` timers                                                                                                                                                                          | Client time is attacker input                                                                                                        |
| 2026-10-07 | LMS services live under `courses/` (not top-level modules)                                                                                                                                                       | 🆕 Observed: assignments/exams/progression nested by domain — keep, document                                                         |
| 2026-10-07 | World-class docs tier (README + SECURITY + VISUAL_IDENTITY)                                                                                                                                                      | 🆕 Docs are a product surface; cited-to-code specs prevent drift                                                                     |
| 2026-10-07 | Repo hygiene as release gate (CODEOWNERS, templates, no junk lockfiles)                                                                                                                                          | 🆕 Protect `master` + review routing before team grows                                                                               |
| 2026-10-08 | STATUS.md rewritten from live inventory (this file)                                                                                                                                                              | 🆕 Old file misled (redeem-gone, LMS-unstarted); status must cite code                                                               |
| 2026-10-08 | Loop HTTP layer: 4 controllers under `courses/` (enrollments/assignments/exams/progression)                                                                                                                      | 🆕 Services existed without routes; ENTER endpoints chain attempt-start + progression unlock; guards on every route                  |
| 2026-10-08 | Boot trio fixed (AuthModule provider, `@Global()` AuthorizationModule, TerminusModule import)                                                                                                                    | 🆕 App had never booted (proven via stash A/B); boot now reaches DB-connect stage                                                    |
| 2026-10-08 | Independent re-verification before trusting concurrent edits (84/84 + golden-flow 1/1)                                                                                                                           | 🆕 Two people editing live files; verify-then-keep protocol (see note below)                                                         |
| 2026-10-09 | Field report `docs/PROJECT_STATE.md` adopted (`891a4fb`, `3a804af`): 32 pages / 2 packages / 42 models / 91+33 tests / no-live-DB / evaluate-ai gaps                                                             | 🆕 STATUS counts were stale; field report re-inventoried from code — adopted where re-verified today                                 |
| 2026-10-09 | `evaluate` action granted to TEACHER + STUDENT (`dd0b6ee`) for demo                                                                                                                                              | 🆕 Unblocks `POST evaluate-ai` RBAC (SUPER_ADMIN-only before); service/AI wiring still pending                                       |
| 2026-10-09 | P0 visual tokens embedded in `apps/web/app/globals.css` + layouts (UNCOMMITTED)                                                                                                                                  | 🆕 `design-system` tsup red (24 errors) so web consumes embedded CSS; commit after green build                                       |
| 2026-10-09 | `prisma.seed` → `seed-path2` via ts-node added to `apps/api/package.json` (UNCOMMITTED)                                                                                                                          | 🆕 `npx prisma db seed` runnable once a DB exists; root `.env.example` still missing                                                 |
| 2026-10-10 | STATUS → 67%: register/structure/file endpoints, RBAC submit/attempt/evaluate grants, enroll-time entitlements, signup + dashboard bento + 5 pages, governance branch (ports/gates, unmerged)                    | 🆕 Mean of 12 tracks (801/12); full runs 164/165 api + 43/43 web; tree red causes all non-loop (idempotency WIP, evaluate-ai WIP)    |
| 2026-10-10 | `*.txt` gitignore rule flagged dangerous (would swallow doc txt files)                                                                                                                                           | 🆕 Blanket ignore + `git clean -fdX` = data loss; scope to explicit junk names                                                       |
| 2026-10-16 | Real migration baseline + `migration_lock.toml` (`618aa0a`); docker init script fixed (it crashed on a FORCE list for tables that don't exist yet)                                                               | 🆕 `migrate deploy` works on a clean DB (verified 5/5 on PG17) — closes audit §8                                                     |
| 2026-10-16 | RLS hardening migration: camelCase policies on every table + FORCE + `app_user` role + SECURITY DEFINER domain resolver (`cb23a97`)                                                                              | 🆕 Old loose `init_rls.sql` was broken & never applied (snake_case columns); deleted — one source of truth                           |
| 2026-10-16 | JWT `tenantId` must match host-resolved tenant; reject otherwise (`f1aaa58`)                                                                                                                                     | 🆕 Closes cross-tenant token use (audit §3.4); 5 regression tests                                                                    |
| 2026-10-16 | Runtime tenant injection: AsyncLocalStorage + Prisma `$extends`; no-op interceptor deleted (`95020fe`)                                                                                                           | 🆕 Per-op `set_config` in short transactions without touching hundreds of call sites; interactive-tx sites call `applyTenantContext` |
| 2026-10-16 | `rls-isolation.e2e-spec.ts` fixed (Prisma raw args — direct values, not arrays) and run live: **5/5 as `app_user`**                                                                                              | 🆕 The suite had never once run green; it is now the isolation proof of record                                                       |
| 2026-10-16 | Student views locked down — no more class-wide submissions/attempts in responses (`58aee23`)                                                                                                                     | 🆕 Audit §6.2/#7: scoped `findMany` per caller + 6 regression tests that fail on the old code (api 193/193)                          |
| 2026-10-16 | Audit #8: `STUDENT` granted `enroll`; unguarded duplicate `/v1/student/enrollments` deleted — official guarded route only (`84db5e1`)                                                                            | 🆕 Web already called the official route (403 before); 8 new tests — A/B: exactly 2 fail on old code; api 201/201                    |
| 2026-10-17 | Webhooks المدفوعات أُعيدت للحياة — rawBody + عمود rawPayload + dedup بمفتاح المزود + فك غلاف Paymob + إسقاط إعادة التحقق عبر API المزود (لا يُخزَّن payment token) لصالح توقيع الـHMAC + idempotency (`d22379b`) | 🆕 الأدلة: سموك HTTP حي **11/11**؛ api 224/224؛ سلسلة 6/6 على قاعدة فارغة؛ RLS 5/5. المتبقي: refund/callback + ويب هوك الفيديو       |
| 2026-10-17 | paymob/fawry يُسجَّلان تلقائيًا من اكتمال مفاتيح البيئة؛ إعداد `payment.providers` الصريح يتقدم؛ القسائم خارج التسجيل (تُستدعى مباشرة من الـorchestrator)                                                        | 🆕 كان السجل يعطي "صفر مزودين" دائمًا → فشل دفع صامت (audit §5.3)                                                                    |
| 2026-10-17 | تحليل جسم الwebhook يقبل Buffer وstring (النست يمرر Buffer مع `rawBody: true`) — اختبار حي كشف أن Paymob كان يصنّف كل حدث `payment.unknown`                                                                      | 🆕 أول تشغيل HTTP حقيقي كشف العيب؛ اختبار انحدار يثبته                                                                               |
| 2026-10-17 | Progression لكل طالب: جدول `student_lesson_unlocks` + UNIQUE(tenantId,userId,lessonId) + 4 سياسات RLS؛ ENTER يكتب منحًا داخل `$transaction` واحدة بـ`skipDuplicates`                                             | 🆕 قلب `lockStatus` كان عالميًا لكل الميزان ودون قيد أو معاملة (audit §6.1)                                                          |
| 2026-10-17 | استدعاء progression مرة واحدة من الخدمة **قبل** تخزين استجابة الـidempotency — والاستجابة تحمل `unlocked` الحقيقي                                                                                                | 🆕 المتحكم كان يستدعيها ثانية فتُرجع صفرًا دائمًا وتخدع الواجهة (audit §6.1)                                                         |
| 2026-10-17 | أموال JSON تُسلسل كسلاسل نصية: patch مركزي لـ`BigInt.prototype.toJSON` عند الإقلاع (`ee766e2`)                                                                                                                   | 🆕 عقد موحد للواجهة والاختبارات؛ لا 500 تسلسل (bundle A)                                                                             |
| 2026-10-17 | دورة حياة مفتاح idempotency: renew in place لـFAILED/المنتهي، `markFailed` على PENDING فقط، `markCompleted` بتسلسل مستقر (`ee766e2`)                                                                             | 🆕 إزالة P2002 عند إعادة المحاولة وعدم إحراق مفتاح نجح (bundle A)                                                                    |
| 2026-10-17 | صف intent واحد لكل (tenantId, idempotencyKey): استئناف FAILED، إرجاع مبكر للمستقر، وترقية SUCCEEDED داخل معاملة الإكمال (`ee766e2`)                                                                              | 🆕 لا دفعة مزود ثانية عند replay؛ السموك الحي 23/23 (bundle A)                                                                       |
| 2026-10-17 | إكمال الويب هوك داخل معاملة واحدة: منح الاستحقاقات ونشر الأوت بوكس يستقبلان `tx`؛ فشل منتصف المسار يتراجع كاملًا والإعادة تبدأ من نظيف (`035a838`)                                                               | 🆕 "المعاملة = مصدر الحقيقة" صارت فعلية في مسار الإكمال نفسه (bundle B)                                                              |
| 2026-10-17 | claim بحالة PENDING بلا استجابة = **استئناف** لا تجاهل؛ إعادة استخدام صف الدفع القائم؛ حدث مدفوع بلا intent → FAILED بـ`INTENT_NOT_FOUND` بدل ابتلاع صامت (`035a838`)                                            | 🆕 كان انهيار جزئي يعلّق الطلب للأبد وتُبتلع إعادات المزود بلا أثر (bundle B)                                                        |
| 2026-10-17 | رفض معالجة الwebhook يُلتقط عند حدّ الطابور بعد تسجيل FAILED + errorCode — السموك الحي أثبت أن الرفض غير المعالج كان يقتل الـAPI كاملًا (`7ebc124`)                                                              | 🆕 كل فحوص السموك الأولى نجحت ثم مات السيرفر لحظات بعدها؛ إصلاح + اختبار انحدار + فحص حياة داخل السموك (bundle B)                    |
| 2026-10-17 | `retryFailedWebhooks` يستبعد `SIGNATURE_INVALID` من إعادة المعالجة (`035a838`)                                                                                                                                   | 🆕 إعادة تشغيلها كانت ستقلب صفوف التحقيق إلى PROCESSED وتُضيع الأثر (bundle B)                                                       |

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

### 🏁 Verified Output (2026-10-08 · history — NOT re-run 2026-10-09)

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

<sub>Inventoried 2026-10-10 · 32 pages (0 dead links) · 42 models · 17 api specs + 3 web tests (164/165 + 43/43) · tsc green both · overall 67% = mean of 12 tracks · next: live DB boot + merge governance + Path-4</sub>

</div>
