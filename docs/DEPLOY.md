# Deployment Runbook — Vercel + Railway

> **Current production:** web on Vercel, API and PostgreSQL on Railway.
> **Verified 28 October 2026:** production branch `main`; web runtime code `cd03fb0` (Vercel auto-deploy; later docs-only commits do not change runtime code), API `5ac122d` (manual `railway up`, deployment `16a33f07-f1dd-404f-b110-ba4497ac7408`); migration #8 applied (**8/8**); `/api/health` **200** with database **up**; production retake smoke **31/31**.
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

   Current expected evidence on `main`: **147/147 web**, **357/357 API**, **4/4 build**. Production migration is **8/8**, and the 28 October release passed the retake, concurrent-start, teacher-queue, and lock-card smokes.

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

Production has **8** migrations. Migration #8 was applied on 28 October 2026:

```text
0_init
20261007000000_lms_rls
20261010000000_auth_cookie_sessions
20261016000000_rls_hardening
20261016000001_tenant_resolution_fn
20261017000000_webhook_raw_payload
20261017000001_student_lesson_unlocks
20261027000001_assignment_retakes
```

Migration #8 is additive: existing submissions are backfilled as submitted attempt #1 with `startedAt = submittedAt`, then `submittedAt` becomes nullable and the unique key becomes `(assignmentId, studentId, attemptNumber)`. It was applied after a full backup.

The production preflight on 27 October 2026 returned **1 total submission, 1 submitted, 0 with null content, 0 empty content**. The backup was a custom-format dump plus globals, restore-tested into a local PostgreSQL 18 container: **44 tables, 3 courses, 1 submission, 7 migrations** at backup time. Post-migration `prisma migrate status` reports **8/8** and “Database schema is up to date!”.

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
| Assignment retake | concurrent start **201 + 409**; third start **400** at `maxAttempts=2` |
| Teacher grading queue | excludes `IN_PROGRESS`; shows both submitted attempts |
| Locked assignment | **403 `LESSON_LOCKED`**; lock card in dark and light with no overflow |
| Railway deployment | `railway service status --service sanad-edtech` reports **SUCCESS** for the intended deployment |
| Logout → refresh | **401**, `/student` redirected to login |

## 7. Known deployment gaps

- RLS runtime activation (section 5).
- Outbox dispatcher (events are written, not delivered).
- No video webhook route.
- No Bull processors.
- Railway may not auto-deploy a `main` push; the 28 October API deploy was manual with `railway up`.
- Real provider sandbox transaction not yet recorded.
- SETH-9 advanced controls are roadmap-only; see [`SETH-9-ROADMAP.md`](SETH-9-ROADMAP.md).
- CI workflow is present but not the release evidence; use the local commands above.

## 8. Costs and operations

- Vercel Hobby is sufficient for the demo; preview URLs may be protected by Vercel Authentication.
- Railway Hobby is required for the API/Postgres/Redis services after the trial credit.
- A custom domain is optional. If added, update `ALLOWED_ORIGINS`, `tenant_domains`, and the Vercel domain configuration together.
- Never paste database passwords or provider keys into chat, source, logs, or issue trackers.
