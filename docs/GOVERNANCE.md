# Repository Governance — Ports, Branches, Commit Gates

> Applies to every human and agent working in this repo.
> Current state: [`CURRENT-STATE.md`](CURRENT-STATE.md). Agent rules: [`AGENTS.md`](../AGENTS.md).

## 1. Canonical ports

| Module | Port | Enforced by |
| --- | --- | --- |
| Web (Next.js) | **3001** | `apps/web/package.json` → `next dev -p 3001` |
| API (NestJS) | **3002** | `apps/api/src/main.ts` → `process.env.PORT \|\| 3002` |
| Database | Railway public proxy | `apps/api/.env` (git-ignored; never printed) |
| Redis | `6379` | `docker-compose.yml` |

A workspace that defaults to any other port is a bug. It lets a second process squat on the wrong port and produce “phantom” 404s.

```powershell
# List listeners on 3000/3001/3002
pnpm ports

# Kill strays on 3000/3001; port 3002 is deliberately skipped
pnpm ports:kill
```

`scripts/ports.ps1` spares `:3002` so the command cannot take down the API it was invoked beside. That is intentional.

## 2. Branches and production

- **Production branch:** `main`. Vercel and Railway deploy from it.
- **Legacy branch:** `master`. `.husky/pre-push` blocks direct pushes to `master` and points at a feature branch.
- Do not create new work on `master`.
- There is no local proof of GitHub branch protection. Confirm the actual rules in the GitHub repository settings before claiming required reviews or protected branches.

Recommended flow:

```powershell
git switch -c feat/<scope>
# ... work, verify, commit ...
git push -u origin feat/<scope>
# open a PR, then merge to main
```

Direct pushes to `main` have been used for this project's recent releases. If branch protection is enabled later, update this section and the release runbook.

## 3. Pre-commit gate

`.husky/pre-commit` runs three checks and refuses the commit if any fails:

1. `lint-staged` — ESLint on staged API sources.
2. `tsc --noEmit` — full API typecheck, not just staged files.
3. `nest build` — validates decorators and the Nest DI graph.

The gate is intentionally scoped to the API. It does **not** run the web suite or the root Turborepo build, so those remain required manual checks before a release:

```powershell
pnpm --filter web test
pnpm --filter api exec jest --config jest.config.js --runInBand
pnpm build
```

Current expected results on `main`: **137/137 web**, **311/311 API**, **4/4 build**. On the pending `feat/security-quick-wins` branch, the API count is **324/324** (33 suites). On the stacked `feat/assignment-retakes` branch, the expected results are **138/138 web**, **331/331 API**, and **4/4 build**, with migration #8 verified as **8/8** on a fresh local PostgreSQL.

Older versions of this document claimed the design-system build had 24 pre-existing errors and the web suite had 8 port-drift failures. Those conditions are no longer true at `4951e49`; do not use them to justify skipping gates.

## 4. Commit content

- Commit source, tests, migrations, and documentation.
- Never commit `.env`, credentials, tokens, database URLs, or provider keys.
- Never commit generated proof logs, scratch `.txt` files, or screenshot dumps. The root `.gitignore` blocks common log/scratch patterns; `git status` is still the final check.
- A schema change needs a migration, RLS policies/grants, and a tenant-scoped query review. The retakes migration is additive but includes a backfill; verify it on a fresh and a legacy-shaped database before applying it to production.
- A webhook change needs signature verification, raw-body handling, replay handling, and a test.

## 5. Ignored files and cleanup

`git clean -fdX` is destructive here. `-X` removes **every** ignored file, including:

- `apps/api/.env` (live database credentials);
- `node_modules/`;
- `dist/`, `.next/`, `.turbo/`.

Do not run it. Use a targeted cleanup after checking what is ignored:

```powershell
git check-ignore -v apps/api/.env
git status --short
```

Then delete only the specific scratch files you intend to remove.

## 6. Release evidence

A release note must include:

- commit and branch;
- web/API test counts;
- build result;
- live health check;
- any migration change;
- any known gap that changed.

Do not cite CI as green, a provider as live, or RLS as enforcing unless the corresponding run actually happened. The current evidence is in [`STATUS.md`](STATUS.md).
