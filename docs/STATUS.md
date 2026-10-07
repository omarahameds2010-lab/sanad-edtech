# Project Status

## ✅ VERIFIED (I ran it and showed the output)

### Build & Tooling
- [x] `pnpm build` exits 0 with no TypeScript errors (shown above)
- [x] `pnpm install` works (shown in earlier output)
- [x] `npx prisma generate` works (shown above)
- [x] Turbo tasks config fixed (`pipeline` → `tasks`)

### Core Platform (Typescript compiles)
- [x] Monorepo: pnpm + Turborepo (tasks fixed)
- [x] NestJS API with modular structure
- [x] PostgreSQL + Prisma ORM schema (all models defined)
- [x] JWT auth (access + rotating refresh tokens, HttpOnly cookies)
- [x] Authorization: `PolicyEngine` + `AuthorizationGuard` + `RequirePermission` decorators
- [x] Feature Flags: plan rules + tenant overrides
- [x] Entitlements: grants/checks per resource (code compiles)
- [x] Plans: Free/Starter/Pro/Business/Enterprise with limits
- [x] Subscriptions: trial/active/canceled states
- [x] Transactional Outbox pattern (code compiles)
- [x] Idempotency keys for financial mutations (code compiles)
- [x] Audit logging for sensitive actions (code compiles)

### Database Schema (Prisma + PostgreSQL + RLS)
- [x] All core models defined: Tenants, Domains, Config, Users, Devices, Sessions
- [x] Courses, Sections, Lessons (with versioning fields)
- [x] Enrollments, LessonProgress
- [x] Exams, Attempts (with versioning)
- [x] Orders, OrderItems, PaymentIntents, Payments, PaymentAttempts
- [x] Refunds, Vouchers, VoucherRedemptions
- [x] LedgerEntries (double-entry)
- [x] WebhookEvents (inbox + replay protection)
- [x] IdempotencyKeys
- [x] ReconciliationRuns/Items
- [x] PaymentRiskEvents, SecurityEvents
- [x] Settlements, SettlementItems
- [x] PaymentAuditLogs
- [x] RLS migration file exists: `prisma/migrations/20240101000000_init_rls.sql`
- [x] App user init script: `docker/postgres/init/01-create-app-user.sql`

### Payments Module (Core - code compiles)
- [x] Provider abstraction: `PaymentProvider` interface
- [x] Paymob provider (hosted checkout, HMAC webhook verification)
- [x] Fawry provider (charge/status/refund, signature verification)
- [x] Voucher provider (atomic redeem, course entitlements)
- [x] Instapay / Vodafone Cash / e& money stubs
- [x] Provider Registry + Health checks + Smart Router
- [x] Payment Orchestrator: Order → Intent → Provider → Verified → Ledger → Enrollment
- [x] Webhook Inbox: signature verify → replay guard → persist → queue → normalize → state machine
- [x] Idempotency service (24h TTL)
- [x] Ledger service (double-entry: platform receivable / customer clearing / teacher payable)
- [x] Fraud/Risk engine (scoring: rapid attempts, device sharing, IP, amount anomaly, voucher abuse)
- [x] Payment Audit Log (with resourceType/resourceId fields added)

### Video Protection (code compiles)
- [x] `WatermarkEngine`: deterministic `mulberry32` positions, HMAC-SHA256 payload signing
- [x] `SignedTokenService`: short-lived JWT-like tokens with embedded watermark + policy
- [x] `PlaybackSessionService`: device binding, concurrent session limit, heartbeat risk scoring, capture events
- [x] Video Protection Controller: authorize/heartbeat/capture/end/verify-token endpoints
- [x] Risk engine: LOW/MEDIUM/HIGH/CRITICAL → allow/challenge/revoke

### Security Hardening (code compiles)
- [x] Production secret validation on startup (main.ts)
- [x] Docker init script creates `app_user` with minimal grants, no BYPASSRLS
- [x] `.env.example` has separate `DATABASE_URL` (app_user) and `MIGRATION_DATABASE_URL` (postgres)
- [x] Production secret validation refuses to start if defaults used

---

## 📝 WRITTEN BUT NOT VERIFIED (code compiles, but not run against real DB)

### Database (needs live PostgreSQL)
- [ ] `prisma migrate deploy` on clean database
- [ ] RLS policies actually enforce isolation (tenant A cannot read tenant B rows)
- [ ] `app_user` created with correct grants, no BYPASSRLS
- [ ] Connection with no tenant context sees 0 rows

### Tenant Isolation Tests (not yet run)
- [ ] Tenant A cannot read/update/delete Tenant B users
- [ ] Tenant A cannot read/update/delete Tenant B courses
- [ ] Tenant A cannot read/update/delete Tenant B enrollments
- [ ] Tenant A cannot read/update/delete Tenant B orders
- [ ] Connection with no tenant context sees 0 rows

### Payments (needs live providers or mocks)
- [ ] Paymob webhook HMAC verification
- [ ] Fawry webhook signature verification
- [ ] Voucher atomic redeem (concurrent safety)
- [ ] Idempotency keys prevent duplicate charges
- [ ] Reconciliation job detects mismatches
- [ ] Ledger invariants (debits = credits)

### Video Protection (needs real video/CDN)
- [ ] Signed token verification at CDN edge
- [ ] Watermark rendering in player
- [ ] Capture event detection (native apps)
- [ ] Risk engine triggers revocation

---

## 🚧 IN PROGRESS

