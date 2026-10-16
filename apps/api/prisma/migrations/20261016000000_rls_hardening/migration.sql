-- RLS hardening (audit 2026-10-16 §3.3) — the complete, corrected policy set
-- for every table in the schema (0_init baseline creates 42 tables).
--
-- Why this migration exists:
--   * the old loose file 20240101000000_init_rls.sql was never applied by
--     Prisma AND referenced snake_case columns ("tenant_id") that do not
--     exist — every application column is camelCase ("tenantId"). That file
--     has been deleted.
--   * 20261007000000_lms_rls covered only 6 tables.
--   * FORCE ROW LEVEL SECURITY was enabled for a subset only.
--   * UPDATE policies had no WITH CHECK, so a row could be moved to another
--     tenant by updating "tenantId".
--
-- Conventions used throughout:
--   * Tenant context = the transaction-local GUC app.tenant_id, set via
--     set_config('app.tenant_id', <tenantId>, true) on the SAME transaction
--     as the statement. The runtime sets it per operation.
--   * current_setting('app.tenant_id', true) returns NULL when unset, so
--     every comparison below is NULL → the row is denied. Deny by default.
--   * Policy names follow "<table>_<action>_policy".
--   * UPDATE policies carry WITH CHECK as well as USING.
--
-- To add a future tenant-scoped table: add its name to the relevant array
-- (or write an explicit block like the special-cases below) and re-run
-- migrations.

-- ---------------------------------------------------------------------------
-- 1. Full CRUD tables (own row set only)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tenant_config',
    'users',
    'devices',
    'sessions',
    'courses',
    'sections',
    'lessons',
    'resources',
    'assignments',
    'assignment_submissions',
    'exams',
    'exam_questions',
    'exam_attempts',
    'videos',
    'enrollments',
    'lesson_progress',
    'entitlements'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
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
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Tables without DELETE (financial/event records are append-mostly)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'outbox_events',
    'playback_sessions',
    'subscriptions',
    'orders',
    'payment_intents',
    'payments',
    'payment_attempts',
    'refunds',
    'idempotency_keys',
    'vouchers',
    'reconciliation_runs',
    'reconciliation_items',
    'settlements'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
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
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Append-only SELECT + INSERT tables (logs, audit, ledger, items)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'audit_logs',
    'capture_events',
    'security_events',
    'order_items',
    'ledger_entries',
    'voucher_redemptions',
    'payment_risk_events',
    'settlement_items',
    'payment_audit_logs'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
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
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Special cases
-- ---------------------------------------------------------------------------

-- tenants: a tenant sees and updates only its own row. No INSERT/DELETE for
-- app_user — tenant provisioning is an operator action (seed/console).
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenants" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_select_policy" ON "tenants";
DROP POLICY IF EXISTS "tenants_insert_policy" ON "tenants";
DROP POLICY IF EXISTS "tenants_update_policy" ON "tenants";
DROP POLICY IF EXISTS "tenants_delete_policy" ON "tenants";
CREATE POLICY "tenants_select_policy" ON "tenants"
  FOR SELECT USING ("id" = current_setting('app.tenant_id', true));
CREATE POLICY "tenants_update_policy" ON "tenants"
  FOR UPDATE USING ("id" = current_setting('app.tenant_id', true))
  WITH CHECK ("id" = current_setting('app.tenant_id', true));

-- tenant_domains: managed by the tenant itself. Reads happen only through
-- app_resolve_tenant_by_domain() (see 20261016000001_tenant_resolution_fn),
-- which is why no public SELECT policy is needed here.
ALTER TABLE "tenant_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_domains" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_domains_select_policy" ON "tenant_domains";
DROP POLICY IF EXISTS "tenant_domains_insert_policy" ON "tenant_domains";
DROP POLICY IF EXISTS "tenant_domains_update_policy" ON "tenant_domains";
DROP POLICY IF EXISTS "tenant_domains_delete_policy" ON "tenant_domains";
CREATE POLICY "tenant_domains_select_policy" ON "tenant_domains"
  FOR SELECT USING ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY "tenant_domains_insert_policy" ON "tenant_domains"
  FOR INSERT WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY "tenant_domains_update_policy" ON "tenant_domains"
  FOR UPDATE USING ("tenantId" = current_setting('app.tenant_id', true))
  WITH CHECK ("tenantId" = current_setting('app.tenant_id', true));
CREATE POLICY "tenant_domains_delete_policy" ON "tenant_domains"
  FOR DELETE USING ("tenantId" = current_setting('app.tenant_id', true));

-- webhook_events: provider callbacks can arrive before the tenant is known,
-- so "tenantId" is nullable (documented exception). NULL rows remain
-- visible/writable for processing; otherwise rows are tenant-scoped.
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "webhook_events_select_policy" ON "webhook_events";
DROP POLICY IF EXISTS "webhook_events_insert_policy" ON "webhook_events";
DROP POLICY IF EXISTS "webhook_events_update_policy" ON "webhook_events";
DROP POLICY IF EXISTS "webhook_events_delete_policy" ON "webhook_events";
CREATE POLICY "webhook_events_select_policy" ON "webhook_events"
  FOR SELECT USING (
    "tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true)
  );
CREATE POLICY "webhook_events_insert_policy" ON "webhook_events"
  FOR INSERT WITH CHECK (
    "tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true)
  );
CREATE POLICY "webhook_events_update_policy" ON "webhook_events"
  FOR UPDATE USING (
    "tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true)
  ) WITH CHECK (
    "tenantId" IS NULL OR "tenantId" = current_setting('app.tenant_id', true)
  );

-- ---------------------------------------------------------------------------
-- 5. Runtime role: app_user (non-superuser, non-owner, NOBYPASSRLS)
-- ---------------------------------------------------------------------------
-- On a fresh docker-compose database the role is created by
-- docker/postgres/init/01-create-app-user.sql (with a local dev password)
-- before migrations run. Here we make the migration self-sufficient and
-- harden the role wherever it exists. Creating/altering roles requires
-- superuser: when the migration user lacks it (managed providers), we emit
-- a NOTICE instead and the operator creates the role manually (runbook).
DO $$
DECLARE
  has_role boolean;
BEGIN
  SELECT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user')
    INTO has_role;

  IF NOT has_role THEN
    BEGIN
      CREATE ROLE app_user WITH
        LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT;
      has_role := true;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'RLS: cannot create app_user (insufficient privilege) — create it manually as superuser';
    END;
  END IF;

  IF has_role THEN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_user', current_database());
    GRANT USAGE ON SCHEMA public TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT USAGE, SELECT ON SEQUENCES TO app_user;
    BEGIN
      ALTER ROLE app_user NOSUPERUSER NOBYPASSRLS;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'RLS: cannot ALTER ROLE app_user (insufficient privilege) — verify NOBYPASSRLS manually';
    END;
  END IF;
END $$;
