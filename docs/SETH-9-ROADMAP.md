# SETH-9 — Phased Security Roadmap / ADR

**Status:** Accepted as direction; **not implemented and not scheduled**
**Date:** 28 October 2026
**Scope:** Platform-wide security architecture
**Related:** [`CURRENT-STATE.md`](CURRENT-STATE.md), [`STATUS.md`](STATUS.md), [`SECURITY.md`](SECURITY.md), [`ARCHITECTURE.md`](ARCHITECTURE.md)

## 1. Context

SETH-9 is the working name for a set of advanced security ideas raised for the platform:

- post-quantum (PQC) signatures and crypto agility;
- zero-knowledge (ZK) delivery or entitlement proofs;
- homomorphic or confidential grading;
- active deception (honeytokens, canary content, decoy paths);
- crypto-shredding as a deletion mechanism.

These are legitimate long-term research directions, but none of them is a substitute for the basic controls this platform still needs. The current production release has known P1 gaps: RLS is not enforcing at runtime, the transactional outbox has no dispatcher, there is no video webhook route, and rate limiting is in-memory per API instance. Adding advanced cryptography before those controls are closed would increase complexity without reducing the most likely risks.

The platform also handles minors, assessments, payments, and video content. A security control that is hard to operate, hard to explain, or easy to misconfigure can make the system less safe than a simpler control that is actually enforced.

## 2. Decision

1. **Do not implement SETH-9 features in the current release.**
2. Treat SETH-9 as a **phased roadmap**, not a release gate or a marketing claim.
3. Finish the baseline security and reliability work first.
4. Each phase requires its own threat model, design review, cost estimate, operational owner, rollback plan, legal/privacy review where relevant, and measurable exit criteria.
5. No phase is approved automatically by this document. A phase starts only after the previous phase's exit criteria are met and a separate ADR/RFC is accepted.
6. Until a control is implemented **and verified in production**, documentation must say it is absent or roadmap-only.

## 3. Threat model assumptions

The roadmap assumes:

- a shared PostgreSQL database with `tenant_id` isolation and PostgreSQL RLS as the last line of defense;
- a NestJS API and Next.js web app behind a CDN/reverse proxy;
- JWT access tokens in HttpOnly cookies plus rotating refresh tokens;
- teachers, students (including minors), and platform administrators;
- payment providers and a video provider as external trust boundaries;
- backups, logs, and support tooling that can outlive a tenant's active account.

It does **not** assume that a client device is trusted, that a CDN header is an authorization boundary, or that a provider callback is authentic without signature verification.

## 4. Phases

### Phase 0 — Baseline and evidence (now, 0–3 months)

**Goal:** close the controls that protect the current system before adding advanced cryptography.

Required work:

- activate RLS at runtime as `app_user`; rotate the database password by hand; remove the owner URL from the runtime path;
- add an outbox dispatcher with retries and observability;
- add the video-provider webhook route with signature verification;
- replace in-memory rate limiting with shared storage and verify proxy-IP handling;
- keep migration backups, restore tests, and rollback drills current;
- make CI a reliable release signal, or explicitly keep local test/build evidence as the gate;
- inventory keys, secrets, certificates, and signing authorities;
- document data classification, retention, deletion, and legal-hold rules;
- add dependency and container scanning, plus alerting for failed webhooks and repeated auth failures.

**Exit criteria:** RLS e2e passes on Railway; outbox and video webhook have production evidence; distributed rate limiting is live; a restore drill passes; key/secret inventory is reviewed; CI or the documented local gate is consistently green.

### Phase 1 — Crypto agility and PQC readiness (3–9 months)

**Goal:** make cryptography replaceable before choosing new algorithms.

Work:

- centralize signing/verification and encryption behind small interfaces;
- use envelope encryption with a managed key service for data keys;
- record algorithm and key identifiers with signed artifacts;
- pilot **hybrid signatures** for long-lived artifacts: audit seals, completion certificates, export manifests, and signed webhook receipts;
- do not migrate short-lived session tokens to PQC first; the operational cost is high and the benefit is low compared with rotation and revocation;
- add a crypto-agility test that can swap a provider without rewriting domain code.

**Why not full PQC now:** library maturity, key/signature sizes, provider support, performance, and the need for a migration path for existing artifacts. A hybrid pilot gives evidence without pretending the whole platform is post-quantum.

**Exit criteria:** a documented key hierarchy; one long-lived artifact signed with a hybrid scheme and verified independently; rotation and revocation tested; no domain module imports a vendor crypto SDK directly.

### Phase 2 — Privacy-preserving delivery and ZK proofs (research, 9–18 months)

**Goal:** explore whether ZK can prove a statement without exposing the underlying data.

Candidate statements:

