# Current State — 27 October 2026

> **This is the canonical snapshot for the repository.** If another document disagrees with this file, this file wins. Production was checked against the live deployment on 25 October 2026; the pending hardening and assignment-retakes branches were checked locally on 26–27 October 2026.
>
> Historical reports keep their original date and evidence. They are not silently rewritten; they carry a banner pointing here.

## Release

| Item | Value |
| --- | --- |
| Production branch | `main` |
| Verified app commit | `4951e49` — `feat(web): redesign student curriculum and lesson workspace` (later docs-only commits do not change runtime code) |
| Pending hardening branch | `feat/security-quick-wins` — rate limiting, lock enforcement, and authoring-read bypass fixes; local only, **not deployed** |
| Pending assignment-retakes branch | `feat/assignment-retakes` — merge of the hardening branch plus the attempt lifecycle; local only, **not deployed** |
| Web | <https://sanad-edtech.vercel.app> |
| API (direct) | <https://sanad-edtech-production.up.railway.app> |
| API through the web domain | <https://sanad-edtech.vercel.app/api/health> (Vercel rewrite to Railway) |
| Health check | `/api/health` → **200** `{"status":"ok","database":"up"}` |
| Login page | `/login` → **200** |
| Database | Managed PostgreSQL on Railway, 7/7 Prisma migrations applied in production; the retakes branch has migration #8 for local verification |
| Demo tenant | `sanad-demo` |

The production demo seed contains **3 published Arabic prep courses**, one exam and one assignment. The student curriculum screen shows the real task counts from the API; do not hardcode the demo's current numbers into marketing copy.

### Demo accounts

These are seeded demo accounts, not production customer accounts.

| Role | Phone | Password |
| --- | --- | --- |
| Teacher | `01000000001` | `Joker-Arabic#2026` |
| Student | `01000000002` | `Student123!` |

## Verification evidence

| Check | Result |
| --- | --- |
| API unit suite on `main` (`4951e49`) | **311 / 311 passed**, 31 suites (`pnpm --filter api exec jest --config jest.config.js --runInBand`) |
| API unit suite on `feat/security-quick-wins` | **344 / 344 passed**, 34 suites |
| API unit suite on `feat/assignment-retakes` | **353 / 353 passed**, 34 suites |
| Web unit suite | **145 / 145 passed**, 9 files (`pnpm --filter web test`) |
| TypeScript | `pnpm --filter web exec tsc --noEmit` and the API typecheck pass |
| Monorepo build | `pnpm build` → **4/4 tasks successful** |
| Live health | Web `/api/health` and direct Railway `/api/health` both return **200**, database up |
| Login-limit smoke (branch) | 10 attempts from one forwarded IP returned `401`; attempts 11–12 returned `429` with `Retry-After: 40` |
| Fresh migration chain | Local PostgreSQL 15 via Docker: **8/8** migrations applied; `prisma migrate diff` reports **no difference** |
| Legacy backfill | A legacy-shaped database with one existing submission migrated cleanly to attempt #1, preserving `submittedAt` and setting `startedAt = submittedAt` |
| Retake HTTP smoke | Attempt 1 → submit → attempt 2 starts → third start returns **400** at `maxAttempts=2`; teacher queue excludes the in-progress attempt |
| Concurrent-start smoke | Two simultaneous `enter` requests → **201 + 409**, exactly one `IN_PROGRESS` row |
| Retake browser QA | Student submitted attempt 1; reload showed «محاولة جديدة» and attempt 2 started with a fresh 300-minute timer. A second QA pass with a graded attempt #1 plus an active attempt #2 showed «قيد الحل», primary «متابعة الحل», secondary «مراجعة المحاولة السابقة», and completion **100% (1/1)**. |
| Locked-assignment QA | With the lesson grant removed, the assignment list rendered «مقفل», the prerequisite «سلّم الواجب السابق أولًا», and a lesson link instead of a generic failure. Verified in dark and light themes with no document-level horizontal overflow. |
| Migration preflight | Read-only production check before migration #8: **1 total** submission, **1 submitted**, **0** with null content, **0** empty content. Migration and backup remain pending. |
| Curriculum/lesson QA | Course page, curriculum task links, video lesson, exam brief, assignment brief, locked-video prerequisite, and theme toggle verified in a browser at desktop and mobile widths |

