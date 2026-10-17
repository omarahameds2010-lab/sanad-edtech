/**
 * JSON helpers for values the database hands back as JavaScript BigInt —
 * every `*Minor` money column in the Prisma schema (audit 2026-10-17 review,
 * bundle A).
 *
 * Without the patch below, any response carrying a raw BigInt makes Nest's
 * serializer throw `TypeError: Do not know how to serialize a BigInt` → 500.
 */

let patched = false;

/**
 * Makes `JSON.stringify` emit BigInt values as decimal strings:
 * `JSON.stringify({ totalMinor: 29900n })` → `{"totalMinor":"29900"}`.
 *
 * The string form is deliberate: HTTP JSON numbers are IEEE doubles, so a
 * number-typed money field would silently lose precision beyond 2^53.
 */
export function patchBigIntSerialization(): void {
  if (patched) return;

  const proto = BigInt.prototype as unknown as { toJSON?: () => string };
  if (typeof proto.toJSON !== "function") {
    Object.defineProperty(BigInt.prototype, "toJSON", {
      value: function (this: bigint): string {
        return this.toString();
      },
      writable: true,
      configurable: true,
    });
  }

  patched = true;
}

/**
 * Deterministic JSON for idempotency hashes: object keys sorted, BigInt
 * emitted as a decimal string, dates as ISO strings. The output stays valid
 * JSON, which `markCompleted` relies on when it replays `JSON.parse`.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForJson(value));
}

function normalizeForJson(value: unknown): unknown {
  if (value === null || value === undefined) return null;

  const type = typeof value;
  if (type === "bigint") return (value as bigint).toString();
  if (type === "number" || type === "boolean" || type === "string") {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeForJson);

  if (type === "object") {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      if (source[key] === undefined) continue;
      out[key] = normalizeForJson(source[key]);
    }
    return out;
  }

  return String(value);
}
