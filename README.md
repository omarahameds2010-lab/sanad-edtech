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

### 🖼️ Product Tour — live production captures

> Every image below is a real capture from the production app on 28 October 2026. Captured at 1440×900, WebP, under 50 KB each.

| Landing | Teacher Discovery | Teacher Space |
|---------|-------------------|---------------|
| ![Landing](docs/assets/readme/01-landing.webp) | ![Teachers](docs/assets/readme/10-teacher-discovery.webp) | ![Teacher Space](docs/assets/readme/02-teacher-dashboard.webp) |
| *Master identity + subject motifs* | *Teacher cards with ENTER SPACE →* | *Same platform, own environment* |

| Student Dashboard | Learning Page | Exam Experience |
|-------------------|---------------|-----------------|
| ![Student](docs/assets/readme/04-student-dashboard.webp) | ![Learning](docs/assets/readme/05-curriculum.webp) | ![Exam](docs/assets/readme/06-assessment-brief.webp) |
| *What should I do next?* | *CONTENT > NAVIGATION > SECONDARY* | *Very low motion, server timer* |

| Course Builder | Analytics | Checkout |
|----------------|-----------|----------|
| ![Builder](docs/assets/readme/03-course-workspace.webp) | ![Analytics](docs/assets/readme/12-analytics.webp) | ![Pay](docs/assets/readme/11-enrollment.webp) |
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
| Lesson content types (VIDEO, ASSIGNMENT, EXAM, RESOURCE) | ✅ | Schema extension in progress |
| Assignment model (300m default) | ✅  | Timer server-authoritative |
| Exam model (70m default) | ✅ | Never expose answers |
| ENTER_ASSIGNMENT → unlock EXAM | ✅ | Idempotent unlock |
| ENTER_EXAM → unlock NEXT LESSON | ✅ | Idempotent unlock |
| Attempt lifecycles | ✅ | IN_PROGRESS → SUBMITTED/EXPIRED/CANCELLED → GRADED |
| Teacher grading flow | � | Score + feedback |
| Question types (MCQ, TF, SHORT, ESSAY, MATCHING) | � | Shuffling + versioning |

### 2.5 Frontend

| Surface | Status | Notes |
|---------|--------|-------|
| Landing (master identity) | ✅ | Architectural grid reveal |
| Teacher discovery (`/teachers`) | ✅ | Cards + ENTER SPACE → |
| Teacher space (`/teachers/[slug]`) | ✅ | Motif continuity |
| Teacher dashboard | ✅ | Revenue, students, actions |
| Student dashboard | ✅ | Continue + progress + next |
| Lesson page | ✅ | CONTENT > NAV > SECONDARY |
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

## 🔟 Backend Deep Dive — Every NestJS Module Explained

### 10.1 Module Catalog

| Module | Folder | Responsibility | Key files | Depends on |
|--------|--------|----------------|-----------|------------|
| `tenants` | `modules/tenants` | Resolution (host → tenant_id), domains, JSON config | `prisma.service.ts` (`setTenantContext`), `tenant-resolver.service.ts` | — (root) |
| `auth` | `modules/auth` | Register/login, JWT 15m, refresh rotation 7d, TOTP, devices | `jwt.strategy.ts`, `refresh.service.ts`, `argon2.util.ts` | `tenants`, `users` |
| `users` | `modules/users` | Profiles, roles, devices, sessions, guardian links | `users.service.ts`, `devices.service.ts` | `tenants` |
| `authorization` | `modules/authorization` | `PolicyEngine.can()`, `AuthorizationGuard`, `@RequirePermission` | `policy-engine.ts`, `authorization.guard.ts` | `entitlements`, `feature-flags`, `plans` |
| `entitlements` | `modules/entitlements` | Per-student grants (purchase/voucher/subscription) | `entitlements.service.ts` (`grant`, `check`) | `payments`, `tenants` |
| `feature-flags` | `modules/feature-flags` | Per-tenant toggles (plan rules + overrides) | `flags.service.ts` | `plans`, `tenants` |
| `plans` | `modules/plans` | Tiers (Free/Starter/Pro/Business/Enterprise), limits, subscriptions | `plans.service.ts` | `tenants` |
| `courses` | `modules/courses` | Courses → sections → lessons, versioning, publishing | `courses.service.ts`, `lessons.service.ts` | `tenants`, `entitlements` |
| `exams` | `modules/exams` | Exams + questions + attempts, 70m timer, no-answer-leak | `exams.service.ts`, `attempts.service.ts` | `courses`, `authorization` |
| `assignments` | `modules/assignments` | Assignments + attempts + grading, 300m timer | `assignments.service.ts` (🚧) | `courses` |
| `payments` | `modules/payments` | Orders, intents, providers, ledger, webhooks, vouchers, refunds | `payment-orchestrator.service.ts`, `ledger.service.ts`, `webhook-inbox.service.ts` | `outbox`, `entitlements`, `audit` |
| `video` | `modules/video` | Upload URLs (TUS), status sync, provider abstraction | `bunny.provider.ts`, `vdocipher.provider.ts` (stub) | `tenants` |
| `video-protection` | `modules/video-protection` | Tokens, watermark, sessions, heartbeat, risk | `watermark-engine.ts`, `signed-token.service.ts`, `playback-session.service.ts` | `video`, `entitlements` |
| `audit` | `modules/audit` | `audit_logs`, `payment_audit_logs`, `security_events` | `audit.service.ts` | `tenants` |
| `outbox` | `modules/outbox` | `outbox_events` writer + BullMQ relay (no lost events) | `outbox.service.ts`, `relay.worker.ts` | `tenants` |
| `notifications` | `modules/notifications` | (planned) email/WhatsApp/push via BullMQ | — | `outbox` |
| `analytics` | `modules/analytics` | (planned) OLAP views, teacher dashboards | — | `courses`, `payments` |

### 10.2 Guarded Endpoint Pattern (Copy This)

```typescript
// apps/api/src/modules/exams/exams.controller.ts
import { Controller, Post, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthorizationGuard } from '@/common/guards/authorization.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { TenantContextInterceptor } from '@/common/interceptors/tenant-context.interceptor';

@Controller('exams')
@UseGuards(AuthorizationGuard)              // 1. Deny by default
@UseInterceptors(TenantContextInterceptor) // 2. SET app.tenant_id per request
export class ExamsController {
  @Post(':id/attempts')
  @RequirePermission('exam:enter', 'Enter exam (records ENTER_EXAM)') // 3. Policy check
  async enter(@Param('id') id: string) {
    // 4. Service fetches by (tenant_id, id) — never id alone
    // 5. Checks enrollment + entitlement + maxAttempts
    // 6. Creates attempt with startedAt=NOW, expiresAt=NOW+70m IN TRANSACTION
    // 7. Idempotent progression unlock (ENTER_EXAM → next lesson)
    // 8. Audit + outbox in SAME transaction
    return this.examsService.enter(id);
  }
}
```

### 10.3 Service Transaction Template (Money / Unlock / Timer)

```typescript
// Golden rule: business write + ledger/enrollment/progression + outbox + audit = ONE tx
await this.prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

  // 1. Lock + validate (FOR UPDATE where money/attempts)
  const attempt = await tx.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });
  if (attempt.expiresAt.getTime() !== storedExpiresAt.getTime()) throw new ConflictException();

  // 2. Mutate (NEVER reset expiresAt on re-enter — it is authoritative)
  // 3. Progression (idempotent upsert, UNIQUE constraint guards concurrency)
  await tx.progressionEvent.upsert({ /* ... */ });

  // 4. Outbox (same tx — relay publishes later)
  await tx.outboxEvent.create({ data: { type: 'EXAM_ENTERED', payload } });

  // 5. Audit (same tx)
  await tx.auditLog.create({ data: { action: 'EXAM_ENTERED', ... } });
});
```

---

## 1️⃣1️⃣ Frontend Deep Dive — Next.js App Router Tour

### 11.1 Routes Map

```
app/
├── page.tsx                          → Landing (master identity, grid reveal)
├── teachers/page.tsx                 → Discovery (cards, filters by subject)
├── teachers/[slug]/page.tsx          → Teacher space (motif continuity)
├── teacher/
│   ├── page.tsx                      → Command center (revenue, students, actions)
│   ├── students/page.tsx             → Roster + progress + entitlements
│   ├── assignments/page.tsx          → Inbox (SUBMITTED → grade)
│   └── analytics/page.tsx            → One metric + context + trend + action
├── student/
│   ├── page.tsx                      → Continue + progress + next + upcoming
│   └── lessons/[id]/page.tsx         → CONTENT > NAV > SECONDARY
└── api/ (route handlers, thin — real logic lives in NestJS)
```

### 11.2 Data-Fetching Rules (Server Components First)

```tsx
// ✅ Server Component — tenant-aware fetch, no token in browser
export default async function TeacherSpace({ params }: { params: { slug: string } }) {
  const res = await fetch(`${process.env.API_URL}/tenants/by-slug/${params.slug}`, {
    headers: { 'x-tenant-slug': params.slug },
    next: { revalidate: 60 },
  });
  if (!res.ok) notFound();
  const teacher = await res.json();
  return <TeacherSpaceView teacher={teacher} />;
}

// ❌ NEVER: fetch with service-role key, expose JWT secret, or trust ?unlocked=true
```

### 11.3 Upload Manager (TUS Resumable — 7 Components)

```
components/upload/
├── index.ts               → Public barrel
├── FileDropzone.tsx       → Drag/drop + accept + size guard (pre-quota check)
├── VideoUploader.tsx      → Gets signed TUS URL from API, uploads DIRECT to Bunny
├── ResourceUploader.tsx   → PDFs/slides → R2 presigned URL
├── ThumbnailUploader.tsx  → Images → R2, preview + crop hint
├── UploadItem.tsx         → Single file row (progress, retry, cancel)
├── UploadProgress.tsx     → Aggregate bar (used in builder header)
├── UploadPreview.tsx      → Thumbnail + duration + status chip
└── UploadManager.tsx      → Queue + concurrency (3) + persistence (localStorage ONLY for UI state)
```

> API is never in the upload hot path: `POST /video/lessons/:id/videos` returns TUS URL → browser → Bunny. Webhook flips `UPLOADING → PROCESSING → READY`.

### 11.4 Command Palette (Cmd+K)

| Registrar | Actions | File |
|-----------|---------|------|
| Teacher | Go to analytics, grade inbox, new course, publish lesson, copy voucher batch | `app/teacher/TeacherCommandRegistrar.tsx` |
| Student | Continue learning, go to next lesson, view attempts, download receipt | `app/student/StudentCommandRegistrar.tsx` |

```tsx
// useCommandPalette.tsx — tiny, feature-owned (not a global animations.ts)
const { open, setOpen } = useCommandPalette();
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); setOpen(!open);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [open]);
```

### 11.5 Timer Display (Derived, Never Authoritative)

```tsx
// Student sees countdown, but server owns expiresAt. Refresh = re-fetch, NOT reset.
function useServerCountdown(expiresAtISO: string) {
  const expires = new Date(expiresAtISO).getTime();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remainingSec = Math.max(0, Math.floor((expires - now) / 1000));
  return { remainingSec, expired: remainingSec <= 0 };
}
// On expired → call POST /attempts/:id/submit (server checks expiresAt, auto-marks EXPIRED)
```

---

## 1️⃣2️⃣ Database Design — ERD, Models, Versioning, Indexing

### 12.1 Entity-Relationship (Core Slice)

```mermaid
erDiagram
    TENANTS ||--o{ TENANT_DOMAINS : has
    TENANTS ||--o{ TENANT_CONFIG : has
    TENANTS ||--o{ USERS : scopes
    TENANTS ||--o{ COURSES : owns
    COURSES ||--o{ SECTIONS : contains
    SECTIONS ||--o{ LESSONS : contains
    LESSONS ||--o{ VIDEOS : embeds
    LESSONS ||--o{ ASSIGNMENTS : "may link"
    LESSONS ||--o{ EXAMS : "may link"
    EXAMS ||--o{ QUESTIONS : has
    EXAMS ||--o{ EXAM_ATTEMPTS : taken-as
    ASSIGNMENTS ||--o{ ASSIGNMENT_ATTEMPTS : taken-as
    USERS ||--o{ ENROLLMENTS : enrolls
    COURSES ||--o{ ENROLLMENTS : receives
    USERS ||--o{ ENTITLEMENTS : granted
    TENANTS ||--o{ ORDERS : bills
    ORDERS ||--o{ ORDER_ITEMS : lines
    ORDERS ||--o{ PAYMENT_INTENTS : pays-via
    PAYMENT_INTENTS ||--o{ PAYMENTS : settles
    PAYMENTS ||--o{ LEDGER_ENTRIES : posts
    PAYMENTS ||--o{ WEBHOOK_EVENTS : notified-by
    TENANTS ||--o{ VOUCHERS : issues
    VOUCHERS ||--o{ VOUCHER_REDEMPTIONS : redeemed-as
    TENANTS ||--o{ OUTBOX_EVENTS : emits
    TENANTS ||--o{ AUDIT_LOGS : records
```