The production API suite is **311/311**; the hardening branch is **344/344**, and the retakes branch (with the hardening branch merged) is **353/353**. Web is **145/145** on the retakes branch. Older documents that mention 86, 179, 229, 276, 307, or 393 tests are historical snapshots, not the current count.

## Stack and repository facts

| Layer | Current implementation |
| --- | --- |
| Web | Next.js `^15.0.0`, React `^19.0.0`, App Router, TypeScript |
| API | NestJS 10 modular monolith, 13 domain modules |
| Database | PostgreSQL + Prisma `5.22.0`; **43 models**, 35 enums, 7 production migrations; migration #8 is committed on the retakes branch and **not applied to Railway** |
| Auth | JWT access token in an HttpOnly cookie + rotating opaque refresh token; refresh-on-mount in the SPA |
| Cache/jobs | Redis and Bull dependencies are installed; **no Bull processors or outbox relay are wired** |
| Storage | R2/S3 signing helpers exist; not part of the verified demo flow |
| Video | Bunny Stream provider, VdoCipher scaffold, unlisted YouTube attach path; student player uses the YouTube IFrame API |
| Payments | Paymob, Fawry, and voucher providers; Instapay, Vodafone Cash, and e&money are scaffolding |
| Monorepo | pnpm `9.15.0` + Turborepo 2 |
| Web pages | 35 App Router pages |
| Node | Node 20 in the API Docker image; `.nvmrc` is 20 |

The repository does **not** have a root `tsconfig.base.json` or a root `.env.example`; the API template lives at `apps/api/.env.example`.

## What is shipped

- Host-based tenant resolution with `tenant_domains`; the production demo resolves `sanad-demo`.
- Teacher authoring for courses, sections, lessons, resources, assignments, and exams, including a publish workspace.
- Student curriculum view with section/lesson/task breakdown, progress, available/locked tasks, and direct task links.
- Student lesson workspace with video/exam/assignment briefs, server-derived state, locked-video prerequisite state, and responsive layouts.
- Server-authoritative assignment and exam timers (300 minutes and 70 minutes by default); refresh does not reset the derived expiry.
- Per-student progression: `ENTER_ASSIGNMENT` unlocks the linked exam, and `ENTER_EXAM` unlocks the next lesson. Grants are idempotent and stored in `student_lesson_unlocks`.
- Teacher grading queue for exam attempts and assignment submissions.
- Cookie-based sessions that survive a hard reload: `AuthProvider` calls `POST /api/auth/refresh`, then `GET /api/users/me`, and exposes a `ready` flag before rendering protected pages.
- Dark theme by default and an optional Academic Light Mode (“Heritage Manuscript”) across the student surfaces, persisted under `sanad:theme` and applied before paint.
- Student Command Center on `/student`, with every displayed number derived from server responses.
- Paymob/Fawry webhook verification with raw payloads, replay/deduplication, atomic settlement, ledger entries, entitlements, and refund settlement.
- Admin refund flow with idempotency, provider rejection handling, ledger reversal, and surgical entitlement revocation.
- Bunny Stream upload/signing code and video-protection primitives (signed playback token, watermark engine, playback sessions).
- Unlisted YouTube attachment for lessons, which is the path used by the current demo content.

## Pending hardening branch — not in production

`feat/security-quick-wins` is local-only until it is merged and deployed. It adds:

- A global `@nestjs/throttler` guard keyed by the forwarded client IP: **120 requests/minute per route** by default, with stricter auth limits (`login` 10/min, `register` 5/min, `refresh` 30/min). Health/readiness and Paymob/Fawry webhook routes opt out.
- In-memory throttler storage. It is per API instance; a multi-replica deployment needs shared storage (for example Redis) before limits are cluster-wide.
- Forwarded-IP extraction (`X-Forwarded-For` first, then `X-Real-IP`, then the socket address). This is a best-effort rate-limit key, not an authorization boundary; a direct caller can spoof the header.
- Locked-lesson payload redaction: `GET /api/v1/student/lessons/:lessonId` returns title/description/access metadata but `assignment: null`, `exam: null`, and `videos: []` while locked.
- Assessment lock enforcement: student assignment/exam view and enter endpoints return **403 `LESSON_LOCKED`** when the lesson is locked and the student has no per-student unlock grant.
- Authoring-read bypass fixes: `GET /api/v1/exams/:examId`, the generic `GET /api/v1/assignments/:assignmentId`, teacher lesson routes, and legacy lesson routes now require the `update` action, not student `read`.
- Pre-start exam protection: the student exam view withholds the question paper until an attempt is active; `questionCount` remains available for the intro screen.
- Student assignment/exam lists return navigation metadata only. Descriptions, instructions, questions, attempts, and grading fields stay behind the locked `/view` routes.

