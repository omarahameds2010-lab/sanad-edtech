## What + Why

<!-- 2-3 sentences. Link the issue: Closes #123 -->

## How verified (required)

Never claim success without proof. Paste the actual output tails.

```text
pnpm --filter web test          → Tests: 137 passed (137)
pnpm --filter api exec jest --config jest.config.js --runInBand
                                → Tests: 311 passed (311)
pnpm build                      → Tasks: 4 successful, 4 total
```

For UI changes, include the route, viewport widths, and theme(s) checked.

For a live change, include:

```powershell
Invoke-RestMethod https://sanad-edtech.vercel.app/api/health
```

## Security checklist

- [ ] Guarded by `AuthorizationGuard` + `@RequirePermission` (or `@Public()` with a reason)
- [ ] Fetches by `(tenantId, id)` — no bare-ID tenant lookups
- [ ] New table? `tenantId` + migration + RLS policies/grants + FORCE
- [ ] Webhook touched? Signature verified before any state change, raw body retained
- [ ] Money/time/unlock decided server-side; no client trust
- [ ] Sensitive action emits an audit/security row
- [ ] No secrets in the diff (`git diff --cached -- .env*` is empty; no tokens/keys/PAN)
- [ ] No PII in logs (IDs only)
- [ ] If RLS-related: remember runtime enforcement is still pending, so tenant filters are mandatory

## Risk + rollback

What breaks if this is wrong? How do we revert in one commit?

## Docs

- [ ] `docs/CURRENT-STATE.md` updated if runtime/test/deployment facts changed
- [ ] `AGENTS.md` updated if architecture rules changed
- [ ] No historical document silently rewritten without a dated banner
