-- docker/postgres/init/01-create-app-user.sql
-- Runs once on fresh database initialization (docker-entrypoint-initdb.d).
--
-- IMPORTANT: no application tables exist yet at this point (the schema is
-- created by `prisma migrate deploy` afterwards). So this script only:
--   1. creates the non-superuser runtime role, and
--   2. grants schema/table/sequence privileges (incl. default privileges for
--      objects the migrations will create).
--
-- RLS itself (ENABLE + FORCE + policies) is applied by the Prisma migrations
-- (see 20261016000000_rls_hardening). Never enable FORCE ROW LEVEL SECURITY
-- for tables here — they do not exist yet.

-- Create app_user (runtime role). Login only — no superuser, no createdb,
-- no createrole, no bypassrls. The password below is a LOCAL DEV value for
-- docker-compose only; real deployments set the password out of band.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH
      LOGIN
      PASSWORD 'app_user_password'
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS
      INHERIT;
  END IF;
END
$$;

-- Connect + schema usage
GRANT CONNECT ON DATABASE learning_platform TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Existing objects (none yet) and objects created later by this (postgres)
-- user — i.e. every table/sequence created by `prisma migrate deploy`.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
