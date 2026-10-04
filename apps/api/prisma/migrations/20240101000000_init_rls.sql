-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

-- Create tenant context function
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy: Tenants table (Super Admin only can see all, otherwise none)
CREATE POLICY tenants_select_policy ON tenants
  FOR SELECT
  USING (
    current_setting('app.tenant_id', true) = id::text
    OR current_setting('app.role', true) = 'SUPER_ADMIN'
  );

CREATE POLICY tenants_insert_policy ON tenants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY tenants_update_policy ON tenants
  FOR UPDATE
  USING (
    current_setting('app.tenant_id', true) = id::text
    OR current_setting('app.role', true) = 'SUPER_ADMIN'
  );

-- RLS Policy: Tenant Domains
CREATE POLICY tenant_domains_select_policy ON tenant_domains
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY tenant_domains_insert_policy ON tenant_domains
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY tenant_domains_update_policy ON tenant_domains
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY tenant_domains_delete_policy ON tenant_domains
  FOR DELETE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Tenant Config
CREATE POLICY tenant_config_select_policy ON tenant_config
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY tenant_config_insert_policy ON tenant_config
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY tenant_config_update_policy ON tenant_config
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Users
CREATE POLICY users_select_policy ON users
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY users_insert_policy ON users
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Devices
CREATE POLICY devices_select_policy ON devices
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY devices_insert_policy ON devices
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY devices_update_policy ON devices
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Sessions
CREATE POLICY sessions_select_policy ON sessions
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY sessions_insert_policy ON sessions
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY sessions_update_policy ON sessions
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Courses
CREATE POLICY courses_select_policy ON courses
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY courses_insert_policy ON courses
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY courses_update_policy ON courses
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Sections
CREATE POLICY sections_select_policy ON sections
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY sections_insert_policy ON sections
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY sections_update_policy ON sections
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Lessons
CREATE POLICY lessons_select_policy ON lessons
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY lessons_insert_policy ON lessons
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY lessons_update_policy ON lessons
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Enrollments
CREATE POLICY enrollments_select_policy ON enrollments
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY enrollments_insert_policy ON enrollments
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY enrollments_update_policy ON enrollments
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Lesson Progress
CREATE POLICY lesson_progress_select_policy ON lesson_progress
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY lesson_progress_insert_policy ON lesson_progress
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY lesson_progress_update_policy ON lesson_progress
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Exams
CREATE POLICY exams_select_policy ON exams
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY exams_insert_policy ON exams
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY exams_update_policy ON exams
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Attempts
CREATE POLICY attempts_select_policy ON attempts
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY attempts_insert_policy ON attempts
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY attempts_update_policy ON attempts
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Orders
CREATE POLICY orders_select_policy ON orders
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY orders_insert_policy ON orders
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY orders_update_policy ON orders
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payment Transactions
CREATE POLICY payment_transactions_select_policy ON payment_transactions
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_transactions_insert_policy ON payment_transactions
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Refunds
CREATE POLICY refunds_select_policy ON refunds
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY refunds_insert_policy ON refunds
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Vouchers
CREATE POLICY vouchers_select_policy ON vouchers
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY vouchers_insert_policy ON vouchers
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY vouchers_update_policy ON vouchers
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Audit Logs
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Outbox Events
CREATE POLICY outbox_events_select_policy ON outbox_events
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY outbox_events_insert_policy ON outbox_events
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY outbox_events_update_policy ON outbox_events
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Entitlements
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY entitlements_select_policy ON entitlements
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY entitlements_insert_policy ON entitlements
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY entitlements_update_policy ON entitlements
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_policy ON subscriptions
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY subscriptions_insert_policy ON subscriptions
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY subscriptions_update_policy ON subscriptions
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Playback Sessions
ALTER TABLE playback_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY playback_sessions_select_policy ON playback_sessions
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY playback_sessions_insert_policy ON playback_sessions
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY playback_sessions_update_policy ON playback_sessions
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Capture Events
ALTER TABLE capture_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY capture_events_select_policy ON capture_events
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY capture_events_insert_policy ON capture_events
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Security Events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY security_events_select_policy ON security_events
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY security_events_insert_policy ON security_events
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_policy ON orders
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY orders_insert_policy ON orders
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY orders_update_policy ON orders
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_items_select_policy ON order_items
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY order_items_insert_policy ON order_items
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payment Intents
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_intents_select_policy ON payment_intents
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_intents_insert_policy ON payment_intents
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_intents_update_policy ON payment_intents
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_select_policy ON payments
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payments_insert_policy ON payments
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payments_update_policy ON payments
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payment Attempts
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_attempts_select_policy ON payment_attempts
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_attempts_insert_policy ON payment_attempts
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_attempts_update_policy ON payment_attempts
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY refunds_select_policy ON refunds
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY refunds_insert_policy ON refunds
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY refunds_update_policy ON refunds
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Ledger Entries
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY ledger_entries_select_policy ON ledger_entries
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY ledger_entries_insert_policy ON ledger_entries
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Webhook Events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_events_select_policy ON webhook_events
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY webhook_events_insert_policy ON webhook_events
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY webhook_events_update_policy ON webhook_events
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Idempotency Keys
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY idempotency_keys_select_policy ON idempotency_keys
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY idempotency_keys_insert_policy ON idempotency_keys
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY idempotency_keys_update_policy ON idempotency_keys
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Vouchers
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY vouchers_select_policy ON vouchers
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY vouchers_insert_policy ON vouchers
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY vouchers_update_policy ON vouchers
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Voucher Redemptions
ALTER TABLE voucher_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY voucher_redemptions_select_policy ON voucher_redemptions
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY voucher_redemptions_insert_policy ON voucher_redemptions
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Reconciliation Runs
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY reconciliation_runs_select_policy ON reconciliation_runs
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY reconciliation_runs_insert_policy ON reconciliation_runs
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY reconciliation_runs_update_policy ON reconciliation_runs
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Reconciliation Items
ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY reconciliation_items_select_policy ON reconciliation_items
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY reconciliation_items_insert_policy ON reconciliation_items
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY reconciliation_items_update_policy ON reconciliation_items
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payment Risk Events
ALTER TABLE payment_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_risk_events_select_policy ON payment_risk_events
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_risk_events_insert_policy ON payment_risk_events
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Settlements
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlements_select_policy ON settlements
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY settlements_insert_policy ON settlements
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY settlements_update_policy ON settlements
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Settlement Items
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlement_items_select_policy ON settlement_items
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY settlement_items_insert_policy ON settlement_items
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Payment Audit Logs
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_audit_logs_select_policy ON payment_audit_logs
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY payment_audit_logs_insert_policy ON payment_audit_logs
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

-- RLS Policy: Videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY videos_select_policy ON videos
  FOR SELECT
  USING (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY videos_insert_policy ON videos
  FOR INSERT
  WITH CHECK (current_setting('app.tenant_id', true) = tenant_id::text);

CREATE POLICY videos_update_policy ON videos
  FOR UPDATE
  USING (current_setting('app.tenant_id', true) = tenant_id::text);
