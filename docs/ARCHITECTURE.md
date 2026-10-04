# Learning Platform Architecture

## Overview
Multi-tenant white-label learning platform for Egyptian teachers. One core platform serves many teachers (tenants) with isolated data, branding, courses, students, payments, and analytics.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                            ┌────────▼────────┐
                            │   Cloudflare    │
                            │  CDN + WAF +    │
                            │  DNS + DDoS     │
                            └────────┬────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
         Static Assets           API / Web              Video CDN
              │                      │                      │
              ▼                      ▼                      ▼
         CDN Cache            Next.js + NestJS         Bunny Stream /
                              (Modular Monolith)       VdoCipher
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 16 + App Router + TypeScript |
| API | NestJS 10 (Modular Monolith) |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT (15min access) + Rotating Refresh Tokens (HttpOnly cookies) |
| Isolation | Shared DB + `tenant_id` + **PostgreSQL RLS (FORCE ROW LEVEL SECURITY)** |
| Cache/Queue | Redis 7 + BullMQ |
| Storage | Cloudflare R2 / S3 |
| Video | Bunny Stream (primary) / VdoCipher (stub) |
| Payments | Paymob, Fawry, Vouchers |
| Monorepo | pnpm + Turborepo |
| CI/CD | GitHub Actions |
| Infra | Docker + Terraform (planned) |
| Monitoring | Prometheus + Grafana + Sentry (planned) |

## Core Architectural Principles

### 1. Modular Monolith First
Not microservices from day one. Modules are isolated with clear boundaries. Extract to services only when operationally justified (independent scaling, different runtime, team ownership).

### 2. Multi-Tenancy via Shared DB + RLS
- Single PostgreSQL database
- Every tenant-scoped table has `tenant_id` column
- **PostgreSQL Row Level Security (RLS)** enforced at database level
- `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables
- Runtime user `app_user` has **no BYPASSRLS** privilege
- Tenant context set via `set_config('app.tenant_id', ..., true)` per transaction

### 3. Defense in Depth
```
Host Header → Tenant Resolution → Auth → Authorization → RLS → Database
```
No single layer is trusted. Even if application code has a bug, RLS is the last line of defense.

### 4. Transactional Outbox Pattern
All domain events written to `outbox_events` table in same transaction as business data. Separate worker publishes to message bus. No lost events.

### 5. Idempotency Keys
Every financial mutation requires `Idempotency-Key` header. 24h TTL. Prevents duplicate charges, enrollments, refunds.

### 6. Versioned Content
Courses, Lessons, Exams are immutable once published. Each publish creates a new version. Student attempts reference the exact version they started.

### 7. Entitlements ≠ Feature Flags
- **Entitlements**: Per-student resource access (granted by purchase/voucher/subscription)
- **Feature Flags**: Per-tenant feature toggles (plan rules + tenant overrides)

## Module Structure

```
apps/api/src/modules/
├── tenants/           # Tenant resolution, config, domains
├── auth/              # JWT, refresh tokens, login/register
├── users/             # User management, devices, sessions
├── authorization/     # PolicyEngine, Guards, Decorators
├── entitlements/      # Resource access grants
├── feature-flags/     # Plan rules + tenant overrides
├── plans/             # Pricing tiers, subscriptions
├── courses/           # Courses, sections, lessons
├── exams/             # Exams, questions, attempts
├── payments/          # Orders, payments, refunds, vouchers, ledger
├── video/             # Video upload, streaming, providers
├── video-protection/  # Watermark, tokens, sessions, risk
├── entitlements/      # Resource access grants
├── feature-flags/     # Feature toggles
├── plans/             # Pricing & subscriptions
├── video/             # Video management
├── video-protection/  # Security layer
├── payments/          # Payments & billing
├── audit/             # Audit logging
├── outbox/            # Transactional outbox
├── notifications/     # (planned)
├── analytics/         # (planned)
└── ...
```

## Database Design

### Core Models
- **Tenant**: Root aggregate, owns all data
- **User**: Scoped to tenant, roles (STUDENT, TEACHER, ADMIN, PARENT, SUPER_ADMIN)
- **Course/Section/Lesson**: Hierarchical content with versioning
- **Enrollment**: Student ↔ Course with dates, status
- **Exam/Question/Attempt**: Versioned exams with attempts
- **Video**: Provider-abstracted, status machine (UPLOADING→PROCESSING→READY→PUBLISHED)

### RLS Policy Pattern
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_name ON table_name
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
-- Repeat for INSERT, UPDATE, DELETE
```
All tenant-scoped tables have `FORCE ROW LEVEL SECURITY`.

