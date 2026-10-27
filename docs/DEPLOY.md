# Deployment Runbook — Vercel + Railway

> **Current production:** web on Vercel, API and PostgreSQL on Railway.
> **Verified 25 October 2026:** production branch `main`, verified app commit `4951e49` (later docs-only commits do not change runtime code), `/api/health` **200** with database **up**. Pending retakes branch was verified locally on 27 October 2026 and is **not deployed**.
> Canonical state: [`CURRENT-STATE.md`](CURRENT-STATE.md).

## 0. Topology

```text
Browser
  → https://sanad-edtech.vercel.app        (Next.js 15, Vercel)
      /api/* ─────────────────────────────→ https://sanad-edtech-production.up.railway.app
                                              (NestJS 10, Railway)
                                              → PostgreSQL (Railway)
                                              → Redis (Railway; no processors yet)
```

- Web project: `sanad-edtech`
- Web production branch: `main`
- API service: `sanad-edtech-production`
- API health: `/api/health`
- API docs: `/api/docs` (served by the API when running)

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

   Current expected evidence on `main`: **137/137 web**, **311/311 API**, **4/4 build**. The pending `feat/security-quick-wins` branch is **344/344 API**; the `feat/assignment-retakes` branch (with hardening merged) is **353/353 API**, **145/145 web**, **4/4 build**, plus the local retake, concurrent-start, lock-card, and migration-preflight checks.

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

> `ALLOWED_ORIGINS` must be the exact ASCII origin. Invisible Unicode marks survive `.trim()` and break exact matching. If browser login fails with 403 while curl works, delete and re-paste the value.

### Health checks

```powershell
Invoke-RestMethod https://sanad-edtech-production.up.railway.app/api/health
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

Both must return HTTP 200 and `database: up`.

### Deploy

Push to `main`. Railway builds the root Dockerfile. There is no separate `railway up` step required for the normal flow.

If a build fails, inspect the Railway build log before changing configuration. Do not switch builders blindly; the Dockerfile path is the known-good path.

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
2. `https://sanad-edtech-production.up.railway.app` on Vercel when unset;
3. `http://localhost:3002` locally.

This default exists because a production build without `API_PROXY_TARGET` once baked `http://localhost:3002`; Vercel refuses to proxy to a private host (`X-Vercel-Error: DNS_HOSTNAME_RESOLVED_PRIVATE`), so every `/api/*` call 404'd.

`apps/web/app/lib/api.ts` has the same fail-safe split:

- browser: same-origin (`""`), so cookies stay first-party;
- server: production API origin on Vercel, `localhost:3002` elsewhere.

Do not set `NEXT_PUBLIC_API_URL` to `http://localhost:3002` in a Vercel production environment.

### Verify

```powershell
Invoke-WebRequest https://sanad-edtech.vercel.app/login -UseBasicParsing
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

Then log in through the browser as the teacher and load `/teacher/courses`; confirm three published courses.

## 4. Database migrations

Production has **7** migrations. The stacked retakes branch adds an eighth:

```text
0_init
20261007000000_lms_rls
20261010000000_auth_cookie_sessions
20261016000000_rls_hardening
20261016000001_tenant_resolution_fn
20261017000000_webhook_raw_payload
20261017000001_student_lesson_unlocks
20261027000001_assignment_retakes   # retakes branch only
```

Migration #8 is additive: existing submissions are backfilled as submitted attempt #1 with `startedAt = submittedAt`, then `submittedAt` becomes nullable and the unique key becomes `(assignmentId, studentId, attemptNumber)`. Apply it only after the branch is approved, and take a database backup first.

Run the read-only preflight before the migration:

```sql
SELECT COUNT(*) FROM assignment_submissions
WHERE status = 'SUBMITTED' AND content IS NULL;
```

The production preflight on 27 October 2026 returned **1 total submission, 1 submitted, 0 with null content, 0 empty content**. No migration was applied by that check; a Railway backup is still required.

Apply with the migration/owner URL. Prisma's datasource reads `DATABASE_URL`, so set it to the owner URL for the migration command:

```powershell
cd apps/api
$env:MIGRATION_DATABASE_URL="<owner-connection-string>"
$env:DATABASE_URL=$env:MIGRATION_DATABASE_URL
pnpm exec prisma migrate deploy
pnpm exec prisma migrate status
```

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

## 5. RLS activation — still pending

The policies are installed, but production is **not** yet enforcing them because the API connects with the migration/owner URL.

`apps/api/src/modules/tenants/prisma.service.ts` currently does:

```ts
const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
```

Activation requires all of the following, in order:

1. **Rotate the Railway database password by hand** in the dashboard.
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

6. Change the runtime preference in `prisma.service.ts` to:

   ```ts
   const url = process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL;
   ```

   (The migration command still uses `MIGRATION_DATABASE_URL` explicitly.)

7. Redeploy and re-run the isolation proof with `RLS_ADMIN_URL` and `RLS_APP_URL`:

   ```powershell
   cd apps/api
   pnpm exec jest --config ./test/jest-e2e.json --runInBand rls-isolation
   ```

   Expected: **5/5** (scoped SELECT; cross-tenant UPDATE/DELETE = 0 rows; cross-tenant INSERT rejected; empty context = 0 rows).

8. Verify a normal login, course list, and student lesson after the switch.

### Rollback

If the app cannot connect as `app_user`:

- restore the previous Railway service variables;
- keep `MIGRATION_DATABASE_URL` available to operators but not the runtime;
- redeploy the previous image;
- do not disable RLS policies or drop the app role.

RLS being inactive is a known P1 gap, not a reason to claim isolation is complete.

## 6. Production verification checklist

| Check | Expected |
| --- | --- |
| Web `/login` | 200, page renders |
| Web `/api/health` | 200, `database: up` |
| Direct API `/api/health` | 200, `database: up` |
| Teacher login (`01000000001`) | 200, role `TEACHER` |
| `/api/tenants/current` | `sanad-demo` |
| `/api/v1/teacher/courses` | 3 published courses |
| Student login (`01000000002`) | 200 |
| `/student/courses` | enrolled courses |
| Course curriculum | tasks and progress render from API |
| Lesson | video/exam/assignment state renders |
| Theme toggle | light/dark persists after reload |
| Logout → refresh | **401**, `/student` redirected to login |

## 7. Known deployment gaps

- RLS runtime activation (section 5).
- Outbox dispatcher (events are written, not delivered).
- No video webhook route.
- No Bull processors.
- Real provider sandbox transaction not yet recorded.
- CI workflow is present but not the release evidence; use the local commands above.

## 8. Costs and operations

- Vercel Hobby is sufficient for the demo; preview URLs may be protected by Vercel Authentication.
- Railway Hobby is required for the API/Postgres/Redis services after the trial credit.
- A custom domain is optional. If added, update `ALLOWED_ORIGINS`, `tenant_domains`, and the Vercel domain configuration together.
- Never paste database passwords or provider keys into chat, source, logs, or issue trackers.
