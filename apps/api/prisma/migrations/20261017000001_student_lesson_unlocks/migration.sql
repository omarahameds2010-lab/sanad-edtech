-- Per-student content unlocks (audit 2026-10-16 §6.1, blocker #6).
--
-- Progression was a tenant-wide flip of lessons."lockStatus": when student A
-- entered an assignment, the linked exam lesson unlocked for EVERY student in
-- the tenant — with no transaction, no per-student record and no constraint.
-- This table stores the grant per (tenantId, userId, lessonId); the unique
-- index makes the ENTER flow idempotent by construction (createMany with
-- skipDuplicates), and the same tenant RLS policy set as every other table
-- protects the rows.

-- CreateTable
CREATE TABLE "student_lesson_unlocks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "unlockType" "ContentUnlockType" NOT NULL,
    "sourceId" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_lesson_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_lesson_unlocks_tenantId_idx" ON "student_lesson_unlocks"("tenantId");

-- CreateIndex
CREATE INDEX "student_lesson_unlocks_userId_idx" ON "student_lesson_unlocks"("userId");

-- CreateIndex
CREATE INDEX "student_lesson_unlocks_lessonId_idx" ON "student_lesson_unlocks"("lessonId");

-- CreateIndex
CREATE INDEX "student_lesson_unlocks_tenantId_userId_idx" ON "student_lesson_unlocks"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "student_lesson_unlocks_tenantId_lessonId_idx" ON "student_lesson_unlocks"("tenantId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "student_lesson_unlocks_tenantId_userId_lessonId_key" ON "student_lesson_unlocks"("tenantId", "userId", "lessonId");

-- AddForeignKey
ALTER TABLE "student_lesson_unlocks" ADD CONSTRAINT "student_lesson_unlocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_unlocks" ADD CONSTRAINT "student_lesson_unlocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_unlocks" ADD CONSTRAINT "student_lesson_unlocks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Row Level Security — the same tenant-isolation policy set as every other
-- table (conventions documented in 20261016000000_rls_hardening). FORCE so
-- even the table owner cannot bypass it.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text := 'student_lesson_unlocks';
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_select_policy', t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert_policy', t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update_policy', t);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete_policy', t);
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR SELECT USING ("tenantId" = current_setting(''app.tenant_id'', true))',
    t || '_select_policy', t);
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR INSERT WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true))',
    t || '_insert_policy', t);
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR UPDATE USING ("tenantId" = current_setting(''app.tenant_id'', true)) WITH CHECK ("tenantId" = current_setting(''app.tenant_id'', true))',
    t || '_update_policy', t);
  EXECUTE format(
    'CREATE POLICY %I ON %I FOR DELETE USING ("tenantId" = current_setting(''app.tenant_id'', true))',
    t || '_delete_policy', t);
END $$;

-- Runtime grants: the hardening migration's "ALL TABLES" grant only covered
-- the tables that existed back then. Grant explicitly while app_user exists.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON "student_lesson_unlocks" TO app_user';
  ELSE
    RAISE NOTICE 'RLS: app_user does not exist — grant student_lesson_unlocks manually when the role is created';
  END IF;
END $$;