### Runtime User
- `app_user` role: LOGIN, no SUPERUSER, no BYPASSRLS
- Grants: SELECT, INSERT, UPDATE, DELETE on tenant-scoped tables only
- Migration user (`postgres`) used ONLY for `prisma migrate`

## Payment Architecture

### Provider Abstraction
```typescript
interface PaymentProvider {
  createPayment(input): Promise<CreatePaymentResult>;
  getPaymentStatus(input): Promise<PaymentStatus>;
  verifyPayment(input): Promise<PaymentStatus>;
  refund?(input): Promise<RefundResult>;
  verifyWebhook(payload, headers): Promise<boolean>;
}
```

### Implemented Providers
- **Paymob**: Hosted checkout, HMAC webhook verification
- **Fawry**: Charge/status/refund, signature verification
- **Voucher**: Atomic redeem (codeHash + FOR UPDATE), course entitlements
- **Instapay/Vodafone Cash/e& money**: Stubs (official integration pending)

### Orchestration Flow
```
Order → PaymentIntent → Provider → Verified Webhook →
  Payment = PAID → Ledger + Enrollment + Outbox Events
```

### Ledger (Double-Entry)
```
Payment PAID:
  DEBIT: PLATFORM_RECEIVABLE
  CREDIT: CUSTOMER_CLEARING

Refund:
  CREDIT: PLATFORM_RECEIVABLE
  DEBIT: CUSTOMER_CLEARING

Settlement:
  DEBIT: PLATFORM_CASH
  CREDIT: TEACHER_PAYABLE
```

### Reconciliation
Daily job compares internal state vs provider state. Mismatches → investigation queue. No auto-correction.

## Video Architecture

### Provider Abstraction
```typescript
interface VideoProvider {
  createUpload(input): Promise<CreateUploadResult>;  // Direct upload URL
  getStatus(videoId): Promise<VideoStatusResult>;
  getPlaybackToken(videoId, sessionId, tenantId, studentId): Promise<PlaybackTokenResult>;
  deleteVideo(videoId): Promise<DeleteVideoResult>;
  handleWebhook(payload): Promise<void>;
  verifyWebhook(payload, headers): Promise<boolean>;
}
```

### Implemented Providers
- **BunnyStreamProvider**: TUS direct upload, HMAC webhook, JWT playback tokens
- **VdoCipherProvider**: Stub (official integration pending)

### Video State Machine
```
UPLOADING → PROCESSING → READY → PUBLISHED
                ↓
              FAILED → (retry or manual)
```

### Security Layers
1. **Direct Upload**: Browser → Provider (TUS), never through API
2. **Quotas**: Per-tenant max file size & stored hours (enforced before upload URL)
3. **Playback Token**: Short-lived JWT (2h), bound to session + student
4. **Watermark**: Deterministic HMAC-signed payload (name, phone, studentId, tenant), position via `mulberry32` PRNG
5. **Session Binding**: Device fingerprint, single active session, heartbeat risk scoring
6. **Capture Detection**: Screenshot, recording, watermark tamper, focus loss, devtools
7. **Risk Engine**: LOW/MEDIUM/HIGH/CRITICAL → allow/challenge/revoke

### Watermark Algorithm
- **Payload**: `studentName|studentPhone|studentId|tenantName|enrollmentId|issuedAt|expiresAt|seed`
- **Signature**: HMAC-SHA256 with `VIDEO_WATERMARK_HMAC_SECRET`
- **Positions**: `mulberry32` PRNG seeded per session, changes every 7s in safe zones (4-60% x, 6-82% y)
- **Client**: React overlay with tamper detection (MutationObserver + interval check)

## Security Implementation

