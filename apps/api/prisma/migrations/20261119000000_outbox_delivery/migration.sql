-- Outbox delivery (phase 1): retry scheduling and a narrowly scoped tenant
-- directory for the background dispatcher.
--
-- The outbox table is RLS-protected. A dispatcher cannot list tenants through
-- the runtime app_user connection because `tenants_select_policy` only exposes
-- the current app.tenant_id. app_list_active_tenant_ids() is the single
-- cross-tenant read surface: it returns IDs only, never names, domains, config
-- or event payloads. The function must be owned by the migration/superuser
-- role so SECURITY DEFINER can bypass FORCE RLS on `tenants`.

ALTER TABLE "outbox_events"
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
  ADD COLUMN "deadAt" TIMESTAMP(3);

CREATE INDEX "outbox_events_publishedAt_nextAttemptAt_idx"
  ON "outbox_events"("publishedAt", "nextAttemptAt");

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

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION app_list_active_tenant_ids() TO app_user';
  ELSE
    RAISE NOTICE 'Outbox: app_user does not exist yet - grant EXECUTE on app_list_active_tenant_ids manually';
  END IF;
END $$;
