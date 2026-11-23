# Outbox Delivery — Phase 1

> **Status: Phase 1 implemented locally (20 November 2026), dead-letter admin
> API added 22 November 2026, disabled by default.** Migration #9 adds
> retry/dead-letter columns and the tenant-ID directory. The `outbox-dispatch`
> Bull sweep is wired into the API and was proven against a local HTTP sink:
> **5/5** e2e checks (valid HMAC + `publishedAt`, a 500 retry followed by
> success, a permanent 4xx dead-letter, no redelivery after publication, and an
> ADMIN-only list/requeue of a dead letter under RLS). The dispatcher stays idle
> unless both `OUTBOX_WEBHOOK_URL` and `OUTBOX_WEBHOOK_SECRET` are set. No real
> external target is configured, so external delivery is still unproven.

## 1. Why this exists

The repository has a transactional outbox so a business transaction can write
its domain event in the same database transaction as the money/entitlement/
video state change. Phase 1 adds the missing tenant-scoped delivery sweep.

Current writers:

| Event | Aggregate | Written by |
| --- | --- | --- |
| `payment.paid` | payment | payment settlement transaction |
| `refund.succeeded` | refund | refund settlement transaction |
| `video.upload.initiated` | video | video creation |
| `video.processing.started` / `completed` / `failed` | video | provider webhook transaction |
| `video.deleted` | video | video deletion |

Bull now has two processors: the tenant-scoped `exam-expiry` worker and the
opt-in `outbox-dispatch` sweep. There is still no reconciliation worker. The
dead-letter administration API is tenant-scoped and ADMIN-only; there is no
dead-letter UI yet.

## 2. Constraints

1. **RLS stays on.** Runtime uses `app_user`, which has no `SUPERUSER` and no
   `BYPASSRLS`. Every read/write of tenant-owned rows happens inside
   `runWithTenantId()` (or with an explicit `set_config('app.tenant_id', …,
   true)` transaction).
2. **No cross-tenant payload reads.** A dispatcher may learn tenant IDs, but it
   must not read another tenant's events without entering that tenant's scope.
3. **At-least-once.** A crash after delivery but before `publishedAt` must be
   allowed. Consumers deduplicate on the event ID.
4. **No event loss.** A failed HTTP call leaves the row unpublished with
   `retryCount`, `lastError`, and a future retry time.
5. **Zero-cost demo.** No new managed service is required. An HTTP webhook
   target is optional; with no target configured the dispatcher stays disabled.
6. **No secrets in the database or logs.** The endpoint URL and signing secret
   come from environment variables (or a secret manager later), never from a
   tenant row or a log line.

## 3. Options considered

| Option | Verdict | Reason |
| --- | --- | --- |
| **A. Per-tenant sweep + tenant-ID directory function** | **Implemented** | Keeps application queries under RLS; exposes only tenant IDs; one worker can sweep every tenant. |
| B. Dispatcher DB role with `BYPASSRLS` | Rejected | A second privileged runtime path weakens the isolation story and needs its own credential rotation. |
| C. Enqueue each event at write time only | Rejected as the only mechanism | The enqueue can happen before the transaction commits, or fail after commit. It can complement a sweep, but cannot replace it. |
| D. Global `app.outbox_dispatcher` GUC policy | Rejected | Any `app_user` connection could set the GUC and read cross-tenant payment/video payloads. |

## 4. Implemented architecture

### 4.1 Tenant directory (migration #9)

`tenants` itself is RLS-protected (`tenants_select_policy` allows only the
current `app.tenant_id`). A dispatcher therefore cannot list tenants through the
normal Prisma client. Migration `20261119000000_outbox_delivery` adds one
narrowly scoped `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION app_list_active_tenant_ids()
RETURNS TABLE (tenant_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t."id"::text
  FROM public."tenants" t
  WHERE t."status" IN ('ACTIVE', 'GRACE_PERIOD');
$$;

REVOKE ALL ON FUNCTION app_list_active_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_list_active_tenant_ids() TO app_user;
```

The migration grants execute only when `app_user` exists; otherwise it raises a
notice so a pre-bootstrap database can grant it manually.

Rules for this function:

- returns **only IDs**, no names, domains, config, users, or payloads;
- `STABLE`, no parameters, no dynamic SQL;
- owned by the migration owner, not `app_user`;
- the local proof shows `app_user` can call it (`1` active ID) while a direct
  `SELECT FROM tenants` still returns `0` rows without a tenant context.

This is the only cross-tenant read surface the dispatcher gets.

