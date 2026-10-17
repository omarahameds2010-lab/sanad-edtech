import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { ProviderRegistryService } from "../providers/provider-registry.service";
import { PaymentOrchestratorService } from "../payment-orchestrator.service";
import { IdempotencyService } from "../security/idempotency.service";
import { PaymentAuditService } from "../security/payment-audit.service";
import { OutboxService } from "../../outbox/outbox.service";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class WebhookInboxService {
  constructor(
    private prisma: PrismaService,
    private providerRegistry: ProviderRegistryService,
    private orchestrator: PaymentOrchestratorService,
    private idempotency: IdempotencyService,
    private audit: PaymentAuditService,
    private outbox: OutboxService,
  ) {}

  /**
   * Receive, verify and persist a provider webhook (audit 2026-10-16 §5.1).
   *
   * Order matters:
   *  1. The raw body must exist — main.ts boots Nest with `rawBody: true`;
   *     without it no provider HMAC can ever be verified.
   *  2. Signature verification runs BEFORE any persistence, so nothing
   *     unverified (or attacker-steered) is ever stored as trusted.
   *  3. The dedup key is the PROVIDER-derived event id
   *     (`verification.externalEventId`), with the `x-event-id` header and
   *     the payload hash only as fallbacks. The old code looked up by header
   *     but stored by provider id, so every genuine retry hit a P2002
   *     unique-constraint violation instead of being recognised as a replay.
   */
  async receiveWebhook(
    provider: string,
    rawBody: string | Buffer,
    headers: Record<string, string>,
    secret: string,
  ): Promise<{ received: boolean; eventId?: string }> {
    if (
      !rawBody ||
      (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody))
    ) {
      throw new BadRequestException(
        `Missing raw body for ${provider} webhook (is rawBody enabled?)`,
      );
    }

    const providerInstance = this.providerRegistry.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not found`);
    }

    const payloadHash = this.hashPayload(rawBody);
    const rawPayload = this.parsePayload(rawBody);

    const verification = await providerInstance.verifyWebhook({
      provider,
      rawBody,
      headers,
      secret,
    });

    const externalEventId =
      verification.externalEventId || headers["x-event-id"] || payloadHash;

    if (!verification.valid) {
      await this.recordUnverifiedEvent(provider, externalEventId, {
        payloadHash,
        rawPayload,
        errorCode: verification.errorCode,
      });
      throw new Error(`Invalid webhook signature: ${verification.errorCode}`);
    }

    // Replay of an already-seen event: return the original row, never re-queue.
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_externalEventId: { provider, externalEventId },
      },
    });

    if (existing) {
      return { received: true, eventId: existing.id };
    }

    let event: { id: string };
    try {
      event = await this.prisma.webhookEvent.create({
        data: {
          provider,
          externalEventId,
          eventType: verification.eventType || "UNKNOWN",
          signatureVerified: true,
          payloadHash,
          rawPayload,
          processingStatus: "PENDING",
        },
      });
    } catch (error) {
      // Concurrent retry won the insert race: both requests verified the same
      // event id; the loser returns the winner's row instead of exploding.
      if (this.isUniqueViolation(error)) {
        const raced = await this.prisma.webhookEvent.findUnique({
          where: {
            provider_externalEventId: { provider, externalEventId },
          },
        });
        if (raced) return { received: true, eventId: raced.id };
      }
      throw error;
    }

    await this.queueForProcessing(event.id);

    return { received: true, eventId: event.id };
  }

  /**
   * Persist a failed signature check for forensics. Repeated probes of the
   * same payload hit the unique key — that replay is ignored, not a crash.
   */
  private async recordUnverifiedEvent(
    provider: string,
    externalEventId: string,
    data: {
      payloadHash: string;
      rawPayload: Prisma.InputJsonValue;
      errorCode?: string;
    },
  ): Promise<void> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider,
          externalEventId,
          eventType: "SIGNATURE_INVALID",
          signatureVerified: false,
          processingStatus: "FAILED",
          ...data,
        },
      });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  private async queueForProcessing(eventId: string): Promise<void> {
    // In a real implementation, this would push to a queue (BullMQ); for now
    // the event runs on the next tick. The rejection MUST be swallowed here:
    // `processEvent` records FAILED + errorCode on the row before rethrowing,
    // and an unhandled rejection takes the whole API process down — the
    // bundle-B live smoke left an orphan `INTENT_NOT_FOUND` event that killed
    // the server moments after every HTTP check had passed.
    setImmediate(() => {
      this.processEvent(eventId).catch((error) => {
        console.error(
          `Webhook processing failed for event ${eventId}: ${error?.message ?? error}`,
        );
      });
    });
  }

  async processEvent(eventId: string): Promise<void> {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) return;

    // Update status to processing
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { processingStatus: "PROCESSING", processedAt: new Date() },
    });

    try {
      // Process based on event type
      await this.handleEvent(event);

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: { processingStatus: "PROCESSED" },
      });
    } catch (error) {
      // Mark as failed
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: { processingStatus: "FAILED", errorCode: error.message },
      });
      throw error;
    }
  }

  private async handleEvent(event: any): Promise<void> {
    const { provider, eventType, rawPayload, id: webhookEventId } = event;

    switch (eventType) {
      case "payment.paid":
      case "payment.completed":
      case "payment.succeeded":
        await this.handlePaymentPaid(provider, rawPayload, webhookEventId);
        break;
      case "payment.failed":
      case "payment.cancelled":
      case "payment.expired":
        await this.handlePaymentFailed(provider, rawPayload, eventType);
        break;
      case "payment.refunded":
        await this.handleRefundCompleted(provider, rawPayload, webhookEventId);
        break;
      case "payment.pending":
        // Just log, no action needed
        break;
      default:
        // Log unknown event types
        console.warn(
          `Unhandled webhook event type: ${eventType} from ${provider}`,
        );
    }
  }

  /** Paymob wraps the transaction in `{ type, obj }`; Fawry sends it flat. */
  private unwrapPayload(payload: any): any {
    return payload?.obj ?? payload ?? {};
  }

  /**
   * Our order uuid as sent to the provider (Paymob `merchant_order_id`,
   * Fawry `merchantRefNum`), with the provider's own order id as a fallback.
   */
  private extractOrderId(obj: any): string | null {
    const candidate =
      obj?.merchantRefNum ||
      obj?.order?.merchant_order_id ||
      obj?.merchant_order_id ||
      obj?.order?.id ||
      null;
    return candidate === null || candidate === "" ? null : String(candidate);
  }

  private async handlePaymentPaid(
    provider: string,
    payload: any,
    webhookEventId: string,
  ): Promise<void> {
    const obj = this.unwrapPayload(payload);
    const transactionId =
      obj.id ?? obj.transaction_id ?? obj.referenceNumber ?? obj.fawryRefNumber;
    const orderId = this.extractOrderId(obj);

    if (transactionId === undefined && orderId === null) return;

    // Primary match: our order uuid. Fallback: the provider's own order id,
    // kept on the intent as `externalIntentId` at creation time.
    let intent = orderId
      ? await this.prisma.paymentIntent.findFirst({
          where: { orderId, provider, status: "PROCESSING" },
        })
      : null;

    if (!intent && obj.order?.id !== undefined) {
      intent = await this.prisma.paymentIntent.findFirst({
        where: {
          externalIntentId: String(obj.order.id),
          provider,
          status: "PROCESSING",
        },
      });
    }

    if (!intent) {
      // No PROCESSING intent. Three very different cases (bundle B/C):
      //  - a redelivery for a transaction this inbox already settled → drop
      //    it as a duplicate no-op;
      //  - the order's intent is ALREADY SETTLED with a DIFFERENT transaction
      //    id: the provider charged twice for one order → record a risk event
      //    and keep the failure visible (reversing the extra charge is a
      //    manual decision, not an automatic one);
      //  - the delivery raced intent creation (or the transaction is not
      //    ours) → never swallow it: fail the event so it stays visible and
      //    `retryFailedWebhooks` can finish it once the intent exists.
      if (transactionId !== undefined) {
        const settled = await this.prisma.payment.findFirst({
          where: { provider, providerTransactionId: String(transactionId) },
        });
        if (settled) return;
      }

      let settledIntent = orderId
        ? await this.prisma.paymentIntent.findFirst({
            where: { orderId, provider },
          })
        : null;
      if (!settledIntent && obj.order?.id !== undefined) {
        settledIntent = await this.prisma.paymentIntent.findFirst({
          where: { externalIntentId: String(obj.order.id), provider },
        });
      }
      if (settledIntent) {
        const settledPayment = await this.prisma.payment.findFirst({
          where: {
            paymentIntentId: settledIntent.id,
            provider,
            status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] },
          },
        });
        if (
          settledPayment &&
          transactionId !== undefined &&
          String(transactionId) !==
            String(settledPayment.providerTransactionId ?? "")
        ) {
          await this.prisma.paymentRiskEvent.create({
            data: {
              tenantId: settledPayment.tenantId,
              paymentId: settledPayment.id,
              userId: settledPayment.userId,
              eventType: "SECOND_CHARGE_DETECTED",
              severity: "HIGH",
              score: 90,
              details: {
                provider,
                incomingTransactionId: String(transactionId),
                settledTransactionId: settledPayment.providerTransactionId,
                orderId: settledIntent.orderId,
              },
            },
          });
          throw new Error(`SECOND_CHARGE_DETECTED:${transactionId}`);
        }
      }

      throw new Error(
        `INTENT_NOT_FOUND:${orderId ?? String(obj.order?.id ?? "unknown")}`,
      );
    }

    // NOTE (audit 2026-10-16 §5.1): the previous flow re-verified the payment
    // through the provider API, but the intent never stores the Paymob payment
    // token that `verifyPayment` needs, so that gate always failed. The
    // webhook HMAC was already verified against the provider secret at receive
    // time — the documented source of truth — and the idempotency key below
    // guards against double-processing.
    const idempotencyKey = `webhook_payment_${provider}_${transactionId ?? webhookEventId}`;

    // Claim the key. `response` is set only when a previous attempt COMPLETED;
    // a PENDING claim without a response means either a concurrent attempt or
    // one that died before finishing — both resume below (bundle B), which is
    // safe because completion is transactional and the payment row is reused.
    const idempotent = await this.idempotency.checkAndStore(
      intent.tenantId,
      intent.userId,
      idempotencyKey,
      "webhook_payment_process",
      { transactionId, orderId: intent.orderId },
    );

    if (!idempotent.isNew && idempotent.response !== undefined) return;

    // Reuse the row a crashed attempt left behind instead of inserting a
    // second PAID payment for the same intent.
    let payment = await this.prisma.payment.findFirst({
      where: { paymentIntentId: intent.id, provider, status: "PAID" },
    });

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          tenantId: intent.tenantId,
          orderId: intent.orderId,
          userId: intent.userId,
          paymentIntentId: intent.id,
          provider,
          paymentMethod: intent.requestedMethod,
          status: "PAID",
          amountMinor: intent.amountMinor,
          currency: intent.currency,
          providerTransactionId:
            transactionId !== undefined ? String(transactionId) : undefined,
          confirmedAt: new Date(),
          metadata: { webhookEventId: webhookEventId },
        },
      });
    }

    // Complete payment (public since bundle B; all-or-nothing in one
    // transaction, so re-running after a failure is safe).
    await this.orchestrator.completePayment(
      intent.tenantId,
      payment.id,
      intent.orderId,
      intent.userId,
      provider,
    );

    // Mark idempotency as completed
    await this.idempotency.markCompleted(intent.tenantId, idempotencyKey, {
      paymentId: payment.id,
    });
  }

  private async handlePaymentFailed(
    provider: string,
    payload: any,
    eventType: string,
  ): Promise<void> {
    const obj = this.unwrapPayload(payload);
    const orderId = this.extractOrderId(obj);
    const failureCode = obj.failure_code || obj.error_code || "PROVIDER_FAILED";
    const failureReason = obj.failure_reason || obj.error_message || eventType;

    let intent = orderId
      ? await this.prisma.paymentIntent.findFirst({
          where: { orderId, provider },
        })
      : null;

    if (!intent && obj.order?.id !== undefined) {
      intent = await this.prisma.paymentIntent.findFirst({
        where: { externalIntentId: String(obj.order.id), provider },
      });
    }

    if (!intent) return;

    // A provider can redeliver the failure; never pile up duplicate FAILED
    // payment rows for the same intent (bundle B).
    const existingFailure = await this.prisma.payment.findFirst({
      where: { paymentIntentId: intent.id, provider, status: "FAILED" },
    });
    if (existingFailure) return;

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "FAILED",
        metadata: {
          ...(intent.metadata as Record<string, any>),
          failureCode,
          failureReason,
          webhookEvent: payload,
        },
      },
    });

    // Create failed payment record
    await this.prisma.payment.create({
      data: {
        tenantId: intent.tenantId,
        orderId: intent.orderId,
        userId: intent.userId,
        paymentIntentId: intent.id,
        provider,
        paymentMethod: intent.requestedMethod,
        status: "FAILED",
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        failureCode,
        failureReason,
        metadata: { webhookEvent: payload },
      },
    });
  }

  /**
   * Provider says a refund finished (bundle C).
   *
   * Shapes handled:
   *  - Paymob refund callbacks (`{ obj: { id, parent_transaction,
   *    refunded_amount_cents, is_refunded: true, ... } }`);
   *  - Fawry `orderStatus: "REFUNDED"` payloads (`referenceNumber`);
   *  - dashboard-initiated refunds with no local refund row — the delta the
   *    provider reports is recorded and reversed here.
   *
   * Settlement is delegated to the orchestrator whose
   * (PENDING|PROCESSING -> SUCCEEDED) CAS guarantees the reversing ledger
   * entries are written exactly once, whether the API flow or this callback
   * gets there first.
   */
  private async handleRefundCompleted(
    provider: string,
    payload: any,
    webhookEventId?: string,
  ): Promise<void> {
    const obj = this.unwrapPayload(payload);
    const orderId = this.extractOrderId(obj);

    // Resolve the settled payment: transaction ids first (a refund callback
    // may carry the parent transaction / the original reference), then the
    // order.
    const txnCandidates = [
      obj.parent_transaction,
      obj.payment_id,
      obj.referenceNumber,
      obj.fawryRefNumber,
      obj.transaction_id,
      obj.id,
    ]
      .filter((value) => value !== undefined && value !== null && value !== "")
      .map((value) => String(value));

    let payment: any = null;
    for (const candidate of txnCandidates) {
      payment = await this.prisma.payment.findFirst({
        where: {
          provider,
          providerTransactionId: candidate,
          status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] },
        },
      });
      if (payment) break;
    }

    if (!payment && orderId) {
      let intent = await this.prisma.paymentIntent.findFirst({
        where: { orderId, provider },
      });
      if (!intent && obj.order?.id !== undefined) {
        intent = await this.prisma.paymentIntent.findFirst({
          where: { externalIntentId: String(obj.order.id), provider },
        });
      }
      if (intent) {
        payment = await this.prisma.payment.findFirst({
          where: {
            paymentIntentId: intent.id,
            provider,
            status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    if (!payment) return;

    // Provider refund id: an explicit refund id wins; otherwise `obj.id`
    // counts only when it is NOT the original (paid) transaction id.
    const explicitRefundId = obj.refund_id ?? obj.refund_transaction_id;
    const objId = obj.id !== undefined ? String(obj.id) : undefined;
    let providerRefundId =
      explicitRefundId !== undefined ? String(explicitRefundId) : undefined;
    if (
      !providerRefundId &&
      objId &&
      objId !== String(payment.providerTransactionId ?? "")
    ) {
      providerRefundId = objId;
    }

    // `refunded_amount_cents` is cumulative on Paymob; other providers may
    // send the refund amount itself. Either way it is only a target — the
    // orchestrator computes the delta against what is already reversed.
    const refundedTotalRaw =
      obj.refunded_amount_cents ?? obj.refund_amount_cents ?? obj.refund_amount;
    let refundAmountMinor: bigint | undefined;
    if (refundedTotalRaw !== undefined && refundedTotalRaw !== null) {
      const asNumber = Number(refundedTotalRaw);
      if (Number.isFinite(asNumber)) {
        refundAmountMinor = BigInt(Math.trunc(asNumber));
      }
    }

    const outcome = await this.orchestrator.settleRefundFromProvider({
      tenantId: payment.tenantId,
      paymentId: payment.id,
      provider,
      providerRefundId,
      refundAmountMinor,
      webhookEventId,
    });

    if (outcome === "settled") {
      await this.audit.log(
        payment.tenantId,
        "webhook",
        "REFUND_SETTLED_WEBHOOK",
        "refund",
        payment.id,
        { provider, providerRefundId: providerRefundId ?? null },
      );
    }
  }

  /** Raw body parsed for storage/audit; non-JSON bodies are wrapped. */
  private parsePayload(rawBody: string | Buffer): Prisma.InputJsonValue {
    const text =
      typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    try {
      const parsed = JSON.parse(text);
      if (parsed !== null && typeof parsed === "object") {
        return parsed as Prisma.InputJsonValue;
      }
      return { raw: text };
    } catch {
      return { raw: text };
    }
  }

  private hashPayload(body: string | Buffer): string {
    return crypto
      .createHash("sha256")
      .update(typeof body === "string" ? body : body.toString())
      .digest("hex");
  }

  async retryFailedWebhooks(): Promise<number> {
    // SIGNATURE_INVALID rows are evidence of an attack/probe, not work to
    // retry — replaying them would flip them to PROCESSED (bundle B).
    const failedEvents = await this.prisma.webhookEvent.findMany({
      where: {
        processingStatus: "FAILED",
        eventType: { not: "SIGNATURE_INVALID" },
      },
      take: 50,
    });

    let retried = 0;
    for (const event of failedEvents) {
      try {
        await this.processEvent(event.id);
        retried++;
      } catch {
        // Keep as failed
      }
    }
    return retried;
  }
}
