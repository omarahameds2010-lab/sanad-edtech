import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import { ProviderRegistryService } from "./providers/provider-registry.service";
import { ProviderRouterService } from "./routing/provider-router.service";
import { VoucherProvider } from "./providers/voucher/voucher.provider";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { OutboxService } from "../outbox/outbox.service";
import { LedgerService } from "./ledger/ledger.service";
import { PaymentRiskService } from "./fraud/payment-risk.service";
import { IdempotencyService } from "./security/idempotency.service";
import { PaymentAuditService } from "./security/payment-audit.service";
import {
  PaymentMethod,
  PaymentStatus,
  PaymentIntentStatus,
  PaymentAttemptStatus,
  OrderStatus,
  VoucherDiscountType,
  Prisma,
} from "@prisma/client";
import * as crypto from "crypto";

export interface CreateOrderInput {
  tenantId: string;
  userId: string;
  items: {
    resourceType: string;
    resourceId: string;
    name: string;
    quantity: number;
    unitPriceMinor: bigint;
    metadata?: Record<string, any>;
  }[];
  currency?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentIntentInput {
  tenantId: string;
  userId: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  requestedProvider?: string;
  returnUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  paymentId?: string;
  providerPaymentId?: string;
  providerTransactionId?: string;
  redirectUrl?: string;
  clientToken?: string;
  expiresAt?: Date;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class PaymentOrchestratorService {
  constructor(
    private prisma: PrismaService,
    private providerRegistry: ProviderRegistryService,
    private providerRouter: ProviderRouterService,
    private voucherProvider: VoucherProvider,
    private entitlementsService: EntitlementsService,
    private featureFlags: FeatureFlagsService,
    private authorization: AuthorizationService,
    private outbox: OutboxService,
    private ledger: LedgerService,
    private risk: PaymentRiskService,
    private idempotency: IdempotencyService,
    private audit: PaymentAuditService,
    @Inject(forwardRef(() => AuthorizationService))
    private authz: AuthorizationService,
  ) {}

  /**
   * Create an order with server-side pricing
   */
  async createOrder(
    input: CreateOrderInput,
  ): Promise<{ orderId: string; totalMinor: bigint }> {
    const { tenantId, userId, items, currency = "EGP", metadata } = input;

    // Verify user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!user) throw new NotFoundException("User not found in tenant");

    // Calculate server-side pricing
    let subtotalMinor = 0n;
    const validatedItems = [];

    for (const item of items) {
      // Verify resource exists and get actual price
      const { priceMinor, name: actualName } = await this.getResourcePrice(
        tenantId,
        item.resourceType,
        item.resourceId,
      );

      if (priceMinor !== item.unitPriceMinor) {
        throw new BadRequestException(
          `Price mismatch for ${item.resourceType} ${item.resourceId}`,
        );
      }

      subtotalMinor += priceMinor * BigInt(item.quantity);
      validatedItems.push({
        ...item,
        unitPriceMinor: priceMinor,
        name: actualName || item.name,
        totalMinor: priceMinor * BigInt(item.quantity),
      });
    }

    // Apply discounts if any (voucher handled separately)
    const discountMinor = 0n; // TODO: Implement discount logic
    const totalMinor = subtotalMinor - discountMinor;

    // Create order
    const order = await this.prisma.order.create({
      data: {
        tenantId,
        userId,
        number: await this.generateOrderNumber(tenantId),
        currency,
        subtotalMinor,
        discountMinor,
        totalMinor,
        status: "PENDING",
        metadata,
        items: {
          create: validatedItems.map((item) => ({
            tenantId,
            resourceType: item.resourceType,
            resourceId: item.resourceId,
            name: item.name,
            quantity: item.quantity,
            unitPriceMinor: item.unitPriceMinor,
            totalMinor: item.totalMinor,
            metadata: item.metadata,
          })),
        },
      },
    });

    await this.audit.log(tenantId, userId, "ORDER_CREATED", "order", order.id, {
      totalMinor: totalMinor.toString(),
      itemCount: items.length,
    });

    return { orderId: order.id, totalMinor };
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    input: CreatePaymentIntentInput,
    idempotencyKey: string,
  ): Promise<PaymentResult> {
    const {
      tenantId,
      userId,
      orderId,
      paymentMethod,
      requestedProvider,
      returnUrl,
      webhookUrl,
      metadata,
    } = input;

    // Verify idempotency
    const idempotent = await this.idempotency.checkAndStore(
      tenantId,
      userId,
      idempotencyKey,
      "payment_intent_create",
      input,
    );
    if (!idempotent.isNew) {
      const existing = await this.prisma.paymentIntent.findUnique({
        where: { id: idempotent.existingId },
      });
      if (existing) return this.mapIntentToResult(existing);
    }

    // Verify order
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, userId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "PENDING")
      throw new BadRequestException("Order not in pending state");

    // Check feature flags
    const flags = await this.featureFlags.getTenantFlags(tenantId);
    if (paymentMethod !== "VOUCHER" && !flags.payments?.enabled) {
      throw new ForbiddenException("Payments not enabled for this tenant");
    }

    // Risk pre-check
    const riskScore = await this.risk.scorePaymentAttempt(
      tenantId,
      userId,
      order.totalMinor,
      paymentMethod,
    );
    if (riskScore >= 80) {
      throw new ForbiddenException({
        code: "RISK_BLOCKED",
        message: "Payment blocked due to risk assessment",
      });
    }

    // Select provider
    let provider: any;
    if (paymentMethod === "VOUCHER") {
      provider = this.voucherProvider;
    } else if (requestedProvider) {
      provider = this.providerRegistry.getProvider(requestedProvider);
      if (
        !provider ||
        !this.providerRegistry.isProviderAvailable(requestedProvider)
      ) {
        throw new BadRequestException("Requested provider not available");
      }
    } else {
      provider = await this.providerRouter.selectProvider(
        tenantId,
        paymentMethod,
        order.totalMinor,
        order.currency,
      );
      if (!provider) {
        throw new BadRequestException(
          "No available provider for this payment method",
        );
      }
    }

    // Create payment intent
    const intent = await this.prisma.paymentIntent.create({
      data: {
        tenantId,
        orderId,
        userId,
        amountMinor: order.totalMinor,
        currency: order.currency,
        requestedMethod: paymentMethod,
        provider: provider.name,
        status: "CREATED",
        idempotencyKey,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        metadata: { ...metadata, returnUrl, webhookUrl, riskScore },
      },
    });

    // If voucher, handle directly
    if (paymentMethod === "VOUCHER") {
      return this.processVoucherPayment(
        tenantId,
        userId,
        order,
        intent,
        metadata,
      );
    }

    // Create provider payment
    const providerInput = this.buildProviderInput(order, input, intent.id);
    const providerResult = await provider.createPayment(providerInput);

    if (!providerResult.success) {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          metadata: { ...metadata, providerError: providerResult.errorMessage },
        },
      });
      throw new BadRequestException(
        providerResult.errorMessage || "Payment initialization failed",
      );
    }

    // Update intent with provider info
    await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "PROCESSING",
        externalIntentId: providerResult.providerPaymentId,
        provider: provider.name,
      },
    });

    return {
      success: true,
      paymentIntentId: intent.id,
      providerPaymentId: providerResult.providerPaymentId,
      providerTransactionId: providerResult.providerTransactionId,
      redirectUrl: providerResult.redirectUrl,
      clientToken: providerResult.clientToken,
      expiresAt: providerResult.expiresAt,
    };
  }

  /**
   * Process voucher payment
   */
  private async processVoucherPayment(
    tenantId: string,
    userId: string,
    order: any,
    intent: any,
    metadata?: Record<string, any>,
  ): Promise<PaymentResult> {
    // For voucher, we need the voucher code from metadata
    const voucherCode = metadata?.voucherCode;
    if (!voucherCode) {
      throw new BadRequestException("Voucher code required");
    }

    // Check if course matches
    const courseId = order.items[0]?.resourceId;

    const result = await this.voucherProvider.redeemVoucher(
      tenantId,
      userId,
      voucherCode,
      courseId,
      {
        orderId: order.id,
        intentId: intent.id,
      },
    );

    if (!result.success) {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          metadata: { ...metadata, voucherError: result.errorMessage },
        },
      });
      throw new BadRequestException(result.errorMessage);
    }

    // Create payment record for voucher
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        orderId: order.id,
        userId,
        paymentIntentId: intent.id,
        provider: "voucher",
        paymentMethod: "VOUCHER",
        status: "PAID",
        amountMinor: order.totalMinor,
        currency: order.currency,
        providerTransactionId: `voucher_${intent.id}`,
        confirmedAt: new Date(),
        metadata: {
          voucherId: result.voucher?.id,
          voucherCode: metadata?.voucherCode,
        },
      },
    });

    // Complete the order
    await this.completePayment(
      tenantId,
      payment.id,
      order.id,
      userId,
      "voucher",
    );

    return {
      success: true,
      paymentIntentId: intent.id,
      paymentId: payment.id,
      providerTransactionId: payment.providerTransactionId,
    };
  }

  /**
   * Handle provider callback/redirect
   */
  async handleProviderCallback(
    tenantId: string,
    providerName: string,
    query: Record<string, any>,
  ): Promise<{ success: boolean; orderId?: string; paymentId?: string }> {
    const provider = this.providerRegistry.getProvider(providerName);
    if (!provider) throw new BadRequestException("Invalid provider");

    // Verify payment with provider
    const intent = await this.prisma.paymentIntent.findFirst({
      where: {
        tenantId,
        provider: providerName,
        externalIntentId: query.payment_token || query.referenceNumber,
      },
    });

    if (!intent) throw new NotFoundException("Payment intent not found");

    const verification = await provider.verifyPayment({
      providerTransactionId: query.payment_token || query.referenceNumber,
      providerPaymentId: query.referenceNumber,
      orderId: intent.orderId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
    });

    if (verification.status !== "PAID") {
      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          metadata: { providerVerificationFailed: true },
        },
      });
      return { success: false };
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        orderId: intent.orderId,
        userId: intent.userId,
        paymentIntentId: intent.id,
        provider: providerName,
        paymentMethod: intent.requestedMethod,
        status: "PAID",
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        providerTransactionId:
          verification.providerTransactionId ||
          query.payment_token ||
          query.referenceNumber,
        confirmedAt: new Date(),
        metadata: { providerCallback: query },
      },
    });

    // Complete order
    await this.completePayment(
      tenantId,
      payment.id,
      intent.orderId,
      intent.userId,
      providerName,
    );

    return { success: true, orderId: intent.orderId, paymentId: payment.id };
  }

  /**
   * Complete payment - create ledger, enrollment, outbox events
   */
  private async completePayment(
    tenantId: string,
    paymentId: string,
    orderId: string,
    userId: string,
    providerName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Update payment
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: "PAID", confirmedAt: new Date() },
      });

      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
      });

      // Create ledger entries
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      await this.ledger.recordPayment(tx, tenantId, payment!, providerName);

      // Grant entitlements for course items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      for (const item of order!.items) {
        if (item.resourceType === "course") {
          await this.entitlementsService.grantCourseEntitlement(
            tenantId,
            userId,
            item.resourceId,
            "purchase",
            { orderId, paymentId, provider: providerName },
          );
        }
      }

      // Publish event
      await this.outbox.publish(tenantId, {
        eventType: "payment.paid",
        aggregateType: "payment",
        aggregateId: paymentId,
        payload: {
          paymentId,
          orderId,
          userId,
          amountMinor: payment!.amountMinor.toString(),
          provider: providerName,
        },
      });
    });

    await this.audit.log(
      tenantId,
      userId,
      "PAYMENT_COMPLETED",
      "payment",
      paymentId,
      { provider: providerName },
    );
  }

  /**
   * Process refund
   */
  async processRefund(
    tenantId: string,
    paymentId: string,
    amountMinor: bigint,
    reason: string,
    requestedBy: string,
    idempotencyKey: string,
  ): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status !== "PAID")
      throw new BadRequestException("Payment not in paid state");
    if (payment.refundedAt)
      throw new BadRequestException("Payment already refunded");

    // Check refundable amount
    const totalRefunded = await this.prisma.refund.aggregate({
      where: { paymentId, status: "SUCCEEDED" },
      _sum: { amountMinor: true },
    });
    const alreadyRefunded = totalRefunded._sum.amountMinor || 0n;
    if (alreadyRefunded + amountMinor > payment.amountMinor) {
      throw new BadRequestException("Refund amount exceeds payment amount");
    }

    // Idempotency
    const idempotent = await this.idempotency.checkAndStore(
      tenantId,
      requestedBy,
      idempotencyKey,
      "refund_create",
      { paymentId, amountMinor },
    );
    if (!idempotent.isNew) return;

    // Create refund record
    const refund = await this.prisma.refund.create({
      data: {
        tenantId,
        paymentId,
        orderId: payment.orderId,
        userId: payment.userId,
        requestedBy,
        amountMinor,
        currency: payment.currency,
        reason,
        status: "PENDING",
        metadata: { idempotencyKey },
      },
    });

    // Process with provider if possible
    if (payment.provider !== "voucher") {
      const provider = this.providerRegistry.getProvider(payment.provider);
      if (provider?.refund) {
        const refundResult = await provider.refund({
          providerPaymentId: payment.providerTransactionId!,
          providerTransactionId: payment.providerTransactionId!,
          amountMinor,
          currency: payment.currency,
          reason,
          idempotencyKey,
        });

        if (refundResult.success) {
          await this.prisma.refund.update({
            where: { id: refund.id },
            data: {
              status: "SUCCEEDED",
              providerRefundId: refundResult.providerRefundId,
              processedAt: new Date(),
            },
          });
        } else {
          await this.prisma.refund.update({
            where: { id: refund.id },
            data: {
              status: "FAILED",
              metadata: { error: refundResult.errorMessage },
            },
          });
          throw new BadRequestException(
            refundResult.errorMessage || "Refund failed",
          );
        }
      }
    } else {
      // Voucher refund - restore voucher usage
      await this.processVoucherRefund(tenantId, payment, amountMinor);
    }

    // Record refund in ledger
    await this.ledger.recordRefund(
      this.prisma,
      tenantId,
      refund,
      payment.provider,
    );

    // Publish event
    await this.outbox.publish(tenantId, {
      eventType: "payment.refunded",
      aggregateType: "refund",
      aggregateId: refund.id,
      payload: {
        refundId: refund.id,
        paymentId,
        amountMinor: amountMinor.toString(),
      },
    });

    await this.audit.log(
      tenantId,
      requestedBy,
      "REFUND_PROCESSED",
      "refund",
      refund.id,
      {
        paymentId,
        amountMinor: amountMinor.toString(),
      },
    );
  }

  private async processVoucherRefund(
    tenantId: string,
    payment: any,
    amountMinor: bigint,
  ): Promise<void> {
    // Find voucher redemption and restore usage
    const redemption = await this.prisma.voucherRedemption.findFirst({
      where: {
        userId: payment.userId,
        metadata: { path: ["orderId"], equals: payment.orderId },
      },
    });

    if (redemption) {
      await this.prisma.voucher.update({
        where: { id: redemption.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  }

  /**
   * Helper methods
   */
  private async getResourcePrice(
    tenantId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<{ priceMinor: bigint; name: string }> {
    switch (resourceType) {
      case "course": {
        const course = await this.prisma.course.findFirst({
          where: { id: resourceId, tenantId },
        });
        if (!course) throw new NotFoundException("Course not found");
        return {
          priceMinor: BigInt(Math.round(Number(course.price) * 100)),
          name: course.title,
        };
      }
      case "voucher":
        return { priceMinor: 0n, name: "Voucher" };
      default:
        throw new BadRequestException(
          `Unsupported resource type: ${resourceType}`,
        );
    }
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.order.count({ where: { tenantId } });
    return `ORD-${tenantId.slice(0, 8)}-${String(count + 1).padStart(6, "0")}`;
  }

  private buildProviderInput(
    order: any,
    input: CreatePaymentIntentInput,
    intentId: string,
  ): any {
    return {
      amountMinor: order.totalMinor,
      currency: order.currency,
      orderId: order.id,
      userId: input.userId,
      paymentMethod: input.paymentMethod,
      customerEmail: input.metadata?.customerEmail,
      customerPhone: input.metadata?.customerPhone,
      customerName: input.metadata?.customerName,
      returnUrl: input.returnUrl,
      webhookUrl: input.webhookUrl,
      metadata: { ...input.metadata, intentId },
      idempotencyKey: `${intentId}_${Date.now()}`,
    };
  }

  private mapIntentToResult(intent: any): PaymentResult {
    return {
      success: intent.status === "PAID" || intent.status === "PROCESSING",
      paymentIntentId: intent.id,
      providerPaymentId: intent.externalIntentId,
      providerTransactionId: intent.providerTransactionId,
      errorCode: intent.status === "FAILED" ? "INTENT_FAILED" : undefined,
    };
  }
}