### 4.2 Sweep worker

The implementation lives in `apps/api/src/modules/outbox/`:

- `OutboxModule` registers the `outbox-dispatch` queue; `AppModule` owns the
  single `BullModule.forRoot(...)` Redis configuration.
- `OutboxDispatchScheduler` installs one repeatable job named `sweep` every
  30 seconds (`OUTBOX_SWEEP_INTERVAL_MS`), with `jobId: "sweep"` so API
  instances do not each add their own repeat entry.
- `OutboxDispatchProcessor` calls `OutboxDispatcherService.sweep()`.
- `OutboxDispatcherService`:
  1. calls `app_list_active_tenant_ids()` outside any tenant ALS scope;
  2. for each ID, enters `runWithTenantId(id, …)`;
  3. fetches due events (`publishedAt = null`, `deadAt = null`, and
     `nextAttemptAt` null or in the past);
  4. delivers each event and writes the result inside that tenant scope.
- the sweep is bounded by `OUTBOX_BATCH_SIZE` (default 50) and
  `OUTBOX_MAX_TENANTS_PER_SWEEP` (default 50);
- a queue/Redis failure is logged and never fails a request path. The repeatable
  job is stored in Redis at boot; if Redis is down at that moment, restart the
  API after Redis recovers.

### 4.3 Delivery transport

`OutboxTransport` is a small interface so tests and future providers do not
depend on HTTP. Phase 1 uses `HttpOutboxTransport`:

- enabled only when **both** `OUTBOX_WEBHOOK_URL` and
  `OUTBOX_WEBHOOK_SECRET` are set; otherwise it logs once and the sweep marks
  nothing;
- `POST` JSON envelope:

```json
{
  "id": "uuid",
  "type": "payment.paid",
  "version": 1,
  "tenantId": "uuid",
  "occurredAt": "2026-11-19T12:00:00.000Z",
  "aggregate": { "type": "payment", "id": "uuid" },
  "payload": { "paymentId": "uuid", "orderId": "uuid", "amountMinor": "19900" }
}
```

- headers:
  - `X-SANAD-Event-Id: <event.id>`
  - `X-SANAD-Timestamp: <unix seconds>`
  - `X-SANAD-Signature: sha256=<HMAC-SHA256(timestamp + "." + rawBody, OUTBOX_WEBHOOK_SECRET)>`
- 10-second default timeout (`OUTBOX_WEBHOOK_TIMEOUT_MS`), no redirects,
  `Content-Type: application/json`;
- 2xx = delivered; 408/429/5xx/network/timeout = retryable; other 4xx =
  permanent failure (still recorded, not retried forever);
- the URL comes from env, not from a tenant or request body, which avoids SSRF
  from tenant-controlled input. Per-tenant endpoints are a later phase and
  require an allowlist.

### 4.4 Retry, backoff, and dead letters

Migration #9 adds two nullable columns to `outbox_events`:

| Column | Purpose |
| --- | --- |
| `nextAttemptAt DateTime?` | earliest next delivery attempt |
| `deadAt DateTime?` | permanent failure / max-attempt exhaustion |

Policy:

- first attempt immediately after the sweep finds the event;
- retry delay `min(30s * 2^(retryCount - 1), 1h)`;
- default max attempts `10`, configurable with `OUTBOX_MAX_ATTEMPTS`;
- on exhaustion or a permanent 4xx, set `deadAt` and write a structured
  dead-letter log with tenant ID, event ID, event type, attempt count, and error
  code; the payload is not logged;
- `publishedAt` is set only after a 2xx response. A crash between delivery and
  the update can duplicate a delivery; the event ID is the dedupe key.

Dead-letter administration (added 22 November 2026):

| Endpoint | Permission | Behavior |
| --- | --- | --- |
| `GET /api/v1/admin/outbox/dead-letters?limit=50` | `outbox:read` (ADMIN) | Lists this tenant's unpublished dead letters, newest `deadAt` first. The response omits `payload`; it includes event identity, `retryCount`, `lastError`, and `deadAt`. Limit is clamped to 1-100. |
| `POST /api/v1/admin/outbox/dead-letters/:eventId/retry` | `outbox:manage` (ADMIN) | CAS-requeues only a still-dead, unpublished row in the current tenant: clears `deadAt`/`lastError`, resets `retryCount` to `0`, and sets `nextAttemptAt` to now. Returns **202**; a missing, published, or concurrently claimed row returns **404**. |

