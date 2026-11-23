# Deployment Runbook — Vercel + local demo API

> **Current demo:** web on Vercel; API and PostgreSQL on the demo laptop, exposed through a Cloudflare quick tunnel. The Railway API endpoint returns `404 Application not found` and is retired.
> **Verified 22 November 2026:** local runtime connects as `app_user` with RLS active; new code `DATABASE_URL` only; API **412/412** (45 suites), web **159/159**, build **4/4**, RLS e2e **5/5**, outbox local-sink e2e **5/5**, live smoke **8/8**, demo doctor **10/10**. Migration chain is **9/9**. The teacher analytics endpoint is tenant-scoped and plan-capped; `/teacher/analytics` is a real page. The server-side exam-expiry Bull worker is live-proven, rate-limit counters are shared through Redis, and outbox delivery Phase 1 is implemented but disabled by default (no external target configured); its ADMIN-only dead-letter list/retry API is tenant-scoped and audited.
> Canonical state: [`CURRENT-STATE.md`](CURRENT-STATE.md).

## 0. Topology

```text
Browser
  → https://sanad-edtech.vercel.app        (Next.js 15, Vercel)
      /api/* ─────────────────────────────→ https://<quick-tunnel>.trycloudflare.com
                                              (NestJS 10, laptop :3002)
                                              → PostgreSQL (local Docker, app_user + RLS)
                                              → Redis (local Docker; exam-expiry worker + opt-in outbox sweep + shared rate-limit counters)
```

- Web project: `sanad-edtech`
- Web production branch: `main`
- API runtime: `scripts/demo/start.ps1` (compiled `apps/api/dist/src/main.js`)
- API health: `/api/health`
- API docs: `/api/docs` (served by the API when running)
- Railway: retired; the old endpoint is **404**, and its runtime was never migrated to `app_user`.

## 1. Before deploying

1. Confirm `main` is the intended commit:

   ```powershell
   git fetch origin
   git status -sb
   git log -1 --oneline origin/main
   ```

2. Confirm the local gates:

   ```powershell
   pnpm --filter web test
   pnpm --filter api exec jest --config jest.config.js --runInBand
   pnpm build
   ```

   Current expected evidence on `main`: **159/159 web**, **412/412 API** (45 suites), **4/4 build**, RLS e2e **5/5**, outbox local-sink e2e **5/5**. Local migration chain is **9/9**. The 28 October release passed the retake, concurrent-start, teacher-queue, and lock-card smokes; the 20 November release adds the outbox sweep without changing payment behavior; the 22 November dead-letter admin API is read/requeue only and does not change delivery or payment behavior.

3. Do not commit `.env`, logs, or generated scratch files.

## 2. Railway API

### Build configuration

Railway builds from the repository root `Dockerfile`. `railway.json` selects the `DOCKERFILE` builder; `nixpacks.toml` is only a fallback.

The Docker image runs:

```text
pnpm install --frozen-lockfile --prod=false
pnpm --filter api exec prisma generate
pnpm --filter api run build
node apps/api/dist/src/main
```

The root `Dockerfile` is intentional: Railway's automatic pnpm-monorepo plan previously failed with `No start command could be found`.

### Deployment trigger

On 28 October 2026 the GitHub-linked service did **not** create a deployment for the `main` push. Deploy the API explicitly and verify the deployment status:

```powershell
railway up --service sanad-edtech --environment production -c -y
railway service status --service sanad-edtech
```

The release deployment was `16a33f07-f1dd-404f-b110-ba4497ac7408`, status **SUCCESS**. Do not assume a GitHub push redeploys the API until the integration is fixed.

### Required environment

At minimum:

```text
DATABASE_URL=postgresql://...
MIGRATION_DATABASE_URL=postgresql://...   # migration/owner connection
JWT_SECRET=<random-secret>
JWT_EXPIRES_IN=15m
NODE_ENV=production
PORT=3002
ALLOWED_ORIGINS=https://sanad-edtech.vercel.app
VIDEO_TOKEN_SECRET=<random-secret>
VIDEO_WATERMARK_HMAC_SECRET=<random-secret>
```