### Authentication
- Access Token: 15min JWT (RS256), in memory
- Refresh Token: 7d, rotating, HttpOnly Secure cookie, reuse detection → revoke family
- Argon2id password hashing
- Device fingerprint tracking

### Authorization
```typescript
can(user, action, resource) // Central PolicyEngine
```
Checks: Tenant isolation → RBAC → Ownership → Entitlements → Feature Flags → Plan Limits

### Webhook Security
1. HMAC signature verification (provider-specific)
2. Replay protection: `UNIQUE(provider, external_event_id)` + inbox table
3. Idempotent processing
4. Inbox table → queue → normalize → state machine

### Secrets Management
- **Runtime**: `DATABASE_URL` (app_user), `JWT_SECRET`, `VIDEO_TOKEN_SECRET`, `VIDEO_WATERMARK_HMAC_SECRET`, provider keys
- **Migration only**: `MIGRATION_DATABASE_URL` (postgres superuser)
- **Production**: Refuses to start if any secret equals default value
- `.env` in `.gitignore`, secrets in Vault/Secret Manager in prod

### Production Hardening
- `app_user` created via Docker init script, minimal grants
- `REVOKE BYPASSRLS` explicit
- `FORCE ROW LEVEL SECURITY` on all tenant tables
- Production secret validation on startup (refuses default values)
- Structured logging: `tenantId`, `userId`, `requestId` only (no PII)

## Data Flow Examples

### Student Watches Video
```
1. GET /api/video/videos/:videoId/playback-token (sessionId)
2. Verify entitlement + enrollment + video status
3. Provider.getPlaybackToken() → signed JWT + HLS URL
3. Client (hls.js) requests manifest with token
4. CDN validates token → serves segments
5. Player renders WatermarkOverlay (HMAC-verified payload)
6. Heartbeat every 15s → risk scoring
7. Capture event → risk engine → revoke if HIGH/CRITICAL
```

### Teacher Uploads Video
```
1. POST /api/video/lessons/:lessonId/videos (metadata)
2. Check quotas (file size, stored hours)
3. Provider.createUpload() → signed TUS URL
3. Browser → Provider (TUS, direct, chunked)
4. Provider webhook → Video state: UPLOADING → PROCESSING → READY
4. Sync status → update Video record
5. Teacher publishes → status = PUBLISHED
```

### Student Buys Course
```
1. POST /api/payments/intents (orderId, paymentMethod)
2. Server calculates price, creates PaymentIntent
3. Provider.createPayment() → redirect URL / client token
3. Student pays on provider page
4. Provider webhook → verify signature → idempotency check
4. Payment = PAID → Ledger + Enrollment + Outbox
4. Outbox worker → EnrollmentService → Entitlements + Notifications
```

## Deployment

### Local Development
```powershell
docker compose up -d          # PostgreSQL + Redis
pnpm install                  # root
cd apps/api; npx prisma generate
npx prisma migrate deploy
pnpm build
cd apps/api; pnpm run dev
```

### Production Checklist
- [ ] All secrets rotated from defaults
- [ ] `MIGRATION_DATABASE_URL` used only for CI/CD migrations
- [ ] `DATABASE_URL` uses `app_user` credentials
- [ ] `app_user` created via init script, no BYPASSRLS
- [ ] `FORCE ROW LEVEL SECURITY` on all tenant tables
- [ ] `JWT_SECRET`, `VIDEO_TOKEN_SECRET`, `VIDEO_WATERMARK_HMAC_SECRET` rotated
- [ ] Provider webhook secrets configured
- [ ] Sentry + Prometheus + Grafana connected
- [ ] Backup + restore tested
- [ ] Load tested (10k concurrent students)

## Future Extraction Candidates
When operationally justified, these modules can become independent services:
1. **Video** (transcoding, CDN, DRM)
2. **Payments** (PCI compliance, provider diversity)
3. **AI** (GPU workloads, model serving)
4. **Analytics** (OLAP, heavy queries)
5. **Notifications** (email/WhatsApp/push volume)
6. **Search** (Meilisearch/Elasticsearch)

---

*Last updated: 2026-10-04*
*Source of truth: `AGENTS.md` + `docs/STATUS.md`*