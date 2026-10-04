# Learning Platform — Agent Memory & Rules

## Project Overview
**Multi-tenant white-label learning platform for Egyptian teachers.** One core platform → many teachers (tenants). Each teacher gets their own domain, branding, courses, students, payments, analytics, without forking code.

## Stack
| Layer | Technology |
|-------|------------|
| Web | Next.js 16 + App Router + TypeScript |
| API | NestJS 10 (modular monolith) |
| DB | PostgreSQL + Prisma ORM |
| Auth | JWT (short access) + rotating refresh tokens (HttpOnly cookies) |
| Isolation | Shared DB + `tenant_id` + **PostgreSQL RLS (FORCE ROW LEVEL SECURITY)** |
| Cache/Queue | Redis + BullMQ |
| Storage | Cloudflare R2 / S3 |
| Video | Bunny Stream / VdoCipher (initial) |
| Payments | Paymob, Fawry, Vouchers |
| Monorepo | pnpm + Turborepo |
| CI/CD | GitHub Actions |
| Infra | Docker + Terraform (later) |

## Environment Rules (Windows + PowerShell + pnpm ONLY)
- **Never** use `npm`, `head`, `tail`, `grep`, `cat`, `&&`, `||`, `>`, `<`, `|`
- **Use** `;`, `Get-Content`, `Select-String`, `Select-Object`, `>`, `tee`
- Redirect output to file first, then read: `command 2>&1 > out.txt; gc out.txt -TotalCount 50`
- pnpm only: `pnpm install`, `pnpm build`, `pnpm test`, `pnpm dev`
- `pnpm` runs from repo root; `apps/api` scripts run inside `apps/api`

## Architecture Decisions & Why
| Decision | Reason |
|----------|--------|
| **Modular Monolith first** | Faster to build, easier to extract services later when operationally justified |
| **Shared DB + `tenant_id` + RLS** | Low cost, simple migrations, single source of truth; RLS = last line of defense |
| **`app_user` role (non-owner, non-superuser)** | Prevents `BYPASSRLS`; runtime code cannot bypass isolation |
| **`set_config('app.tenant_id', ..., true)` inside transaction** | Transaction-local tenant context; no leakage via connection pooling |
| **Host-header tenant resolution** | No hardcoded domains; `tenant_domains` table maps domain → `tenant_id` |
| **Transactional Outbox** | DB commit + event in same transaction → no lost events |
| **Idempotency keys** | Every financial mutation has unique key → safe retries |
| **Versioned content (courses/lessons/exams)** | Published snapshots never mutate; old attempts point to old versions |
| **Entitlements separate from feature flags** | Entitlements = resource access (per-student); Flags = feature toggles (per-tenant/plan) |
| **Config over code for tenant customization** | Branding, limits, feature toggles via JSON config; no per-tenant code forks |
| **Transaction = source of truth** | Payment confirmed → ledger + enrollment + outbox in SAME transaction |

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
| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | All Prisma models + enums |
| `apps/api/prisma/migrations/20240101000000_init_rls.sql` | RLS policies |
| `apps/api/src/modules/tenants/prisma.service.ts` | `setTenantContext()` helper |
| `apps/api/src/common/interceptors/tenant-context.interceptor.ts` | Sets tenant context per request |
| `apps/api/src/modules/authorization/policy-engine.ts` | Central `can(user, action, resource)` |
| `apps/api/src/modules/entitlements/entitlements.service.ts` | Entitlement grants/checks |
| `apps/api/src/modules/video-protection/services/watermark-engine.ts` | Deterministic watermark positions |
| `apps/api/src/modules/payments/payment-orchestrator.service.ts` | Order → Intent → Provider → Ledger flow |

---

**Source of truth for all agents.** Update this file when architecture decisions change.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
