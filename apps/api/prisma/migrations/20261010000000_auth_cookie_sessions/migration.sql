-- Auth: cookie-backed session rotation chain
-- Additive + idempotent. Never drops data or columns.
-- Existing sessions become non-refreshable (their refresh path was already
-- broken — see auth.service.ts), so no backfill of secrets is attempted.

-- 1. Family grouping for rotation chains. One login = one family.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "familyId" TEXT;
UPDATE "sessions" SET "familyId" = "id" WHERE "familyId" IS NULL;
ALTER TABLE "sessions" ALTER COLUMN "familyId" SET NOT NULL;

-- 2. Deterministic O(1) lookup secret (sha256 hex).
--    Argon2id is salted → non-deterministic → unsearchable. The column that
--    stores it must never be used in a WHERE clause.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refreshTokenLookup" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "replacedById" TEXT;

-- 3. Observability / audit trail for rotations and revocations.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "lastRotatedAt" TIMESTAMP(3);

-- 4. Indexes. A UNIQUE index on a nullable column permits multiple NULLs in
--    PostgreSQL, so pre-existing rows (lookup = NULL) neither collide nor
--    need backfilling.
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refreshTokenLookup_key" ON "sessions"("refreshTokenLookup");
CREATE INDEX IF NOT EXISTS "sessions_familyId_idx" ON "sessions"("familyId");
CREATE INDEX IF NOT EXISTS "sessions_replacedById_idx" ON "sessions"("replacedById");
