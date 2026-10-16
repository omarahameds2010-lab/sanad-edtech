# Learning Platform — Agent Memory & Rules

## Project Overview

**Multi-tenant white-label learning platform for Egyptian teachers.** One core platform → many teachers (tenants). Each teacher gets their own domain, branding, courses, students, payments, analytics, without forking code.

## Stack

| Layer       | Technology                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Web         | Next.js 15 (pinned `^15.0.0`) + App Router + TypeScript                                                                                      |
| API         | NestJS 10 (modular monolith)                                                                                                                 |
| DB          | PostgreSQL + Prisma ORM                                                                                                                      |
| Auth        | JWT (short access) + rotating refresh tokens (HttpOnly cookies)                                                                              |
| Isolation   | Shared DB + `tenant_id` + **PostgreSQL RLS (FORCE ROW LEVEL SECURITY)** — ⚠️ designed, NOT wired at runtime yet (see Verified Reality below) |
| Cache/Queue | Redis + BullMQ (⚠️ deps installed; no processors/relay wired)                                                                                |
| Storage     | Cloudflare R2 / S3                                                                                                                           |
| Video       | Bunny Stream / VdoCipher (initial)                                                                                                           |
| Payments    | Paymob, Fawry, Vouchers                                                                                                                      |
| Monorepo    | pnpm + Turborepo                                                                                                                             |
| CI/CD       | GitHub Actions                                                                                                                               |
| Infra       | Docker + Terraform (later)                                                                                                                   |

## ⚠️ Verified Reality (2026-10-16 Audit) — Read Before Building

> Full report: `docs/AUDIT-2026-10-16.md`. The claims above describe the intended architecture, not today's runtime. Everything below was verified by reading the code.

**Credential incident — resolved; rotation pending (2026-10-16 evening).** Commit `78b9d69` (pushed) fixed `apps/api/src/modules/tenants/prisma.service.ts` to read `MIGRATION_DATABASE_URL` / `DATABASE_URL` from env. Same day: the working-tree leak in `apps/api/prisma/seed-path2.ts` was reverted and `apps/api/srv.txt` deleted — `git status` clean, git history never contained the secret. **By hand only:** rotate the Railway DB password in the dashboard. Never paste credentials into source, logs, or chat.

**Not true in runtime code yet (despite this file):**

- **RLS is NOT enforced.** `setTenantContext` has zero call sites; `TenantContextInterceptor` is a no-op; migrations FORCE only 6 tables; `init_rls.sql` is a loose file Prisma ignores. Tenant isolation today = every query must carry `tenantId`. Never write a query without it.
- **Feature flags — FIXED 2026-10-16 (`e9227bc`).** `checkFeatureFlags` accepts both raw booleans and `{enabled,value}` objects (regression was `=== true` → every gated action 403 `FEATURE_DISABLED`). Regression tests cover both shapes.
- **Progression unlocks are GLOBAL per tenant** (`Lesson.lockStatus`), not per-student, not transactional. No `UnlockRule` table exists.
- **Transactional outbox has no dispatcher** — events are written and never sent.
- **Payment webhooks cannot work** (no `rawBody: true`; payload never stored). No refund/callback HTTP routes exist.
- **`prisma migrate deploy` fails on a fresh DB** — no baseline migration exists.
- **JWT `tenantId` is never matched against the request Host** — cross-tenant token use is possible until RLS/token binding land.
- Canonical ports: **web :3001, api :3002** (older docs still say `:3000` in places).
- Dual jest configs: run API tests as `jest --config jest.config.js` inside `apps/api`.

**Rules that follow:**

1. Fix the P0 blockers (audit §10) before any new feature work.
2. Claims about RLS / flags / outbox / webhooks must cite working code — not intent.
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

- User = high-school student, 1 day/week on this project
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

| File                                                                 | Purpose                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                      | All Prisma models + enums                                                 |
| `apps/api/prisma/migrations/20240101000000_init_rls.sql`             | ⚠️ RLS policies — loose file Prisma ignores; not applied (audit §3.3)     |
| `apps/api/src/modules/tenants/prisma.service.ts`                     | `setTenantContext()` helper — ⚠️ zero call sites today                    |
| `apps/api/src/common/interceptors/tenant-context.interceptor.ts`     | ⚠️ no-op today — tenant context is never actually set                     |
| `apps/api/src/modules/authorization/policy-engine.ts`                | Central `can(user, action, resource)`                                     |
| `apps/api/src/modules/entitlements/entitlements.service.ts`          | Entitlement grants/checks                                                 |
| `apps/api/src/modules/video-protection/services/watermark-engine.ts` | Deterministic watermark positions                                         |
| `apps/api/src/modules/payments/payment-orchestrator.service.ts`      | Order → Intent → Provider → Ledger flow                                   |
| `docs/AUDIT-2026-10-16.md`                                           | Latest verified reality (2026-10-16) — read before trusting any other doc |

---

**Source of truth for all agents.** Update this file when architecture decisions change.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
