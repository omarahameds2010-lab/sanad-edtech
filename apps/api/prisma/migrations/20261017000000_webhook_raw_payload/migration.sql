-- Audit 2026-10-16 §5.1: webhook processing reads `rawPayload` on every
-- event (handleEvent / handlePaymentPaid), but the column never existed —
-- the raw provider body is also required for audit and replay.
ALTER TABLE "webhook_events" ADD COLUMN "rawPayload" JSONB;