- a student holds a valid entitlement for a course;
- an attempt was started inside the allowed window;
- a payment receipt matches an order without revealing payment details;
- a teacher is authorized for a tenant without exposing the full role graph.

Important limits:

- ZK does **not** hide content that is sent to a client in plaintext;
- it does not replace server-side authorization, RLS, or signed short-lived media URLs;
- trusted setup, verifier cost, proof latency, and mobile performance must be measured;
- a proof system is a new dependency and a new failure mode.

**Exit criteria:** one narrow, non-critical statement has a formal specification, a verifier, a performance budget, and an independent security review; the simpler signed-token alternative is documented and compared.

### Phase 3 — Confidential / homomorphic grading (research)

**Goal:** reduce exposure of answer content during grading.

Reality check:

- fully homomorphic evaluation of essay or LLM-assisted grading is not practical at current cost and latency;
- a trusted execution environment or an isolated grading worker with strict data minimization is more plausible;
- any encrypted-computation claim must state what the server can still see and who holds the keys.

Work:

- separate grading orchestration from content storage;
- minimize the data sent to an evaluator;
- evaluate isolated workers, short-lived credentials, and encrypted queues;
- keep a human review path for disputed grades.

**Exit criteria:** a threat model for the grading boundary; a measured pilot on non-production data; a written comparison of FHE, TEE, and isolated-worker options; no production claim until the pilot is reviewed.

### Phase 4 — Active deception (6–12 months, after baseline)

**Goal:** detect and slow down unauthorized exploration without harming legitimate users.

Possible controls:

- honeytokens in configuration and database rows;
- canary documents and decoy lesson assets;
- alerting on access to paths or records that no legitimate workflow uses;
- rate and sequence anomalies tied to the existing audit trail.

Constraints:

- no entrapment, no hidden punishment, and no deception that affects grades or payments;
- minors require a higher privacy and safety bar;
- false positives must be triaged by a human;
- decoys must not contain real student data;
- legal review is required before deployment.

**Exit criteria:** a documented decoy inventory; alert routing and runbook; a false-positive review; a privacy impact assessment; an explicit off-switch.

### Phase 5 — Crypto-shredding (12–24 months)

**Goal:** make deletion verifiable by destroying the key that protects a tenant's or subject's data.

Work:

- per-tenant or per-subject data-encryption keys;
- envelope encryption for stored content and exports;
- a managed KMS with audited key deletion;
- a deletion workflow that covers primary data, backups, search indexes, logs, and caches;
- legal-hold and retention exceptions;
- a documented distinction between “deleted from the application” and “cryptographically erased”.

Hard problems:

- backups and point-in-time recovery can retain old ciphertext;
- key deletion can be irreversible and must be authorized;
- shared rows and derived analytics may contain data from multiple subjects;
- a lost key can destroy data that must be retained.

**Exit criteria:** a key hierarchy and deletion authority; a restore test proving deleted keys cannot decrypt retained backups; a legal review; an operator runbook with two-person approval.

## 5. Dependencies and sequencing

```text
Phase 0 baseline
  ├─ RLS activation
  ├─ outbox dispatcher
  ├─ video webhook
  ├─ distributed rate limiting
  └─ backup/restore + CI evidence
        ↓
Phase 1 crypto agility / hybrid PQC pilot
        ↓
Phase 2 ZK research (narrow statement only)
        ↓
Phase 3 confidential grading research
        ↓
Phase 4 active deception
        ↓
Phase 5 crypto-shredding
```

Phases 2–5 are research tracks, not a promise of delivery. Phase 4 and Phase 5 should not start before Phase 0 is complete.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Security theater | Publish evidence and explicit non-claims; no feature is “done” without a production check |
| Key loss or lockout | Key escrow/recovery procedure, two-person approval, restore drills |
| Latency and cost | Performance budget per phase; pilot on non-production data first |
| New supply-chain risk | Pin versions, review dependencies, keep a removal plan |
| Legal/privacy harm to minors | Privacy impact assessment and legal review before deception or crypto-shredding |
| Vendor lock-in | Crypto-agility interfaces and exportable key formats |
| Irreversible deletion | Retention/legal-hold rules and a delayed, audited deletion window |
| False sense of confidentiality | State the threat model; do not claim ZK/FHE properties that are not verified |

## 7. What this ADR does not approve

This document does **not** approve:

- post-quantum signing of sessions or all platform traffic;
- zero-knowledge delivery of course content;
- homomorphic grading;
- active deception in production;
- crypto-shredding of tenant data;
- any new schema, migration, dependency, or vendor for these features.

## 8. Review

- Review this roadmap quarterly and after any major security incident.
- Each phase gets its own ADR/RFC with a named owner and budget.
- Update [`CURRENT-STATE.md`](CURRENT-STATE.md) only when a phase is implemented and verified.
- If a phase is abandoned, record why; do not leave an ambiguous “in progress” claim.