### 12.2 Model Groups (Prisma)

| Group | Models | Tenant-scoped? | Versioned? |
|-------|--------|----------------|------------|
| Identity | `Tenant`, `TenantDomain`, `TenantConfig` | Root (`Tenant` is root) | Config is append-only |
| People | `User`, `Device`, `Session`, `GuardianLink` | ✅ `tenantId` | — |
| Catalog | `Course`, `Section`, `Lesson`, `CourseVersion` | ✅ | ✅ publish = new version |
| Learning | `Enrollment`, `LessonProgress`, `ProgressionEvent` | ✅ | Progress pins version |
| Assessment | `Exam`, `Question`, `ExamAttempt`, `Assignment`, `AssignmentAttempt`, `Submission`, `Grade` | ✅ | ✅ attempts pin version |
| Commerce | `Order`, `OrderItem`, `PaymentIntent`, `Payment`, `PaymentAttempt`, `Refund`, `Voucher`, `VoucherRedemption`, `LedgerEntry`, `Settlement`, `SettlementItem` | ✅ | Immutable ledger (never update, only reverse) |
| Video | `Video`, `PlaybackSession`, `CaptureEvent`, `VideoQuota` | ✅ | Status machine |
| Platform | `Plan`, `Subscription`, `Entitlement`, `FeatureFlag`, `IdempotencyKey`, `WebhookEvent`, `OutboxEvent`, `ReconciliationRun`, `PaymentRiskEvent`, `PaymentAuditLog`, `AuditLog`, `SecurityEvent` | ✅ (except global plans) | Outbox ordered by seq |

### 12.3 Versioning Pattern (Never Mutate Published)

```prisma
model Course {
  id        String   @id @default(cuid())
  tenantId  String
  slug      String
  version   Int      @default(1)
  status    CourseStatus @default(DRAFT) // DRAFT | PUBLISHED | ARCHIVED
  // ... fields
  @@unique([tenantId, slug, version])
}

model ExamAttempt {
  id           String   @id @default(cuid())
  tenantId     String
  examId       String
  examVersion  Int      // ← pins the version the student started
  studentId    String
  startedAt    DateTime @default(now())
  expiresAt    DateTime // ← SOURCE OF TRUTH (startedAt + timerMinutes)
  status       AttemptStatus @default(IN_PROGRESS)
  @@index([tenantId, studentId, status])
  @@index([expiresAt]) // for auto-submit sweeper
}
```

### 12.4 Indexing Strategy

| Query | Index | Why |
|-------|-------|-----|
| Tenant isolation (every query) | `(tenantId)` leading column on ALL tenant tables | RLS + app filter both hit it |
| Login | `User(tenantId, email)` unique | Host → tenant → email |
| Enrollment check | `Enrollment(tenantId, studentId, courseId)` unique | Hot path on every lesson view |
| Entitlement check | `Entitlement(tenantId, studentId, resourceType, resourceId)` | Cached 60s in Redis |
| Attempt list | `ExamAttempt(tenantId, studentId, status)` | Dashboard queries |
| Auto-submit sweeper | `ExamAttempt(expiresAt)` where `status=IN_PROGRESS` | BullMQ delayed job fallback |
| Webhook dedupe | `WebhookEvent(provider, externalEventId)` unique | Replay protection |
| Idempotency | `IdempotencyKey(key)` unique + `expiresAt` TTL | 24h window |
| Ledger audit | `LedgerEntry(tenantId, paymentId)` | Reconciliation |
| Outbox relay | `OutboxEvent(processed, seq)` | Ordered publish |
| Voucher redeem | `Voucher(codeHash)` unique | Atomic lookup |

### 12.5 Migrations & RLS Files

```
prisma/migrations/
├── 20240101000000_init_rls.sql        → Base RLS: ENABLE + FORCE + policies (SELECT/INSERT/UPDATE/DELETE)
└── 20261007000000_lms_rls/migration.sql → LMS tables RLS (assignments, exams, attempts, progression)
```

```sql
-- Pattern applied to EVERY tenant table (see migration files for full list):
ALTER TABLE "ExamAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamAttempt" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_select" ON "ExamAttempt";
CREATE POLICY "tenant_isolation_select" ON "ExamAttempt"
  FOR SELECT USING (current_setting('app.tenant_id', true) = "tenantId");
-- Repeat for INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), DELETE (USING)
```

---

## 1️⃣3️⃣ Multi-Tenancy — Host Resolution → RLS (The Core Magic)

### 13.1 How a Request Finds Its Tenant

```mermaid
flowchart LR
    H[Host: physics-ahmed.example.com] --> M{tenant_domains lookup}
    M -->|HIT| T[tenant_id = t_123]
    M -->|MISS| F[404 Unknown tenant]
    T --> C[SET app.tenant_id = t_123 tx-local]
    C --> Q[SELECT * FROM courses — RLS auto-filters]
    Q --> R[Only t_123 rows — even if code forgets WHERE]
```

### 13.2 Code: Tenant Resolution + Context

```typescript
// apps/api/src/modules/tenants/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  // Call INSIDE every transaction, FIRST statement:
  async setTenantContext(tx: any, tenantId: string) {
    // `true` = local to THIS transaction only (no pool leakage)
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  }
}
```

```typescript
// apps/api/src/common/interceptors/tenant-context.interceptor.ts
// Runs before EVERY guarded handler: resolves Host → tenant_id → stores on request
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    const host = req.headers['host'] ?? req.headers['x-forwarded-host'];
    // 1. Lookup tenant_domains (cached 30s in Redis)
    // 2. req.tenantId = row.tenant_id (or throw 404)
    // 3. Services MUST call setTenantContext(tx, req.tenantId) before queries
    return next.handle();
  }
}
```

### 13.3 Code: Fetch by (tenant_id, id) — Never ID Alone

```typescript
// ❌ VULNERABLE — cross-tenant read if attacker guesses UUID
const course = await prisma.course.findUnique({ where: { id } });

// ✅ CORRECT — tenant-scoped composite lookup (+ RLS as backstop)
const course = await tx.course.findFirstOrThrow({
  where: { tenantId: req.tenantId, id },
});
```

### 13.4 Isolation Guarantees (What RLS Gives You)

| Attack | Without RLS | With FORCE RLS + app_user |
|--------|-------------|---------------------------|
| Dev forgets `tenantId` in WHERE | Leaks all tenants | Returns only current tenant (or zero) |
| SQL injection in filter | Full table dump | Still filtered to tenant |
| Stolen `app_user` creds, no tenant ctx | Full read | **Zero rows** (no ctx = no match) |
| `BYPASSRLS` attempt | — | Impossible (`app_user` lacks privilege; `postgres` never in runtime) |
| New table without policy | Open | CI check fails (see §30: `rls-coverage` job) |

### 13.5 Custom Domains per Teacher (White-Label)

```
teacher1.example.com ─┐
teacher1.com ─────────┼──→ tenant_domains ──→ tenant_id=t_123 ──→ branded space
www.teacher1.com ─────┘         (all map to ONE tenant)
```

| Step | Action |
|------|--------|
| 1 | Teacher adds domain in dashboard → `tenant_domains` row `status=PENDING` |
| 2 | Platform shows DNS CNAME target (`cname.lp-edge.example`) |
| 3 | Nightly verifier checks DNS → `status=VERIFIED` |
| 4 | Cloudflare for SaaS provisions cert (planned) |
| 5 | Requests with `Host: teacher1.com` resolve to `t_123` automatically |

---

## 1️⃣4️⃣ Authentication — JWT + Refresh Rotation + Devices

### 14.1 Token Lifetimes

| Token | TTL | Stored | Transport | On theft |
|-------|-----|--------|-----------|----------|
| Access JWT (RS256) | 15 min | Memory only (never localStorage) | `Authorization: Bearer` | Short window; refresh rotation limits blast radius |
| Refresh | 7 days | HttpOnly + Secure + SameSite=Lax cookie (`lp_refresh`) | Cookie auto-sent | **Reuse detection → revoke entire family** |
| Signup/invite | 24 h | DB (hashed) | Magic link / code | Single-use |
| Playback JWT | 2 h | Memory | HLS query/header | Bound to session + student + video |

### 14.2 Refresh Rotation Flow (Reuse Detection)

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as NestJS /auth
    participant DB as sessions table

    B->>API: POST /auth/refresh (cookie: R1)
    API->>DB: Find R1 (hash) — valid + not used?
    DB-->>API: Valid
    API->>DB: Mark R1 USED + issue R2 (same family)
    API-->>B: New access JWT + Set-Cookie: R2

    Note over B,DB: Attacker replays stolen R1:
    B->>API: POST /auth/refresh (cookie: R1 again)
    API->>DB: R1 already USED → REUSE DETECTED
    DB-->>API: Revoke whole family + flag security_event
    API-->>B: 401 + clear cookie + force re-login (all devices)
```

### 14.3 Password & Device Security

```typescript
// Argon2id (memory-hard) — NOT bcrypt, NOT SHA256
import * as argon2 from 'argon2';
const hash = await argon2.hash(password, {
  type: argon2.argon2id, memoryCost: 19456, timeCost: 3, parallelism: 1,
});

// Device fingerprint (SHA256 of canvas + UA + headers + salt) — stored, NOT PII-logged
const fp = sha256(`${canvas}|${ua}|${tz}|${DEVICE_FP_SALT}`).slice(0, 32);
```

| Control | Rule |
|---------|------|
| Password policy | Min 8, require letter + number; breach-list check (HaveIBeenPwned k-anonymity, planned) |
| 2FA | TOTP mandatory for TEACHER/ADMIN; optional for STUDENT/PARENT |
| Sessions | Max 3 concurrent per student; 5 per teacher; oldest evicted with email notice |
| Login alerts | New device → email + `security_event` row |
| Rate limits | 5 login attempts / 15m / IP+email → 30m lockout + CAPTCHA (planned) |

---

## 1️⃣5️⃣ Authorization — PolicyEngine Matrix

### 15.1 The Single Entry Point

```typescript
// apps/api/src/modules/authorization/policy-engine.ts
type Action =
  | 'course:read' | 'course:create' | 'course:publish'
  | 'lesson:read' | 'exam:enter' | 'exam:grade'
  | 'assignment:enter' | 'assignment:grade'
  | 'payment:create' | 'payment:refund' | 'voucher:redeem' // ← REDEEM must exist (known issue)
  | 'video:upload' | 'video:publish' | 'playback:authorize'
  | 'user:manage' | 'tenant:configure';

async function can(user, action: Action, resource?: { tenantId, ownerId?, courseId? }): Promise<boolean> {
  // 1. Tenant isolation (user.tenantId === resource.tenantId) — else DENY + security_event
  // 2. RBAC (role × action matrix below)
  // 3. Ownership (teacher owns course; student owns attempt)
  // 4. Entitlements (student has grant for course/video/exam?)
  // 5. Feature flags (tenant plan enables feature?)
  // 6. Plan limits (quota not exceeded? e.g., max students, storage hours)
  // ALL must pass → ALLOW. ANY fail → DENY (default-deny).
}
```

### 15.2 RBAC Matrix (Simplified — full matrix in `policy-engine.ts`)

| Action | STUDENT | PARENT | TEACHER | ADMIN | SUPER_ADMIN |
|--------|:-------:|:------:|:-------:|:-----:|:-----------:|
| `course:read` (enrolled) | ✅ | 👁 (own child) | ✅ | ✅ | ✅ |
| `course:create` | ❌ | ❌ | ✅ | ✅ | ✅ |
| `course:publish` | ❌ | ❌ | ✅ (own) | ✅ | ✅ |
| `exam:enter` | ✅ (entitled) | ❌ | 👁 (preview) | ✅ | ✅ |
| `exam:grade` | ❌ | ❌ | ✅ (own course) | ✅ | ✅ |
| `assignment:enter` | ✅ (entitled) | ❌ | 👁 | ✅ | ✅ |
| `payment:create` | ✅ (self) | ✅ (child) | ❌ | ✅ (manual) | ✅ |
| `payment:refund` | ❌ | ❌ | ❌ (request only) | ✅ | ✅ |
| `voucher:redeem` | ✅ | ✅ (child) | ❌ | ✅ | ✅ |
| `video:upload` | ❌ | ❌ | ✅ (quota) | ✅ | ✅ |
| `playback:authorize` | ✅ (entitled) | ❌ | ✅ | ✅ | ✅ |
| `user:manage` | ❌ (self only) | ❌ | ✅ (own students) | ✅ | ✅ |
| `tenant:configure` | ❌ | ❌ | ⚠️ (branding only) | ✅ | ✅ |

### 15.3 Decorator + Guard Wiring

```typescript
// Controller (declarative — no inline if(role) spaghetti):
@Post(':id/grade')
@RequirePermission('assignment:grade')
async grade(@Param('id') id: string, @Body() dto: GradeDto, @Req() req) {
  return this.assignmentsService.grade(req.tenantId, req.user, id, dto);
}
// Guard resolves: tenant → user → PolicyEngine.can() → ALLOW or 403 + audit
```

## 1️⃣6️⃣ Payments — Providers, Orchestrator, Ledger, Webhooks

### 16.1 Provider Contract (Swap Without Rewriting Business Logic)

```typescript
// apps/api/src/modules/payments/providers/payment-provider.interface.ts
export interface PaymentProvider {
  readonly name: 'paymob' | 'fawry' | 'voucher' | 'instapay' | 'vodafone-cash' | 'e-money';
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>; // redirect URL / client token
  getPaymentStatus(ref: string): Promise<PaymentStatus>;                  // polling fallback
  verifyPayment(ref: string): Promise<PaymentStatus>;                     // authoritative check
  refund?(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<boolean>; // HMAC FIRST
}
```

| Provider | Create | Verify | Refund | Webhook auth | Status |
|----------|--------|--------|--------|--------------|--------|
| Paymob | Hosted checkout + iframe | HMAC-SHA512 over sorted payload | ✅ | `hmac` header | ✅ Production |
| Fawry | Charge + reference number (kiosk/cash) | SHA256 signature | ✅ | `secure-hash` | ✅ Production |
| Voucher | N/A (no external call — atomic DB redeem) | `codeHash` lookup | N/A (void grant) | N/A (internal) | ✅ Production |
| Instapay | — | — | — | — | � Stub |
| Vodafone Cash | — | — | — | — | � Stub |
| e& money | — | — | — | — | � Stub |

### 16.2 Orchestration (Transaction = Source of Truth)

```mermaid
sequenceDiagram
    participant S as Student
    participant API as Orchestrator
    participant P as Provider (Paymob/Fawry)
    participant WH as Webhook Inbox
    participant DB as PG (ONE tx)