Add provider/video keys only when they are actually configured:

```text
PAYMOB_API_KEY
PAYMOB_INTEGRATION_ID
PAYMOB_IFRAME_ID
PAYMOB_HMAC_SECRET
FAWRY_MERCHANT_CODE
FAWRY_SECRET_KEY
FAWRY_SECURE_HASH_KEY
BUNNY_STREAM_API_KEY
BUNNY_STREAM_LIBRARY_ID
BUNNY_STREAM_CDN_HOSTNAME
BUNNY_STREAM_SIGNING_KEY
SANAD_BASE_URL
SANAD_API_KEY
```

Optional outbox delivery (Phase 1 stays disabled unless **both** are set):

```text
OUTBOX_WEBHOOK_URL=https://receiver.example.com/sanad/outbox
OUTBOX_WEBHOOK_SECRET=<random-secret>
OUTBOX_SWEEP_INTERVAL_MS=30000
OUTBOX_BATCH_SIZE=50
OUTBOX_MAX_ATTEMPTS=10
OUTBOX_MAX_TENANTS_PER_SWEEP=50
OUTBOX_WEBHOOK_TIMEOUT_MS=10000
OUTBOX_BACKOFF_MS=30000
```

The receiver must verify `X-SANAD-Signature` as
`sha256=HMAC-SHA256(timestamp + "." + rawBody, OUTBOX_WEBHOOK_SECRET)`, reject
stale `X-SANAD-Timestamp` values, and deduplicate on `X-SANAD-Event-Id`. Do not
put the secret in a URL or log it.

> `ALLOWED_ORIGINS` must be the exact ASCII origin. Invisible Unicode marks survive `.trim()` and break exact matching. If browser login fails with 403 while curl works, delete and re-paste the value.

### Health checks

```powershell
Invoke-RestMethod http://localhost:3002/api/health
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

Both must return HTTP 200 and `database: up`. The Railway endpoint is retired
and returns `404 Application not found`; do not use it as a health target.

### Deploy

The current demo deploys the web app to Vercel on a push to `main`; the API is
the compiled local process on `:3002` exposed through the Cloudflare quick
tunnel. Start/restart it with `pnpm demo:start -- -Tunnel cloudflared -Watch
-SyncFallback`. The watchdog updates the fallback when the tunnel URL changes.
The root `Dockerfile` remains the known-good API image for a future hosted API,
but Railway is retired and does not auto-deploy this repository.

## 3. Vercel web

### Configuration

- Framework: Next.js
- Root directory: repository root (the workspace build is resolved by pnpm)
- Install command: `pnpm install`
- Build command: `pnpm --filter web build` (or the project equivalent)
- Output: Next.js default
- Production branch: `main`

### API proxy

`apps/web/next.config.mjs` rewrites `/api/:path*` to:

1. `API_PROXY_TARGET` when set;
2. `DEMO_TUNNEL_ORIGIN` when set;
3. the `FALLBACK_DEMO_TUNNEL_ORIGIN` quick tunnel on Vercel when both are unset;
4. `http://localhost:3002` locally.

This default exists because a production build without `API_PROXY_TARGET` once baked `http://localhost:3002`; Vercel refuses to proxy to a private host (`X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE`), so every `/api/*` call 404'd. The current fallback is the quick tunnel in `next.config.mjs`; `-SyncFallback` updates it when the tunnel restarts.

`apps/web/app/lib/api.ts` keeps the browser same-origin (`""`) so cookies stay first-party. Its server-side fallback still points at the retired Railway origin; the demo's data calls run in the browser, and `API_PROXY_TARGET` is the supported override for a future server-side call. Do not set `NEXT_PUBLIC_API_URL` to `http://localhost:3002` in a Vercel production environment.

### Verify