- [ ] Add `REDEEM` action to authorization `Action` enum
- [ ] Pin single Prisma version in package.json (5.22.0)
- [ ] Run tenant isolation tests against live DB
- [ ] **Add LMS Core content types (ASSIGNMENT, EXAM, RESOURCE) to Lesson model**
- [ ] **Implement Assignment/Exam models with timers (300min/70min)**
- [ ] **Implement Content Progression System (ENTER_ASSIGNMENT → unlock EXAM, ENTER_EXAM → unlock NEXT LESSON)**
- [ ] **Implement Assignment/Exam timers with server-authoritative timing**

---

## ⚠️ KNOWN ISSUES

| Issue | Impact | Status |
|-------|--------|--------|
| `nestjs-pino 5.3.1` peer dependency mismatch with NestJS 10 | Build warning only | Acceptable for now |
| Prisma client version in package.json is 5.7.1 but 5.22.0 installed | Update package.json | To fix |
| Cross-module imports: some files still use `../../../` instead of `@/*` or workspace packages | Build works now but should clean up | To fix |
| `node_modules` previously touched by npm (now pnpm-only) | Clean install done | Resolved |
| `REDEEM` action missing from authorization `Action` type | Voucher redeem endpoint fails auth | To add |

---

## 🎯 NEXT 5 TASKS (Priority Order)

1. **Add LMS Core content types (ASSIGNMENT, EXAM, RESOURCE) to Lesson model** and update Prisma schema
2. **Implement Assignment/Exam models with timers** (300min assignment, 70min exam)
2. **Implement Content Progression System** (ENTER_ASSIGNMENT → unlock EXAM, ENTER_EXAM → unlock NEXT LESSON)
3. **Implement server-authoritative timers** (300min assignment, 70min exam)
4. **Implement Content Progression System** (ENTER_ASSIGNMENT → unlock EXAM, ENTER_EXAM → unlock NEXT LESSON)

---

## 📋 DECISIONS LOG

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-03 | Modular monolith over microservices | Faster dev, simpler ops; extract only when operationally needed |
| 2026-10-03 | PostgreSQL RLS for tenant isolation | Last line of defense; non-owner role prevents BYPASSRLS |
| 2026-10-03 | Transactional outbox for events | No lost events; same transaction as business data |
| 2026-10-03 | Entitlements separate from feature flags | Entitlements = per-student resource access; Flags = per-tenant feature toggles |
| 2026-10-03 | Config-over-code for tenant customization | 80% of cases need only JSON config; no per-tenant code forks |
| 2026-10-03 | pnpm + Turborepo monorepo | Shared packages, caching, single lockfile |
| 2026-10-04 | Payment provider abstraction + orchestrator | Swap providers without changing business logic; single source of truth for payments |
| 2026-10-04 | Double-entry ledger for payments | Auditability; reconciliation foundation |
| 2026-10-04 | Dynamic watermark with HMAC | Cryptographic attribution; tamper-evident; deterministic positions |
| 2026-10-04 | Split DATABASE_URL / MIGRATION_DATABASE_URL | Runtime never connects as superuser; defense in depth |
| 2026-10-04 | Production secret validation on startup | Fail fast if secrets not rotated |

---

## 🔑 ENVIRONMENT VARIABLES (`.env.example`)

```bash
# Database
# Runtime user (app_user) - NO superuser, NO BYPASSRLS
DATABASE_URL="postgresql://app_user:app_user_password@localhost:5432/learning_platform?schema=public"

# Migration user (postgres superuser) - ONLY for prisma migrate
MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learning_platform?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# CORS
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"

# Node
NODE_ENV="development"
PORT=3000

# Logging
LOG_LEVEL="info"

# Paymob
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""
PAYMOB_BASE_URL="https://accept.paymob.com/api"

# Fawry
FAWRY_MERCHANT_CODE=""
FAWRY_SECRET_KEY=""
FAWRY_SECURE_HASH_KEY=""
FAWRY_BASE_URL="https://atfawry.fawrystaging.com"

# Video Security - MUST be changed in production!
VIDEO_WATERMARK_HMAC_SECRET="change-in-production"
VIDEO_TOKEN_SECRET="change-in-production"
VIDEO_TOKEN_ISSUER="learning-platform"
VIDEO_TOKEN_TTL_MS="300000"

# App
APP_URL="http://localhost:3000"
LOG_LEVEL="info"
```

---

## 🐳 DOCKER COMPOSE (for local dev)

```yaml
# docker-compose.yml at repo root
services:
  postgres:
    image: postgres:15-alpine
    container_name: learning-platform-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: learning_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: >
      postgres
      -c shared_preload_libraries=pg_stat_statements
      -c pg_stat_statements.track=all
      -c max_connections=200

  redis:
    image: redis:7-alpine
    container_name: learning-platform-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Run: `docker compose up -d` from repo root.

---

## 🐳 INIT SCRIPT (auto-runs on first DB start)

File: `docker/postgres/init/01-create-app-user.sql`
- Creates `app_user` with password
- Grants only SELECT/INSERT/UPDATE/DELETE on public schema
- Revokes BYPASSRLS explicitly
- Forces RLS on all tenant-scoped tables

---

## 🧪 HOW TO VERIFY (run in order)

```powershell
# 1. Start DB
docker compose up -d

# 2. Install deps
pnpm install

# 3. Generate Prisma client (from apps/api)
cd apps/api; npx prisma generate

# 4. Run migrations
npx prisma migrate deploy

# 5. Build (from repo root)
cd ..\..; pnpm build

# 6. Run dev API
cd apps/api; pnpm run dev
```

Expected: `pnpm build` exits 0 with no TypeScript errors.