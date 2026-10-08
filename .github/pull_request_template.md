## What + Why

<!-- 2-3 sentences. Link issue: Closes #123 -->

## How verified (REQUIRED)

<!-- Never claim success without proof. Paste outputs. -->

```
pnpm build → (paste tail: Tasks X successful)
pnpm test → ( Suites: X passed )
Manual → (steps + screenshots, if UI)
```

## Security checklist (check or explain N/A)

- [ ] Guarded by `AuthorizationGuard` + `@RequirePermission` (or `@Public()` with reason)
- [ ] Fetch by `(tenantId, id)` — no bare-ID tenant lookups
- [ ] New table? → `tenantId` + RLS migration + FORCE (see `docs/SECURITY.md` §5.3)
- [ ] Webhook touched? → HMAC verified BEFORE state change (raw body, constant-time)
- [ ] Money/time/unlock decided server-side (no client trust)
- [ ] Sensitive action emits audit row (see `docs/SECURITY.md` §9.1 catalog)
- [ ] No secrets in diff (`git diff --cached -- .env*` empty; no tokens/keys/PAN)
- [ ] No PII in logs (IDs only — see `docs/SECURITY.md` §9.2)

## Risk + Rollback

<!-- What breaks if this is wrong? How to revert in one commit? -->
