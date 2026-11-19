# Outbox Delivery — Design

> **Status: design only, not implemented.** The transactional outbox is still
> write-only. `OutboxEvent` rows are committed atomically with payments,
> refunds, and video updates, but no dispatcher reads or delivers them. This
> document defines the delivery design, the RLS constraints, and the evidence
> required before the gap can be marked closed.

## 1. Why this exists

The repository has a transactional outbox so a business transaction can write
its domain event in the same database transaction as the money/entitlement/
video state change. That part works. Delivery does not.

Current writers:

| Event | Aggregate | Written by |
| --- | --- | --- |
| `payment.paid` | payment | payment settlement transaction |
| `refund.succeeded` | refund | refund settlement transaction |
| `video.upload.initiated` | video | video creation |
| `video.processing.started` / `completed` / `failed` | video | provider webhook transaction |
| `video.deleted` | video | video deletion |

The only Bull processor today is `exam-expiry`. There is no outbox relay,
reconciliation worker, or dead-letter surface.

## 2. Constraints

1. **RLS stays on.** Runtime uses `app_user`, which has no `SUPERUSER` and no
   `BYPASSRLS`. Every read/write of tenant-owned rows must happen inside
   `runWithTenantId()` (or with an explicit `set_config('app.tenant_id', …,
   true)` transaction).
2. **No cross-tenant payload reads.** A dispatcher may learn tenant IDs, but it
   must not read another tenant's events without entering that tenant's scope.
3. **At-least-once.** A crash after delivery but before `publishedAt` must be
   allowed. Consumers deduplicate on the event ID.
4. **No event loss.** A failed HTTP call must leave the row unpublished with
   `retryCount`, `lastError`, and a future retry time.
5. **Zero-cost demo.** No new managed service is required. An HTTP webhook
   target is optional; with no target configured the dispatcher stays disabled.
6. **No secrets in the database or logs.** The endpoint URL and signing secret
   come from environment variables (or a secret manager later), never from a
   tenant row or a log line.

## 3. Options considered

| Option | Verdict | Reason |
| --- | --- | --- |
| **A. Per-tenant sweep + tenant-ID directory function** | **Recommended** | Keeps application queries under RLS; exposes only tenant IDs; one worker can sweep every tenant. |
| B. Dispatcher DB role with `BYPASSRLS` | Rejected | A second privileged runtime path weakens the isolation story and needs its own credential rotation. |
| C. Enqueue each event at write time only | Rejected as the only mechanism | The enqueue can happen before the transaction commits, or fail after commit. It can complement a sweep, but cannot replace it. |
| D. Global `app.outbox_dispatcher` GUC policy | Rejected | Any `app_user` connection could set the GUC and read cross-tenant payment/video payloads. |

## 4. Recommended architecture

### 4.1 Tenant directory (migration #9)

`tenants` itself is RLS-protected (`tenants_select_policy` allows only the
current `app.tenant_id`). A dispatcher therefore cannot list tenants through the
normal Prisma client. Add one narrowly scoped `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION app_list_active_tenant_ids()
RETURNS TABLE (tenant_id text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id::text
  FROM tenants
  WHERE status IN ('ACTIVE', 'GRACE_PERIOD');
$$;

REVOKE ALL ON FUNCTION app_list_active_tenant_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_list_active_tenant_ids() TO app_user;
```

Rules for this function:

- returns **only IDs**, no names, domains, config, users, or payloads;
- `STABLE`, no parameters, no dynamic SQL;
- owned by the migration owner, not `app_user`;
- regression test proves `app_user` can call it but still cannot select
  `tenants` rows for another tenant.

This is the only cross-tenant read surface the dispatcher gets.

### 4.2 Sweep worker

New `OutboxDispatcherModule` with a Bull queue named `outbox-dispatch`:

- one repeatable job (`jobId: "outbox-sweep"`, every 30 seconds) so multiple API
  instances do not all sweep at once;
- each run:
  1. call `app_list_active_tenant_ids()` outside any tenant ALS scope;
  2. for each ID, `runWithTenantId(id, () => outbox.getUnpublishedEvents(50))`;
  3. deliver each event through the configured transport;
  4. update the row inside the same tenant scope.
- the sweep is bounded (batch size + per-run tenant count) so one noisy tenant
  cannot starve the rest;
- a queue/Redis failure is logged and never fails a request path.

### 4.3 Delivery transport

Define a small interface so tests and future providers do not depend on HTTP:

```ts
interface OutboxTransport {
  readonly enabled: boolean;
  deliver(event: OutboxEnvelope): Promise<DeliveryResult>;
}
```

