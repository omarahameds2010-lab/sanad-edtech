# Current State — 13 November 2026

> **This is the canonical snapshot for the repository.** If another document disagrees with this file, this file wins. The live deployment was checked on 13 November 2026 after the Sprint 1 demo-hardening release.
>
> Historical reports keep their original date and evidence. They are not silently rewritten; they carry a banner pointing here.

## Release

| Item | Value |
| --- | --- |
| Production branch | `main` (GitHub's default branch is `master`; Vercel follows `main`) |
| Web runtime code | `1c09fe0` — Sprint 1 demo hardening; Vercel deployment status SUCCESS |
| API code | `5ac122d` — unchanged; Sprint 1 contains no API code or migration change |
| API runtime | Local compiled NestJS API on `:3002`; start with `pnpm demo:start` |
| API public origin | <https://timer-surprised-governing-prize.trycloudflare.com> — Cloudflare quick tunnel; the URL changes on restart until a stable ngrok domain is configured |
| Web | <https://sanad-edtech.vercel.app> |
| API through the web domain | <https://sanad-edtech.vercel.app/api/health> (Vercel rewrite to the current tunnel) |
| Health check | `/api/health` → **200** `{"status":"ok","database":"up"}` |
| Login page | `/login` → **200** |
| Database | Local Docker PostgreSQL `learning_platform`; **8/8** Prisma migrations, 3 courses, 0 submissions at verification |
| Demo tenant | `sanad-demo` |

The Railway API (`https://sanad-edtech-production.up.railway.app`) and its database remain the historical production deployment, but the current demo web app is proxied to the laptop tunnel. The live student dashboard shows 0 submissions, matching the local Docker database (0 rows), not the Railway demo state (3 submissions). Railway's GitHub-linked service also did **not** auto-deploy the 28 October push; do not assume a push to `main` redeploys that API until the integration is fixed.

The production demo seed contains **3 published Arabic prep courses**, one exam and one assignment. The student curriculum screen shows the real task counts from the API; do not hardcode the demo's current numbers into marketing copy.

### Demo accounts

These are seeded demo accounts, not production customer accounts.

| Role | Phone | Password |
| --- | --- | --- |
| Teacher | `01000000001` | `Joker-Arabic#2026` |
| Student | `01000000002` | `Student123!` |

The demo assignment was set to `maxAttempts = 2` for the production retake smoke. The demo student now has two submitted attempts (1 and 2); a third start returns `400`. This is demo data, not a guarantee of the generic seed.

## Verification evidence

| Check | Result |
| --- | --- |
| API unit suite on production code (`5ac122d`) | **357 / 357 passed**, 35 suites, run 13 November 2026 (`pnpm --filter api exec jest --config jest.config.js --runInBand`) |
| Web unit suite on `1c09fe0` | **150 / 150 passed**, 10 files, run 13 November 2026 (`pnpm --filter web test`) |
| Monorepo build on `1c09fe0` | **4/4 tasks successful** (`pnpm build`) |
| Live judge path | `/demo` **200**; one-click teacher and student access reached `/teacher` and `/student`; demo banner present; teacher navigation has no analytics link; `/teacher/analytics` redirects to `/teacher`; an unknown URL renders the branded Arabic 404 |
| Local database | **8/8** migrations, 3 courses, 0 submissions (`learning-platform-db`) |
| Production migration chain | **8/8**; `prisma migrate status` reports “Database schema is up to date!” |
| Migration #8 schema checks | `attemptNumber` NOT NULL default 1; `startedAt` NOT NULL default CURRENT_TIMESTAMP; `submittedAt` nullable; unique key `(assignmentId, studentId, attemptNumber)`; `SubmissionStatus` includes `IN_PROGRESS` |
| Migration backfill | Existing production row preserved as attempt #1 with `startedAt = submittedAt`; no null content |
| Backup before migration | Custom-format dump + globals, restore-tested into a local PostgreSQL 18 container: **44 tables, 3 courses, 1 submission, 7 migrations** at backup time |
| Production retake smoke | **31/31 checks passed**: metadata-only list, `maxAttempts=2`, concurrent start **201 + 409**, attempt 1 submit, attempt 2 start/submit, third attempt **400**, teacher queue excludes `IN_PROGRESS` and includes both submitted attempts, health **200** |
| Production lock-card QA | Assignment lesson temporarily set to `LOCKED` with `ENTER_ASSIGNMENT`; the student page rendered «الواجب مقفل» and «لفتح هذا الواجب، سلّم الواجب السابق أولًا.» in dark and light themes with no horizontal overflow; the lesson was restored to `UNLOCKED`/`NONE` |
| Live health | Web `/api/health` returns **200**, database **up**, through the current laptop tunnel; the direct Railway endpoint remains a separate historical deployment |
| Fresh local chain (historical) | Local PostgreSQL 15: **8/8** migrations and `prisma migrate diff` no drift |
| Pre-merge branch evidence (historical) | API **344/344** on `feat/security-quick-wins`; API **353/353**, web **145/145** on `feat/assignment-retakes`; local retake, concurrent-start, and lock-card QA |

Production final database state after the 28 October smoke: **3 submissions** (2 at attempt 1, 1 at attempt 2), **0** in progress, **0** null `startedAt`/`submittedAt`; demo assignment `maxAttempts=2`. That is the Railway state and is not the current local demo state. Older documents that mention 86, 179, 229, 276, 307, 311, 344, 353, or 393 tests are historical snapshots, not the current count.

## Sprint 1 demo hardening — 2026-11-13

Sprint 1 makes the judge path survive a laptop reboot without changing the Vercel frontend or the API code.

- Added `scripts/demo/start.ps1` (Docker, compiled API, tunnel, optional watchdog), `stop.ps1`, `smoke.ps1`, `backup.ps1`, and `install-autostart.ps1`, exposed as `pnpm demo:start`, `demo:start:watch`, `demo:stop`, `demo:smoke`, `demo:backup`, and `demo:autostart`.
- Added the runbook in [`DEMO-STABILITY.md`](DEMO-STABILITY.md): stable ngrok domain setup, Cloudflare quick-tunnel fallback, watchdog, smoke, backup, autostart, and troubleshooting.
- `apps/web/next.config.mjs` now resolves the API proxy from `API_PROXY_TARGET` or `DEMO_TUNNEL_ORIGIN`, strips invisible Unicode marks (LRM/RLM/ZWSP/BOM), validates the origin, and logs the target during the Vercel build. The temporary hardcoded quick-tunnel fallback remains until a stable domain is configured and verified.
- Removed the four fabricated teacher screens: `/teacher/analytics` redirects to `/teacher`; course `builder`, `preview`, and `publish` redirect to the real course workspace. Analytics was removed from the teacher navigation and command palette, and dead creation commands were replaced with real publish/payments commands.
- Added branded Arabic `not-found.tsx`, `error.tsx`, and `loading.tsx` with dark/light styles in `apps/web/app/system-pages.css`.
- Verified locally: start/stop on an isolated `:3099` API, public smoke **2/2**, backup dump **0.25 MB**, autostart install/remove, browser QA of student and teacher one-click access, redirects, and the 404 in dark/light themes. The live deployment then verified `/demo`, both one-click logins, the teacher dashboard, the analytics redirect, and the branded 404.
- Remaining: install ngrok, claim a free static domain, set its authtoken locally, start with `pnpm demo:start -- -Tunnel ngrok -NgrokDomain <domain> -Watch`, set Vercel Production `API_PROXY_TARGET=https://<domain>`, redeploy once, and verify before removing the hardcoded fallback. Do not install autostart before the stable domain exists.

## Stack and repository facts

| Layer | Current implementation |
| --- | --- |
| Web | Next.js `^15.0.0`, React `^19.0.0`, App Router, TypeScript |
| API | NestJS 10 modular monolith, 13 domain modules |
| Database | PostgreSQL 18.6 + Prisma `5.22.0`; **43 models**, 35 enums, **8 production migrations** (migration #8 applied 28 October 2026) |
| Auth | JWT access token in an HttpOnly cookie + rotating opaque refresh token; refresh-on-mount in the SPA |
| Cache/jobs | Redis and Bull dependencies are installed; **no Bull processors or outbox relay are wired** |
| Storage | R2/S3 signing helpers exist; not part of the verified demo flow |
| Video | Bunny Stream provider, VdoCipher scaffold, unlisted YouTube attach path; student player uses the YouTube IFrame API |
| Payments | Paymob, Fawry, and voucher providers; Instapay, Vodafone Cash, and e&money are scaffolding |
| Monorepo | pnpm `9.15.0` + Turborepo 2 |
| Web pages | 35 App Router pages plus root loading/error/not-found states |
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

## Deployed hardening — 2026-10-28

`feat/security-quick-wins` is merged and deployed. It adds:

- A global `@nestjs/throttler` guard keyed by the forwarded client IP: **120 requests/minute per route** by default, with stricter auth limits (`login` 10/min, `register` 5/min, `refresh` 30/min). Health/readiness and Paymob/Fawry webhook routes opt out.
- In-memory throttler storage. It is per API instance; a multi-replica deployment needs shared storage (for example Redis) before limits are cluster-wide.
- Forwarded-IP extraction (`X-Forwarded-For` first, then `X-Real-IP`, then the socket address). This is a best-effort rate-limit key, not an authorization boundary; a direct caller can spoof the header.
- Locked-lesson payload redaction: `GET /api/v1/student/lessons/:lessonId` returns title/description/access metadata but `assignment: null`, `exam: null`, and `videos: []` while locked.
- Assessment lock enforcement: student assignment/exam view and enter endpoints return **403 `LESSON_LOCKED`** when the lesson is locked and the student has no per-student unlock grant.
- Authoring-read bypass fixes: `GET /api/v1/exams/:examId`, the generic `GET /api/v1/assignments/:assignmentId`, teacher lesson routes, and legacy lesson routes now require the `update` action, not student `read`.
- Pre-start exam protection: the student exam view withholds the question paper until an attempt is active; `questionCount` remains available for the intro screen.
- Student assignment/exam lists return navigation metadata only. Descriptions, instructions, questions, attempts, and grading fields stay behind the locked `/view` routes.

Production now enforces these paths. The production smoke verified the metadata-only student list, `LESSON_LOCKED` lock-card rendering in dark/light themes, and the retake flow. Distributed rate-limit storage and hostile-proxy tuning remain open.

## Deployed assignment retakes — 2026-10-28

`feat/assignment-retakes` is merged and deployed on top of the hardening branch. It adds:

- Migration #8 `20261027000001_assignment_retakes`: `attemptNumber`, `startedAt`, nullable `submittedAt`, the `IN_PROGRESS` submission status, and a unique `(assignmentId, studentId, attemptNumber)` key replacing the one-row unique key.
- Safe backfill of existing rows as submitted attempt #1; `startedAt` is backfilled from the old `submittedAt`. No existing row is deleted or rewritten.
- Active-attempt semantics: `IN_PROGRESS` + `submittedAt = null` while the student writes; submit sets the final timestamp. Timers derive from `startedAt`, not `submittedAt`.
- Server-side `maxAttempts` enforcement, attempt N+1 after a completed attempt, and a `409` for concurrent duplicate starts. An active attempt is checked before the max-attempt count, so an open final attempt returns `409`, not a misleading `400`.
- The next attempt number is `max(count, highest stored attemptNumber) + 1`, tolerating gaps in legacy history.
- Teacher grading queue and teacher student-file history exclude in-progress attempts. Student history includes them with `submittedAt: null`.
- Assignment list/runner and dashboard types handle nullable timestamps; the teacher queue shows the attempt number.
- Student overview fixes: completion counts any submission with a non-null `submittedAt`; an active `IN_PROGRESS` attempt outranks an older grade; result review scans all attempts; and a `LESSON_LOCKED` response renders the prerequisite lock card instead of a failure state.

Migration #8 is applied to Railway (**8/8**). The production smoke created attempt 1 and attempt 2 for the demo student, then rejected attempt 3 with **400**; the teacher queue excluded the active attempt and showed both submitted attempts.

## Known limits and absent features

Do not overstate the following controls; each row is the current limit.

| Area | Current reality |
| --- | --- |
| RLS enforcement on Railway | Policies exist for all 43 application tables and tenant context is injected per request, but the runtime currently selects `MIGRATION_DATABASE_URL` first and therefore connects with owner/superuser credentials. **RLS is not enforcing at runtime until the runtime URL is `app_user` and that preference is flipped.** Every query must still carry `tenantId`. |
| Transactional outbox | Events are written to `OutboxEvent`; there is **no dispatcher/relay** delivering them. |
| Background jobs | Redis/Bull dependencies exist, but no processors or scheduled jobs are registered. |
| Video provider webhook | There is no video webhook route. Bunny's provider-side webhook helper is not exposed as an HTTP endpoint. |
| Advanced progression | Only `ENTER_ASSIGNMENT` and `ENTER_EXAM` are active. `COMPLETE_*`, `PASS_EXAM`, `SCORE_THRESHOLD`, `TIME_ELAPSED`, and manual unlocks are future extension points. |
| Locked lesson content | The student lesson payload and assessment view/enter paths now enforce locks; a temporarily locked assignment rendered the lock card in production. Other content types still need their own enforcement review. |
| Rate limiting | Live in production as an in-memory per-IP/per-route guard. It is per API instance; distributed/shared storage and hostile-proxy tuning remain open. |
| Word-level review highlighting | `AssignmentSubmission` stores `content`, `score`, and `feedback`; per-word evidence spans are not persisted. The result screen uses an aggregate bridge, not fabricated highlights. |
| Content versioning | Courses, lessons, and exams do not have a separate version/snapshot table. Publishing updates the current row; old attempts are not guaranteed to point at an immutable content version. |
| Assignment retakes | Live with migration #8; `maxAttempts` is server-enforced and concurrent starts are serialized to one `201` and one `409`. The demo assignment is configured with `maxAttempts=2`. |
| Railway auto-deploy | The GitHub-linked Railway service did not create a deployment for the 28 October push. The API was deployed manually with `railway up`; verify the deployment status after each push until the integration is fixed. |
| Demo tunnel | The live web app currently uses a Cloudflare quick tunnel. The URL changes when cloudflared restarts, so a reboot requires updating Vercel `API_PROXY_TARGET` or relying on the temporary hardcoded fallback. A free ngrok static domain is the next step; see `docs/DEMO-STABILITY.md`. |
| Demo autostart | The Windows Startup-folder entry is not installed yet. `pnpm demo:autostart` is a manual step after the stable ngrok domain exists; installing it before that would start a tunnel with a new URL at every logon. |
| Vercel proxy environment | The local machine does not have the Vercel CLI, so the production `API_PROXY_TARGET` value has not been inspected directly. The live deployment currently works through the current tunnel and the fallback; confirm the env value when the stable domain is configured. |
| SETH-9 advanced security | Post-quantum signing, zero-knowledge delivery, homomorphic grading, active deception, and crypto-shredding are **not implemented**. A dependency-ordered, phased roadmap/ADR is recorded in [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md). |
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

# Local demo lifecycle (see docs/DEMO-STABILITY.md)
pnpm demo:start -- -Tunnel none
pnpm demo:smoke
pnpm demo:backup
pnpm demo:stop

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
| `docs/DEMO-STABILITY.md` | Stable tunnel, watchdog, smoke, backup, and autostart runbook |
| `docs/AUDIT-2026-10-16.md` | Historical audit, preserved as a dated snapshot |
| `docs/GOVERNANCE.md` | Repository workflow and gates |