```powershell
Invoke-WebRequest https://sanad-edtech.vercel.app/login -UseBasicParsing
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

Then log in through the browser as the teacher and load `/teacher/courses`; confirm three published courses.

## 4. Database migrations

The local demo database has **9** migrations. Migration #9 was applied on 20 November 2026; the retired Railway production chain was 8/8.

```text
0_init
20261007000000_lms_rls
20261010000000_auth_cookie_sessions
20261016000000_rls_hardening
20261016000001_tenant_resolution_fn
20261017000000_webhook_raw_payload
20261017000001_student_lesson_unlocks
20261027000001_assignment_retakes
20261119000000_outbox_delivery
```

Migration #8 is additive: existing submissions are backfilled as submitted attempt #1 with `startedAt = submittedAt`, then `submittedAt` becomes nullable and the unique key becomes `(assignmentId, studentId, attemptNumber)`. It was applied after a full backup.

Migration #9 is additive: it adds `outbox_events.nextAttemptAt`, `outbox_events.deadAt`, the due-row index, and the `SECURITY DEFINER` `app_list_active_tenant_ids()` function that returns tenant IDs only. It does not change payment, enrollment, or RLS policy behavior.

The production preflight on 27 October 2026 returned **1 total submission, 1 submitted, 0 with null content, 0 empty content**. The backup was a custom-format dump plus globals, restore-tested into a local PostgreSQL 18 container: **44 tables, 3 courses, 1 submission, 7 migrations** at backup time. At that time `prisma migrate status` reported **8/8**; the local chain now reports **9/9** and “Database schema is up to date!”.

Apply with the migration/owner URL. Prisma's datasource reads `DATABASE_URL`, so set it to the owner URL for the migration command:

```powershell
cd apps/api
$env:MIGRATION_DATABASE_URL="<owner-connection-string>"
$env:DATABASE_URL=$env:MIGRATION_DATABASE_URL
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

On this Windows host, Prisma 5.22's Windows schema engine returned `P1001` even though `psql` and `prisma db execute` reached the database. The same Prisma 5.22 CLI inside a Linux Node 20 Alpine container (with OpenSSL installed) applied the migration successfully. Use a Linux environment/container for production migrations if this recurs.

For a database whose history predates the baseline, resolve the already-applied migrations first, then deploy:

```powershell
pnpm exec prisma migrate resolve --applied 0_init
# repeat for each pre-baseline migration actually present
pnpm exec prisma migrate deploy
```

Do not run `migrate reset` against production.

### Seed

```powershell
cd apps/api
$env:MIGRATION_DATABASE_URL="<owner-connection-string>"
$env:DATABASE_URL=$env:MIGRATION_DATABASE_URL
$env:PROD_TENANT_DOMAINS="sanad-edtech-production.up.railway.app"
$env:DEMO_YOUTUBE_ID="<unlisted-youtube-id>"
pnpm seed:path2
```

The seed is idempotent: tenant, teacher/student accounts, three published courses, sections/lessons, exam/assignment, enrollment, and entitlements.

## 5. RLS activation

### 5.1 Local demo — active (verified 16 November 2026)

`apps/api/src/modules/tenants/prisma.service.ts` now reads the runtime URL from `DATABASE_URL` only. There is no silent fallback to `MIGRATION_DATABASE_URL`:

```ts
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required for the API runtime");
}
```

- The runtime uses `app_user` (non-owner, no `SUPERUSER`, no `BYPASSRLS`).
- `scripts/demo/start.ps1` checks that `app_user` can connect before starting the API and passes the owner URL only to migrations/seeds.
- The API logs the connected role at startup: `DB runtime role: app_user (superuser=off)`; it warns if the role is a superuser.
- `.env.local` contains the `app_user` `DATABASE_URL`; `MIGRATION_DATABASE_URL` remains the owner URL for `pnpm demo:reset`, `pnpm demo:seed`, and `pnpm demo:paid`.
- `WebhookInboxService` captures the request tenant ID and re-enters `runWithTenantId()` around asynchronous `setImmediate()` processing and retries, so webhook work does not lose the RLS tenant context.