    S->>API: POST /payments/intents (orderId) + Idempotency-Key
    API->>API: Server prices order (NEVER trust client amount)
    API->>P: createPayment(amount, currency=EGP)
    P-->>S: Redirect to pay (card / Fawry ref / wallet)
    S->>P: Pays
    P->>WH: POST /webhooks/paymob (raw body + HMAC)
    WH->>WH: 1. Verify HMAC 2. Replay guard UNIQUE(provider, eventId) 3. Persist inbox
    WH->>DB: BEGIN — Payment=PAID + Ledger + Enrollment + Entitlements + Outbox + Audit — COMMIT
    DB-->>S: Enrollment active (next poll / websocket)
```

### 16.3 Golden Rules (Violate These → Revert PR)

1. **Never trust payment status from client** (redirect `success=true` means nothing).
2. **Never trust amount/discount from client** (server reprices from `Order` + `Voucher` + `Plan`).
3. **Never trust provider callback until HMAC verified** (raw body, constant-time compare).
4. **Never process same event twice** (inbox unique + idempotent state machine).
5. **Never create enrollment from browser redirect alone** (only from verified webhook / verified status poll).
6. **Never mutate historical financial records** (ledger is append-only; refunds are reversing entries).

### 16.4 Webhook Verification (Paymob + Fawry Patterns)

```typescript
// 1. Use RAW body (not JSON-parsed) — Express: express.raw({ type: '*/*' }) on webhook route
import { createHmac, timingSafeEqual } from 'crypto';

function verifyPaymobHmac(rawBody: Buffer, receivedHmac: string, secret: string): boolean {
  const computed = createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(receivedHmac, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b); // constant-time!
}
// 2. Replay guard BEFORE business logic:
await tx.webhookEvent.create({ data: { provider, externalEventId } }); // UNIQUE → 409 = duplicate, ACK + ignore
// 3. THEN transition Payment PENDING → PAID (idempotent: if already PAID, ACK + ignore)
```

### 16.5 Double-Entry Ledger (Auditable Money)

```
Payment PAID (EGP 500, course):
  DEBIT   PLATFORM_RECEIVABLE      500
  CREDIT  CUSTOMER_CLEARING        500
  (On settlement to teacher, 85% share):
  DEBIT   PLATFORM_CASH            425
  CREDIT  TEACHER_PAYABLE:t_123    425
  DEBIT   PLATFORM_FEE_REVENUE       75  (implicit via receivable clearing)

Refund (full):
  CREDIT  PLATFORM_RECEIVABLE      500   (reversal, new rows — never UPDATE old rows)
  DEBIT   CUSTOMER_CLEARING        500

Invariant (checked by nightly job): SUM(debits) == SUM(credits) per tenant per day.
Mismatch → reconciliation item → investigation queue (NO auto-correction).
```

### 16.6 Voucher Atomic Redeem (Concurrency-Safe)

```sql
-- 1. Hash incoming code (never store raw):
-- codeHash = HMAC_SHA256(normalized_code, VOUCHER_HMAC_SECRET)
-- 2. Lock the voucher row:
SELECT * FROM "Voucher" WHERE "codeHash" = $1 FOR UPDATE;
-- 3. Checks in SAME tx: not expired, uses < maxUses, not already redeemed by this user
-- 4. INSERT redemption (UNIQUE(voucherId, userId) where single-use) + grant entitlement + outbox + audit
-- Concurrent double-redeem → one wins, other gets UNIQUE violation → clean 409 (no double grant)
```

### 16.7 Idempotency Keys (24h TTL)

```http
POST /api/payments/intents HTTP/1.1
Host: api.example.com
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{ "orderId": "ord_123", "paymentMethod": "paymob" }
```

| Scenario | Behavior |
|----------|----------|
| Same key + same payload (retry) | Return ORIGINAL result (no new intent) |
| Same key + different payload | `422 Idempotency conflict` (client bug) |
| Key older than 24h | Expired → treated as new (row swept by cron) |

### 16.8 Reconciliation (Daily, No Auto-Correction)

```
Cron 02:00 Africa/Cairo:
  FOR each provider settlement report (CSV/API):
    Match internal Payments (PAID) ↔ provider records by providerRef
    ├── Matched → OK
    ├── Internal PAID, provider MISSING → investigate (webhook lost? → verify via getPaymentStatus)
    ├── Provider PAID, internal PENDING → backfill via verified poll + ledger (with audit RECONCILED)
    └── Amount mismatch → freeze payout for order → manual review queue
```

---

## 1️⃣7️⃣ Video Protection — 7 Layers + Watermark Math

### 17.1 Threat Model

| Actor | Attack | Mitigation layers |
|-------|--------|-------------------|
| Casual student | Share login with friend | Session binding (1 active) + device FP + heartbeat |
| Telegram uploader | Screen-record + re-upload | Moving HMAC watermark (identity attribution) + capture detection |
| Token thief | Steal HLS URL, share publicly | Short-lived JWT (2h) bound to session+student+video+IP-range |
| Quota abuser | Upload 4K movies as "lesson" | Pre-upload quota (size + stored hours per plan) |
| Devtools tinkerer | Remove watermark overlay | Tamper detection (MutationObserver + interval) → risk → revoke |
| Credential stuffer | Brute-force student accounts | Rate-limit + device alerts + Argon2id (slow to crack) |

### 17.2 The 7 Layers (In Order)

```
1. DIRECT UPLOAD   Browser → Bunny (TUS resumable). API NEVER proxies bytes. API issues signed upload URL AFTER quota check.
2. QUOTAS          Per-tenant: maxFileBytes (e.g., 2GB) + maxStoredHours (e.g., 100h on Pro). Checked BEFORE createUpload.
3. PLAYBACK TOKEN  JWT 2h: { videoId, sessionId, studentId, tenantId, exp, watermarkSeed }. Signed with VIDEO_TOKEN_SECRET.
4. WATERMARK       HMAC payload rendered as moving overlay (see §17.3). Verified client-side + logged server-side.
5. SESSION BINDING One active playback session per student. New device → oldest revoked + email. Heartbeat 15s → risk score.
6. CAPTURE EVENTS  Client reports: screenshot key, recording API, focus loss, devtools open, overlay removed. Server scores.
7. RISK ENGINE     LOW → allow. MEDIUM → challenge (re-auth). HIGH → pause + warn. CRITICAL → revoke token + kill session + audit.
```

### 17.3 Watermark Math (Deterministic, Verifiable)

```
Payload:  studentName|studentPhone|studentId|tenantName|enrollmentId|issuedAt|expiresAt|seed
Signature: HMAC-SHA256(payload, VIDEO_WATERMARK_HMAC_SECRET) → hex (first 16 chars displayed as tiny code)
Positions: mulberry32(seed) → PRNG stream; every 7s pick (x: 4–60%, y: 6–82%) safe zones (avoids controls)
Opacity: 0.55–0.75 (readable on pause, non-blocking during play)
Tamper: MutationObserver on overlay node + 3s interval checksum → mismatch = CAPTURE_EVENT{type: WATERMARK_TAMPER}
```

```typescript
// apps/api/src/modules/video-protection/services/watermark-engine.ts
// mulberry32 — tiny, seedable, deterministic (same seed → same positions on re-render)
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Position at tick n: rng = mulberry32(seed + n); x = 4 + rng()*56; y = 6 + rng()*76;
```

### 17.4 Playback Token + Session Flow

```mermaid
sequenceDiagram
    participant S as Student player (hls.js)
    participant API as /playback-token
    participant CDN as Bunny Edge
    participant HB as /heartbeat (15s)

