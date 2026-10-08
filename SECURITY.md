# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| `master` (latest) | ✅ Full support — report here |
| Older commits / forks | ⚠️ Upgrade to latest first, then report |

This project is pre-1.0 and moves fast. If you run an older commit, verify the issue exists on latest `master` before reporting.

## Reporting a Vulnerability — PRIVATE ONLY

**Do NOT open a public issue, discussion, or pull request for security problems.** No PoC on public channels before a fix exists.

- **How:** Use GitHub **Private vulnerability reporting** (Repo → Security tab → Report a vulnerability). If unavailable, contact the maintainer via [LinkedIn](https://www.linkedin.com/in/omar-ahmed-7b97613b1/) requesting a secure channel (PGP on request).
- **Scope:** Our code and staging deployments. Test with **your own accounts and test tenants only** — never access other tenants' data (that itself is the vulnerability class we take most seriously; see `CROSS_TENANT_ATTEMPT` handling in `docs/SECURITY.md`).
- **Include:** Affected route/commit, reproduction steps, impact (rows/EGP/users), logs with `requestId` if you have it. Redact secrets/PII from your report.

## What Happens Next (SLA)

| Severity | Examples | Response |
|----------|----------|----------|
| **Critical** | Cross-tenant data leak, forged payment accepted, RLS bypass | Acknowledge 48h · fix ≤ 15 days |
| **High** | Auth bypass, answer leak, session hijack path | Acknowledge 48h · fix ≤ 30 days |
| **Medium/Low** | Missing rate limit, verbose error, hardening | Triage 5 days · fix ≤ 90 days |

You will get: acknowledgment (48h), triage decision, fix timeline, and credit if you want it (name/handle/anonymous).

## Scope Notes (Read Before Testing)

- **In scope:** `apps/api` authorization/tenancy/payments/video/LMS logic, RLS policies, webhook verification, exam integrity.
- **Out of scope:** Spam, social engineering of staff/students, physical attacks, third-party provider outages (report to the provider).
- **Safe harbor:** Good-faith research inside the scope above, respecting test-tenant boundaries, will not result in legal action. Minors' data gets extra care — stop and report immediately if you encounter real student PII.

## Full Specification

The complete security architecture (threat model, 22-action PolicyEngine, RLS design, payment/video hardening, 6 incident runbooks, 4000+ lines, every control cited to code) lives in [`docs/SECURITY.md`](docs/SECURITY.md).
