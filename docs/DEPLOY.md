# Go-Live Runbook — Sanad on Railway + Vercel

Triangle: **Web on Vercel → API on Railway → Postgres on Railway.**
Order matters: database first, then API, then web. Nothing here needs new code.

**Costs (Oct 2026):** Vercel Hobby = free (personal / non-commercial — fine for
the prize demo). Railway's old free tier is gone: one-time $5 trial credit, then
Hobby ≈ $5/month + usage (Postgres, Redis and the API share it). A custom domain
is ~$10–15/year — optional to boot, but see §4 (cookies).

**Deployable branch:** the current work lives on `feat/go-live-deploy`. Direct
pushes to `master` are blocked by the pre-push hook — either point both
dashboards at `feat/go-live-deploy` (Vercel → Settings → Git → Production
Branch; Railway service → Settings → Source), or merge it into `master` through
a GitHub Pull Request.

## 0) Prereqs (on your machine)

- Railway project with a **running** Postgres service (dashboard shows Active, not Paused). Reuse the existing project if you already have one.
- This repo pushed to GitHub (branch with `railway.json` at root — `feat/go-live-deploy`).
- **Password hygiene first:** if this database's password ever transited a chat, ticket or log — rotate it **before** anything else (Postgres service → Settings → rotate credentials), then use the new string everywhere below. Rotating later means redoing §2.

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
repeat after the domains are known. Include **both** the web domain and
the API domain — the browser calls the API directly, so the API's own
`Host` header is what gets resolved.

Expect **7/7 migrations** from `prisma migrate deploy` (baseline + 6). The
`rls_hardening` migration creates `app_user` with LOGIN but **no password** —
set one in §2.5 before the runtime switches to it.

## 2) API service on Railway

1. Railway → **+ New → GitHub Repo** → select `sanad-edtech` (same project
   as Postgres is fine).
2. Service Settings → **Root Directory**: repo root (default). `railway.json`
   at root is auto-detected: the build installs with `--prod=false`, runs
   `prisma generate`, then `nest build`. Start = `node apps/api/dist/src/main`,
   healthcheck = `/api/health`.

   > Why `--prod=false`: with `NODE_ENV=production` set below, pnpm 9 skips
   > devDependencies — and the build needs `@nestjs/cli`, `typescript` and
   > `prisma`. Generation lives in the Railway build command, not in the api
   > `build` script: on Windows the running dev API locks Prisma's query
   > engine and `prisma generate` would fail with EPERM on every commit.

3. **Variables** tab — set exactly these (no more, no less to start):

| Variable                      | Value                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Reference: `${{Postgres.DATABASE_URL}}` to boot, then switch to the `app_user` string in §2.5 |
| `NODE_ENV`                    | `production`                                                                                  |
| `JWT_SECRET`                  | generated (see below — never reuse demo value)                                                |
| `VIDEO_TOKEN_SECRET`          | generated                                                                                     |
| `VIDEO_WATERMARK_HMAC_SECRET` | generated                                                                                     |
| `STORAGE_SIGNING_SECRET`      | generated                                                                                     |
| `ALLOWED_ORIGINS`             | `https://<your-vercel-domain>` (step 3; update after)                                         |
| `REDIS_URL`                   | Railway Redis reference (add Redis addon if boot fails on BullMQ connect)                     |

> **Do NOT set `MIGRATION_DATABASE_URL` on Railway.** `prisma.service.ts`
> prefers it when present — which would keep the runtime on the superuser and
> silently bypass FORCE RLS. It belongs on your machine, for migrations only.

Generate each secret **on your own machine, never send them to anyone**:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `main.ts:validateSecrets()` **refuses to boot** in production on default
> secrets — this is intentional. Real values are mandatory, not optional.

4. Deploy → wait for `/api/health` to answer `200` at
   `https://<api-domain>/api/health`. **Write down `<api-domain>`.**

### 2.5) Activate RLS — run the API as `app_user`, not the superuser

FORCE RLS never applies to superusers, so the runtime must connect as
`app_user` (non-superuser, NOBYPASSRLS — created by the `rls_hardening`
migration, but without a password).

1. Generate a password locally (same `node -e` command as above).
2. Railway → Postgres service → **Data** tab → run once, as the admin:
   `ALTER ROLE app_user WITH PASSWORD '<generated>';`
3. On the API service, replace `DATABASE_URL` with:
   `postgresql://app_user:<generated>@<same-host>:<same-port>/<same-db>`
   (copy host/port/db from the Postgres service's own `DATABASE_URL`; when the
   API and Postgres live in the same Railway project, prefer the private host —
   e.g. `postgres.railway.internal`).
4. Redeploy. Logs must show `✅ Database connected`. From now on a
   cross-tenant query returns 0 rows even if a route forgets a `tenantId`
   filter — that is RLS, live.

## 3) Web on Vercel

1. Vercel → Add New Project → Import `sanad-edtech`. (Production Branch: set
   it to `feat/go-live-deploy` while `master` lags behind — Settings → Git.)