Local verification (16 November 2026):

| Check | Result |
| --- | --- |
| Startup role | `DB runtime role: app_user (superuser=off)` |
| RLS isolation e2e | **5/5** (scoped SELECT; cross-tenant UPDATE/DELETE = 0 rows; cross-tenant INSERT rejected; empty context = 0 rows) |
| Voucher checkout | order + `SANAD-2026` intent `success: true`; one ACTIVE paid enrollment |
| Signed Paymob webhook | async event **PROCESSED** with tenant ID; order **CONFIRMED**, intent **SUCCEEDED**, payment **PAID**, ledger + enrollment created |
| Live smoke | **8/8** through `https://sanad-edtech.vercel.app` (22 November 2026) |
| Demo doctor | **10/10** (22 November 2026) |

To reproduce locally:

```powershell
pnpm demo:start -- -Tunnel cloudflared -Watch
pnpm demo:doctor
pnpm --filter api exec jest --config ./test/jest-e2e.json --runInBand rls-isolation
```

`pnpm demo:reset -Force` is the destructive reset: backup → `prisma migrate deploy` → remove known RLS test tenants → truncate demo tables → seed free + paid demo → verify. It preserves `tenants`, `tenant_domains`, and `_prisma_migrations`.

### 5.2 Hosted activation — pending

The Railway API endpoint is retired (`404 Application not found`), so the hosted runtime was not migrated and **RLS must not be claimed as active there**. If the API is redeployed to a host, activate it in this order:

1. **Rotate the database password by hand** in the provider dashboard.
2. Confirm `app_user` exists and is not a superuser / does not have `BYPASSRLS`:

   ```sql
   SELECT rolname, rolsuper, rolbypassrls
   FROM pg_roles
   WHERE rolname = 'app_user';
   ```

3. Confirm grants for `app_user` on the application tables.
4. Apply all migrations as the owner.
5. Set the runtime environment:

   ```text
   DATABASE_URL=postgresql://app_user:<password>@<host>:<port>/<db>?schema=public
   # Do NOT set MIGRATION_DATABASE_URL in the runtime service.
   ```

6. Deploy the current code, which reads `DATABASE_URL` only.
7. Re-run the isolation proof with `RLS_ADMIN_URL` and `RLS_APP_URL`:

   ```powershell
   cd apps/api
   pnpm exec jest --config ./test/jest-e2e.json --runInBand rls-isolation
   ```

   Expected: **5/5**.

8. Verify a normal login, course list, voucher checkout, and student lesson after the switch.

### Rollback

If the app cannot connect as `app_user`:

- restore the previous service variables;
- keep `MIGRATION_DATABASE_URL` available to operators but not the runtime;
- redeploy the previous image;
- do not disable RLS policies or drop the app role.

RLS being inactive on a host is a known gap, not a reason to claim hosted isolation is complete.

### Outbox delivery (optional, Phase 1)

The `outbox-dispatch` sweep is idle unless both variables are set. With no
receiver configured, events remain unpublished; that is the safe default for
the demo.

```powershell
$env:OUTBOX_WEBHOOK_URL="https://receiver.example.com/sanad/outbox"
$env:OUTBOX_WEBHOOK_SECRET="<random-secret>"
# restart the API so the transport reads the environment
```

The receiver must verify `X-SANAD-Signature` over
`X-SANAD-Timestamp + "." + rawBody`, reject stale timestamps, and deduplicate
on `X-SANAD-Event-Id`. A 2xx marks `publishedAt`; 408/429/5xx/network failures
retry with backoff; other 4xx (or max attempts) set `deadAt`. The local proof
does not need a real external endpoint:

```powershell
cd apps/api
$env:OUTBOX_E2E="1"
$env:RLS_ADMIN_URL="postgresql://postgres:postgres@127.0.0.1:5432/learning_platform?schema=public"
$env:RLS_APP_URL="postgresql://app_user:app_user_password@127.0.0.1:5432/learning_platform?schema=public"
pnpm exec jest --config test/jest-e2e.json --runInBand outbox-delivery
```

