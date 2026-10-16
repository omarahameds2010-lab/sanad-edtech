import { BadRequestException } from "@nestjs/common";

/**
 * Canonical `*Minor` (piastres/cents) value (audit 2026-10-17 review, bundle A).
 *
 * HTTP JSON cannot carry a real `bigint` — clients send numbers or digit
 * strings. Anything compared against a Prisma BigInt column must go through
 * this helper first: `1 !== 1n` is always true in JavaScript, which is how
 * every `POST /payments/orders` used to die with "Price mismatch".
 */
export function toBigIntMinor(value: unknown, field: string): bigint {
  if (typeof value === "bigint") return value;

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new BadRequestException(
        `${field} must be an integer in minor units`,
      );
    }
    return BigInt(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }

  throw new BadRequestException(
    `${field} must be an integer in minor units (number or digit string)`,
  );
}