Production `4951e49` does not include any of these changes yet.

## Pending assignment-retakes branch — not in production

`feat/assignment-retakes` is stacked on `feat/security-quick-wins` and is local-only until both branches are merged and deployed. It adds:

- Migration #8 `20261027000001_assignment_retakes`: `attemptNumber`, `startedAt`, nullable `submittedAt`, the `IN_PROGRESS` submission status, and a unique `(assignmentId, studentId, attemptNumber)` key replacing the one-row unique key.
- Safe backfill of existing rows as submitted attempt #1; `startedAt` is backfilled from the old `submittedAt`. No existing row is deleted or rewritten.
- Active-attempt semantics: `IN_PROGRESS` + `submittedAt = null` while the student writes; submit sets the final timestamp. Timers derive from `startedAt`, not `submittedAt`.
- Server-side `maxAttempts` enforcement, attempt N+1 after a completed attempt, and a `409` for concurrent duplicate starts. An active attempt is checked before the max-attempt count, so an open final attempt returns `409`, not a misleading `400`.
- The next attempt number is `max(count, highest stored attemptNumber) + 1`, tolerating gaps in legacy history.
- Teacher grading queue and teacher student-file history exclude in-progress attempts. Student history includes them with `submittedAt: null`.
- Assignment list/runner and dashboard types handle nullable timestamps; the teacher queue shows the attempt number.
- Student overview fixes: completion counts any submission with a non-null `submittedAt`; an active `IN_PROGRESS` attempt outranks an older grade; result review scans all attempts; and a `LESSON_LOCKED` response renders the prerequisite lock card instead of a failure state.

Production `4951e49` still has one submission row per student/assignment and does **not** enforce retakes. Migration #8 has **not** been applied to Railway; the read-only preflight passed and a backup is still required before deployment.

## Known limits and absent features

Do not describe any of the following as shipped:

