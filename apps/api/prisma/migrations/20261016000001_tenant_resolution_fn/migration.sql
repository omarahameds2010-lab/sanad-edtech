-- Tenant resolution for the pre-authentication routing step.
--
-- TenantResolverMiddleware maps the request Host → tenant BEFORE any login
-- happens, so no tenant context (app.tenant_id) can exist yet. A plain
-- SELECT against tenant_domains/tenants is therefore impossible once RLS is
-- enforced for the runtime role. This function performs exactly one lookup
-- (domain → ACTIVE-or-not tenant) and nothing else.
--
-- SECURITY DEFINER: runs with the privileges of the migration/owner user.
-- NOTE: FORCE ROW LEVEL SECURITY also applies to the table owner; the
-- function relies on the owner being a SUPERUSER (docker-compose: postgres;
-- verify the same for managed providers). The runtime role app_user has no
-- direct table access to tenant_domains/tenants beyond its own tenant
-- context.
CREATE OR REPLACE FUNCTION app_resolve_tenant_by_domain(p_domain text)
RETURNS TABLE (id text, slug text, name text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT t."id"::text, t."slug"::text, t."name"::text, t."status"::text
  FROM public."tenant_domains" td
  JOIN public."tenants" t ON t."id" = td."tenantId"
  WHERE td."domain" = p_domain
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION app_resolve_tenant_by_domain(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    GRANT EXECUTE ON FUNCTION app_resolve_tenant_by_domain(text) TO app_user;
  ELSE
    RAISE NOTICE 'RLS: app_user does not exist yet — grant EXECUTE on app_resolve_tenant_by_domain manually';
  END IF;
END $$;
