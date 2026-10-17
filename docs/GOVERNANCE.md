# Repository Governance — Ports, Branches, Commit Gates

> Applies to every human and every agent working in this repo.
> Source of truth alongside `AGENTS.md` and `docs/HANDOFF.md`.

---

## 1. Canonical ports (locked)

| Module        | Port                 | Enforced by                                           |
| ------------- | -------------------- | ----------------------------------------------------- |
| Web (Next.js) | **3001**             | `apps/web/package.json` → `next dev -p 3001`          |
| API (NestJS)  | **3002**             | `apps/api/src/main.ts` → `process.env.PORT \|\| 3002` |
| Database      | Railway public proxy | `apps/api/.env` (git-ignored, never printed)          |

A module that defaults to any other port is a bug, because it lets a second
process quietly squat on the wrong port and produce "phantom" 404s — the exact
failure `HANDOFF §7.1` documents.

```powershell
# List stray listeners on any dev port
pnpm ports

# Kill strays on 3000/3001. Port 3002 is deliberately SKIPPED: a script that
# kills the API it was just invoked alongside would be unusable.
pnpm ports:kill
```

> Note on the kill rule: the governance text says to kill anything occupying
> `:3001`. `scripts/ports.ps1` implements that, and additionally spares `:3002`
> so the command can never take down the API it runs next to. This is a
> deliberate, documented divergence, not an omission.

---

## 2. No direct push to `master`

`master` is protected. All work lands through a short-lived feature branch and
a reviewed Pull Request.

```powershell
git switch -c feat/<scope>        # e.g. feat/ai-module, fix/refresh-rotation
# ... work, commit ...
git push -u origin feat/<scope>   # then open a PR
```

CI (`typecheck`, `lint`, `test-unit`, `build`, `e2e refs`) must be green before
merge. Agents create branches the same way — never commit straight to `master`.

---

## 3. Pre-commit gate

`.husky/pre-commit` runs three checks and **refuses the commit** if any fails:

1. `lint-staged` — eslint on staged API sources
2. `tsc --noEmit` — a **full-project** typecheck (not just staged files), which
   is what actually catches a duplicate property
3. `nest build` — validates decorators and the DI graph, which `tsc` does not

### Why it is scoped instead of running `pnpm build`

A root `pnpm build` runs Turborepo across every workspace, including
`packages/design-system` — whose `tsup` build has **24 pre-existing errors**
that predate this work and are explicitly out of scope
(`docs/HANDOFF.md §5`: _"packages/design-system ... لا تلمسه"_).

Running the root build here would make the hook fail on **every commit,
forever** — which is how a security gate gets switched off within a week.

`husky init` writes `npm test` by default; that is wrong twice over here: it
violates the pnpm-only rule, and it fans out to the web suite, which carries 8
pre-existing failures from the `3001 → 3002` port drift in
`apps/web/app/lib/api.ts` (`api.test.ts` still asserts `:3001`).

**Verified:** a deliberately duplicated interface property is rejected with
`error TS2300: Duplicate identifier` and exit code 2; removing it returns the
typecheck to exit code 0.

---

## 4. Ignored files and cleanup

`.gitignore` blocks the log/scratch patterns this repo has historically
produced (`*.txt`, `*-out.txt`, `build*.txt`, `*.bak`, `*.tsbuildinfo`) plus
ad-hoc probe scripts. Anything whose only purpose is to prove a run happened
belongs there, not in a commit — some of those files have held live secrets.

### ⚠️ `git clean -fdX` is destructive here — read before running it

`-X` removes **every git-ignored file**, not just junk. On this repo that
means it would delete:

- `apps/api/.env` — the live Railway database credentials
- `node_modules/` — every workspace, requiring a full reinstall
- `dist/`, `.next/`, `.turbo/` — all build caches

`.env` being git-ignored is precisely why it is _not protected_. Please use a
targeted cleanup of the specific junk patterns instead, after confirming
`.env` is untracked:

```powershell
git check-ignore -v apps/api/.env    # must list .gitignore — proof it is untracked
git status --short                   # review what is actually there first
```

Then delete by explicit pattern, never with `-X`.
