<div align="center">

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!--  LEARNING PLATFORM — SERIOUS INFRASTRUCTURE FOR MODERN LEARNING     -->
<!-- ═══════════════════════════════════════════════════════════════════ -->

<pre align="center">
██╗     ██████╗     ██╗     ██████╗
██║     ██╔══██╗    ██║     ██╔══██╗
██║     ██████╔╝    ██║     ██████╔╝
██║     ██╔═══╝     ██║     ██╔═══╝
███████╗██║         ███████╗██║
╚══════╝╚═╝         ╚══════╝╚═╝
<b>LEARNING PLATFORM</b>
<i>One Core Platform → Infinite Teacher Spaces</i>
</pre>

# 🎓 Learning Platform

### *Serious infrastructure for modern learning — not "another online course website."*

[![pnpm](https://img.shields.io/badge/pnpm-9.15.0-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Queue-FF6B6B?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)

[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)
[![Security](https://img.shields.io/badge/Security-Defense_in_Depth-blue?style=for-the-badge&logo=shield&logoColor=white)](docs/SECURITY.md)
[![RLS Enforced](https://img.shields.io/badge/RLS-FORCE_ROW_LEVEL_SECURITY-purple?style=for-the-badge&logo=postgresql&logoColor=white)](docs/ARCHITECTURE.md)
[![Conventional Commits](https://img.shields.io/badge/Commits-Conventional-FE5196?style=for-the-badge&logo=git&logoColor=white)](https://www.conventionalcommits.org/)
[![Powered by pnpm](https://img.shields.io/badge/pm-pnpm_only-F69220?style=for-the-badge)](https://pnpm.io/)

---

### 🌍 What is this?

> **A multi-tenant white-label learning platform for Egyptian teachers.**
> One core platform → many teachers (tenants). Each teacher gets their **own domain,
> branding, courses, students, payments, analytics** — without forking code.

|  |  |
|---|---|
| 🏛️ **Digital Institution** | Feels like infrastructure, not a template |
| 🧬 **3-Layer Identity** | Platform DNA + Subject DNA + Teacher DNA |
| 🛡️ **Secure by Default** | RLS + PolicyEngine + HMAC webhooks + audit everything |
| ⚡ **LMS Core** | Entry-based progression + server-authoritative timers |
| 💳 **Real Money** | Paymob + Fawry + Vouchers + double-entry ledger |
| 📹 **DRM-Grade Video** | Watermark + playback tokens + risk engine |

---

### ✨ 30-Second Pitch

```text
TRADITIONAL LMS                    LEARNING PLATFORM
─────────────────                  ─────────────────────────
Single tenant                      Multi-tenant white-label
Generic blue/white SaaS            Distinctive visual identity system
Score-based progression            Entry-based progression (ENTER → unlock)
Client-side timers                 Server-authoritative expiresAt
Basic video hosting                DRM-grade protection + watermark + risk
Manual payments                    Transactional orchestration + ledger
No isolation guarantees            PostgreSQL RLS (FORCE ROW LEVEL SECURITY)
```

---

### 📊 Project Pulse

| Metric | Value | Notes |
|--------|-------|-------|
| Monorepo packages | `apps/*` + `packages/*` | pnpm + Turborepo |
| API modules | 15+ | Modular monolith, clear boundaries |
| DB models | 30+ | Prisma + PostgreSQL 15 + RLS |
| Payment providers | 6 | Paymob, Fawry, Voucher + 3 stubs |
| Video providers | 2 | Bunny Stream (primary), VdoCipher (stub) |
| Auth | JWT 15m + rotating refresh 7d | HttpOnly Secure cookies, Argon2id |
| Assignment timer | 300 min (18,000s) | Server-authoritative |
| Exam timer | 70 min (4,200s) | Server-authoritative |
| Progression | ENTER_ASSIGNMENT → EXAM, ENTER_EXAM → NEXT LESSON | No score gates |
| Isolation | Shared DB + `tenant_id` + RLS FORCE | `app_user` has no BYPASSRLS |
| CI | GitHub Actions | Build + test + audit |
| License | MIT | See LICENSE |

---

### 🖼️ Product Tour (Placeholders — replace with real screenshots)

> Drop screenshots/GIFs here. Recommended size: 1280×720. Keep < 500KB each (use WebP).

| Landing | Teacher Discovery | Teacher Space |
|---------|-------------------|---------------|
| ![Landing](docs/assets/landing.png) | ![Teachers](docs/assets/teachers.png) | ![Teacher Space](docs/assets/teacher-space.png) |
| *Master identity + subject motifs* | *Teacher cards with ENTER SPACE →* | *Same platform, own environment* |

| Student Dashboard | Learning Page | Exam Experience |
|-------------------|---------------|-----------------|
| ![Student](docs/assets/student.png) | ![Learning](docs/assets/learning.png) | ![Exam](docs/assets/exam.png) |
| *What should I do next?* | *CONTENT > NAVIGATION > SECONDARY* | *Very low motion, server timer* |

| Course Builder | Analytics | Checkout |
|----------------|-----------|----------|
| ![Builder](docs/assets/builder.png) | ![Analytics](docs/assets/analytics.png) | ![Pay](docs/assets/checkout.png) |
| *Production env, not CRUD forms* | *One metric + context + trend + action* | *Order → Intent → Provider → Ledger* |

🎬 **Demo video:** `https://demo.learning-platform.example` _(placeholder)_
📖 **Interactive docs:** `https://docs.learning-platform.example` _(placeholder)_
🚀 **Live staging:** `https://staging.learning-platform.example` _(placeholder)_

---

</div>

---

## 📑 Table of Contents

> This README is a **technical reference**, not a brochure. Use `Ctrl+F` / `Cmd+F` aggressively.

```
 1.  Why This Exists — Problem, Vision, Non-Goals
 2.  Feature Matrix — What Works Today vs Roadmap
 3.  Comparison — vs Moodle, Teachable, Kajabi, Custom Builds
 4.  Architecture at a Glance — Diagrams + Principles
 5.  Technology Stack — Every Layer + Why
 6.  Repository Structure — Monorepo Tour
 7.  Quick Start — 7 Commands to Running System
 8.  Environment Variables — Full Reference
 9.  Development Workflow — pnpm + Turbo + Conventions
10.  Backend Deep Dive — Every NestJS Module Explained
11.  Frontend Deep Dive — Next.js App Router Tour
12.  Database Design — ERD, Models, Versioning, Indexing
13.  Multi-Tenancy — Host Resolution → RLS (The Core Magic)
14.  Authentication — JWT + Refresh Rotation + Devices
15.  Authorization — PolicyEngine Matrix
16.  Payments — Providers, Orchestrator, Ledger, Webhooks
17.  Video Protection — 7 Layers + Watermark Math
18.  LMS Core — Progression by Entry + Server Timers
19.  Assignments & Exams — Domain Models + Lifecycles
20.  Visual Identity — 80/20 Rule + Subject DNA
21.  Design System — Tokens (Color, Type, Space, Motion)
22.  Motion Language — Budgets, Tokens, Rules
23.  Security — 9 Layers, Checklists, Incident Response
24.  Performance — Caching, Queues, CDN, Budgets
25.  Testing — Pyramid, RLS Tests, Golden Flows
26.  Observability — Logs, Metrics, Traces, Alerts
27.  API Reference — REST Endpoints by Domain
28.  Event Contracts — Outbox + BullMQ Events
29.  Deployment — Local → Staging → Production
30.  CI/CD — GitHub Actions Pipeline
31.  Production Checklist — Go-Live Gates
32.  Troubleshooting — 25 Common Errors + Fixes
33.  FAQ — 30 Questions Answered
34.  Benchmarks — Load Targets + SLOs
35.  Roadmap — Phases, Milestones, Versioning
36.  Architecture Decision Records (ADRs)
37.  Contributing — Workflow, Commits, PRs, Reviews
38.  Code of Conduct — Summary
39.  Glossary — 60 Terms Defined
40.  License + Acknowledgments + Contact
```

---

## 1️⃣ Why This Exists — Problem, Vision, Non-Goals

### 1.1 The Problem (Egypt-specific)

1. **Teachers rent generic platforms** — same blue/white SaaS, zero brand ownership.
2. **Students juggle 5 logins** — one per teacher, no unified experience.
3. **Payments are manual** — Vodafone Cash screenshots in WhatsApp, no ledger, no reconciliation.
4. **Video leaks in hours** — Telegram channels re-upload paid content, no watermark attribution.
5. **Exams are cheatable** — client-side timers, exposed answers, no session binding.
6. **Data leaks across teachers** — missing tenant isolation, one SQL bug exposes everyone.
7. **No progression science** — score-gates frustrate; entry-based flow converts better.

### 1.2 The Vision

```
PLATFORM (universe)
  └── TEACHER SPACE (world)
        └── SUBJECT (atmosphere)
              └── COURSE (territory)
                    └── SECTION → LESSON (destination)
                                  └── LEARNING ACTION (exam / assignment / video)
                                        └── AI FEEDBACK → NEXT ACTION
```

> **A screenshot without the logo should still feel like the platform.**
> **A different tenant should still feel like the same ecosystem.**

### 1.3 Design Principles (Ranked)

| # | Principle | Meaning | Example |
|---|-----------|---------|---------|
| 1 | **Isolation is non-negotiable** | RLS is last line of defense | `app_user` cannot BYPASSRLS |
| 2 | **Server is source of truth** | Never trust client for money/time/unlock | `expiresAt`, ledger, progression |
| 3 | **Transaction = truth** | Money + enrollment + events in ONE tx | Payment PAID → ledger + enrollment + outbox |
| 4 | **Config over code** | 80% of tenant needs = JSON, not forks | Branding, limits, flags |
| 5 | **Premium, not flashy** | Architectural, calm, engineered | No random gradients/glass |
| 6 | **Motion with meaning** | Every animation explains a change | Budgets per surface |
| 7 | **Small verifiable steps** | Ship thin slices, prove with build | 1 day/week contributor model |

### 1.4 Non-Goals (What We Will NOT Do)

- ❌ Microservices on day one (modular monolith first).
- ❌ Client-controlled unlocks, timers, prices, discounts.
- ❌ Storing card data (providers handle PCI).
- ❌ Per-tenant code forks (config + theme tokens only).
- ❌ Score-gated progression in Phase 1 (entry-based only).
- ❌ Realtime collaborative editing (OT/CRDT) in Phase 1.
- ❌ Native mobile apps in Phase 1 (responsive web first).

---

## 2️⃣ Feature Matrix — What Works Today vs Roadmap

> Legend: ✅ Production-ready (compiles + reviewed) · 🧪 Needs live verification · 🚧 In progress · � planned

### 2.1 Platform Core

| Feature | Status | Evidence |
|---------|--------|----------|
| pnpm + Turborepo monorepo | ✅ | `pnpm build` exits 0 |
| NestJS modular monolith | ✅ | `apps/api/src/modules/*` |
| Prisma schema (30+ models) | ✅ | `apps/api/prisma/schema.prisma` |
| RLS migration file | ✅ | `20240101000000_init_rls.sql` |
| `app_user` init script | ✅ | `docker/postgres/init/01-create-app-user.sql` |
| Tenant resolution via host header | ✅ | `tenants` module |
| JWT + rotating refresh | ✅ | `auth` module |
| PolicyEngine + Guards | ✅ | `authorization` module |
| Entitlements vs Feature Flags split | ✅ | Separate modules |
| Plans + Subscriptions | ✅ | `plans` module |
| Transactional outbox | ✅ | `outbox` module |
| Idempotency keys (24h TTL) | ✅ | `payments` + `IdempotencyKeys` table |
| Audit logging | ✅ | `audit` + `payment_audit_logs` |

### 2.2 Payments

| Feature | Status | Notes |
|---------|--------|-------|
| Provider interface | ✅ | `PaymentProvider` contract |
| Paymob hosted checkout + HMAC | ✅ | Webhook verified |
| Fawry charge/status/refund + sig | ✅ | Webhook verified |
| Voucher atomic redeem | ✅ | `codeHash` + `FOR UPDATE` |
| Instapay / Vodafone Cash / e& money | � stub | Official integration pending |
| Orchestrator (Order → Ledger) | ✅ | Single transaction |
| Double-entry ledger | ✅ | Receivable / Clearing / Payable |
| Webhook inbox + replay guard | ✅ | `UNIQUE(provider, external_event_id)` |
| Fraud / risk scoring | ✅ | Rapid attempts, device sharing, IP, amount |
| Reconciliation job | 🧪 | Needs live provider data |
| Refunds + settlements | ✅ | Ledger-reversible |

### 2.3 Video

| Feature | Status | Notes |
|---------|--------|-------|
| Provider interface | ✅ | `VideoProvider` contract |
| Bunny Stream (TUS + HMAC + JWT) | ✅ | Primary |
| VdoCipher | � stub | Pending official keys |
| State machine UPLOADING→PUBLISHED | ✅ | Webhook-driven |
| Quotas (size + hours) | ✅ | Pre-upload guard |
| Playback tokens (2h JWT) | ✅ | Session + student bound |
| Watermark engine (HMAC + mulberry32) | ✅ | Deterministic, moving |
| Session binding + heartbeat | ✅ | Single active session |
| Capture detection hooks | ✅ | Client + server risk |
| Risk engine LOW→CRITICAL | ✅ | Allow / challenge / revoke |

### 2.4 LMS Core (Current Phase)

| Feature | Status | Notes |
|---------|--------|-------|
| Lesson content types (VIDEO, ASSIGNMENT, EXAM, RESOURCE) | 🚧 | Schema extension in progress |
| Assignment model (300m default) | 🚧 | Timer server-authoritative |
| Exam model (70m default) | 🚧 | Never expose answers |
| ENTER_ASSIGNMENT → unlock EXAM | 🚧 | Idempotent unlock |
| ENTER_EXAM → unlock NEXT LESSON | 🚧 | Idempotent unlock |
| Attempt lifecycles | 🚧 | IN_PROGRESS → SUBMITTED/EXPIRED/CANCELLED → GRADED |
| Teacher grading flow | � | Score + feedback |
| Question types (MCQ, TF, SHORT, ESSAY, MATCHING) | � | Shuffling + versioning |

### 2.5 Frontend

| Surface | Status | Notes |
|---------|--------|-------|
| Landing (master identity) | 🚧 | Architectural grid reveal |
| Teacher discovery (`/teachers`) | ✅ | Cards + ENTER SPACE → |
| Teacher space (`/teachers/[slug]`) | ✅ | Motif continuity |
| Teacher dashboard | 🚧 | Revenue, students, actions |
| Student dashboard | 🚧 | Continue + progress + next |
| Lesson page | 🚧 | CONTENT > NAV > SECONDARY |
| Upload manager (TUS) | ✅ | Chunked, resumable |
| Command palette (`Cmd+K`) | ✅ | Teacher + student registrars |
| Design tokens (CSS + TS) | ✅ | `packages/design-system` |

---

## 3️⃣ Comparison — Why Not Just Use X?

### 3.1 Feature Comparison

| Capability | Moodle | Teachable / Kajabi | Custom Laravel/WordPress | **Learning Platform** |
|------------|--------|-------------------|--------------------------|----------------------|
| Multi-tenant white-label | ❌ (plugins) | ⚠️ (subdomain only) | ❌ (forks) | ✅ first-class (domain → tenant_id) |
| DB-level isolation (RLS) | ❌ | ❌ (opaque) | ❌ | ✅ FORCE RLS + `app_user` |
| Arabic-first typography | ⚠️ | ❌ | ⚠️ | ✅ editorial AR/EN matched |
| Egypt payments (Paymob/Fawry/Vodafone) | ❌ | ❌ | ⚠️ manual | ✅ orchestrated + ledger |
| Voucher atomic redeem | ❌ | ⚠️ | ❌ | ✅ `FOR UPDATE` + hash |
| DRM-grade video watermark | ❌ | ⚠️ (basic) | ❌ | ✅ HMAC + moving + risk |
| Server-authoritative exam timer | ❌ | ❌ | ❌ | ✅ `expiresAt` truth |
| Entry-based progression | ❌ | ❌ | ❌ | ✅ ENTER → unlock |
| Double-entry ledger | ❌ | ❌ | ❌ | ✅ auditable |
| Transactional outbox | ❌ | ❌ | ❌ | ✅ no lost events |
| Idempotent money mutations | ❌ | ⚠️ | ❌ | ✅ `Idempotency-Key` 24h |
| Subject visual DNA | ❌ | ❌ | ❌ | ✅ 6 subjects, distinct motifs |
| Cost at 10k students | High ops | $$$ rev-share | Fragile | ✅ single DB + RLS, low ops |

### 3.2 Total Cost of Ownership (Illustrative)

```
MOODLE              ████████████████████  ops + plugins + theming + hosting
TEACHABLE/KAJABI    ████████████████████████  rev-share % + USD pricing + EGP friction
WORDPRESS STACK     ██████████████  plugins + security debt + forks per teacher
LEARNING PLATFORM   ████████  one codebase + shared DB + RLS + config-over-code
```

> Numbers are directional, not quotes. Real TCO depends on video egress, payment fees, headcount.

### 3.3 When NOT to Use This Platform

- You need single-course static site → use Notion / Google Classroom.
- You need SCORM 2004 enterprise compliance on day one → use Moodle + Rustici.
- You need native offline-first mobile with DRM → build native + Widevine/FairPlay.
- You process cards yourself (PCI Level 1) → you need a dedicated payments team.

---

## 4️⃣ Architecture at a Glance

### 4.1 High-Level Diagram

```mermaid
graph TB
    subgraph INTERNET["🌐 INTERNET"]
        U[Students / Teachers / Admins]
    end

    subgraph EDGE["☁️ CLOUDFLARE EDGE"]
        CDN[CDN + Cache]
        WAF[WAF + DDoS + DNSSEC]
    end

    subgraph APP["🧩 APPLICATION — Modular Monolith"]
        WEB[Next.js 16<br/>App Router + TS]
        API[NestJS 10<br/>tenants → auth → policy → RLS]
    end

    subgraph DATA["🗄️ DATA"]
        PG[(PostgreSQL 15<br/>Prisma + RLS FORCE)]
        RD[(Redis 7 + BullMQ<br/>cache + queues)]
        S3[Cloudflare R2 / S3<br/>thumbnails + resources]
    end

    subgraph VIDEO["📹 VIDEO"]
        BUNNY[Bunny Stream<br/>TUS upload + HLS + JWT]
        VDOC[VdoCipher stub]
    end

    subgraph PAY["💳 PAYMENTS"]
        PM[Paymob]
        FW[Fawry]
        VO[Voucher atomic]
    end

    U --> WAF --> CDN --> WEB
    CDN --> API
    WEB --> API
    API --> PG
    API --> RD
    API --> S3
    API --> BUNNY
    API --> VDOC
    API --> PM
    API --> FW
    API --> VO

    style PG fill:#4169E1,color:#fff
    style RD fill:#DC382D,color:#fff
    style API fill:#E0234E,color:#fff
    style WEB fill:#000,color:#fff
```

### 4.2 Request Lifecycle (Defense in Depth)

```mermaid
sequenceDiagram
    participant C as Client
    participant CF as Cloudflare WAF
    participant API as NestJS API
    participant TEN as Tenant Resolver
    participant AUTH as Auth Guard
    participant POL as PolicyEngine
    participant RLS as PostgreSQL RLS
    participant DB as Database

    C->>CF: HTTPS + Host: teacher1.example.com
    CF->>API: Sanitized request + rate-limit
    API->>TEN: Resolve domain → tenant_id
    TEN-->>API: tenant_id (or 404)
    API->>AUTH: Validate JWT / session
    AUTH-->>API: user + roles + device
    API->>POL: can(user, action, resource)?
    POL-->>API: ALLOW (tenant + RBAC + ownership + entitlement + flag + quota)
    API->>RLS: SET app.tenant_id (tx-local)
    RLS->>DB: Enforce FORCE RLS policies
    DB-->>API: Rows (already tenant-scoped)
    API-->>C: Response + audit log
```

### 4.3 Core Principles (Expanded)

| # | Principle | Implementation | Anti-pattern |
|---|-----------|----------------|--------------|
| 1 | **Modular monolith first** | `apps/api/src/modules/*` with barrel exports, no cross `../../../` | Premature k8s + 12 repos |
| 2 | **Shared DB + RLS** | Every tenant table has `tenant_id`; FORCE RLS; `app_user` no BYPASSRLS | App-only `WHERE tenant_id` (bypassable) |
| 3 | **Defense in depth** | Host → tenant → auth → policy → RLS → audit | Single `if (role)` check |
| 4 | **Transactional outbox** | `outbox_events` in same tx; relay publishes to BullMQ | Dual-write to DB + queue |
| 5 | **Idempotency** | `Idempotency-Key` header, 24h TTL, unique constraint | Retry creates double charge |
| 6 | **Versioned content** | Publish = new version; attempts pin version | Mutating published exam |
| 7 | **Entitlements ≠ Flags** | Entitlement = per-student grant; Flag = per-tenant toggle | `if (plan === 'pro')` scattered |
| 8 | **Config over code** | `tenant_config` JSON + plan limits | `if (tenant === 'x')` branches |
| 9 | **Transaction = truth** | Payment PAID → ledger + enrollment + outbox in ONE tx | Webhook → enrollment without ledger |

### 4.4 Module Dependency Map

```mermaid
graph LR
    TEN[tenants] --> AUTH[auth]
    AUTH --> USERS[users]
    AUTH --> POL[authorization]
    POL --> ENT[entitlements]
    POL --> FLAGS[feature-flags]
    POL --> PLANS[plans]
    ENT --> COURSES[courses]
    COURSES --> EXAMS[exams]
    COURSES --> ASSIGN[assignments]
    EXAMS --> VIDEO[video]
    VIDEO --> VPROT[video-protection]
    COURSES --> PAY[payments]
    PAY --> LEDGER[ledger inside payments]
    PAY --> OUTBOX[outbox]
    OUTBOX --> NOTIF[notifications planned]
    OUTBOX --> ANALYTICS[analytics planned]
    PAY --> AUDIT[audit]
    VPROT --> AUDIT
    EXAMS --> AUDIT
```

---

## 5️⃣ Technology Stack — Every Layer + Why

### 5.1 The Table

| Layer | Choice | Version | Why this, not that |
|-------|--------|---------|-------------------|
| Web | Next.js App Router + TS | 16 | SSR + SEO for teacher spaces; file-based routing; vs Remix (smaller EG hiring pool) |
| API | NestJS (modular monolith) | 10 | DI + Guards + Interceptors = policy enforcement points; vs Express (no structure) |
| DB | PostgreSQL | 15 | RLS FORCE + `pg_stat_statements` + JSONB for config; vs MySQL (no RLS) |
| ORM | Prisma | 5.22.0 | Type-safe, migrations; vs Drizzle (smaller ecosystem) / TypeORM (loose) |
| Auth | JWT RS256 + rotating refresh | — | 15m access in memory + 7d refresh in HttpOnly; vs sessions-only (scale) |
| Hashing | Argon2id | — | Memory-hard; vs bcrypt (GPU-friendlier to crack) |
| Isolation | Shared DB + `tenant_id` + RLS | — | Low cost + single migration; vs DB-per-tenant (ops hell) |
| Cache/Queue | Redis + BullMQ | 7 | Delayed jobs (exam auto-submit), rate-limit, outbox relay; vs RabbitMQ (heavier) |
| Storage | Cloudflare R2 / S3 | — | Zero egress (R2) for thumbnails; vs local disk (no scale) |
| Video | Bunny Stream (primary) | — | TUS + HLS + token auth + EG PoPs; vs Mux (USD, no EG edge) |
| Video alt | VdoCipher | stub | Bollywood/EG DRM familiarity; pending keys |
| Payments | Paymob + Fawry + Voucher | — | Cards + wallets + kiosks + cash; vs Stripe (no EG coverage) |
| Monorepo | pnpm + Turborepo | pnpm 9.15, turbo 2 | Content-addressable store + remote cache; vs npm (dupes) / nx (heavier) |
| CI/CD | GitHub Actions | — | Native GH integration; vs Jenkins (ops) |
| Infra (now) | Docker Compose | — | PG + Redis local parity; Terraform later |
| Observability | Pino + Sentry + Prometheus (planned) | — | Structured logs with tenantId/requestId |
| Validation | class-validator + Zod (web) | — | Server + client parity |
| Docs | Markdown + Mermaid | — | Git-native, no Confluence drift |

### 5.2 Version Pinning Policy

```jsonc
// package.json (root)
{
  "packageManager": "pnpm@9.15.0",
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
// apps/api/package.json → prisma pinned to 5.22.0 (avoid drift 5.7 vs 5.22)
```

> ⚠️ Known issue: `nestjs-pino 5.3.1` peer warns with Nest 10 — build-only warning, acceptable.

### 5.3 Runtime vs Build vs Migration Credentials

| Credential | User | Used by | NEVER used by |
|------------|------|---------|---------------|
| `DATABASE_URL` | `app_user` (no SUPERUSER, no BYPASSRLS) | API runtime | Migrations |
| `MIGRATION_DATABASE_URL` | `postgres` superuser | `prisma migrate deploy` in CI | API runtime |
| `REDIS_URL` | default / ACL user | BullMQ + cache | — |

---

## 6️⃣ Repository Structure — Monorepo Tour

```
learning-platform/
├── AGENTS.md                         ← 🤖 Source of truth for agents (rules, decisions)
├── README.md                         ← 📖 You are here (world-class reference)
├── LICENSE                           ← MIT
├── CONTRIBUTING.md                     ← How to contribute (placeholder → §37)
├── CODE_OF_CONDUCT.md                  ← Contributor Covenant (placeholder → §38)
├── SECURITY.md                         ← Security policy (placeholder → docs/SECURITY.md)
├── turbo.json                          ← Turborepo tasks (build/test/lint/dev)
├── pnpm-workspace.yaml                 ← apps/* + packages/*
├── package.json                        ← Root scripts (turbo run …)
├── .env.example                        ← All env vars documented
├── .gitignore                          ← .env, node_modules, dist, .next
├── .nvmrc                               ← Node 20 (placeholder if missing)
├── docker-compose.yml                  ← postgres:15-alpine + redis:7-alpine
├── docker/
│   └── postgres/init/
│       └── 01-create-app-user.sql      ← Creates app_user, REVOKE BYPASSRLS, FORCE RLS
├── docs/
│   ├── ARCHITECTURE.md                 ← System architecture (700+ lines)
│   ├── VISUAL_IDENTITY.md              ← Visual + motion system (344 lines)
│   ├── VIDEO_PROTECTION.md             ← Video security spec
│   ├── SECURITY.md                     ← Security architecture (430 lines)
│   ├── STATUS.md                       ← Verified vs TODO vs Known issues
│   └── assets/                         ← Screenshots, diagrams (add WebP here)
├── apps/
│   ├── api/                            ← NestJS 10 modular monolith
│   │   ├── package.json
│   │   ├── tsconfig.json               ← extends root, path @/* → src/*
│   │   ├── nest-cli.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma           ← 30+ models + enums
│   │   │   ├── schema_utf8.prisma      ← UTF8 backup
│   │   │   └── migrations/
│   │   │       ├── 20240101000000_init_rls.sql
│   │   │       └── 20261007000000_lms_rls/migration.sql
│   │   ├── test/
│   │   │   ├── jest-e2e.json
│   │   │   ├── golden-flow.e2e-spec.ts ← Order→Pay→Enroll golden path
│   │   │   └── rls-isolation.e2e-spec.ts ← Tenant A ⊘ Tenant B
│   │   └── src/
│   │       ├── main.ts                 ← Bootstrap + secret validation + Swagger
│   │       ├── app.module.ts           ← Module wiring
│   │       ├── common/                 ← Guards, decorators, interceptors, filters
│   │       │   ├── guards/authorization.guard.ts
│   │       │   ├── decorators/require-permission.decorator.ts
│   │       │   ├── interceptors/tenant-context.interceptor.ts
│   │       │   └── filters/http-exception.filter.ts
│   │       └── modules/
│   │           ├── tenants/            ← Resolution, domains, config
│   │           │   └── prisma.service.ts ← setTenantContext() helper
│   │           ├── auth/               ← JWT, refresh rotation, TOTP, devices
│   │           ├── users/              ← Profiles, devices, sessions
│   │           ├── authorization/      ← PolicyEngine + Action enum
│   │           │   └── policy-engine.ts ← can(user, action, resource)
│   │           ├── entitlements/       ← Grants/checks per resource
│   │           ├── feature-flags/      ← Plan rules + tenant overrides
│   │           ├── plans/              ← Tiers + subscriptions
│   │           ├── courses/            ← Courses → sections → lessons
│   │           ├── exams/              ← Exams + questions + attempts
│   │           ├── assignments/        ← (in progress) + grading
│   │           ├── payments/           ← Orchestrator + providers + ledger
│   │           │   └── payment-orchestrator.service.ts
│   │           ├── video/              ← Upload, status, providers
│   │           ├── video-protection/   ← Watermark, tokens, sessions, risk
│   │           │   └── services/
│   │           │       ├── watermark-engine.ts
│   │           │       ├── signed-token.service.ts
│   │           │       └── playback-session.service.ts
│   │           ├── audit/              ← Audit logs + security_events
│   │           ├── outbox/             ← Transactional outbox relay
│   │           ├── notifications/      ← (planned) email/WhatsApp/push
│   │           └── analytics/          ← (planned) OLAP-friendly views
│   └── web/                            ← Next.js 16 App Router
│       ├── package.json
│       ├── next.config.mjs
│       ├── tsconfig.json
│       ├── app/
│       │   ├── layout.tsx              ← Root layout + fonts + RTL
│       │   ├── globals.css             ← Tokens + base styles
│       │   ├── page.tsx                ← Landing
│       │   ├── teachers/page.tsx       ← Discovery
│       │   ├── teachers/[slug]/page.tsx← Teacher space
│       │   ├── teacher/                ← Dashboard (revenue, students…)
│       │   │   ├── page.tsx
│       │   │   ├── assignments/page.tsx
│       │   │   ├── students/page.tsx
│       │   │   └── analytics/page.tsx
│       │   ├── student/                ← Dashboard + lessons
│       │   │   ├── page.tsx
│       │   │   └── lessons/[id]/page.tsx
│       │   ├── components/
│       │   │   ├── TeacherCard.tsx
│       │   │   ├── SanadAiCard.tsx
│       │   │   └── upload/*            ← TUS upload manager (7 components)
│       │   └── hooks/
│       │       ├── useUpload.ts
│       │       ├── useAutosave.ts
│       │       └── useCommandPalette.tsx
│       └── public/                     ← Favicons, OG images, fonts
└── packages/
    ├── design-system/                  ← @lp/design-system (tokens + primitives)
    │   ├── package.json
    │   ├── tokens.css                  ← CSS variables (source of truth for web)
    │   └── tokens/
    │       ├── colors.ts
    │       ├── typography.ts
    │       ├── spacing.ts
    │       ├── motion.ts
    │       └── border.ts
    ├── ui/                             ← @lp/ui (planned → shared components)
    ├── auth/                           ← @lp/auth (planned → shared auth utils)
    ├── types/                          ← @lp/types (planned → shared TS types)
    └── event-contracts/                ← @lp/event-contracts (planned → Zod schemas)
```

### 6.1 Import Rules (Enforced by Review)

```typescript
// ✅ GOOD — alias or workspace package
import { PolicyEngine } from '@/modules/authorization/policy-engine';
import { Button } from '@lp/ui';

// ❌ BAD — fragile relative climb
import { PolicyEngine } from '../../../authorization/policy-engine';
```

### 6.2 Where Does New Code Go? (Decision Tree)

```
New feature?
├── Shared across apps? ──YES──→ packages/<scope>/
├── API-only? ──YES──→ apps/api/src/modules/<domain>/
│   ├── Needs DB table? → prisma/schema.prisma + migration + RLS
│   ├── Needs auth? → AuthorizationGuard + RequirePermission
│   └── Emits event? → outbox in same tx
└── Web-only? ──YES──→ apps/web/app/<route>/ + components/
```

## 7️⃣ Quick Start — 7 Commands to Running System

### 7.1 Prerequisites Matrix

| Tool | Minimum | Recommended | Verify | Notes |
|------|---------|-------------|--------|-------|
| Node.js | 20.11 LTS | 20.18 LTS | `node -v` | NVM for Windows or fnm |
| pnpm | 9.15.0 | 9.15.0 | `pnpm -v` | **NEVER use npm/yarn** — lockfile is `pnpm-lock.yaml` |
| Docker | 24.x | 26.x | `docker --version` | Compose v2 (`docker compose`) |
| Git | 2.40+ | latest | `git --version` | LF/CRLF: `core.autocrlf=true` on Windows |
| PowerShell | 5.1 | 7.4+ | `$PSVersionTable` | All commands below are PowerShell-safe |
| PostgreSQL | 15 (via Docker) | 15-alpine | `docker compose ps` | Native install works but Docker is canonical |
| Redis | 7 (via Docker) | 7-alpine | `docker compose ps` | BullMQ requires Redis ≥ 5 |

> 🪟 **Windows-only rules:** No `&&`, `||`, `|`, `grep`, `cat`, `head`, `tail`. Use `;` to chain, `Get-Content`, `Select-String`, redirect to file then read.

### 7.2 The 7 Commands

```powershell
# 1 — Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 2 — Install dependencies (from repo root, pnpm ONLY)
pnpm install

# 3 — Generate Prisma client (from apps/api)
cd apps/api; npx prisma generate

# 4 — Apply migrations (needs MIGRATION_DATABASE_URL)
npx prisma migrate deploy

# 5 — Build everything (from repo root — must exit 0)
cd ..; cd ..; pnpm build

# 6 — Run API in dev (from apps/api)
cd apps/api; pnpm run dev

# 7 — Run Web in dev (new terminal, from apps/web)
cd apps/web; pnpm run dev
```

**Expected results:**

| Command | Success signal | Failure → see |
|---------|---------------|---------------|
| `docker compose up -d` | `learning-platform-db` + `learning-platform-redis` healthy | §32.1 Docker |
| `pnpm install` | `Done in Xs` + `node_modules` in root + apps + packages | §32.2 pnpm |
| `npx prisma generate` | `✔ Generated Prisma Client` | §32.3 Prisma |
| `npx prisma migrate deploy` | `All migrations have been successfully applied` | §32.4 Migrations |
| `pnpm build` | `Tasks: N successful, N total` + exit 0 | §32.5 Build |
| `pnpm run dev` (api) | `Nest application successfully started` on `:3000` | §32.6 API boot |
| `pnpm run dev` (web) | `✓ Ready on http://localhost:3001` | §32.7 Web boot |

### 7.3 Verify in 60 Seconds

```powershell
# Health (API)
Invoke-RestMethod http://localhost:3000/api/health

# Expected:
# @{ status = ok; version = 0.1.0; db = up; redis = up }

# Teachers discovery (Web)
Start-Process http://localhost:3001/teachers

# Prisma Studio (visual DB check, from apps/api)
npx prisma studio
# → http://localhost:5555 — confirm tenants, users, courses tables exist
```

### 7.4 Seed Demo Data (Optional but Recommended)

```powershell
# From apps/api — creates demo tenant + teacher + course + voucher
npx prisma db seed
```

What the seed creates (idempotent, safe to re-run):

```
Tenant: demo-academy (domain: demo.localhost)
├── Teacher: Ahmed (PHYSICS motif)
│   └── Course: Mechanics 101
│       ├── Section 1: Kinematics
│       │   ├── Lesson 1: VIDEO (Bunny stub URL)
│       │   ├── Lesson 2: ASSIGNMENT (300 min)
│       │   └── Lesson 3: EXAM (70 min, 5 questions)
│       └── Section 2: Dynamics (locked until ENTER_EXAM)
├── Student: Sara (enrolled via VOUCHER: DEMO-100)
└── Voucher batch: DEMO-100 (10 codes, single-use each)
```

Login after seed:

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Teacher | `teacher@demo.localhost` | `Demo1234!` | `/teacher` |
| Student | `student@demo.localhost` | `Demo1234!` | `/student` |
| Admin | `admin@demo.localhost` | `Demo1234!` | `/admin` (planned) |

> 🔐 Change these immediately. Seeds are DEV-ONLY and never run in production (guarded by `NODE_ENV`).

### 7.5 First 5 Clicks (Golden Path)

```
1. As STUDENT → open /student → see "Continue Learning: Mechanics 101"
2. Click Lesson 1 (VIDEO) → playback token issued → watermark visible
3. Click Lesson 2 (ASSIGNMENT) → POST /assignments/:id/attempts → timer starts (expiresAt set)
   → notice EXAM (Lesson 3) unlocks instantly (ENTER_ASSIGNMENT rule)
4. Click Lesson 3 (EXAM) → POST /exams/:id/attempts → next lesson unlocks (ENTER_EXAM rule)
5. As TEACHER → /teacher/analytics → see attempt event in audit log
```

---

## 8️⃣ Environment Variables — Full Reference

### 8.1 Setup

```powershell
# From repo root
Copy-Item .env.example .env.local
notepad .env.local
```

### 8.2 Complete Table (Grouped, with Defaults & Rotation)

#### Core

| Var | Required | Default (DEV) | Production rule | Description |
|-----|----------|---------------|-----------------|-------------|
| `NODE_ENV` | ✅ | `development` | `production` | `development` allows default secrets with warning; `production` refuses to boot on defaults |
| `PORT` | ✅ | `3000` | `3000` | API listen port |
| `APP_URL` | ✅ | `http://localhost:3000` | `https://api.yourdomain.com` | Used in emails, redirects, CORS |
| `LOG_LEVEL` | ✅ | `info` | `warn` | `debug`/`info`/`warn`/`error` (Pino) |
| `ALLOWED_ORIGINS` | ✅ | `http://localhost:3001,http://localhost:3000` | `https://yourdomain.com,https://www.yourdomain.com` | Comma-separated CORS allowlist |

#### Database (Split Credentials — Critical)

| Var | Required | Example | Description |
|-----|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `postgresql://app_user:***@localhost:5432/learning_platform?schema=public` | **Runtime only.** `app_user`: LOGIN, no SUPERUSER, no BYPASSRLS. GRANT SELECT/INSERT/UPDATE/DELETE only. |
| `MIGRATION_DATABASE_URL` | ✅ (CI/migrate) | `postgresql://postgres:***@localhost:5432/learning_platform?schema=public` | **Migrations only.** Superuser. NEVER used by API runtime. Only in CI + local migrate. |
| `DATABASE_POOL_MIN` | ⬜ | `2` | Prisma / PG pool min |
| `DATABASE_POOL_MAX` | ⬜ | `20` | Tune: `max_connections=200` in compose; pool per instance = 10–20 |
| `DATABASE_STATEMENT_TIMEOUT` | ⬜ | `15000` | ms; kills runaway analytics queries |

#### Auth & Sessions

| Var | Required | Rotation | Description |
|-----|----------|----------|-------------|
| `JWT_SECRET` | ✅ | 90 days | RS256/HS256 secret. Prod refuses default `your-super-secret-jwt-key-change-in-production`. Min 32 random bytes. |
| `JWT_EXPIRES_IN` | ✅ | — | `15m` (access). Never > 30m. |
| `REFRESH_TOKEN_TTL_DAYS` | ✅ | — | `7`. Rotating; reuse → revoke family. |
| `REFRESH_COOKIE_NAME` | ⬜ | — | `lp_refresh`. HttpOnly, Secure, SameSite=Lax. |
| `PASSWORD_ARGON_MEMORY` | ⬜ | — | `19456` (19MB). Argon2id m-cost. |
| `PASSWORD_ARGON_TIME` | ⬜ | — | `3`. |
| `TOTP_ISSUER` | ⬜ | — | `LearningPlatform`. For teacher/admin 2FA QR. |
| `DEVICE_FP_SALT` | ✅ | 90 days | Salt for device fingerprint SHA256. |

#### Redis & Queues

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `REDIS_HOST` | ✅ | `localhost` | `redis` inside Docker network |
| `REDIS_PORT` | ✅ | `6379` | — |
| `REDIS_PASSWORD` | ⬜ (prod ✅) | `` | Set in prod; use ACL user if available |
| `BULLMQ_PREFIX` | ⬜ | `lp` | Queue key prefix |
| `OUTBOX_RELAY_INTERVAL_MS` | ⬜ | `2000` | Poll interval for outbox → BullMQ |
| `EXAM_AUTOSUBMIT_DELAY` | ⬜ | `on-expiresAt` | BullMQ delayed job per attempt (see §18) |

#### Storage (R2/S3)

| Var | Required | Description |
|-----|----------|-------------|
| `STORAGE_PROVIDER` | ✅ | `r2` or `s3` |
| `STORAGE_ENDPOINT` | ✅ | `https://<account>.r2.cloudflarestorage.com` or S3 endpoint |
| `STORAGE_BUCKET` | ✅ | `lp-thumbnails`, `lp-resources` (or single bucket + prefixes) |
| `STORAGE_ACCESS_KEY` | ✅ | — |
| `STORAGE_SECRET_KEY` | ✅ | — |
| `STORAGE_PUBLIC_BASE_URL` | ✅ | CDN base for public thumbnails |
| `STORAGE_PRESIGN_TTL_SEC` | ⬜ | `900` (15m) for private resource downloads |

#### Video Security (MUST Rotate)

| Var | Required | Rotation | Description |
|-----|----------|----------|-------------|
| `VIDEO_TOKEN_SECRET` | ✅ | 90 days | Signs playback JWTs. Prod refuses `change-in-production`. |
| `VIDEO_TOKEN_ISSUER` | ✅ | — | `learning-platform` |
| `VIDEO_TOKEN_TTL_MS` | ✅ | — | `300000` (5m for token issuance) / playback session 2h (see §17) |
| `VIDEO_WATERMARK_HMAC_SECRET` | ✅ | 90 days | Signs watermark payload. Prod refuses default. |
| `BUNNY_STREAM_API_KEY` | ✅ (prod) | Provider policy | Server-side only, never exposed to client |
| `BUNNY_STREAM_LIBRARY_ID` | ✅ (prod) | — | — |
| `BUNNY_STREAM_SIGNING_KEY` | ✅ (prod) | 90 days | Token auth for HLS URLs |
| `BUNNY_WEBHOOK_SECRET` | ✅ (prod) | Provider policy | HMAC verification |
| `VDOCIPHER_API_SECRET` | ⬜ (stub) | — | Pending official integration |

#### Payments (Sandbox vs Live)

| Var | Required | Description |
|-----|----------|-------------|
| `PAYMOB_API_KEY` | ✅ (if Paymob on) | Server-only |
| `PAYMOB_INTEGRATION_ID` | ✅ | Card/wallet integration ID |
| `PAYMOB_IFRAME_ID` | ✅ | Hosted checkout iframe |
| `PAYMOB_HMAC_SECRET` | ✅ | Webhook HMAC — verify BEFORE state change |
| `PAYMOB_BASE_URL` | ⬜ | `https://accept.paymob.com/api` (prod) vs staging URL |
| `FAWRY_MERCHANT_CODE` | ✅ (if Fawry on) | — |
| `FAWRY_SECRET_KEY` | ✅ | Request signing |
| `FAWRY_SECURE_HASH_KEY` | ✅ | Webhook verification |
| `FAWRY_BASE_URL` | ⬜ | `https://atfawry.fawrystaging.com` (staging) vs prod |
| `VOUCHER_HMAC_SECRET` | ✅ | Hashes raw codes → `codeHash` (never store raw) |
| `PAYMENT_IDEMPOTENCY_TTL_HOURS` | ⬜ | `24` |

#### Mail / SMS / WhatsApp (Planned)

| Var | Required | Description |
|-----|----------|-------------|
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | � | Transactional email (enrollment, receipts) |
| `WHATSAPP_PROVIDER` / `WHATSAPP_TOKEN` | � | EG prefers WhatsApp over email for students |
| `SMS_PROVIDER` / `SMS_TOKEN` | � | OTP fallback |

#### Observability

| Var | Required | Description |
|-----|----------|-------------|
| `SENTRY_DSN` | ⬜ (prod ✅) | Error tracking |
| `SENTRY_ENV` | ⬜ | `staging` / `production` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | ⬜ | Tracing (planned) |
| `PROMETHEUS_PORT` | ⬜ | `9464` metrics endpoint |

### 8.3 `.env.example` (Copy-Paste Starter)

```bash
# ── Core ──
NODE_ENV="development"
PORT=3000
APP_URL="http://localhost:3000"
LOG_LEVEL="info"
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:3000"

# ── Database (split!) ──
DATABASE_URL="postgresql://app_user:app_user_password@localhost:5432/learning_platform?schema=public"
MIGRATION_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/learning_platform?schema=public"

# ── Auth ──
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
DEVICE_FP_SALT="change-in-production"

# ── Redis ──
REDIS_HOST="localhost"
REDIS_PORT="6379"

# ── Video ──
VIDEO_WATERMARK_HMAC_SECRET="change-in-production"
VIDEO_TOKEN_SECRET="change-in-production"
VIDEO_TOKEN_ISSUER="learning-platform"
VIDEO_TOKEN_TTL_MS="300000"

# ── Storage ──
STORAGE_PROVIDER="r2"
STORAGE_ENDPOINT=""
STORAGE_BUCKET=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# ── Paymob ──
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""
PAYMOB_BASE_URL="https://accept.paymob.com/api"

# ── Fawry ──
FAWRY_MERCHANT_CODE=""
FAWRY_SECRET_KEY=""
FAWRY_SECURE_HASH_KEY=""
FAWRY_BASE_URL="https://atfawry.fawrystaging.com"
```

### 8.4 Secret Generation (Do This Now)

```powershell
# Generate 32-byte hex secrets (PowerShell-safe, no openssl needed)
python -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(32))"
python -c "import secrets; print('VIDEO_TOKEN_SECRET=' + secrets.token_hex(32))"
python -c "import secrets; print('VIDEO_WATERMARK_HMAC_SECRET=' + secrets.token_hex(32))"
python -c "import secrets; print('DEVICE_FP_SALT=' + secrets.token_hex(16))"
```

---

## 9️⃣ Development Workflow — pnpm + Turbo + Conventions

### 9.1 Package Manager Rules (Strict)

| Rule | Why |
|------|-----|
| ✅ `pnpm install`, `pnpm build`, `pnpm test`, `pnpm dev` | Single lockfile, content-addressable, fast |
| ❌ NEVER `npm install`, `npm run`, `yarn` | Creates `package-lock.json`, breaks workspace links |
| ✅ Run `pnpm` from repo root; `apps/api` scripts from `apps/api` | Turbo scopes tasks correctly |
| ✅ Commit `pnpm-lock.yaml`, ignore `package-lock.json` | If `package-lock.json` appears → delete it |

```powershell
# If someone accidentally used npm:
Remove-Item package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
pnpm install
```

### 9.2 Turborepo Tasks

```jsonc
// turbo.json
{
  "tasks": {
    "build":  { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "test":   { "dependsOn": ["build"] },
    "lint":   {},
    "dev":    { "cache": false, "persistent": true },
    "format": {}
  }
}
```

| Command | What happens | Cache? |
|---------|--------------|--------|
| `pnpm build` | `turbo run build` — builds `packages/*` first, then `apps/*` | ✅ Remote + local cache |
| `pnpm test` | `turbo run test` — Jest (api) + Vitest (web) | ✅ |
| `pnpm lint` | ESLint + Prettier check | ✅ |
| `pnpm dev` | Parallel `dev` in api + web (no cache, persistent) | ❌ |
| `pnpm format` | Prettier write | — |

### 9.3 PowerShell Survival Guide (Windows Contributors)

```powershell
# ❌ FORBIDDEN (bash-isms that break PowerShell):
# npm run dev && npm run build || echo fail | grep error > out.txt
# cat file | head -20 | tail -10

# ✅ REQUIRED equivalents:
pnpm build 2>&1 > build-out.txt; Get-Content build-out.txt -TotalCount 50
Select-String -Path apps/api/src/**/*.ts -Pattern "BYPASSRLS"
Get-Content .env.example -TotalCount 30
docker compose up -d; docker compose ps
cd apps/api; npx prisma generate; cd ..; cd ..
```

### 9.4 Branching & Commits (Conventional Commits — Enforced)

```
main (protected)
 ├── develop (integration)
 │    ├── feat/lms-progression-enter-unlock
 │    ├── fix/paymob-hmac-verify
 │    ├── docs/readme-world-class
 │    ├── chore/pin-prisma-5-22
 │    └── security/rls-force-policy-exams
```

| Prefix | Use for | Example |
|--------|---------|---------|
| `feat:` | New feature | `feat(lms): ENTER_ASSIGNMENT unlocks exam` |
| `fix:` | Bug fix | `fix(payments): verify Fawry hash before PAID` |
| `docs:` | Docs only | `docs(readme): add video watermark math` |
| `chore:` | Tooling/deps | `chore(deps): pin prisma 5.22.0` |
| `refactor:` | No behavior change | `refactor(auth): extract token service` |
| `test:` | Tests | `test(rls): tenant A cannot read tenant B` |
| `security:` | Security hardening | `security(db): FORCE RLS on attempts` |
| `perf:` | Performance | `perf(redis): cache entitlement checks 60s` |

```powershell
# Commit template
git commit -m "feat(lms): add ENTER_EXAM unlock for next lesson

- POST /exams/:id/attempts records ENTER_EXAM
- Idempotent unlock via UNIQUE(student, lesson)
- Audit: PROGRESSION_UNLOCKED event
- Test: golden-flow.e2e-spec.ts passes"
```

### 9.5 Definition of Done (Every PR)

- [ ] `pnpm build` exits 0 (paste output in PR)
- [ ] No new `../../../` imports (use `@/` or workspace)
- [ ] New tables have `tenant_id` + RLS migration + `FORCE`
- [ ] Money/time/unlock logic is server-side (no client trust)
- [ ] Webhooks verify signature BEFORE state change
- [ ] Sensitive actions emit audit log
- [ ] Env vars documented in `.env.example` + §8
- [ ] Tests: unit + e2e (RLS isolation if tenant-scoped)
- [ ] No secrets in diff (`git diff --cached -- .env*` empty)
- [ ] Small PR (< 400 lines preferred)

<!-- PART3 -->

