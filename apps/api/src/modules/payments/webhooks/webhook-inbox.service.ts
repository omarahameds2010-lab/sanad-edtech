import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import { ProviderRegistryService } from '../providers/provider-registry.service';
import { PaymentOrchestratorService } from '../payment-orchestrator.service';
import { IdempotencyService } from '../security/idempotency.service';
import { PaymentAuditService } from '../security/payment-audit.service';
import { OutboxService } from '../../outbox/outbox.service';
import { Prisma, WebhookProcessingStatus } from '@prisma/client';

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

  async receiveWebhook(
    provider: string,
    rawBody: string | Buffer,
    headers: Record<string, string>,
    secret: string,
  ): Promise<{ received: boolean; eventId?: string }> {
    const providerInstance = this.providerRegistry.getProvider(provider);
    if (!providerInstance) {
      throw new Error(`Provider ${provider} not found`);
    }

    // Generate payload hash for deduplication
    const payloadHash = this.hashPayload(rawBody);

    // Check if already processed
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { provider_externalEventId: { provider, externalEventId: headers['x-event-id'] || '' } },
    });

    if (existing) {
      return { received: true, eventId: existing.id };
    }

    // Verify signature
    const verification = await providerInstance.verifyWebhook({
      provider,
      rawBody,
      headers,
      secret,
    });

    if (!verification.valid) {
      await this.recordWebhookEvent(provider, headers['x-event-id'] || '', 'SIGNATURE_INVALID', {
        signatureVerified: false,
        payloadHash,
        processingStatus: 'FAILED',
        errorCode: verification.errorCode,
      });
      throw new Error(`Invalid webhook signature: ${verification.errorCode}`);
    }

    // Persist webhook event
    const event = await this.recordWebhookEvent(provider, verification.externalEventId || headers['x-event-id'] || '', verification.eventType || 'UNKNOWN', {
      signatureVerified: true,
      payloadHash,
      processingStatus: 'PENDING',
    });

    // Queue for processing
    await this.queueForProcessing(event.id);

    return { received: true, eventId: event.id };
  }

  private async recordWebhookEvent(
    provider: string,
    externalEventId: string,
    eventType: string,
    data: Partial<Prisma.WebhookEventCreateInput>,
  ) {
    return this.prisma.webhookEvent.create({
      data: {
        provider,
        externalEventId,
        eventType,
        ...data,
      } as Prisma.WebhookEventCreateInput,
    });
  }

  private async queueForProcessing(eventId: string): Promise<void> {
    // In a real implementation, this would push to a queue (BullMQ)
    // For now, process synchronously
    setImmediate(() => this.processEvent(eventId));
  }

  async processEvent(eventId: string): Promise<void> {
    const event = await this.prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (!event) return;

    // Update status to processing
    await this.prisma.webhookEvent.update({
      where: { id: eventId },
      data: { processingStatus: 'PROCESSING', processedAt: new Date() },
    });

    try {
      // Process based on event type
      await this.handleEvent(event);

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: { processingStatus: 'PROCESSED' },
      });
    } catch (error) {
      // Mark as failed
      await this.prisma.webhookEvent.update({
        where: { id: eventId },
        data: { processingStatus: 'FAILED', errorCode: error.message },
      });
      throw error;
    }
  }

  private async handleEvent(event: any): Promise<void> {
    const { provider, eventType, externalEventId, rawPayload, id: webhookEventId } = event;

    switch (eventType) {
      case 'payment.paid':
      case 'payment.completed':
      case 'payment.succeeded':
        await this.handlePaymentPaid(provider, rawPayload, webhookEventId);
        break;
      case 'payment.failed':
      case 'payment.cancelled':
      case 'payment.expired':
        await this.handlePaymentFailed(provider, rawPayload, eventType);
        break;
      case 'payment.refunded':
        await this.handleRefundCompleted(provider, rawPayload);
        break;
      case 'payment.pending':
        // Just log, no action needed
        break;
      default:
        // Log unknown event types
        console.warn(`Unhandled webhook event type: ${eventType} from ${provider}`);
    }
  }

  private async handlePaymentPaid(provider: string, payload: any, webhookEventId: string): Promise<void> {
    const transactionId = payload.id || payload.transaction_id || payload.referenceNumber;
    const orderId = payload.merchant_order_id || payload.merchantRefNum || payload.order?.id;

    if (!orderId) return;

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { orderId, provider, status: 'PROCESSING' },
    });

    if (!intent) return;

    // Verify payment with provider
    const providerInstance = this.providerRegistry.getProvider(provider);
    if (!providerInstance) return;

    const verification = await providerInstance.verifyPayment({
      providerTransactionId: transactionId,
      providerPaymentId: orderId,
      orderId: intent.orderId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
    });

    if (verification.status !== 'PAID') return;

    // Check idempotency
    const idempotent = await this.idempotency.checkAndStore(
      intent.tenantId,
      intent.userId,
      `webhook_payment_${provider}_${transactionId}`,
      'webhook_payment_process',
      { transactionId, orderId },
    );

    if (!idempotent.isNew) return;

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        tenantId: intent.tenantId,
        orderId: intent.orderId,
        userId: intent.userId,
        paymentIntentId: intent.id,
        provider,
        paymentMethod: intent.requestedMethod,
        status: 'PAID',
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        providerTransactionId: transactionId,
        confirmedAt: new Date(),
        metadata: { webhookEventId: webhookEventId },
      },
    });

    // Complete payment
    await this.orchestrator['completePayment'](
      intent.tenantId,
      payment.id,
      intent.orderId,
      intent.userId,
      provider,
    );

    // Mark idempotency as completed
    await this.idempotency.markCompleted(intent.tenantId, `webhook_payment_${provider}_${transactionId}`, { paymentId: payment.id });
  }

  private async handlePaymentFailed(provider: string, payload: any, eventType: string): Promise<void> {
    const orderId = payload.merchant_order_id || payload.merchantRefNum || payload.order?.id;
    const failureCode = payload.failure_code || payload.error_code || 'PROVIDER_FAILED';
    const failureReason = payload.failure_reason || payload.error_message || eventType;

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { orderId, provider },
    });

    if (!intent) return;

    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: 'FAILED',
        metadata: { ...(intent.metadata as Record<string, any>), failureCode, failureReason, webhookEvent: payload },
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
        status: 'FAILED',
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        failureCode,
        failureReason,
        metadata: { webhookEvent: payload },
      },
    });
  }

  private async handleRefundCompleted(provider: string, payload: any): Promise<void> {
    const refundId = payload.refund_id || payload.id;
    const paymentId = payload.payment_id || payload.referenceNumber;

    // Find payment
    const payment = await this.prisma.payment.findFirst({
      where: { providerTransactionId: paymentId, provider },
    });

    if (!payment) return;

    // Update refund record
    await this.prisma.refund.updateMany({
      where: { paymentId: payment.id, providerRefundId: refundId },
      data: { status: 'SUCCEEDED', processedAt: new Date() },
    });
  }

  private hashPayload(body: string | Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(typeof body === 'string' ? body : body.toString()).digest('hex');
  }

  async retryFailedWebhooks(): Promise<number> {
    const failedEvents = await this.prisma.webhookEvent.findMany({
      where: { processingStatus: 'FAILED' },
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