Expected: **5/5**. To disable delivery again, remove both variables and restart
the API. Do not claim external delivery until a real receiver has recorded the
signed request and the resulting `publishedAt`.

ADMIN-only dead-letter operations (the response omits payloads):

```text
GET  /api/v1/admin/outbox/dead-letters?limit=50
POST /api/v1/admin/outbox/dead-letters/:eventId/retry   -> 202
```

A retry clears `deadAt`/`lastError`, resets `retryCount` to `0`, sets
`nextAttemptAt` to now, and writes `OUTBOX_DEAD_LETTER_RETRIED` to `audit_logs`.
It only makes the row eligible for the next sweep; if delivery is disabled, the
row remains pending. A teacher token gets **403** and an anonymous caller **401**.

## 6. Demo verification checklist

| Check | Expected |
| --- | --- |
| Web `/login` | 200, page renders |
| Web `/api/health` | 200, `database: up` |
| Local API `/api/health` | 200, `database: up` |
| Local API startup log | `DB runtime role: app_user (superuser=off)` |
| Teacher login (`01000000001`) | 200, role `TEACHER` |
| `/api/tenants/current` | `sanad-demo` |
| `/api/v1/teacher/courses` | 3 published courses |
| Student login (`01000000002`) | 200 |
| `/student/courses` | enrolled courses |
| Course curriculum | tasks and progress render from API |
| Lesson | video/exam/assignment state renders |
| Theme toggle | light/dark persists after reload |
| Assignment retake | concurrent start **201 + 409**; third start **400** at `maxAttempts=2` |
| Teacher grading queue | excludes `IN_PROGRESS`; shows both submitted attempts |
| Locked assignment | **403 `LESSON_LOCKED`**; lock card in dark and light with no overflow |
| Outbox (disabled default) | API boots, scheduler logs the sweep, dispatcher logs idle when URL/secret are absent; no outbox rows are consumed |
| Outbox local sink | `OUTBOX_E2E=1` + `RLS_ADMIN_URL` + `RLS_APP_URL` → **5/5** |
| Demo doctor | `pnpm demo:doctor` → **10/10** |
| Logout → refresh | **401**, `/student` redirected to login |

## 7. Known deployment gaps

- Hosted RLS activation: local runtime is active, but the Railway endpoint is retired and was never migrated (section 5).
- Outbox delivery is Phase 1 and local-only: the sweep, HMAC transport, retry, and dead-letter state exist and passed a local sink **5/5**, but no external receiver is configured. Dead letters can be listed and requeued through the ADMIN-only API; there is no dead-letter UI or alert. See [`OUTBOX-DELIVERY.md`](OUTBOX-DELIVERY.md).
- Real Bunny webhook round trip (route exists and is unit-tested; no Bunny library/key is configured in the demo).
- Bull runs `exam-expiry` and the opt-in `outbox-dispatch` sweep; there is no reconciliation worker. Redis must be running for the delayed expiry and the sweep; if it is unavailable, exam start still succeeds and the client timer remains the fallback.
- Rate-limit counters are Redis-shared. A Redis outage falls back to per-instance memory, and forwarded client IPs remain a best-effort key outside a trusted proxy edge.
- Railway auto-deploy: the service is retired; the 28 October deploy was manual with `railway up`.
- Real provider sandbox transaction not yet recorded.
- SETH-9 advanced controls are roadmap-only; see [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md).
- CI workflow is present but not the release evidence; use the local commands above.

## 8. Costs and operations

- Vercel Hobby is sufficient for the demo; preview URLs may be protected by Vercel Authentication.
- The API/Postgres/Redis demo runs in local Docker; Railway is retired for this demo.
- A custom domain is optional. If added, update `ALLOWED_ORIGINS`, `tenant_domains`, and the Vercel domain configuration together.
- Never paste database passwords or provider keys into chat, source, logs, or issue trackers.