    S->>API: GET /video/:id/playback-token (sessionId + entitlement proof)
    API->>API: Check enrollment + entitlement + video=PUBLISHED + quota
    API-->>S: { hlsUrl (signed), token (JWT 2h), watermarkPayload (HMAC) }
    S->>CDN: GET manifest.m3u8?token=JWT
    CDN->>CDN: Verify JWT (exp + session + student + video) → serve segments
    S->>S: Render WatermarkOverlay (moves every 7s)
    loop Every 15s
        S->>HB: POST /playback/heartbeat (watchTime, focus, overlayChecksum)
        HB-->>S: { risk: LOW } or challenge/revoke
    end
    S->>API: POST /playback/capture (type: SCREENSHOT) → risk bump → maybe revoke
```

### 17.5 Video State Machine

```
UPLOADING ──(TUS complete + webhook)──→ PROCESSING ──(transcode done)──→ READY ──(teacher publishes)──→ PUBLISHED
     │                                      │                              │                                    │
     │ (webhook: failed)                    │ (webhook: failed)            │ (teacher unpublishes)              │ (provider deletes)
     ▼                                      ▼                              ▼                                    ▼
  FAILED ──(retry createUpload)──→ UPLOADING   FAILED ──(retry)──→ PROCESSING   READY                          ARCHIVED
```

| Status | Playable? | Listed? | Notes |
|--------|-----------|---------|-------|
| UPLOADING | ❌ | ❌ (teacher only) | TUS in progress |
| PROCESSING | ❌ | ❌ | Transcoding / DRM packaging |
| READY | ❌ | ✅ (teacher preview) | Awaiting publish |
| PUBLISHED | ✅ (entitled) | ✅ | CDN serves with token |
| FAILED | ❌ | ⚠️ (error banner) | Retry or manual intervene |
| ARCHIVED | ❌ | ❌ | Soft-deleted, recoverable 30d |

---

## 1️⃣8️⃣ LMS Core — Progression by Entry + Server Timers

### 18.1 The Big Idea (Read This Once)

> **Progression by ENTRY, not by score.** Entering an assignment unlocks its exam.
> Entering an exam unlocks the next lesson. No pass thresholds in Phase 1.
> Timers are **server-authoritative**: `expiresAt` is truth; frontend is a clock display.

```
ENTER_ASSIGNMENT ──→ EXAM unlocked
ENTER_EXAM ──→ NEXT LESSON unlocked

Future (extension points, NOT active): COMPLETE_* / PASS_EXAM / SCORE_THRESHOLD / TIME_ELAPSED / MANUAL
```

### 18.2 State Machines

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS : POST /assignments/:id/attempts\n(startedAt=NOW, expiresAt=NOW+300m)
    IN_PROGRESS --> SUBMITTED : POST /attempts/:id/submit (before expiresAt)
    IN_PROGRESS --> EXPIRED : expiresAt passes (sweeper auto-submits)
    IN_PROGRESS --> CANCELLED : Teacher/admin cancels
    SUBMITTED --> GRADED : Teacher grades (score + feedback)
    EXPIRED --> GRADED : Teacher grades late submission
```

```mermaid
stateDiagram-v2
    [*] --> IN_PROGRESS : POST /exams/:id/attempts\n(startedAt=NOW, expiresAt=NOW+70m)
    IN_PROGRESS --> SUBMITTED : POST /attempts/:id/submit (answers, before expiresAt)
    IN_PROGRESS --> EXPIRED : Auto-submit on expiresAt (BullMQ delayed job + sweeper)
    IN_PROGRESS --> CANCELLED : Abandoned / revoked
    SUBMITTED --> GRADED : Auto-grade (MCQ/TF) + manual (essay) → merged
    EXPIRED --> GRADED : Grade what was answered
```

### 18.3 Timer Contract (Server-Authoritative)

| Field | Stored? | Meaning |
|-------|---------|---------|
| `startedAt` | ✅ DB | Server `NOW()` at ENTER. Immutable. |
| `expiresAt` | ✅ DB | `startedAt + timerMinutes`. **SOURCE OF TRUTH.** Never recomputed, never reset on re-fetch. |
| `remainingSeconds` | ❌ derived | `max(0, expiresAt - serverNow)`. Frontend display only. |
| `timerMinutes` | ✅ (parent config snapshot) | Copied to attempt at creation (config change doesn't affect running attempts). |

```typescript
// ENTER (first time) — creates attempt:
const startedAt = new Date(); // server time, NOT client time
const expiresAt = new Date(startedAt.getTime() + timerMinutes * 60_000);
await tx.attempt.create({ data: { startedAt, expiresAt, status: 'IN_PROGRESS', versionSnapshot } });
// RE-ENTER (refresh / resume) — returns SAME attempt, SAME expiresAt (NEVER extend):
const existing = await tx.attempt.findFirst({ where: { studentId, parentId, status: 'IN_PROGRESS' } });
if (existing) return { ...existing, remainingSeconds: diff(serverNow, existing.expiresAt) };
```

| Scenario | Correct behavior |
|----------|------------------|
| Refresh / browser restart | Same `expiresAt` (resume) |
| Client clock manipulated | Ignored (server `NOW()` only) |
| Tab open past expiry | Sweeper/BullMQ marks EXPIRED + auto-submits |
| Double-click ENTER (race) | Unique partial index `(studentId, parentId)` WHERE `status=IN_PROGRESS` → one wins |
| Teacher changes `timerMinutes` mid-attempt | Running attempts unaffected (snapshot); new attempts use new value |

### 18.4 Progression Security (Frontend MUST NOT Control Unlocks)

```
Student Request → Auth → Tenant → Authorization → Enrollment → Entitlement
  → Business Rule (ENTER_*) → TRANSACTION (attempt + progression upsert + outbox + audit)
  → Response: { isLocked: boolean, unlockType: ContentUnlockType }
```

- ❌ NEVER accept `lockStatus: "UNLOCKED"` from student.
- ❌ NEVER trust `?unlocked=true`, localStorage flags, or client-computed progression.
- ✅ Unlock rows have `UNIQUE(studentId, targetId, unlockType)` → concurrent double-ENTER = one row (idempotent).
- ✅ Use `Idempotency-Key` on ENTER endpoints for safe retries.

### 18.5 API Examples (LMS)

```http
### Enter assignment (starts 300m timer + unlocks linked exam)
POST /api/assignments/asg_123/attempts HTTP/1.1
Authorization: Bearer <15m JWT>
Idempotency-Key: <uuid>

# 201 Created
{
  "attemptId": "aat_456",
  "startedAt": "2026-10-07T10:00:00Z",
  "expiresAt": "2026-10-07T15:00:00Z",
  "remainingSeconds": 18000,
  "unlocked": [{ "type": "EXAM", "id": "exm_789", "unlockType": "ENTER_ASSIGNMENT" }]
}

### Enter exam (starts 70m timer + unlocks next lesson)
POST /api/exams/exm_789/attempts HTTP/1.1
Authorization: Bearer <15m JWT>
Idempotency-Key: <uuid>

# 201 Created
{
  "attemptId": "eat_999",
  "startedAt": "2026-10-07T10:05:00Z",
  "expiresAt": "2026-10-07T11:15:00Z",
  "remainingSeconds": 4200,
  "questions": [{ "id": "q1", "type": "MCQ", "prompt": "...", "options": ["A","B","C","D"] }],
  "unlocked": [{ "type": "LESSON", "id": "les_next", "unlockType": "ENTER_EXAM" }]
}
# NOTE: correct answers NEVER included. Auto-grade happens server-side on submit.
```

### 18.6 Question Types & Grading

| Type | Auto-grade? | Student sees | Teacher sees |
|------|-------------|--------------|--------------|
| MCQ | ✅ exact match | Options only (shuffled if enabled) | Correct option + distractor stats |
| TRUE_FALSE | ✅ | Statement + True/False | Correct value |
| SHORT_ANSWER | ⚠️ normalized match + manual review | Text input | Model answer + tolerance rules |
| ESSAY | ❌ manual (rubric) | Rich text | Rubric + score + feedback |
| MATCHING | ✅ (all pairs correct) | Drag/match UI | Pair mapping |

---

## 1️⃣9️⃣ Visual Identity — 80/20 Rule + Subject DNA

> Full spec: [`docs/VISUAL_IDENTITY.md`](docs/VISUAL_IDENTITY.md) (344 lines). This section is the operational summary.

### 19.1 The 80/20 Rule

| Share | Owned by | Contains | NEVER changes per tenant |
|-------|----------|----------|--------------------------|
| 80% Master | Platform | Typography, grid, spacing, nav, components, motion, icons, card geometry | Hierarchy, behavior, a11y, interaction language |
| 20% Expression | Tenant/Subject | Accent color, motif, hero art, shapes, logo, imagery, patterns | — (customizable) |

### 19.2 3-Layer Identity

```
LAYER 1 PLATFORM → type, grid, spacing, UI, motion, icons, principles (same everywhere)
LAYER 2 SUBJECT  → motif, geometry, accent family, illustrations, atmosphere (per subject)
LAYER 3 TEACHER  → logo, photo, course identity, accent tweak, domain (per teacher)

Result: PLATFORM DNA + SUBJECT DNA + TEACHER DNA
```

### 19.3 Subject Visual DNA (Implementation Hints)

| Subject | Motif | Geometry | Motion metaphor | Accent family |
|---------|-------|----------|-----------------|---------------|
| Mathematics | Grids, coordinates, angles | Precise rectangles, hairlines | Straight, grid-aligned | Indigo / graphite |
| Physics | Orbits, waves, vectors | Orbital curves, field lines | Kinetic, wave-like | Cyan / deep navy |
| Arabic | Letterforms, ink rhythm | Calligraphic curves, editorial rules | Flowing, typographic | Emerald / ink black |
| English | Quotes, columns | Editorial grid, modular type | Structured, rhythmic | Amber / warm gray |
| Chemistry | Molecules, hexagons | Nodes + bonds, hex patterns | Connected, node-based | Teal / lab white |
| CS | Graphs, blocks | Node graphs, binary rhythm | Logical, modular | Lime / carbon |

### 19.4 Teacher Card (Most Recognizable Element)

```
┌────────────────────────────────────┐
│ PLATFORM / TEACHERS                │
│    [SUBJECT VISUAL — motif here]   │
│ PHYSICS                            │
│ Dr. Ahmed                          │
│ Mechanics • Waves • Electricity    │
│ 24 Courses      1,240 Students     │
│                    ENTER SPACE →   │
└────────────────────────────────────┘
Same structure, different expression. Motif persists into Teacher Space header (shared-element transition).
```

### 19.5 What Tenant CAN vs CANNOT Change

| ✅ Allowed | ❌ Forbidden |
|-----------|--------------|
| Logo, name, photo, subject, accent, motif, hero/cover art, domain, course presentation, small prefs | Info hierarchy, nav, component behavior, a11y rules, interaction language, layout principles, core type system |

---

## 2️⃣0️⃣ Design System — Tokens (Color, Type, Space, Motion)

> Source of truth: `packages/design-system/tokens.css` (web) + `tokens/*.ts` (typed). No hardcoded hex outside tokens.

### 20.1 Colors (`tokens/colors.ts` + `tokens.css`)

```css
/* Master: Deep Graphite + Near Black + Warm Off-White. Accent = electric/intelligent. */
:root {
  --lp-ink-950: #0B0D10;   /* near black — hero bg */
  --lp-ink-900: #13161B;   /* graphite — panels */
  --lp-ink-700: #2A2F37;
  --lp-paper-50: #FAF7F2;   /* warm off-white — reading bg */
  --lp-paper-100: #F3EFE8;
  --lp-accent-500: #2E5BFF; /* electric — default; overridden per subject/tenant */
  --lp-accent-600: #1E40D8;
  --lp-success-500: #16A34A;
  --lp-warn-500: #D97706;
  --lp-danger-500: #DC2626; /* used sparingly — no aggressive red walls */
}
```

### 20.2 Typography (`tokens/typography.ts`)

| Role | EN | AR | Usage |
|------|----|----|-------|
| Display | `Sora` / `Space Grotesk` (600–700) | `IBM Plex Sans Arabic` (600–700) | Landing hero, teacher space title |
| Heading | Inter (600) | IBM Plex Sans Arabic (600) | Section titles |
| Body | Inter (400/500) | IBM Plex Sans Arabic (400/500) | Long-form, lessons |
| UI | Inter (500, tabular) | IBM Plex Sans Arabic (500) | Buttons, labels |
| Numeric | `tabular-nums` | `tabular-nums` | Prices, timers, stats (never jump) |

### 20.3 Spacing & Borders (`tokens/spacing.ts`, `tokens/border.ts`)

```
spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96  (4pt base, generous whitespace)
radius:  sm 6 / md 10 / lg 16 / xl 24 (cards, NOT pills everywhere)
border: 1px solid ink-900/8% on paper; 1px solid white/10% on dark
```

### 20.4 Motion Tokens (`tokens/motion.ts`)

```
motion.instant  = 80ms    motion.fast   = 140ms
motion.standard = 220ms   motion.medium = 320ms
motion.slow     = 450ms   motion.emphasis = 650ms   motion.hero = 900ms

EASE_OUT   → buttons, hover, dropdowns, menus, cards
EASE_IN_OUT→ page transitions, layout movement, shared-element
Spring     → drag/reorder only (sparingly)
```

See §21 for budgets + rules.

## 2️⃣1️⃣ Motion Language — Budgets, Tokens, Rules

> Principle: **MOTION = FEEDBACK + HIERARCHY + CONTINUITY.** If an animation doesn't explain a change, guide attention, or preserve continuity — delete it.

### 21.1 Budgets by Surface

| Surface | Budget | Allowed | Forbidden |
|---------|:------:|---------|-----------|
| Marketing / Landing | High | Grid reveal, hero 900ms, motif transitions | — (still no random parallax) |
| Teacher dashboard | Medium | Drawer 320ms, tab slide, toast | Heavy hero on every visit |
| Course builder | Medium | Reorder spring, autosave pulse | Layout thrash |
| Student dashboard | Low–Med | Progress fill, card expand | Autoplay, bounces |
| Learning / lesson | Low | Fade + 8px slide, tab slide | Parallax, glows |
| Exam | Very Low | State changes only (submit → graded) | ANY decorative motion (distraction = unfair) |
| Payment | Low | Success check 220ms AFTER backend confirms | Fake success before webhook |
| Auth | Low | Error fade, focus ring | Shakes, jumps |

### 21.2 Signature Motions (Only 3 — Everything Else Is Standard)

1. **Architectural Grid Reveal** (landing/hero) — hairlines draw in, then content fades (450–900ms, once).
2. **Learning Path Connection** (course/teacher space) — SVG path draws between nodes as you scroll into view.
3. **Teacher Space Portal** (card → space) — shared-element: motif + title morph (300–500ms, `EASE_IN_OUT`).

### 21.3 Hard Rules

- Buttons: hover = subtle contrast; press = `scale(0.98)`; loading preserves width (no layout shift); success = icon swap (no confetti on money/exam).
- Hover reveals interactivity only (no lift/rotate/glow explosions).
- Focus ALWAYS visible (keyboard = mouse).
- Page transitions: `opacity + translateY(8px)`, 250–450ms. Navigation first, motion second.
- Modals: backdrop fade + `scale(0.98→1)`. No zoom-from-center.
- Drawers slide from logical edge (RTL-aware: right in LTR, left in RTL).
- Toasts: in 150–220ms, out 100–180ms, stacked max 3.
- `prefers-reduced-motion`: kill parallax/decorative/large transitions; keep state feedback (opacity only).
- Performance: `transform` + `opacity` only (GPU). No layout/paint animations. No giant JS animation libs except GSAP-on-landing (selective) + Lenis-on-marketing (selective).
- Optimistic UI ONLY for safe ops (save draft, toggle theme). NEVER for payments, exam submit, grading, publish.

---

## 2️⃣2️⃣ Security — 9 Layers, Checklists, Incident Response

> Full spec: [`docs/SECURITY.md`](docs/SECURITY.md) (430 lines). This is the operator's digest.

### 22.1 The 9 Layers

| # | Layer | Controls |
|---|-------|----------|
| 1 | Network (Cloudflare) | WAF (OWASP Top 10), rate-limit, bot mgmt, DDoS auto-mitigate, TLS 1.2+, HSTS, DNSSEC, CAA |
| 2 | App — Auth | Argon2id, JWT 15m, refresh rotation + reuse revoke, TOTP (teacher/admin), device FP, session caps |
| 3 | App — AuthZ | `AuthorizationGuard` + `RequirePermission` + `PolicyEngine` (tenant → RBAC → ownership → entitlement → flag → quota) |
| 4 | DB — RLS | `FORCE RLS` all tenant tables, `app_user` no BYPASSRLS, tx-local `app.tenant_id`, split credentials |
| 5 | Data — PII | Classification (RESTRICTED/CONFIDENTIAL/INTERNAL/PUBLIC), AES-256-GCM envelope + KMS (prod), blind indexes (`HMAC(phone)`) for search |
| 6 | Payments | 6 golden rules (§16.3), HMAC webhooks, inbox dedupe, ledger append-only, reconciliation (no auto-fix) |
| 7 | Video | 7 layers (§17.2), short JWTs, HMAC watermark, session binding, capture → risk → revoke |
| 8 | Secrets | `.env` gitignored, Vault/Secrets Manager in prod, startup refuses defaults, 90-day rotation |
| 9 | Audit & Monitor | `audit_logs` + `payment_audit_logs` + `security_events`; structured logs (`tenantId,userId,requestId` — NO PII); Sentry + Prometheus + Grafana |

### 22.2 PII Classification

| Level | Fields | Storage | Search | Log? |
|-------|--------|---------|--------|------|
| RESTRICTED | National ID, password hash, refresh hash, provider secrets | App-encrypted (AES-GCM) + KMS | Never | ❌ |
| CONFIDENTIAL | Phone, email, DOB, guardian | Encrypted at rest, blind index | Via `blind_index` only | ❌ (hash only) |
| INTERNAL | Name, enrollment, progress, orders | RLS-protected plaintext | Normal | ❌ (IDs only) |
| PUBLIC | Course titles, public certs | Public read | Normal | ✅ |

### 22.3 Audit Log Schema (Every Sensitive Action)

```typescript
interface AuditLog {
  tenantId: string; actorId: string; action: string;
  resourceType: string; resourceId: string;
  previousState?: unknown; nextState?: unknown; reason?: string;
  requestId: string; ipHash: string; // hash, NOT raw IP
  metadata: Record<string, unknown>; createdAt: Date;
}
// Actions: LOGIN, PASSWORD_CHANGE, REFRESH_REUSE_DETECTED, PAYMENT_PAID, VOUCHER_REDEEMED,
// VIDEO_UPLOAD, PLAYBACK_AUTHORIZED/REVOKED, CAPTURE_EVENT, USER_ROLE_CHANGED,
// TENANT_CONFIG_CHANGED, CROSS_TENANT_ATTEMPT, WEBHOOK_SIGNATURE_FAILED, RISK_THRESHOLD_EXCEEDED, ...
```

### 22.4 Secrets Rotation Calendar

| Secret | Rotation | Owner | How |
|--------|----------|-------|-----|
| `JWT_SECRET` | 90d | Backend | Dual-accept window (old + new for 15m) then cutover |
| `VIDEO_TOKEN_SECRET` | 90d | Video | Same dual-accept (2h TTL makes this easy) |
| `VIDEO_WATERMARK_HMAC_SECRET` | 90d | Video | Old watermarks verify with old key (key-id in payload) |
| `DATABASE_URL` (app_user) | 90d | DBA | Rotate + restart pool (zero-downtime rolling) |
| Paymob/Fawry/Bunny keys | Provider policy | Payments/Video | Staging first, then prod during low-traffic window |

### 22.5 Incident Response (SEV Levels)

| Level | Examples | Response | First actions |
|-------|----------|----------|---------------|
| SEV-1 | Cross-tenant leak, payment compromise, KMS compromise, mass PII | 15 min, all-hands | Freeze deploys → revoke sessions/keys → snapshot DB → disable provider → notify |
| SEV-2 | Admin takeover, token abuse at scale, ledger mismatch | 1 h | Revoke family/sessions → STRICT video mode → freeze payouts → reconcile |
| SEV-3 | Single suspicious account, isolated webhook fails | 4 h | Block IP/user → review audit → rotate if needed |

> Forensics: NEVER delete logs during incident. Export audit to secure bucket, snapshot DB, keep timeline with UTC timestamps.

### 22.6 Release Security Checklist

```
Pre-deploy:
[ ] Secrets rotated from defaults (startup validator passes in prod mode)
[ ] pnpm build 0 errors + pnpm test green + pnpm audit --prod clean
[ ] Migration reviewed (new tables have tenant_id + RLS + FORCE)
[ ] Webhook secrets configured + verified in staging
[ ] No secrets in git history (gitleaks clean)
Post-deploy:
[ ] /health green + error rate normal + webhook delivery >99%
[ ] Audit logs flowing (spot-check 5 rows) + dashboards green
[ ] Rollback plan ready (previous image tagged, migrate:down tested)
```

---

## 2️⃣3️⃣ Performance — Caching, Queues, CDN, Budgets

### 23.1 Caching Layers

| Layer | What | TTL | Invalidation |
|-------|------|-----|--------------|
| CDN (Cloudflare) | Thumbnails, public course pages, teacher spaces | 1h (stale-while-revalidate 24h) | Purge on publish (`POST /courses/:id/publish` → purge tag) |
| Redis — tenant domains | `host → tenant_id` | 30s | On domain verify/delete |
| Redis — entitlements | `(tenant,student,resource)` → bool | 60s | On enroll/refund/voucher redeem (explicit del) |
| Redis — flags | `(tenant,flag)` → bool | 5m | On config change |
| Redis — rate-limit | Fixed window per IP+route | Window (60s/15m) | — |
| Postgres — statement cache | Prepared queries via Prisma | — | — |

### 23.2 BullMQ Queues

| Queue | Jobs | Concurrency | Retry |
|-------|------|-------------|-------|
| `outbox-relay` | `outbox_events` → handlers (enroll, notify, analytics) | 10 | 5× exponential + DLQ |
| `exam-autosubmit` | Delayed job per attempt (`expiresAt - now`) | 20 | 3× (idempotent) |
| `webhook-normalize` | Provider payload → canonical `PaymentStatus` | 10 | 5× |
| `reconciliation` | Nightly provider ↔ ledger diff | 1 | Manual rerun |
| `notifications` (planned) | Email/WhatsApp/push | 20 | 5× + DLQ |
| `video-sync` | Poll provider status (fallback to webhooks) | 5 | 3× |

### 23.3 Web Vitals Budgets (Web)

| Metric | Target | Guardrail |
|--------|--------|-----------|
| LCP | < 2.5s (p75) | Hero images WebP + `priority` + CDN |
| INP | < 200ms | Server Components, no client waterfalls |
| CLS | < 0.1 | Fixed upload/cover aspect ratios, tabular-nums |
| JS bundle (per route) | < 200KB gzip | Dynamic import for builder/charts/player |

### 23.4 DB Performance

- `pg_stat_statements` ON (`shared_preload_libraries`), `max_connections=200` (compose default).
- Slow-query log > 500ms → weekly review → add index or rewrite.
- Analytics NEVER on OLTP tables directly in request path → materialized views (planned) + read replica (planned).
- `EXPLAIN (ANALYZE, BUFFERS)` required in PRs that add queries on >10k-row tables.

---

## 2️⃣4️⃣ Testing — Pyramid, RLS Tests, Golden Flows

### 24.1 Pyramid & Commands

```
        ┌─ E2E (golden flows + RLS isolation) — slow, few, critical
        │   test/golden-flow.e2e-spec.ts, test/rls-isolation.e2e-spec.ts
        ├─ Integration (service + real PG via Testcontainers) — medium
        └─ Unit (pure logic: watermark PRNG, ledger math, policy matrix) — fast, many
```

```powershell
pnpm test                       # all (turbo)
cd apps/api; pnpm test          # unit + integration (Jest)
cd apps/api; pnpm test:e2e      # e2e (needs docker compose up -d)
pnpm test --coverage            # coverage (target: 80% lines on payments/auth/lms)
```

### 24.2 RLS Isolation Tests (Must Pass Before Merge)

```typescript
// test/rls-isolation.e2e-spec.ts (simplified)
describe('Tenant isolation (FORCE RLS)', () => {
  it('Tenant A cannot read Tenant B courses', async () => {
    await asTenant('A', async (tx) => {
      const rows = await tx.course.findMany();
      expect(rows.every((r) => r.tenantId === 'A')).toBe(true);
      expect(rows.find((r) => r.tenantId === 'B')).toBeUndefined();
    });
  });
  it('No tenant context sees ZERO rows', async () => {
    const rows = await prismaNoCtx.course.findMany(); // no set_config
    expect(rows).toHaveLength(0);
  });
  it('Fetch by (tenantId, id) blocks cross-tenant guess', async () => {
    await expect(
      coursesService.getById('tenant-A', courseOfTenantB.id),
    ).rejects.toThrow(NotFoundException); // NOT 403 leak (don't reveal existence)
  });
});
```

### 24.3 Golden Flows (End-to-End Money + Learning)

| Flow | Steps asserted | File |
|------|---------------|------|
| Buy course | Order → Intent → mock webhook PAID → ledger balanced → enrollment ACTIVE → entitlement granted → outbox emitted | `golden-flow.e2e-spec.ts` |
| Voucher enroll | Atomic redeem (concurrent ×10 → exactly 1 wins per single-use) → entitlement → enrollment | `voucher.e2e-spec.ts` (planned) |
| Assignment → exam unlock | ENTER_ASSIGNMENT → exam `isLocked=false` → timer `expiresAt` stable across re-fetch | `lms-progression.e2e-spec.ts` (🚧) |
| Exam → next lesson | ENTER_EXAM → next lesson unlocked → answers never contain solutions | `lms-progression.e2e-spec.ts` (🚧) |
| Video playback | Entitled → token 200; non-entitled → 403; revoked session → 401 on heartbeat | `video-protection.e2e-spec.ts` (🧪) |

### 24.4 Coverage Gates (CI Fails Below)

| Area | Lines | Branches | Why strict |
|------|-------|----------|------------|
| `payments/*` (orchestrator, ledger, webhooks, vouchers) | ≥ 85% | ≥ 80% | Money |
| `auth/*`, `authorization/*` | ≥ 85% | ≥ 80% | Access |
| `exams/*`, `assignments/*` (timers, progression) | ≥ 85% | ≥ 80% | Fairness |
| `video-protection/*` | ≥ 80% | ≥ 75% | Anti-piracy |
| Overall | ≥ 75% | — | — |

---

## 2️⃣5️⃣ Observability — Logs, Metrics, Traces, Alerts

### 25.1 Structured Logging (Pino — No PII Ever)

```typescript
// ✅ CORRECT
logger.info({ tenantId, userId, requestId, action: 'PAYMENT_PAID', orderId }, 'payment confirmed');
// ❌ FORBIDDEN (PII / secrets in logs)
logger.info({ email, phone, jwt, rawBody }, 'debug');
```

| Field | Always present | Never present |
|-------|---------------|---------------|
| `tenantId`, `userId`, `requestId`, `action`, `resourceType/Id` | ✅ | — |
| `email`, `phone`, `nationalId`, `password`, `tokens`, `card PAN`, raw webhook bodies | — | ❌ (hash or omit) |

### 25.2 Metrics (Prometheus — Planned Wiring)

| Metric | Type | Alert |
|--------|------|-------|
| `http_requests_total{route,status}` | Counter | 5xx rate > 1% for 5m → page |
| `http_request_duration_seconds` | Histogram | p95 > 800ms on `/playback-token` → warn |
| `payment_webhook_verify_failures_total` | Counter | Spike → SEV-2 (provider compromise?) |
| `ledger_imbalance_total` | Gauge | > 0 → SEV-1 (freeze payouts) |
| `exam_autosubmit_lag_seconds` | Gauge | > 60s → warn (sweeper falling behind) |
| `bullmq_failed_jobs_total{queue}` | Counter | DLQ growth → warn |
| `rls_violations_total` (cross-tenant attempts) | Counter | Any → SEV-1 investigate |

### 25.3 Tracing (OpenTelemetry — Planned)

- Propagate `traceId` = `requestId` from edge → API → PG (`application_name`) → BullMQ job data.
- Sample 10% in prod, 100% on errors / SEV.

---

## 2️⃣6️⃣ API Reference — REST Endpoints by Domain

> Base: `/api`. Auth: `Authorization: Bearer <15m JWT>` unless noted. Tenant: resolved from `Host` (or `x-tenant-slug` in dev). Full OpenAPI: `pnpm export:openapi` → `openapi.json` (planned wiring).

### 26.1 Auth & Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | ❌ | Register (student/parent) → sets refresh cookie |
| POST | `/auth/login` | ❌ | Login (rate-limited 5/15m) → access + refresh |
| POST | `/auth/refresh` | 🍪 refresh | Rotate (reuse → revoke family) |
| POST | `/auth/logout` | ✅ | Revoke session + clear cookie |
| POST | `/auth/2fa/enable` | ✅ | TOTP setup (teacher/admin) |
| GET | `/users/me` | ✅ | Own profile (tenant-scoped) |
| GET | `/users/devices` | ✅ | List sessions/devices |
| DELETE | `/users/devices/:id` | ✅ | Revoke device |

### 26.2 Tenants & Catalog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tenants/by-slug/:slug` | ❌ (public) | Public teacher space data (no PII) |
| GET | `/courses` | ✅/❌ (public list) | Paginated, filter by teacher/subject |
| GET | `/courses/:id` | ✅ | Detail + `isLocked` + `unlockType` per lesson |
| POST | `/courses` | `course:create` | Teacher creates draft |
| POST | `/courses/:id/publish` | `course:publish` | Snapshot new version (immutable) |
| GET | `/lessons/:id` | ✅ | Lesson + lock state (server-computed) |

### 26.3 LMS (Assignments & Exams)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/assignments/:id/attempts` | `assignment:enter` | Starts 300m timer; unlocks linked exam (`ENTER_ASSIGNMENT`) |
| GET | `/assignments/attempts/:id` | owner | Resume (same `expiresAt`, derived `remainingSeconds`) |
| POST | `/assignments/attempts/:id/submit` | owner | Text + file refs; before `expiresAt` else 409 → auto EXPIRED |
| POST | `/assignments/attempts/:id/grade` | `assignment:grade` | Teacher: score + feedback → `GRADED` |
| POST | `/exams/:id/attempts` | `exam:enter` | Starts 70m timer; unlocks next lesson (`ENTER_EXAM`); questions WITHOUT answers |
| GET | `/exams/attempts/:id` | owner | Resume (same `expiresAt`) |
| POST | `/exams/attempts/:id/submit` | owner | Answers; server auto-grades MCQ/TF, queues manual |
| POST | `/exams/attempts/:id/grade` | `exam:grade` | Teacher merges manual scores |

### 26.4 Payments

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/orders` | ✅ | Server prices from catalog (never client amount) |
| POST | `/payments/intents` | ✅ + `Idempotency-Key` | Returns provider redirect/token |
| GET | `/payments/:id` | ✅ (owner/admin) | Status (from DB, not provider, unless `?verify=true`) |
| POST | `/webhooks/paymob` | HMAC | Raw body; inbox dedupe; PAID → ledger+enroll (ONE tx) |
| POST | `/webhooks/fawry` | Sig | Same guarantees |
| POST | `/vouchers/redeem` | `voucher:redeem` | Atomic; returns entitlement + enrollment |
| POST | `/payments/:id/refund` | `payment:refund` | Reversing ledger entries (never mutates history) |

### 26.5 Video & Protection

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/video/lessons/:lessonId/videos` | `video:upload` | Quota check → signed TUS URL (browser → Bunny direct) |
| GET | `/video/videos/:id/status` | ✅ | `UPLOADING/PROCESSING/READY/PUBLISHED/FAILED` |
| POST | `/video/videos/:id/publish` | `video:publish` | `READY → PUBLISHED` |
| GET | `/video/videos/:id/playback-token` | `playback:authorize` | 2h JWT + HLS URL + HMAC watermark payload |
| POST | `/video/playback/heartbeat` | ✅ | Every 15s → risk score |
| POST | `/video/playback/capture` | ✅ | Screenshot/record/tamper/focus/devtools event |
| POST | `/video/playback/end` | ✅ | Close session |
| POST | `/webhooks/bunny` | HMAC | `UPLOADING → PROCESSING → READY` transitions |

### 26.6 cURL Cookbook

```bash
# Login (stores refresh cookie)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@demo.localhost","password":"Demo1234!"}'

# Enter assignment (starts timer)
curl -b cookies.txt -X POST http://localhost:3000/api/assignments/asg_123/attempts \
  -H 'Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000'

# Check remaining (re-fetch — expiresAt MUST be identical)
curl -b cookies.txt http://localhost:3000/api/assignments/attempts/aat_456
```

---

## 2️⃣7️⃣ Event Contracts — Outbox + BullMQ Events

> Schemas live in `packages/event-contracts` (Zod, planned). Topic naming: `<domain>.<action>.v1`.

| Event | Emitted when (same tx as trigger) | Consumers |
|-------|-----------------------------------|-----------|
| `enrollment.activated.v1` | Payment PAID / voucher redeemed | Entitlements grant, welcome notify, analytics |
| `exam.entered.v1` | `ENTER_EXAM` recorded | Progression unlock, analytics funnel |
| `assignment.entered.v1` | `ENTER_ASSIGNMENT` recorded | Progression unlock, analytics |
| `attempt.expired.v1` | Sweeper marks EXPIRED | Auto-submit grader, notify student |
| `payment.paid.v1` | Ledger committed | Receipt email/WhatsApp, settlement planner |
| `payment.refunded.v1` | Reversal committed | Revoke entitlement? (policy: keep access vs revoke — configurable) |
| `video.ready.v1` | Provider webhook READY | Notify teacher, purge preview cache |
| `playback.revoked.v1` | Risk CRITICAL | Kill CDN token (denylist 5m), email student |
| `security.cross_tenant_attempt.v1` | PolicyEngine DENY (tenant mismatch) | SEV-1 triage queue |

```typescript
// Outbox row (ordered, exactly-once intent; relay dedupes by (type, aggregateId, seq)):
// { id, tenantId, seq (BIGSERIAL), type, aggregateType, aggregateId, payload: JSONB, createdAt, processedAt? }
```

---

## 2️⃣8️⃣ Deployment — Local → Staging → Production

### 28.1 Local (Docker Compose — Canonical)

```yaml
# docker-compose.yml (root) — postgres:15-alpine + redis:7-alpine
services:
  postgres:
    image: postgres:15-alpine
    environment: { POSTGRES_USER: postgres, POSTGRES_PASSWORD: postgres, POSTGRES_DB: learning_platform }
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data, ./docker/postgres/init:/docker-entrypoint-initdb.d]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U postgres"], interval: 10s, retries: 5 }
    command: postgres -c shared_preload_libraries=pg_stat_statements -c max_connections=200
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
```

```powershell
docker compose up -d; docker compose ps
docker compose logs postgres --tail 50 2>&1 > pg-log.txt; Get-Content pg-log.txt -TotalCount 50
```

### 28.2 Staging (VPS / Render / Fly — Minimal Viable)

```
1 VPS (2 vCPU / 4GB): API (pm2) + Web (standalone) + PG (managed) + Redis (managed)
Deploy: git push → Actions → build → migrate (MIGRATION_URL) → restart → /health → smoke (login + enter exam)
Data: nightly prod-snapshot scrubbed (PII hashed) → staging (for realistic RLS tests)
```

### 28.3 Production (Target — When Revenue Justifies)

```
Cloudflare (DNS+WAF+CDN) → LB → API ×3 (Hetzner/DO) → PG primary + replica (managed) + Redis (managed/Aiven)
+ R2 (storage) + Bunny (video) + Sentry + Prometheus/Grafana + Vault (secrets) + Backups (WAL-G daily + PITR)
Terraform (planned) for all of the above. Today: Compose + manual VPS is FINE (modular monolith!).
```

### 28.4 Dockerfile Strategy (Planned — Add When Deploying)

```dockerfile
# apps/api/Dockerfile (multi-stage: deps → build → runner, non-root, tini)
# apps/web/Dockerfile (standalone output, non-root)
# Health: HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/api/health
```

---

## 2️⃣9️⃣ CI/CD — GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml (canonical — create this file next)
name: CI
on: { push: { branches: [main, develop] }, pull_request: {} }
jobs:
  build-test:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:15-alpine, env: { POSTGRES_PASSWORD: postgres }, ports: ["5432:5432"] }
      redis: { image: redis:7-alpine, ports: ["6379:6379"] }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build            # MUST exit 0
      - run: pnpm lint
      - run: pnpm test --coverage  # gates §24.4
      - run: pnpm audit --prod     # fail on high/critical
  rls-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Fail if ANY table with tenantId lacks FORCE RLS policy (psql query over information_schema)
      - run: ./scripts/check-rls.sh
  migrate-staging:
    needs: [build-test]
    if: github.ref == 'refs/heads/develop'
    steps:
      - run: npx prisma migrate deploy  # with MIGRATION_DATABASE_URL (staging)
```

| Job | Fails the build if |
|-----|-------------------|
| `build` | tsc errors, missing env types |
| `lint` | ESLint/Prettier violations, `../../../` imports (custom rule, planned) |
| `test` | Unit/integration/e2e red, coverage below gates |
| `rls-coverage` | New tenant table without RLS |
| `audit` | `pnpm audit` high/critical without waiver |

---

## 3️⃣0️⃣ Production Checklist — Go-Live Gates (Copy Into Release Issue)

```
Secrets & Access:
[ ] JWT/VIDEO_* /DEVICE_FP_SALT rotated (32+ random bytes, NOT defaults — boot validator passes)
[ ] DATABASE_URL = app_user (verified: SELECT rolsuper, rolbypassrls → false, false)
[ ] MIGRATION_DATABASE_URL ONLY in CI (never on app hosts, never in client bundle)
[ ] Paymob/Fawry/Bunny webhook secrets set + verified with sandbox → live toggle
[ ] Admin TOTP enforced; break-glass SUPER_ADMIN in Vault (2 custodians)
Data & Isolation:
[ ] prisma migrate deploy clean on fresh clone
[ ] FORCE RLS on ALL tenant tables (check-rls.sh green)
[ ] RLS e2e green (A⊘B + no-ctx-zero-rows)
[ ] Backups tested (restore to staging + spot-check ledger balance)
Money:
[ ] Sandbox charge → webhook → ledger balanced → enrollment active (record video)
[ ] Refund → reversing entries (history untouched)
[ ] Reconciliation dry-run green; payout freeze runbook printed
[ ] Idempotency retry test (same key → same result, no double charge)
Video & LMS:
[ ] Bunny webhook → READY → publish → token plays with watermark (screenshot contains identity)
[ ] Revoked session → heartbeat 401 within 15s
[ ] Assignment ENTER → expiresAt stable across 3 re-fetches; EXAM unlocks
[ ] Exam ENTER → next lesson unlocks; answers API contains ZERO solutions
Ops:
[ ] /health + Sentry + Prometheus green; PagerDuty routes SEV-1 → phone
[ ] Load test: 1k concurrent playback-token + 500 concurrent ENTER (p95 < 800ms)
[ ] Rollback rehearsed (previous image + migrate:down plan)
Legal:
[ ] Terms + Privacy + Refund policy (AR/EN) published; guardian consent flow for <18
```

---

## 3️⃣1️⃣ Troubleshooting — 25 Common Errors + Fixes

| # | Symptom | Cause | Fix (PowerShell-safe) |
|---|---------|-------|----------------------|
| 1 | `pnpm: command not found` | pnpm not installed | `Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing \| Invoke-Expression` |
| 2 | `package-lock.json` appears | Someone ran `npm install` | `Remove-Item package-lock.json; Remove-Item -Recurse -Force node_modules; pnpm install` |
| 3 | `ERR_PNPM_OUTDATED_LOCKFILE` | Lockfile drift | `pnpm install --frozen-lockfile` in CI; `pnpm install` locally then commit lock |
| 4 | `turbo: pipeline vs tasks` error | Old `turbo.json` key | Rename `pipeline` → `tasks` (already fixed) |
| 5 | `prisma generate` → `P1001 can't reach DB` | Postgres down | `docker compose up -d; docker compose ps` |
| 6 | `migration failed: role app_user does not exist` | Used `DATABASE_URL` for migrate | Use `MIGRATION_DATABASE_URL` (postgres) for `migrate deploy` |
| 7 | `permission denied for table X` (runtime) | Connected as wrong user / missing GRANT | Runtime must use `DATABASE_URL` (app_user); re-run `01-create-app-user.sql` |
| 8 | `RLS returns 0 rows unexpectedly` | `app.tenant_id` not set in tx | Call `setTenantContext(tx, tenantId)` FIRST in every tx |
| 9 | `BYPASSRLS check fails` | `app_user` has bypass (bad init) | `ALTER ROLE app_user NOBYPASSRLS;` + re-apply FORCE |
| 10 | `JWT_SECRET uses default` (prod boot refuses) | Forgot rotation | Generate (§8.4) + set in Vault + redeploy |
| 11 | `CORS blocked` (web → api) | Origin not allowlisted | Add to `ALLOWED_ORIGINS` (exact scheme+host+port) |
| 12 | `401 on refresh` (all devices logged out) | Reuse detected (token stolen OR double-tab race) | Check `security_events`; if legit race → retry login once; if reuse → rotate + investigate |
| 13 | `403 on entitled lesson` | Missing entitlement / expired enrollment | Check `entitlements` + `enrollments(status, dates)`; re-grant via order/voucher |
| 14 | `Paymob webhook 500` | HMAC mismatch (parsed body, not raw) | Use `express.raw()` on webhook route + constant-time compare (§16.4) |
| 15 | `Duplicate payment` (double charge) | Missing `Idempotency-Key` / retry without key | Always send key; same key+payload → same result (§16.7) |
| 16 | `Voucher redeem 409` (second attempt) | Already redeemed (correct!) | Return existing enrollment (idempotent UX: "Already enrolled ✓") |
| 17 | `Voucher redeem race → double grant` | Missing `FOR UPDATE` / unique | Add `FOR UPDATE` + `UNIQUE(voucherId,userId)` (§16.6) |
| 18 | `Video status stuck UPLOADING` | Webhook not received (Bunny → API blocked) | Check webhook secret + public URL; fallback: `video-sync` poller |
| 19 | `HLS 403` (token valid?) | Token expired / session revoked / video not PUBLISHED | Re-issue token; check `playback_sessions(status)` + video status |
| 20 | `Watermark missing` | Overlay removed (tamper) or CSS `display:none` | Tamper detector should fire `WATERMARK_TAMPER` → check console + risk score |
| 21 | `Exam timer reset on refresh` (BUG if happens) | Client recomputed `expiresAt` | Server must RETURN stored `expiresAt` (§18.3) — file SEV-2, fairness issue |
| 22 | `Answers leaked in API` (SEV-1 if happens) | Serializer included `correctAnswer` | Strip in DTO (`@Exclude`) + contract test asserting absence |
| 23 | `N+1 on teacher dashboard` | Loop of per-student queries | Batch with `findMany({ where: { id: { in } } })` + DataLoader (planned) |
| 24 | `BullMQ jobs stuck` | Redis evicted / prefix mismatch | Check `BULLMQ_PREFIX` + Redis `maxmemory-policy=noeviction` for queues |
| 25 | `Outbox not relaying` | Relay down / `processedAt` stuck | Check relay worker logs + `OUTBOX_RELAY_INTERVAL_MS`; replay from `seq` cursor |

> Still stuck? Open an issue with: `requestId`, `tenantId`, `pnpm build` output, `docker compose ps`, and REDACTED env (never paste secrets).

---

## 3️⃣2️⃣ FAQ — 30 Questions Answered

**Q1. Why modular monolith, not microservices?**
Faster to build, one deploy, single transaction for money+enrollment. Extract video/payments/analytics only when they need independent scaling, runtimes, or teams.

**Q2. Why shared DB + RLS instead of DB-per-tenant?**
One migration, low cost, single source of truth. RLS is the last line of defense — even buggy app code can't cross tenants. DB-per-tenant = ops hell at 100+ teachers.

**Q3. Can `app_user` bypass RLS?**
No. Created with `NOLOGIN`? No — `LOGIN` but `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`. Verified in checklist.

**Q4. Where is tenant context set?**
`TenantContextInterceptor` resolves Host → `tenant_id`; every service transaction calls `setTenantContext(tx, tenantId)` with `set_config(..., true)` (tx-local, no pool leak).

**Q5. Why `expiresAt` instead of countdown?**
Countdowns can be forged/paused. `expiresAt` is a server timestamp; remaining is derived. Refresh-safe, clock-tamper-proof.

**Q6. Why entry-based progression (not score)?**
Higher completion, less frustration, simpler fairness. Score-gates (`PASS_EXAM`, `SCORE_THRESHOLD`) are future extension points, not Phase 1.

**Q7. Do you expose exam answers to students?**
Never. Questions DTO excludes solutions; auto-grading is server-side. Contract test asserts absence.

**Q8. How do vouchers survive concurrent redeem?**
`codeHash` lookup + `SELECT ... FOR UPDATE` + `UNIQUE(voucherId, userId)` + same-tx entitlement. One wins, others get clean 409.

**Q9. How are payments idempotent?**
`Idempotency-Key` header (24h). Same key+payload → original result. Same key+different payload → 422.

**Q10. What happens if a webhook is replayed?**
`UNIQUE(provider, externalEventId)` → duplicate ACKed and ignored. State machine is idempotent (PENDING→PAID once).

**Q11. Do you store card numbers?**
Never. Providers handle PCI. We store `providerRef` + ledger rows only.

**Q12. How does the watermark identify leakers?**
HMAC-signed payload (name/phone/IDs) rendered as moving overlay. Screenshot/photo of screen contains identity. Positions are deterministic per seed (auditable).

**Q13. Can students share logins?**
Single active playback session + device FP + heartbeat. Second device revokes first with email notice.

**Q14. What triggers video revoke?**
Risk CRITICAL: watermark tamper, recording API, token reuse across IPs, rapid session hopping. HIGH pauses + warns.

**Q15. Why Bunny over Mux/Cloudflare Stream?**
TUS resumable uploads, HLS token auth, EG-friendly PoPs, sane pricing in EGP context. VdoCipher kept as stub for DRM familiarity.

**Q16. Why Paymob + Fawry?**
Cards + wallets (Paymob) + kiosks/cash (Fawry reference numbers) = how Egypt actually pays. Stripe doesn't cover this.

**Q17. Why pnpm + Turbo (not npm/nx)?**
Content-addressable store (disk-efficient), strict peer deps, fast remote cache. pnpm-only is enforced (npm breaks links).

**Q18. Why Prisma 5.22.0 pinned?**
Avoids 5.7 vs 5.22 drift seen in CI. Single version = reproducible migrations + client.

**Q19. Why Argon2id (not bcrypt)?**
Memory-hard → GPU/ASIC-resistant. Correct choice for password hashing in 2026.

**Q20. Why 15-minute access tokens?**
Short blast radius if stolen. Refresh rotation + reuse detection covers UX (silent renew).

**Q21. How do custom domains work?**
`tenant_domains` maps any hostname → `tenant_id`. Teacher points CNAME → edge; verifier flips PENDING→VERIFIED; requests resolve automatically.

**Q22. What can a teacher customize?**
Logo, colors (accent), motif, hero art, domain, course presentation. NOT hierarchy, nav, behavior, a11y, motion language.

**Q23. How is Arabic typography handled?**
Matched pairs (Inter ↔ IBM Plex Sans Arabic), editorial rules for Arabic (calligraphic rhythm), RTL-aware motion (drawers flip edge).

**Q24. What if the teacher changes exam duration mid-attempt?**
Running attempts keep snapshot; new attempts use new value. Fairness preserved.

**Q25. How are refunds accounted?**
Reversing ledger entries (new rows). History never UPDATEs. Payouts frozen on mismatch until manual review.

**Q26. How do you prevent double enrollment?**
`UNIQUE(tenantId, studentId, courseId)` + idempotent webhook handling + outbox dedupe.

**Q27. What's the slowest query? How do you know?**
`pg_stat_statements` + slow log (>500ms). Dashboard queries use covering indexes (§12.4). Analytics moves to materialized views (planned).

**Q28. Can I run without Docker?**
Yes (native PG15 + Redis7), but Docker is canonical for parity. CI uses services containers.

**Q29. How do I add a new payment provider?**
Implement `PaymentProvider` (5 methods) → register in `ProviderRegistry` → add env + webhook route (raw body) → golden-flow e2e with mock → reconciliation mapping.

**Q30. How do I add a new subject motif?**
Add entry to Subject DNA table (§19.3) → tokens (accent + geometry) → card variant + space header variant → motion metaphor → docs + screenshot.

---

## 3️⃣3️⃣ Benchmarks — Load Targets + SLOs

### 33.1 Service-Level Objectives (Staging → Prod)

| SLO | Target | Measure |
|-----|--------|---------|
| Availability (API) | 99.9% monthly | `/health` + LB checks |
| p95 `GET /playback-token` | < 400ms | Prometheus histogram |
| p95 `POST /exams/:id/attempts` | < 800ms | Includes tx + unlock + audit |
| Webhook processing (verify → commit) | < 2s p95 | Inbox → ledger |
| Exam auto-submit lag (expiresAt → EXPIRED) | < 30s | BullMQ delayed + sweeper fallback |
| RLS isolation tests | 100% pass | Every deploy |
| Ledger balance | Always 0 mismatch | Nightly job |
| Backup restore (staging drill) | < 30 min RTO, < 5 min RPO | Monthly drill |

### 33.2 Load Test Plan (k6 — Planned Script `scripts/load.js`)

```
Phase 1 (smoke):  50 VUs × 5m  — login + browse + playback-token
Phase 2 (soak):  500 VUs × 30m — mixed student/teacher traffic
Phase 3 (spike): 0 → 2000 VUs in 2m (exam start storm: all students ENTER at once)
Assertions: p95 < 800ms, 5xx < 0.5%, PG connections < 150, Redis mem < 70%
```

> Exam-start storms are the hardest: thousands of `ENTER` transactions in the same second. Mitigations: connection pool sizing, `IN_PROGRESS` partial unique index, BullMQ for grading (not in request path), read-your-write via primary for attempt resume.

---

## 3️⃣4️⃣ Roadmap — Phases, Milestones, Versioning

### 34.1 Versioning (SemVer + CalVer Hybrid)

- `0.x` — pre-1.0: LMS Core + hardening (breaking schema changes allowed with migration).
- `1.0` — first paid cohort: money + video + progression all verified live.
- Post-1.0: SemVer (`1.2.0` features, `1.2.1` fixes). DB migrations always forward-only.

### 34.2 Phases

```
Phase 0 ✅ Foundation (DONE — compiles, reviewed)
  Monorepo, NestJS modules, Prisma schema, RLS files, auth, policy, payments core, video core

Phase 1 🚧 LMS Core (NOW — 4 tasks)
  [ ] Lesson types (ASSIGNMENT/EXAM/RESOURCE) on Lesson model
  [ ] Assignment/Exam models + timers (300m/70m, expiresAt truth)
  [ ] Progression (ENTER_ASSIGNMENT → EXAM, ENTER_EXAM → NEXT LESSON, idempotent)
  [ ] E2E: progression + timer stability + no-answer-leak

Phase 2 � Learning Experience
  Student home (continue/progress/next), lesson page, exam runner, assignment submitter,
  grading inbox, receipts,WhatsApp notifications, autosave, offline draft (localStorage UI-only)

Phase 3 � Production Hardening
  Live Paymob/Fawry verification, Bunny live webhooks, reconciliation live,
  Sentry+Prometheus wired, load test 10k, backup drill, SEV runbook rehearsal

Phase 4 � Growth
  Course builder v2 (visual tree, preview, publish flow), analytics v1 (funnel, retention),
  search (Meilisearch), AI feedback stub (structured, calm — no purple robots)

Phase 5 🔮 Scale (extract ONLY when justified)
  Video service, payments service, analytics OLAP, notifications volume, search cluster
```

### 34.3 Milestone Exit Criteria

| Milestone | Green when |
|-----------|------------|
| LMS Core done | `lms-progression.e2e` green + RLS green + `pnpm build` 0 + demo video recorded |
| First live EGP | Real Paymob sandbox → staging PAID → ledger balanced → enrollment active (screen-recorded) |
| First live video | Bunny TUS → READY → watermark visible in screenshot → revoke works in <15s |
| 1.0 | All Phase 1–3 + 100-student pilot with zero SEV-1 + refund drill clean |

---

## 3️⃣5️⃣ Architecture Decision Records (ADRs) — The Why Behind the What

| # | Date | Decision | Context | Consequences |
|---|------|----------|---------|--------------|
| 1 | 2026-10-03 | Modular monolith over microservices | 1 dev, 1 day/week; ops budget ~0 | ✅ Fast iteration, single tx for money. ❌ Must discipline module boundaries (no `../../../`). Revisit at 10k concurrent. |
| 2 | 2026-10-03 | Shared DB + `tenant_id` + RLS FORCE | Low cost, single migration; need hard isolation | ✅ Cheap + safe. ❌ Must audit every new table (CI gate). Noisy-neighbor risk → read replica later. |
| 3 | 2026-10-03 | `app_user` (no BYPASSRLS) + split credentials | Prevent privilege escalation | ✅ Defense in depth. ❌ Two URLs to manage (runtime vs migrate). |
| 4 | 2026-10-03 | Transactional outbox | No lost events (enrollment email, analytics) | ✅ Reliable. ❌ Relay lag (2s poll) — acceptable. |
| 5 | 2026-10-03 | Entitlements ≠ Feature Flags | Per-student access vs per-tenant toggles conflated in v0 | ✅ Clear mental model. ❌ Two systems to maintain. |
| 6 | 2026-10-03 | Config-over-code for tenants | Avoid forks per teacher | ✅ 80% needs = JSON. ❌ 20% needs custom work (accept). |
| 7 | 2026-10-04 | Provider abstraction + orchestrator (payments) | Swap Paymob/Fawry without rewriting ledger | ✅ Testable with mocks. ❌ Interface must stay minimal (5 methods). |
| 8 | 2026-10-04 | Double-entry ledger (append-only) | Auditability + reconciliation | ✅ Provable money. ❌ More rows (fine — PG handles millions). |
| 9 | 2026-10-04 | HMAC watermark + mulberry32 positions | Attribute leaks without heavy DRM | ✅ Cheap + effective deterrent. ❌ Not Hollywood-DRM (Widevine later if needed). |
| 10 | 2026-10-04 | Split `DATABASE_URL` / `MIGRATION_DATABASE_URL` | Runtime must never be superuser | ✅ Fail-safe. ❌ Local DX: two vars (documented). |
| 11 | 2026-10-05 | Entry-based progression (not score) | Score-gates kill completion; fairness disputes | ✅ Simple + convertible. ❌ Purists want pass-gates → future `PASS_EXAM` flag. |
| 12 | 2026-10-05 | Server-authoritative `expiresAt` | Client timers are cheatable | ✅ Fair. ❌ Requires sweeper + BullMQ delayed jobs (ops). |
| 13 | 2026-10-05 | pnpm + Turbo (strict) | npm drift + slow CI | ✅ Fast + reproducible. ❌ Windows contributors must learn PS-safe commands. |

> New ADR? Append row + date + context. Decisions are append-only (never rewrite history).

---

## 3️⃣6️⃣ Contributing — Workflow, Commits, PRs, Reviews

### 36.1 Who This Is For

- User = high-school student, **1 day/week** on this project. Work in **small verifiable steps**. Commit after each working task. Prefer small PRs.

### 36.2 Setup for Contributors (First Time)

```powershell
git clone https://github.com/omarahameds2010-lab/sanad-edtech.git; cd learning-platform
docker compose up -d
pnpm install
cd apps/api; npx prisma generate; npx prisma migrate deploy; cd ..; cd ..
Copy-Item .env.example .env.local
pnpm build 2>&1 > build-out.txt; Get-Content build-out.txt -TotalCount 30
```

### 36.3 Daily Loop

```powershell
git checkout develop; git pull
git checkout -b feat/<scope>-<short-name>
# ... code (small slice!) ...
pnpm build 2>&1 > build-out.txt; Get-Content build-out.txt -TotalCount 20
cd apps/api; pnpm test; cd ..; cd ..
git add -A; git commit -m "feat(scope): what + why"
git push -u origin feat/<scope>-<short-name>
# Open PR: develop ← feat/... (fill template below)
```

### 36.4 PR Template (Paste Into Every PR)

```markdown
## What + Why
<!-- 2-3 sentences. Link issue. -->

## How verified (REQUIRED — never claim without this)
```
pnpm build → Tasks: X successful (paste tail)
pnpm test → Suites: X passed
RLS e2e → green (if tenant-scoped)
Manual → <steps + screenshots>
```

## Security checklist (check or explain N/A)
- [ ] Guarded by AuthorizationGuard + RequirePermission
- [ ] Fetch by (tenant_id, id); RLS migration + FORCE (if new table)
- [ ] Webhook HMAC verified BEFORE state change (if provider callback)
- [ ] No PII in logs; audit row written (if sensitive action)
- [ ] No secrets in diff

## Risk + Rollback
<!-- What breaks if this is wrong? How to revert? -->
```

### 36.5 Reviewer Checklist (For the Maintainer)

- [ ] Build output pasted + exit 0? (If not → request changes, no exceptions.)
- [ ] Scope creep? (Split if >400 lines or 2 features.)
- [ ] Money/time/unlock server-side? (Client trust → block.)
- [ ] Tests meaningful (not `expect(true).toBe(true)`)?
- [ ] Docs updated (README/docs/STATUS + `.env.example` if env added)?
- [ ] Small enough to revert in one commit?

### 36.6 Commit Footer Tags (For Changelog)

```
feat(lms): ENTER_EXAM unlocks next lesson
Refs: #123
Security: RLS policy added on progression_events
Test: lms-progression.e2e-spec.ts (3 cases)
```

---

## 3️⃣7️⃣ Code of Conduct — Summary (Full Text → `CODE_OF_CONDUCT.md`)

- Be kind, assume good intent, no harassment/discrimination.
- Egyptian Arabic + English both welcome. Explain jargon.
- Security issues → private disclosure first (see `SECURITY.md`), never public PoC before fix.
- Violations → warning → temporary ban → permanent ban (maintainer discretion, appealable).
- This is a learning project (high-school contributor) — patience is mandatory, mentorship is celebrated.

---

## 3️⃣8️⃣ Glossary — 60 Terms Defined

| Term | Definition |
|------|------------|
| Tenant | One teacher's isolated space (data + branding + domain). Root aggregate. |
| White-label | Same codebase, per-tenant branding/domains (no forks). |
| RLS | Row Level Security — PG filters rows by policy (`app.tenant_id`). |
| FORCE RLS | Applies even to table owners (no escape hatch). |
| `app_user` | Least-privilege runtime role (no SUPERUSER/BYPASSRLS). |
| Outbox | Table buffering domain events in same tx as business write (no lost events). |
| Idempotency key | Client-sent UUID making retries safe (24h window). |
| Ledger | Append-only double-entry money log (debits = credits). |
| Reconciliation | Daily provider ↔ ledger diff (mismatches → queue, no auto-fix). |
| Entitlement | Per-student grant to access a resource (course/video/exam). |
| Feature flag | Per-tenant toggle (plan + override). |
| Plan | Pricing tier (Free/Starter/Pro/Business/Enterprise) with quotas. |
| Progression | Unlock graph (ENTER_* in Phase 1). |
| `expiresAt` | Server-computed attempt deadline (source of truth). |
| Attempt | One student's run at an assignment/exam (has its own timer). |
| Version snapshot | Attempt pins parent version (config changes don't affect running). |
| Playback token | Short JWT authorizing HLS fetch (session+student+video bound). |
| Watermark | HMAC-signed identity overlay (moving, tamper-evident). |
| Risk engine | LOW/MED/HIGH/CRITICAL scorer → allow/challenge/pause/revoke. |
| TUS | Resumable upload protocol (browser → Bunny direct). |
| HLS | HTTP Live Streaming (segmented video via CDN). |
| HMAC | Keyed hash for webhook/watermark verification (constant-time compare). |
| Blind index | `HMAC(PII)` allowing search without decrypting. |
| PolicyEngine | Central `can(user, action, resource)` (tenant→RBAC→ownership→entitlement→flag→quota). |
| Guard | NestJS gate running before handler (deny by default). |
| Interceptor | Wraps request (tenant resolution, logging). |
| BullMQ | Redis-backed job queue (delayed exam auto-submit, outbox relay). |
| SLO | Service-level objective (e.g., p95 < 800ms). |
| SEV | Severity (1 = critical, 3 = minor). |
| TOTP | Time-based one-time password (2FA). |
|TEE| — |
| PII | Personally identifiable info (never logged). |
| KMS | Key management service (envelope encryption in prod). |
| CDN | Content delivery network (Cloudflare edge cache). |
| WAF | Web application firewall (OWASP rules). |
| PoP | Point of presence (edge location, e.g., Cairo). |
| EGP | Egyptian pound (currency for all prices). |
| Fawry ref | Kiosk/cash reference number (pay offline, confirm online). |
| Voucher | Pre-paid code granting entitlement (atomic redeem). |
| Settlement | Payout batch to teacher (debit cash, credit payable). |
| Chargeback | Provider-forced refund (dispute → freeze + review). |
| Dedupe | Replay guard (`UNIQUE(provider, eventId)`). |
| Sweeper | Cron marking expired attempts (fallback to BullMQ delayed jobs). |
| Materialized view | Precomputed analytics snapshot (planned). |
| OLAP | Analytical workload (vs OLTP transactional). |
| INP/LCP/CLS | Web Vitals (responsiveness / paint / stability). |
| RTL | Right-to-left (Arabic layout; motion edges flip). |
| Motif | Subject-specific visual pattern (orbits, grids, molecules…). |
| Accent | Per-tenant electric color (20% expression layer). |
| Grid reveal | Signature landing animation (hairlines draw in). |
| Portal | Shared-element card → space transition. |
| Autosave | Debounced draft persist (UI-safe optimistic). |
| TTFB | Time to first byte (edge → origin). |
| DLQ | Dead-letter queue (failed jobs after retries). |
| Canary | Gradual rollout (5% → 50% → 100%). |
| Break-glass | Emergency super-admin (Vault, 2 custodians, audited). |
| PITR | Point-in-time recovery (WAL-based restore). |
| RTO/RPO | Recovery time/point objectives. |
| SemVer | MAJOR.MINOR.PATCH versioning. |
| ADR | Architecture decision record (append-only). |

---

## 3️⃣9️⃣ License + Acknowledgments + Contact

### License

MIT License — see [`LICENSE`](LICENSE). You may fork, self-host, and sell teacher spaces built on this. Attribution appreciated but not required. No warranty (see license). Money-handling code comes with zero guarantees — audit before accepting live EGP.

### Author

Built with ❤️ by **OMAR AHMED** — 16-year-old high-school student & founder, building serious learning infrastructure for Egyptian teachers and students.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-OMAR_AHMED-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/omar-ahmed-7b97613b1/)

### Acknowledgments (Tech Heroes)

- [Next.js](https://nextjs.org/) · [NestJS](https://nestjs.com/) · [Prisma](https://www.prisma.io/) · [PostgreSQL](https://www.postgresql.org/) · [Redis](https://redis.io/) · [BullMQ](https://bullmq.io/) · [Turborepo](https://turbo.build/) · [pnpm](https://pnpm.io/) · [Cloudflare](https://www.cloudflare.com/) · [Bunny Stream](https://bunny.net/stream/) · [Paymob](https://paymob.com/) · [Fawry](https://www.fawry.com/) · [Argon2](https://github.com/P-H-C/phc-winner-argon2) · [TUS](https://tus.io/) · [hls.js](https://github.com/video-dev/hls.js/) · [Mermaid](https://mermaid.js.org/) · [Shields.io](https://shields.io/) (badges on this page)

### Documentation Map (Start Here → Go Deep)

| If you want… | Read… |
|--------------|-------|
| Rules + decisions (source of truth) | [`AGENTS.md`](AGENTS.md) |
| System architecture + data flows | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Visual + motion system | [`docs/VISUAL_IDENTITY.md`](docs/VISUAL_IDENTITY.md) |
| Video security math | [`docs/VIDEO_PROTECTION.md`](docs/VIDEO_PROTECTION.md) |
| Threats + layers + compliance | [`docs/SECURITY.md`](docs/SECURITY.md) |
| Verified vs TODO vs known issues | [`docs/STATUS.md`](docs/STATUS.md) |

### Contact & Community

| Channel | Link |
|---------|------|
| 🐛 Issues | `https://github.com/omarahameds2010-lab/sanad-edtech/issues` |
| 💬 Discussions | `https://github.com/omarahameds2010-lab/sanad-edtech/discussions` |
| 🔒 Security (private) | `security@yourdomain.com` (PGP on request — never post PoC publicly) |
| 👤 Author | **OMAR AHMED** (16) — [LinkedIn](https://www.linkedin.com/in/omar-ahmed-7b97613b1/) |

---

<div align="center">

### 🏛️ Built with architectural precision. Designed for scale. Secured by default.

**A screenshot without the logo should still feel like the platform.**
**A different tenant should still feel like the same ecosystem.**

[![Star on GitHub](https://img.shields.io/github/stars/omarahameds2010-lab/sanad-edtech?style=social)](https://github.com/omarahameds2010-lab/sanad-edtech)
[![Fork](https://img.shields.io/github/forks/omarahameds2010-lab/sanad-edtech?style=social)](https://github.com/omarahameds2010-lab/sanad-edtech/fork)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-OMAR_AHMED-0A66C2?style=social&logo=linkedin)](https://www.linkedin.com/in/omar-ahmed-7b97613b1/)

<sub>Last updated: 2026-10-28 · Source of truth: <code>AGENTS.md</code> + <code>docs/STATUS.md</code> + <code>docs/ARCHITECTURE.md</code> + <code>docs/SECURITY.md</code> + <code>docs/VIDEO_PROTECTION.md</code> · README line target: 2000+ (this file) · Product tour: real production captures in <code>docs/assets/readme/</code></sub>

</div>