2. **Root Directory**: `apps/web` (Framework preset: Next.js).
3. **Environment Variables** — the browser only calls the web's own origin;
   Next.js proxies `/api/*` to the API (`apps/web/next.config.mjs`):

   | Variable              | Value                                         |
   | --------------------- | --------------------------------------------- |
   | `NEXT_PUBLIC_API_URL` | `https://<web-domain>` — the web's own domain |
   | `API_PROXY_TARGET`    | `https://<api-domain>` from step 2            |

   Same-origin proxy = first-party cookies + no CORS. (The project's
   `*.vercel.app` domain shows up under Settings → Domains right after
   import.)

4. Deploy → open `https://<web-domain>`. **Write down `<web-domain>`.**
5. Back in Railway API service: set `ALLOWED_ORIGINS` to `https://<web-domain>`
   (redeploy happens automatically) — the API validates the `Origin` of every
   unsafe request against it, proxied requests included.

## 4) Cookies — why the no-domain setup works

The browser only ever talks to the **web origin**: `/api/*` is proxied from
Vercel to the Railway API (`API_PROXY_TARGET` in §3), so session cookies are
first-party and the default `SameSite=Strict` policy just works — no custom
domain, no `COOKIE_SAMESITE=none`.

Only if you bypass the proxy (point `NEXT_PUBLIC_API_URL` straight at the API
domain) do cookies become cross-site — then:

1. **Same parent domain (recommended):** web on `app.example.com`, API on
   `api.example.com` — same site, default cookies just work.
   - Vercel → Project → Domains → add the web domain (Vercel prints the DNS records for your registrar).
   - Railway → API service → Settings → Domains → add `api.example.com` (CNAME to the service).
   - Re-run the seed with `PROD_TENANT_DOMAINS` including **both** new domains.
   - Set `ALLOWED_ORIGINS=https://app.example.com` on the API service.
2. **No domain yet (fallback):** set `COOKIE_SAMESITE=none` on the API service
   (requires HTTPS, which Railway/Vercel give by default). Works on most
   desktop Chrome setups, but can still break on browsers that block
   third-party cookies — fine for a short demo, not for real students.

Per-teacher vanity subdomains (`teacher1.example.com`) need Vercel Pro for
wildcards (on Hobby, add each subdomain explicitly) and a small
tenant-resolution follow-up beyond this single-tenant launch.

## 5) Live smoke test (5 minutes, proves the loop)

1. Open `/signup` → register a student → land on `/student`.
2. `/courses/<slug>` → enroll → open course → enter exam → answer → submit.
3. Login as teacher (seeded `01000000001`) → grading queue → grade.
4. Student result screen shows score. Done = the platform is live.
5. Leave the tab open 15+ minutes → navigate → session survives. That proves
   the refresh-cookie path from §4 is configured right.

## Troubleshooting (symptom → cause → fix)

| Symptom                                                | Cause                                                               | Fix                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `P1001` anywhere                                       | Postgres paused/unreachable                                         | Railway → Resume Postgres; re-run migrate                                             |
| `404 Tenant not found` (API JSON)                      | cloud Host not in `tenant_domains`                                  | re-run seed with `PROD_TENANT_DOMAINS` set                                            |
| Browser CORS errors, API fine via curl                 | web domain missing from `ALLOWED_ORIGINS`                           | set it on API service, redeploy                                                       |
| API crashes on boot, "SECURITY ERROR" log              | default secrets + `NODE_ENV=production`                             | set real generated secrets                                                            |
| Railway build fails on `tsup`/design-system            | root `pnpm build` pulls broken packages                             | our `railway.json` builds **api only** (`--filter api`) — do not switch to root build |
| Railway build: `nest: not found` / `prisma: not found` | pnpm 9 skips devDeps when `NODE_ENV=production`                     | install with `--prod=false` — see `railway.json` / §2                                 |
| Login `401 Invalid credentials` on live                | seed never ran on Railway DB                                        | run `pnpm seed:path2` against Railway URL                                             |
| Logged out every ~15 min / refresh 401                 | cookies went cross-site (proxy bypassed / `API_PROXY_TARGET` unset) | §4 — keep the web-origin proxy, or same parent domain / `COOKIE_SAMESITE=none`        |
| Cross-tenant data visible in prod                      | runtime still connects as superuser (FORCE RLS skips superusers)    | unset `MIGRATION_DATABASE_URL`, point `DATABASE_URL` at `app_user` (§2.5)             |
| `password authentication failed for user "app_user"`   | role exists with no password (migrations create it without one)     | `ALTER ROLE app_user WITH PASSWORD '...'` in the Postgres Data tab (§2.5)             |

## What NOT to send in chat, ever

Secrets, passwords, connection strings, private keys. Generate locally,
paste directly into Railway/Vercel dashboards. If a secret leaks in chat
or git, rotate it immediately (new value → update dashboards → redeploy).
