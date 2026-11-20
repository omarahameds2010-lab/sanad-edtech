export const OUTBOX_QUEUE = "outbox-dispatch";
export const OUTBOX_SWEEP_JOB = "sweep";

export const DEFAULT_OUTBOX_SWEEP_INTERVAL_MS = 30_000;
export const DEFAULT_OUTBOX_BATCH_SIZE = 50;
export const DEFAULT_OUTBOX_MAX_ATTEMPTS = 10;
export const DEFAULT_OUTBOX_MAX_TENANTS = 50;
export const DEFAULT_OUTBOX_TIMEOUT_MS = 10_000;
export const DEFAULT_OUTBOX_BACKOFF_MS = 30_000;
export const MAX_OUTBOX_BACKOFF_MS = 60 * 60_000;

function positiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function outboxSweepIntervalMs(): number {
  return positiveInt(
    process.env.OUTBOX_SWEEP_INTERVAL_MS,
    DEFAULT_OUTBOX_SWEEP_INTERVAL_MS,
  );
}

export function outboxBatchSize(): number {
  return positiveInt(
    process.env.OUTBOX_BATCH_SIZE,
    DEFAULT_OUTBOX_BATCH_SIZE,
  );
}

export function outboxMaxAttempts(): number {
  return positiveInt(
    process.env.OUTBOX_MAX_ATTEMPTS,
    DEFAULT_OUTBOX_MAX_ATTEMPTS,
  );
}

export function outboxMaxTenantsPerSweep(): number {
  return positiveInt(
    process.env.OUTBOX_MAX_TENANTS_PER_SWEEP,
    DEFAULT_OUTBOX_MAX_TENANTS,
  );
}

export function outboxTimeoutMs(): number {
  return positiveInt(
    process.env.OUTBOX_WEBHOOK_TIMEOUT_MS,
    DEFAULT_OUTBOX_TIMEOUT_MS,
  );
}

export function outboxBackoffMs(retryCount: number): number {
  const exponent = Math.max(0, retryCount - 1);
  return Math.min(
    DEFAULT_OUTBOX_BACKOFF_MS * 2 ** exponent,
    MAX_OUTBOX_BACKOFF_MS,
  );
}