| Area | Current reality |
| --- | --- |
| RLS enforcement on Railway | Policies exist for all 43 application tables and tenant context is injected per request, but the runtime currently selects `MIGRATION_DATABASE_URL` first and therefore connects with owner/superuser credentials. **RLS is not enforcing at runtime until the runtime URL is `app_user` and that preference is flipped.** Every query must still carry `tenantId`. |
| Transactional outbox | Events are written to `OutboxEvent`; there is **no dispatcher/relay** delivering them. |
| Background jobs | Redis/Bull dependencies exist, but no processors or scheduled jobs are registered. |
| Video provider webhook | There is no video webhook route. Bunny's provider-side webhook helper is not exposed as an HTTP endpoint. |
| Advanced progression | Only `ENTER_ASSIGNMENT` and `ENTER_EXAM` are active. `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, and manual unlocks are future extension points. |
| Locked lesson content | Production `4951e49` still treats locks as advisory in some student API views. `feat/security-quick-wins` closes the lesson-payload and assessment-entry paths, but it is not deployed yet. |
| Rate limiting | Production `4951e49` has no application-level rate limiting. The pending branch adds in-memory per-IP limits; distributed/shared storage and hostile-proxy tuning remain open. |
| Word-level review highlighting | `AssignmentSubmission` stores `content`, `score`, and `feedback`; per-word evidence spans are not persisted. The result screen uses an aggregate bridge, not fabricated highlights. |
| Content versioning | Courses, lessons, and exams do not have a separate version/snapshot table. Publishing updates the current row; old attempts are not guaranteed to point at an immutable content version. |
| Assignment retakes | Production `4951e49` still uses `@@unique([assignmentId, studentId])`, so `Assignment.maxAttempts` does not enable retakes. The pending `feat/assignment-retakes` branch implements the attempt model and migration #8, but it is not deployed. |
| Exam auto-submit | The student client submits when the timer reaches zero; the API records a late submit as `TIMED_OUT`. There is no server-side scheduled auto-submit worker. |
| Reconciliation | `ReconciliationRun`, `ReconciliationItem`, and settlement models exist, but there is no live reconciliation worker or route. |
| Provider sandbox proof | Paymob/Fawry code and local webhook smokes are present; a real provider sandbox run remains pending. |
| Instapay / Vodafone Cash / e&money | Provider classes are scaffolding/stubs. They are not live payment methods. |
| VdoCipher | Explicit stub. Use Bunny Stream or the unlisted YouTube demo path. |
| AI claims | The web client and API contain a SANAD evaluation endpoint/client. The external RAG service, Qdrant/BM25 stack, benchmark numbers, and the “393 achievements” claims from older demo copy are not in this repository and are not verified here. |
| CI as release proof | `.github/workflows/ci.yml` exists, but the release evidence for this commit is the local test/build run above. Do not cite CI as green until it has actually run successfully on `main`. |

## Tenancy and isolation model

1. `TenantResolverMiddleware` resolves the request host through the `SECURITY DEFINER` function `app_resolve_tenant_by_domain`.
2. The request runs inside `AsyncLocalStorage` tenant scope.
3. `PrismaService` wraps operations in a short transaction and calls `set_config('app.tenant_id', <id>, true)`.
4. RLS policies compare `current_setting('app.tenant_id', true)` with the row's `tenantId`.
5. Interactive `$transaction` sites call `applyTenantContext(tx)` explicitly.

The database side is complete. Runtime activation is the remaining operational step:

- rotate the Railway database password by hand;
- apply the migrations as the migration owner;
- point the **runtime** `DATABASE_URL` at the non-owner `app_user`;
- remove/avoid `MIGRATION_DATABASE_URL` in the runtime environment;
- flip the preference in `apps/api/src/modules/tenants/prisma.service.ts` so runtime no longer selects the migration URL.

Until that is done, the application-level `tenantId` filters are not a backup to RLS — they are the active isolation control.

## Payment truth

The money path is implemented as **order → payment intent → provider → ledger + entitlement**, inside a transaction where possible.

- Money crosses the API as JSON strings; minor units are canonicalized with `toBigIntMinor`.
- Idempotency keys renew in place and store a stable completed payload.
- Webhooks verify the provider signature before any state change; raw bodies are retained for replay.
- A paid event with no matching `PROCESSING` intent fails visibly as `INTENT_NOT_FOUND` and is retryable.
- Refunds claim an idempotency key before validation, use CAS transitions, reverse ledger entries, and revoke the matching entitlement in the same settlement transaction.
- A second paid transaction for an already-settled order raises `SECOND_CHARGE_DETECTED`; it is not auto-settled.

See `docs/STATUS.md` and `docs/SECURITY.md` for the detailed state and evidence.

## Student experience — Heritage Manuscript

The student side is a warm-paper/ink register in light mode and a graphite register in dark mode, with emerald as the action accent.

- Light mode tokens are scoped under `html[data-theme="light"]` in `apps/web/app/globals.css`.
- The theme is applied pre-paint from `apps/web/app/layout.tsx`; the default is dark.
- `ThemeProvider` and `useTheme()` live in `apps/web/app/lib/theme-provider.tsx`.
- The toggle is in the student dock (`StudentDock.tsx`); the saved key is `sanad:theme`.
- The redesigned curriculum board and lesson workspace use the `lc-*` surface family in `globals.css`.
- The student course page, task links, lesson player, exam brief, assignment brief, and locked-video state were browser-verified in both themes at desktop and mobile widths.

## How to reproduce the evidence

```powershell
# From the repository root
pnpm install
pnpm --filter api exec prisma generate
pnpm --filter web test
pnpm --filter api exec jest --config jest.config.js --runInBand
pnpm build

# Live check
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

## Documentation map

| Document | Purpose |
| --- | --- |
| `README.md` | Public overview and setup |
| `docs/CURRENT-STATE.md` | This canonical snapshot |
| `docs/STATUS.md` | Concise status and evidence |
| `docs/ARCHITECTURE.md` | Current runtime architecture |
| `docs/DEPLOY.md` | Deployment/runbook and RLS activation |
| `docs/SECURITY.md` | Threat model and security controls (with current-state banner) |
| `docs/VISUAL_IDENTITY.md` | Design system and Heritage Manuscript specification |
| `docs/COMMAND-CENTER.md` | Student dashboard data/design contract |
| `docs/VIDEO_PROTECTION.md` | Video protection specification and current limits |
| `docs/DEMO.md` | Demo runbook |
| `docs/DEMO-SCRIPT.md` | Honest demo script |
| `docs/AUDIT-2026-10-16.md` | Historical audit, preserved as a dated snapshot |
| `docs/GOVERNANCE.md` | Repository workflow and gates |