Phase 1 implementation is `HttpOutboxTransport`:

- enabled only when `OUTBOX_WEBHOOK_URL` is set; otherwise it logs once and the
  sweep marks nothing;
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
- 10-second timeout, no redirects, `Content-Type: application/json`;
- 2xx = delivered; 408/429/5xx/network = retryable; other 4xx = permanent
  failure (still recorded, not retried forever);
- the URL comes from env, not from a tenant or request body, which avoids SSRF
  from tenant-controlled input. Per-tenant endpoints are a later phase and
  require an allowlist.

### 4.4 Retry, backoff, and dead letters

The model already has `retryCount` and `lastError`. Add two nullable columns in
the same migration:

| Column | Purpose |
| --- | --- |
| `nextAttemptAt DateTime?` | earliest next delivery attempt |
| `deadAt DateTime?` | permanent failure / max-attempt exhaustion |

Policy:

- first attempt immediately after the sweep finds the event;
- retry delay `min(30s * 2^retryCount, 1h)`;
- default max attempts `10`, configurable with `OUTBOX_MAX_ATTEMPTS`;
- on exhaustion set `deadAt` and log a structured error with event ID, tenant
  ID, type, and attempt count; do **not** log the payload;
- an admin/dead-letter read endpoint is a follow-up, not part of phase 1;
- `publishedAt` is set only after a 2xx response. A crash between delivery and
  the update can duplicate a delivery; the event ID is the dedupe key.

### 4.5 Idempotency and ordering

- Consumers must deduplicate on `event.id`; the dispatcher guarantees
  at-least-once, not exactly-once.
- No global ordering guarantee. Per-aggregate ordering can be added later by
  delivering one event at a time per `(tenantId, aggregateType, aggregateId)`;
  phase 1 uses a small batch and does not promise ordering.
- `payment.paid` and `refund.succeeded` already carry stable aggregate IDs and
  money as strings; the envelope preserves that shape.

### 4.6 Observability

- structured logs: `tenantId`, `eventId`, `eventType`, `attempt`, `outcome`,
  `durationMs`; no payload, no PII;
- counters (when a metrics backend exists): delivered, retried, dead;
- `pnpm demo:doctor` can later assert that the outbox queue has a worker and
  that no event is older than the configured SLA.

## 5. Rollout plan

1. **Migration + tests.** Add the tenant-ID function and `nextAttemptAt`/
   `deadAt`; prove `app_user` can call the function, direct cross-tenant
   `tenants`/`outbox_events` reads still return zero rows.
2. **Dispatcher behind a flag.** `OUTBOX_DELIVERY_ENABLED=false` by default.
   Unit-test the sweep, tenant scoping, transport, retry, and dead-letter paths
   with a fake transport.
3. **Local sink.** Run a tiny local HTTP receiver, enable the dispatcher for one
   tenant, and prove: one delivery, duplicate-safe replay, a forced 500 retry,
   and a 4xx permanent failure. Reset the demo afterward.
4. **Live proof.** Configure a real target and repeat the same checks; record
   event IDs, HTTP statuses, retry counts, and final `publishedAt`.
5. **Only then** update the public claim from “outbox is write-only” to
   “outbox delivery is implemented and proven.”

## 6. Acceptance criteria

- [ ] `app_user` can list tenant IDs but cannot read another tenant's rows.
- [ ] A payment event is delivered once with a valid HMAC and marked
      `publishedAt` only after 2xx.
- [ ] A 500/network failure increments `retryCount`, stores `lastError`, and
      retries after `nextAttemptAt`.
- [ ] A permanent 4xx is recorded without an infinite retry loop.
- [ ] Max attempts set `deadAt` and produce an observable log.
- [ ] A crash between delivery and `publishedAt` is safe because the consumer
      deduplicates on `event.id`.
- [ ] No payload or credential appears in logs.
- [ ] `pnpm build`, API tests, web tests, RLS e2e, and `pnpm demo:doctor` pass.

## 7. Non-goals

- Exactly-once delivery.
- A full event bus, schema registry, or Kafka replacement.
- Per-tenant webhook configuration in phase 1.
- A dead-letter administration UI.
- Reconciliation of payment provider state (separate worker).

## 8. Open decisions

1. Which target receives the first live delivery (internal notification
   service, teacher webhook, or an operations sink)?
2. Whether per-tenant endpoints are needed before the judging deadline.
3. Whether `nextAttemptAt`/`deadAt` ship in migration #9 or a separate
   migration after the tenant-ID function.

Until those are decided, the correct current claim remains: **the outbox is
transactional and write-only; no dispatcher exists.**
