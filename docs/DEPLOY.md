# Go-Live Runbook — Sanad on Railway + Vercel (100% free tier)

Triangle: **Web on Vercel → API on Railway → Postgres on Railway.**
Order matters: database first, then API, then web. Nothing here needs new code.

## 0) Prereqs (on your machine)

- Railway project with a **running** Postgres service (dashboard shows Active, not Paused).
- This repo pushed to GitHub (branch with `railway.json` at root).

## 1) Database: migrate + seed (one time, from your machine)

```powershell
cd apps/api
$env:DATABASE_URL="<paste Railway Postgres connection string>"
$env:MIGRATION_DATABASE_URL=$env:DATABASE_URL
npx prisma migrate deploy
$env:PROD_TENANT_DOMAINS="<web-domain>,<api-domain>"   # filled in steps 2–3, re-run seed after
$env:DEMO_YOUTUBE_ID="dQw4w9WgXcQ"
pnpm seed:path2
```

Why `PROD_TENANT_DOMAINS`: tenant resolution is Host-based and the seed
only registers `localhost`. Without the cloud domains every request
answers `404 Tenant not found`. Re-running seed is idempotent — safe to
repeat after the domains are known.

## 2) API service on Railway

1. Railway → **+ New → GitHub Repo** → select `sanad-edtech` (same project
   as Postgres is fine).
2. Service Settings → **Root Directory**: repo root (default). `railway.json`
   at root is auto-detected: build = `pnpm install --frozen-lockfile` +
   `pnpm --filter api run build`, start = `node apps/api/dist/main`,
   healthcheck = `/api/health`.
3. **Variables** tab — set exactly these (no more, no less to start):

| Variable                      | Value                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`                | Reference: `${{Postgres.DATABASE_URL}}` (use the real service name)       |
| `NODE_ENV`                    | `production`                                                              |
| `JWT_SECRET`                  | generated (see below — never reuse demo value)                            |
| `VIDEO_TOKEN_SECRET`          | generated                                                                 |
| `VIDEO_WATERMARK_HMAC_SECRET` | generated                                                                 |
| `STORAGE_SIGNING_SECRET`      | generated                                                                 |
| `ALLOWED_ORIGINS`             | `https://<your-vercel-domain>` (step 3; update after)                     |
| `REDIS_URL`                   | Railway Redis reference (add Redis addon if boot fails on BullMQ connect) |

Generate each secret **on your own machine, never send them to anyone**:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `main.ts:validateSecrets()` **refuses to boot** in production on default
> secrets — this is intentional. Real values are mandatory, not optional.

4. Deploy → wait for `/api/health` to answer `200` at
   `https://<api-domain>/api/health`. **Write down `<api-domain>`.**

## 3) Web on Vercel

1. Vercel → Add New Project → Import `sanad-edtech`.
2. **Root Directory**: `apps/web` (Framework preset: Next.js).
3. **Environment Variables**: `NEXT_PUBLIC_API_URL` = `https://<api-domain>`
   from step 2. No other vars needed.
4. Deploy → open `https://<web-domain>`. **Write down `<web-domain>`.**
5. Back in Railway API service: set `ALLOWED_ORIGINS` to the web domain
   (redeploy happens automatically) — otherwise browsers block every call.

## 4) Live smoke test (5 minutes, proves the loop)

1. Open `/signup` → register a student → land on `/student`.
2. `/courses/<slug>` → enroll → open course → enter exam → answer → submit.
3. Login as teacher (seeded `01000000001`) → grading queue → grade.
4. Student result screen shows score. Done = the platform is live.

## Troubleshooting (symptom → cause → fix)

| Symptom                                     | Cause                                     | Fix                                                                                   |
| ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `P1001` anywhere                            | Postgres paused/unreachable               | Railway → Resume Postgres; re-run migrate                                             |
| `404 Tenant not found` (API JSON)           | cloud Host not in `tenant_domains`        | re-run seed with `PROD_TENANT_DOMAINS` set                                            |
| Browser CORS errors, API fine via curl      | web domain missing from `ALLOWED_ORIGINS` | set it on API service, redeploy                                                       |
| API crashes on boot, "SECURITY ERROR" log   | default secrets + `NODE_ENV=production`   | set real generated secrets                                                            |
| Railway build fails on `tsup`/design-system | root `pnpm build` pulls broken packages   | our `railway.json` builds **api only** (`--filter api`) — do not switch to root build |
| Login `401 Invalid credentials` on live     | seed never ran on Railway DB              | run `pnpm seed:path2` against Railway URL                                             |

## What NOT to send in chat, ever

Secrets, passwords, connection strings, private keys. Generate locally,
paste directly into Railway/Vercel dashboards. If a secret leaks in chat
or git, rotate it immediately (new value → update dashboards → redeploy).
