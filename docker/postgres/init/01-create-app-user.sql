-- docker/postgres/init/01-create-app-user.sql
-- This script runs on first database initialization
-- Creates a non-superuser app_user for runtime with minimal required privileges

-- Create app_user (runtime user)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user_password';
  END IF;
END
$$;

-- Grant connect to database
GRANT CONNECT ON DATABASE learning_platform TO app_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant CRUD on all tables in public schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- CRITICAL: Revoke BYPASSRLS if accidentally granted (defense in depth)
REVOKE BYPASSRLS ON ALL TABLES IN SCHEMA public FROM app_user;

-- Ensure RLS is enforced for app_user
ALTER TABLE public.tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_config FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.devices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.courses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sections FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lessons FORCE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE public.exams FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.refunds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.outbox_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.playback_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.capture_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.security_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_risk_events FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settlements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_logs FORCE ROW LEVEL SECURITY;