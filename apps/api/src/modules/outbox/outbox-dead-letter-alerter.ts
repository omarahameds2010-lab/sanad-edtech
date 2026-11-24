import { Injectable, Logger } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { outboxTimeoutMs } from "./outbox-delivery.constants";

export interface OutboxDeadLetterAlert {
  tenantId: string;
  eventId: string;
  eventType: string;
  attempt: number;
  error: string;
}

export interface OutboxDeadLetterAlertResult {
  sent: boolean;
  skipped: boolean;
  reason?: string;
}

/**
 * Optional operator alert for a newly dead-lettered outbox event.
 *
 * This is deliberately separate from OUTBOX_WEBHOOK_URL: the delivery target
 * receives business events, while the alert target receives a small,
 * payload-free operational notice. Both the URL and signing secret are
 * deployment configuration only, never tenant input (SSRF boundary).
 *
 * Signing contract:
 *   X-SANAD-Alert-Id:  <event id>
 *   X-SANAD-Timestamp: <unix seconds>
 *   X-SANAD-Signature: sha256=<HMAC-SHA256(timestamp + "." + raw body)>
 *
 * Alerts are best-effort. A receiver failure is logged and never changes the
 * dead-letter state or fails the sweep; operators can still list/retry through
 * the ADMIN API.
 */
@Injectable()
export class OutboxDeadLetterAlerter {
  private readonly logger = new Logger(OutboxDeadLetterAlerter.name);
  private disabledLogged = false;

  get enabled(): boolean {
    return Boolean(this.config().url && this.config().secret);
  }

  get disabledReason(): string {
    const { url, secret } = this.config();
    if (!url) {
      return "OUTBOX_ALERT_WEBHOOK_URL is not set";
    }
    if (!secret) {
      return "OUTBOX_ALERT_WEBHOOK_SECRET is not set";
    }
    return "dead-letter alerting is not configured";
  }

  async send(
    alert: OutboxDeadLetterAlert,
  ): Promise<OutboxDeadLetterAlertResult> {
    const { url, secret } = this.config();
    if (!url || !secret) {
      if (!this.disabledLogged) {
        this.disabledLogged = true;
        this.logger.log(
          `Outbox dead-letter alerter idle: ${this.disabledReason}.`,
        );
      }
      return { sent: false, skipped: true, reason: this.disabledReason };
    }

    const body = JSON.stringify({
      alert: "outbox.dead_letter",
      tenantId: alert.tenantId,
      eventId: alert.eventId,
      eventType: alert.eventType,
      attempt: alert.attempt,
      error: alert.error,
      deadAt: new Date().toISOString(),
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), outboxTimeoutMs());

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SANAD-Alert-Id": alert.eventId,
          "X-SANAD-Timestamp": String(timestamp),
          "X-SANAD-Signature": `sha256=${signature}`,
        },
        body,
        redirect: "error",
        signal: controller.signal,
      });

      if (response.status < 200 || response.status >= 300) {
        const reason = `http-${response.status}`;
        this.logger.warn(
          `Outbox dead-letter alert failed: tenant=${alert.tenantId} event=${alert.eventId} type=${alert.eventType} reason=${reason}`,
        );
        return { sent: false, skipped: false, reason };
      }

      this.logger.warn(
        `Outbox dead-letter alert sent: tenant=${alert.tenantId} event=${alert.eventId} type=${alert.eventType} attempt=${alert.attempt}`,
      );
      return { sent: true, skipped: false };
    } catch (error) {
      const reason =
        error instanceof Error && error.name === "AbortError"
          ? "timeout"
          : "network-error";
      this.logger.warn(
        `Outbox dead-letter alert failed: tenant=${alert.tenantId} event=${alert.eventId} type=${alert.eventType} reason=${reason}`,
      );
      return { sent: false, skipped: false, reason };
    } finally {
      clearTimeout(timer);
    }
  }

  private config(): { url: string; secret: string } {
    return {
      url: process.env.OUTBOX_ALERT_WEBHOOK_URL?.trim() || "",
      secret: process.env.OUTBOX_ALERT_WEBHOOK_SECRET?.trim() || "",
    };
  }
}