Every retry writes `OUTBOX_DEAD_LETTER_RETRIED` to `audit_logs` with the prior
error and retry count; the payload is never copied into the audit record. The
retry only makes the event eligible for the next sweep — if
`OUTBOX_WEBHOOK_URL`/`OUTBOX_WEBHOOK_SECRET` are unset, the dispatcher remains
idle and the row stays pending.

### 4.5 Idempotency and ordering

- Consumers must deduplicate on `event.id`; the dispatcher guarantees
  at-least-once, not exactly-once.
- No global ordering guarantee. Per-aggregate ordering can be added later by
  delivering one event at a time per `(tenantId, aggregateType, aggregateId)`;
  phase 1 uses a small batch and does not promise ordering.
- `payment.paid` and `refund.succeeded` already carry stable aggregate IDs and
  money as strings; the envelope preserves that shape.

### 4.6 Observability

- aggregate sweep log: tenants, examined, delivered, retried, dead, failed
  tenants;
- one warning per dead-lettered event: tenant ID, event ID, event type,
  attempt, error code; no payload, no PII, no secret;
- the local e2e test asserts the receiver saw the signed body and that
  `publishedAt`/`deadAt`/`retryCount` match the delivery outcome;
- dead-letter list/retry is available to ADMINs through the tenant-scoped API;
  every retry is recorded in `audit_logs`;
- counters (when a metrics backend exists): delivered, retried, dead;
- `pnpm demo:doctor` does not yet assert outbox health; a dead-letter alert is
  a follow-up.

## 5. Rollout plan

1. **Migration + tests.** ✅ Migration #9 and the tenant-ID function are
   applied locally; the RLS isolation suite remains 5/5.
2. **Dispatcher behind an opt-in gate.** ✅ No URL/secret means idle. The
   dispatcher is registered at boot but does not query the database while
   disabled. Unit tests cover sweep, tenant scoping, transport, retry, and
   dead-letter paths.
3. **Local sink.** ✅ A local HTTP receiver ran inside the e2e test: one
   delivery with a valid HMAC and `publishedAt`, a forced 500 retry followed by
   success, a permanent 4xx dead-letter, and no redelivery after publication.
4. **Live proof.** ⬜ Configure a real target and repeat the same checks; record
   event IDs, HTTP statuses, retry counts, and final `publishedAt`.
5. **Only then** update the public claim from “implemented locally, disabled by
   default” to “outbox delivery is live-proven.”

## 6. Acceptance criteria

- [x] `app_user` can list tenant IDs but cannot read another tenant's rows.
- [x] An outbox event is delivered with a valid HMAC and marked `publishedAt`
      only after 2xx (local sink, synthetic e2e event).
- [x] A 500/network failure increments `retryCount`, stores `lastError`, and
      retries after `nextAttemptAt`.
- [x] A permanent 4xx is recorded without an infinite retry loop.
- [x] Max attempts set `deadAt` and produce an observable log.
- [x] A published event is not redelivered by the next sweep; consumers must
      still deduplicate on `event.id` for the crash window.
- [x] An ADMIN can list this tenant's dead letters and requeue one; teachers get
      **403**, anonymous callers get **401**, and a cross-tenant/non-dead event
      is not visible.
- [x] A dead-letter retry resets the retry budget and writes an audit row
      without the payload.
- [x] No payload or credential appears in logs or admin responses.
- [ ] A real payment/refund event is delivered to an external target.
- [x] `pnpm build`, API tests, web tests, RLS e2e, and the local outbox e2e pass;
      API **412/412** (45 suites), outbox e2e **5/5**, RLS **5/5**, live smoke
      **8/8**, and `pnpm demo:doctor` **10/10** passed on 22 November 2026 after
      the dead-letter admin release. The API is local, so no Vercel redeploy was
      required for this release.

## 7. Non-goals

- Exactly-once delivery.
- A full event bus, schema registry, or Kafka replacement.
- Per-tenant webhook configuration in phase 1.
- A dead-letter administration UI.
- Reconciliation of payment provider state (separate worker).

## 8. Open decisions

1. Which target receives the first live delivery (internal notification
   service, teacher webhook, or an operations sink)? Phase 1 exposes one generic
   `OUTBOX_WEBHOOK_URL`; a real target is still pending.
2. Whether per-tenant endpoints are needed before the judging deadline.
3. Whether a dead-letter UI is needed; the ADMIN-only API is implemented, but
   there is no screen yet.

The correct current claim is: **outbox delivery is implemented locally,
disabled by default, and proven against a local sink; a tenant-scoped,
ADMIN-only dead-letter list/retry API exists; external delivery is not yet
proven.**
