import { Injectable, Logger } from "@nestjs/common";
import { createHmac } from "node:crypto";
import { outboxTimeoutMs } from "./outbox-delivery.constants";
import type {
  OutboxDeliveryResult,
  OutboxEnvelope,
  OutboxTransport,
} from "./outbox.types";

/**
 * Sends outbox events to a single operator-configured HTTPS endpoint.
 *
 * The endpoint and signing secret are deployment configuration only. They are
 * never read from a tenant row or a request body, which keeps tenant-controlled
 * input out of the outbound URL (SSRF boundary).
 *
 * Signing contract:
 *   X-SANAD-Event-Id:  <event id>
 *   X-SANAD-Timestamp: <unix seconds>
 *   X-SANAD-Signature: sha256=<HMAC-SHA256(timestamp + "." + raw body)>
 *
 * The receiver must verify the HMAC in constant time, reject stale timestamps,
 * and deduplicate on X-SANAD-Event-Id.
 */
@Injectable()
export class HttpOutboxTransport implements OutboxTransport {
  private readonly logger = new Logger(HttpOutboxTransport.name);
  private readonly url = process.env.OUTBOX_WEBHOOK_URL?.trim() || "";
  private readonly secret = process.env.OUTBOX_WEBHOOK_SECRET?.trim() || "";
  private readonly timeoutMs = outboxTimeoutMs();

  get enabled(): boolean {
    return Boolean(this.url && this.secret);
  }

  get disabledReason(): string {
    if (!this.url) {
      return "OUTBOX_WEBHOOK_URL is not set";
    }
    if (!this.secret) {
      return "OUTBOX_WEBHOOK_SECRET is not set";
    }
    return "outbox delivery is not configured";
  }

  async deliver(envelope: OutboxEnvelope): Promise<OutboxDeliveryResult> {
    if (!this.url || !this.secret) {
      return {
        ok: false,
        retryable: false,
        error: "outbox-delivery-not-configured",
      };
    }

    const body = JSON.stringify(envelope);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", this.secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SANAD-Event-Id": envelope.id,
          "X-SANAD-Timestamp": String(timestamp),
          "X-SANAD-Signature": `sha256=${signature}`,
        },
        body,
        redirect: "error",
        signal: controller.signal,
      });

      if (response.status >= 200 && response.status < 300) {
        return { ok: true, retryable: false, status: response.status };
      }

      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      return {
        ok: false,
        retryable,
        status: response.status,
        error: `http-${response.status}`,
      };
    } catch (error) {
      return {
        ok: false,
        retryable: true,
        error:
          error instanceof Error && error.name === "AbortError"
            ? "timeout"
            : "network-error",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
