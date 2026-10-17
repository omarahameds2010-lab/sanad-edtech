import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import { applyTenantContext } from "../../common/prisma/tenant-context";
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
import { toBigIntMinor } from "../../common/money/minor-units";

export interface CreateOrderInput {
  tenantId: string;
  userId: string;
  items: {
    resourceType: string;
    resourceId: string;
    name: string;
    quantity: number;
    // Accept whatever HTTP JSON can actually carry; canonicalized server-side.
    unitPriceMinor: bigint | number | string;
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

export interface RefundInput {
  tenantId: string;
  paymentId: string;
  /** Omit for a full remaining refund. */
  amountMinor?: bigint;
  reason?: string;
  requestedBy: string;
  idempotencyKey: string;
}

export interface RefundResult {
  refundId: string;
  status: string;
  /** JSON cannot carry BigInt — refunds leave the API as digit strings. */
  amountMinor: string;
  paymentStatus: string;
  replayed?: boolean;
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

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // Verify resource exists and get actual price
      const { priceMinor, name: actualName } = await this.getResourcePrice(
        tenantId,
        item.resourceType,
        item.resourceId,
      );

      // `1 !== 1n` is always true in JS: the price from Prisma is a BigInt
      // while HTTP JSON can only send a number or a string. Canonicalize both
      // sides — otherwise every POST /payments/orders dies here with
      // "Price mismatch" (audit 2026-10-17 review, bundle A).
      const clientPriceMinor = toBigIntMinor(
        item.unitPriceMinor,
        `items[${i}].unitPriceMinor`,
      );
      if (priceMinor !== clientPriceMinor) {
        throw new BadRequestException(
          `Price mismatch for ${item.resourceType} ${item.resourceId}`,
        );
      }

      const quantity = toBigIntMinor(item.quantity, `items[${i}].quantity`);
      if (quantity <= 0n) {
        throw new BadRequestException(
          `Quantity must be a positive integer for ${item.resourceId}`,
        );
      }

      subtotalMinor += priceMinor * quantity;
      validatedItems.push({
        ...item,
        quantity: Number(quantity),
        unitPriceMinor: priceMinor,
        name: actualName || item.name,
        totalMinor: priceMinor * quantity,
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

    // Replay: a finished attempt stored its result — return it verbatim.
    if (!idempotent.isNew && idempotent.response !== undefined) {
      return idempotent.response as PaymentResult;
    }

    // The (tenantId, idempotencyKey) unique index is the real dedup guard. The
    // old code searched `payment_intent` by the *idempotency-key row's* id,
    // always missed, then inserted a second intent and died on P2002 (audit
    // 2026-10-17 review, bundle A). Reuse the previous attempt's row instead.
    const priorIntent = await this.prisma.paymentIntent.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
    });

    // A retry against an intent that is already settled — or is talking to the
    // provider right now — must never start a second provider payment.
    if (
      priorIntent &&
      (priorIntent.status === "PROCESSING" ||
        priorIntent.status === "SUCCEEDED" ||
        priorIntent.status === "REQUIRES_ACTION")
    ) {
      const replay = this.mapIntentToResult(priorIntent);
      // A renewed key lost the stored response; stamp it again so the next
      // retry takes the plain replay path.
      if (idempotent.isNew) {
        await this.idempotency.markCompleted(tenantId, idempotencyKey, replay);
      }
      return replay;
    }

    // Verify order (items included: the voucher flow needs the course id;
    // without the include, `order.items[0]` threw at runtime — live smoke
    // caught what the mocks hid)
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, userId },
      include: { items: true },
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

    // Create — or resume — the payment intent. A retry after a crash or an
    // explicit failure must reuse its row: a second insert would violate
    // @@unique([tenantId, idempotencyKey]).
    let intent: any;
    if (priorIntent) {
      if (
        priorIntent.status === "EXPIRED" ||
        priorIntent.status === "CANCELLED"
      ) {
        throw new ConflictException(
          "This idempotency key belongs to a cancelled or expired intent — start a new checkout",
        );
      }
      // CREATED (attempt died before reaching the provider) or FAILED (explicit
      // refusal): reset the same row and initialize again.
      intent = await this.prisma.paymentIntent.update({
        where: { id: priorIntent.id },
        data: {
          status: "CREATED",
          amountMinor: order.totalMinor,
          currency: order.currency,
          requestedMethod: paymentMethod,
          provider: provider.name,
          externalIntentId: null,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
          metadata: {
            ...metadata,
            returnUrl,
            webhookUrl,
            riskScore,
            resumedFrom: priorIntent.status,
          },
        },
      });
    } else {
      try {
        intent = await this.prisma.paymentIntent.create({
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
      } catch (error) {
        if (!this.isUniqueViolation(error)) throw error;
        // Two concurrent requests raced the same new key: the winner's intent
        // exists now. Replay its stored response if it already finished;
        // otherwise fail explicitly instead of initializing a second provider
        // payment for one order (bundle C).
        const keyRow = await this.prisma.idempotencyKey.findUnique({
          where: { tenantId_key: { tenantId, key: idempotencyKey } },
        });
        if (keyRow?.status === "COMPLETED" && keyRow.responseHash) {
          return JSON.parse(keyRow.responseHash) as PaymentResult;
        }
        throw new ConflictException(
          "Concurrent checkout in progress — retry with the same idempotency key",
        );
      }
    }

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
      // Release the key: an explicit provider refusal is retryable, and the
      // renew path in checkAndStore reuses the key row instead of a P2002.
      await this.idempotency.markFailed(tenantId, idempotencyKey);
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

    const result: PaymentResult = {
      success: true,
      paymentIntentId: intent.id,
      providerPaymentId: providerResult.providerPaymentId,
      providerTransactionId: providerResult.providerTransactionId,
      redirectUrl: providerResult.redirectUrl,
      clientToken: providerResult.clientToken,
      expiresAt: providerResult.expiresAt,
    };

    // Store the response so any retry with this key replays it verbatim
    // instead of initializing a second provider payment.
    await this.idempotency.markCompleted(tenantId, idempotencyKey, result);

    return result;
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

    // Crash-resume (bundle C): reuse whatever a previous attempt left behind
    // instead of redeeming the voucher twice or dying on the payment unique
    // index. A CONFIRMED order means the previous attempt finished — replay.
    const existingPayment = await this.prisma.payment.findFirst({
      where: { paymentIntentId: intent.id, provider: "voucher" },
    });
    if (existingPayment) {
      const freshOrder = await this.prisma.order.findFirst({
        where: { id: order.id },
      });
      if (freshOrder?.status === "CONFIRMED") {
        const replay: PaymentResult = {
          success: true,
          paymentIntentId: intent.id,
          paymentId: existingPayment.id,
          providerTransactionId:
            existingPayment.providerTransactionId ?? undefined,
        };
        if (intent.idempotencyKey) {
          await this.idempotency.markCompleted(
            tenantId,
            intent.idempotencyKey,
            replay,
          );
        }
        return replay;
      }
    }

    // Check if course matches
    const courseId = order.items?.[0]?.resourceId;

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
      // Crash-window guard: a previous attempt may have already paid for this
      // intent and died before completing the idempotency key. Never report a
      // paid intent as failed.
      const alreadyPaid = await this.prisma.payment.findFirst({
        where: { paymentIntentId: intent.id, status: "PAID" },
      });
      if (alreadyPaid) {
        const replay: PaymentResult = {
          success: true,
          paymentIntentId: intent.id,
          paymentId: alreadyPaid.id,
          providerTransactionId: alreadyPaid.providerTransactionId ?? undefined,
        };
        if (intent.idempotencyKey) {
          await this.idempotency.markCompleted(
            tenantId,
            intent.idempotencyKey,
            replay,
          );
        }
        return replay;
      }

      await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "FAILED",
          metadata: { ...metadata, voucherError: result.errorMessage },
        },
      });
      if (intent.idempotencyKey) {
        await this.idempotency.markFailed(tenantId, intent.idempotencyKey);
      }
      throw new BadRequestException(result.errorMessage);
    }

    // Create — or reuse — the payment record for this voucher checkout. The
    // unique (provider, providerTransactionId) row is the crash anchor for
    // retries (bundle C).
    let payment = existingPayment;
    if (!payment) {
      try {
        payment = await this.prisma.payment.create({
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
      } catch (error) {
        if (!this.isUniqueViolation(error)) throw error;
        payment = await this.prisma.payment.findFirst({
          where: { paymentIntentId: intent.id, provider: "voucher" },
        });
        if (!payment) throw error;
      }
    }

    // Complete the order
    await this.completePayment(
      tenantId,
      payment.id,
      order.id,
      userId,
      "voucher",
    );

    const voucherResult: PaymentResult = {
      success: true,
      paymentIntentId: intent.id,
      paymentId: payment.id,
      providerTransactionId: payment.providerTransactionId ?? undefined,
    };

    if (intent.idempotencyKey) {
      await this.idempotency.markCompleted(
        tenantId,
        intent.idempotencyKey,
        voucherResult,
      );
    }

    return voucherResult;
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
   * Complete payment - create ledger, enrollment, outbox events.
   *
   * Public since bundle B: the webhook inbox calls it when a provider confirms
   * a payment. Everything inside runs in ONE transaction (including the
   * entitlement grants and the outbox publish), so a mid-flight failure rolls
   * back atomically and a retry re-runs from a clean slate.
   */
  async completePayment(
    tenantId: string,
    paymentId: string,
    orderId: string,
    userId: string,
    providerName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Interactive tx clients are not auto-wrapped: set the RLS tenant
      // context for the whole transaction first. (Also covers webhook-style
      // callers that run without an AsyncLocalStorage request scope.)
      await applyTenantContext(tx, tenantId);

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

      // Settle the intent in the same transaction so later retries observe
      // SUCCEEDED instead of CREATED/PROCESSING (bundle A).
      if (payment?.paymentIntentId) {
        await tx.paymentIntent.updateMany({
          where: {
            id: payment.paymentIntentId,
            status: { in: ["CREATED", "PROCESSING"] },
          },
          data: { status: "SUCCEEDED" },
        });
      }

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
            tx,
          );
        }
      }

      // Publish event
      await this.outbox.publish(
        tenantId,
        {
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
        },
        tx,
      );
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
   * Process a refund (bundle C).
   *
   * Money-out rules:
   *  - a COMPLETED key replays its stored result verbatim;
   *  - a PENDING key resumes the crashed attempt it left behind;
   *  - the refund row is claimed (PENDING -> PROCESSING) *before* the provider
   *    network call, so a retry after a crash lands on PROCESSING and refuses
   *    ("outcome unknown") instead of refunding twice;
   *  - settlement (status + reversing ledger entries + payment/order state +
   *    entitlement revocation on a full refund) runs in ONE transaction, and
   *    the (PENDING|PROCESSING -> SUCCEEDED) CAS makes the webhook path and
   *    this path settle the same refund exactly once.
   */
  async processRefund(input: RefundInput): Promise<RefundResult> {
    const { tenantId, paymentId, requestedBy, idempotencyKey } = input;

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException("Payment not found");

    // Claim the idempotency key BEFORE any state validation: a replay must
    // work even after the payment has since been fully refunded. The hash
    // covers only the raw request (not the resolved amount), so retries with
    // an omitted `amountMinor` hash identically.
    const idempotent = await this.idempotency.checkAndStore(
      tenantId,
      requestedBy,
      idempotencyKey,
      "refund_create",
      {
        paymentId,
        amountMinor: input.amountMinor?.toString() ?? null,
        reason: input.reason ?? null,
      },
    );

    if (!idempotent.isNew && idempotent.response !== undefined) {
      return { ...(idempotent.response as RefundResult), replayed: true };
    }

    if (!idempotent.isNew) {
      // PENDING claim without a response: a previous attempt died somewhere
      // between the key claim and completion. Resume — or refuse loudly.
      const prior = await this.prisma.refund.findFirst({
        where: {
          tenantId,
          paymentId,
          metadata: { path: ["idempotencyKey"], equals: idempotencyKey },
        },
      });

      if (!prior)
        throw new ConflictException(
          "Refund attempt already in progress — retry shortly",
        );

      if (prior.status === "SUCCEEDED") {
        const result = this.refundResult(prior, payment.status);
        await this.idempotency.markCompleted(tenantId, idempotencyKey, result);
        return { ...result, replayed: true };
      }

      if (prior.status === "FAILED") {
        await this.idempotency.markFailed(tenantId, idempotencyKey);
        throw new BadRequestException(
          (prior.metadata as any)?.error || "Refund failed",
        );
      }

      if (prior.status === "PROCESSING")
        throw new ConflictException(
          "Refund outcome unknown — reconcile with the provider before retrying",
        );

      // PENDING: the provider was never called for it (the claim flips to
      // PROCESSING before the network call) — safe to execute now.
      return this.executeRefund(payment, prior, idempotencyKey);
    }

    // Fresh attempt — validate now; a refusal releases the claim so the
    // teacher can retry with the same key.
    let amountMinor: bigint;
    try {
      if (payment.status !== "PAID" && payment.status !== "REFUND_PENDING")
        throw new BadRequestException("Payment not in paid state");
      if (payment.refundedAt)
        throw new BadRequestException("Payment already refunded");

      // Refundable amount = paid − everything already locked (SUCCEEDED PLUS
      // in-flight). The old check only subtracted SUCCEEDED, so a request
      // racing an in-flight refund could over-refund (bundle C).
      const locked = await this.prisma.refund.aggregate({
        where: {
          paymentId,
          status: { in: ["PENDING", "PROCESSING", "SUCCEEDED"] },
        },
        _sum: { amountMinor: true },
      });
      const lockedMinor = locked._sum.amountMinor ?? 0n;
      const remaining = payment.amountMinor - lockedMinor;
      if (remaining <= 0n)
        throw new BadRequestException("Payment has no refundable amount left");

      amountMinor = input.amountMinor ?? remaining;
      if (amountMinor <= 0n)
        throw new BadRequestException("Refund amount must be positive");
      if (amountMinor > remaining)
        throw new BadRequestException(
          "Refund amount exceeds refundable amount",
        );
      if (payment.provider === "voucher" && amountMinor !== payment.amountMinor)
        throw new BadRequestException(
          "Voucher payments can only be refunded in full",
        );
    } catch (error) {
      await this.idempotency.markFailed(tenantId, idempotencyKey);
      throw error;
    }

    // Record the refund and seal the payment as refund-pending in one
    // transaction, so any retry finds the row through its key.
    const refund = await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);
      const created = await tx.refund.create({
        data: {
          tenantId,
          paymentId,
          orderId: payment.orderId,
          userId: payment.userId,
          requestedBy,
          amountMinor,
          currency: payment.currency,
          reason: input.reason,
          status: "PENDING",
          metadata: { idempotencyKey },
        },
      });
      await tx.payment.updateMany({
        where: { id: paymentId, status: { in: ["PAID", "REFUND_PENDING"] } },
        data: { status: "REFUND_PENDING" },
      });
      return created;
    });

    await this.audit.log(
      tenantId,
      requestedBy,
      "REFUND_REQUESTED",
      "refund",
      refund.id,
      {
        paymentId,
        amountMinor: amountMinor.toString(),
        provider: payment.provider,
      },
    );

    return this.executeRefund(payment, refund, idempotencyKey);
  }

  /**
   * Execute a refund row whose PENDING state is already committed: claim it
   * PROCESSING *before* calling the provider, then settle or fail it.
   */
  private async executeRefund(
    payment: any,
    refund: any,
    idempotencyKey: string,
  ): Promise<RefundResult> {
    const tenantId = payment.tenantId as string;

    // Voucher refunds never hit a provider: settle immediately.
    if (payment.provider === "voucher") {
      const outcome = await this.settleRefundAttempt(
        payment,
        refund,
        "voucher",
      );
      const result = this.refundResult(refund, outcome.paymentStatus);
      await this.idempotency.markCompleted(tenantId, idempotencyKey, result);
      await this.audit.log(
        tenantId,
        refund.requestedBy ?? payment.userId,
        "REFUND_PROCESSED",
        "refund",
        refund.id,
        {
          paymentId: payment.id,
          amountMinor: refund.amountMinor.toString(),
          provider: "voucher",
        },
      );
      return result;
    }

    // Claim before the network call: a crashed attempt leaves PROCESSING,
    // which retries refuse to re-execute (fail visibly, never double-refund).
    const claim = await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);
      return tx.refund.updateMany({
        where: { id: refund.id, status: "PENDING" },
        data: { status: "PROCESSING" },
      });
    });
    if (claim.count === 0)
      throw new ConflictException("Refund already being processed");

    const provider = this.providerRegistry.getProvider(payment.provider);
    if (!provider?.refund)
      throw new BadRequestException("Provider does not support refunds");

    const providerResult = await provider.refund({
      providerPaymentId: payment.providerTransactionId!,
      providerTransactionId: payment.providerTransactionId!,
      amountMinor: refund.amountMinor,
      currency: refund.currency,
      reason: refund.reason ?? undefined,
      idempotencyKey,
    });

    if (!providerResult.success) {
      await this.failRefundAttempt(
        payment,
        refund,
        providerResult.errorMessage,
      );
      await this.idempotency.markFailed(tenantId, idempotencyKey);
      throw new BadRequestException(
        providerResult.errorMessage || "Refund failed",
      );
    }

    const outcome = await this.settleRefundAttempt(
      payment,
      refund,
      payment.provider,
      providerResult.providerRefundId,
    );
    const result = this.refundResult(refund, outcome.paymentStatus);
    await this.idempotency.markCompleted(tenantId, idempotencyKey, result);
    await this.audit.log(
      tenantId,
      refund.requestedBy ?? payment.userId,
      "REFUND_PROCESSED",
      "refund",
      refund.id,
      {
        paymentId: payment.id,
        amountMinor: refund.amountMinor.toString(),
        provider: payment.provider,
      },
    );
    return result;
  }

  private refundResult(refund: any, paymentStatus: string): RefundResult {
    return {
      refundId: refund.id,
      status: "SUCCEEDED",
      amountMinor: refund.amountMinor.toString(),
      paymentStatus,
    };
  }

  private async settleRefundAttempt(
    payment: any,
    refund: any,
    providerName: string,
    providerRefundId?: string,
  ): Promise<{ settled: boolean; paymentStatus: string }> {
    return this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, payment.tenantId);
      return this.applyRefundSettlement(
        tx,
        payment,
        refund,
        providerName,
        providerRefundId,
      );
    });
  }

  private async failRefundAttempt(
    payment: any,
    refund: any,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, payment.tenantId);
      const won = await tx.refund.updateMany({
        where: { id: refund.id, status: { in: ["PENDING", "PROCESSING"] } },
        data: {
          status: "FAILED",
          metadata: {
            ...((refund.metadata as Record<string, any>) ?? {}),
            error: errorMessage ?? "Refund failed",
          },
        },
      });
      if (won.count > 0) {
        // No money moved — put the payment back into its paid state so the
        // remaining balance stays refundable.
        await tx.payment.updateMany({
          where: { id: payment.id, status: "REFUND_PENDING" },
          data: { status: "PAID" },
        });
      }
    });
  }

  /**
   * The single settlement path shared by the API flow and the provider
   * webhook. The CAS on (PENDING|PROCESSING -> SUCCEEDED) is the money guard:
   * whichever caller wins writes the reversing ledger entries exactly once.
   */
  private async applyRefundSettlement(
    tx: Prisma.TransactionClient,
    payment: any,
    refund: any,
    providerName: string,
    providerRefundId?: string,
  ): Promise<{ settled: boolean; paymentStatus: string }> {
    const won = await tx.refund.updateMany({
      where: { id: refund.id, status: { in: ["PENDING", "PROCESSING"] } },
      data: {
        status: "SUCCEEDED",
        processedAt: new Date(),
        ...(providerRefundId ? { providerRefundId } : {}),
      },
    });

    if (won.count === 0) {
      // Lost the race to a concurrent path (webhook callback or a second
      // attempt): read the final state instead of double-writing.
      const fresh = await tx.refund.findUnique({ where: { id: refund.id } });
      if (fresh?.status === "SUCCEEDED") {
        const freshPayment = await tx.payment.findUnique({
          where: { id: payment.id },
        });
        return {
          settled: false,
          paymentStatus: freshPayment?.status ?? "PAID",
        };
      }
      throw new ConflictException("Refund is no longer settleable");
    }

    await this.ledger.recordRefund(
      tx,
      payment.tenantId,
      {
        id: refund.id,
        amountMinor: refund.amountMinor,
        currency: refund.currency,
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
      },
      providerName,
    );

    const agg = await tx.refund.aggregate({
      where: { paymentId: payment.id, status: "SUCCEEDED" },
      _sum: { amountMinor: true },
    });
    const totalRefunded = agg._sum.amountMinor ?? 0n;
    const fullyRefunded = totalRefunded >= payment.amountMinor;

    if (fullyRefunded) {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "REFUNDED" },
      });
      // Revoke before restoring the redemption: the revocation resolves the
      // voucherId through that redemption row.
      await this.revokeOrderEntitlements(tx, payment);
      if (providerName === "voucher") {
        await this.restoreVoucherRedemption(tx, payment);
      }
    } else {
      // Partially refunded: back to PAID so the remaining balance stays
      // refundable; access is kept.
      await tx.payment.updateMany({
        where: { id: payment.id, status: "REFUND_PENDING" },
        data: { status: "PAID" },
      });
    }

    await this.outbox.publish(
      payment.tenantId,
      {
        eventType: "refund.succeeded",
        aggregateType: "refund",
        aggregateId: refund.id,
        payload: {
          refundId: refund.id,
          paymentId: payment.id,
          amountMinor: refund.amountMinor.toString(),
          totalRefundedMinor: totalRefunded.toString(),
        },
      },
      tx,
    );

    return {
      settled: true,
      paymentStatus: fullyRefunded ? "REFUNDED" : "PAID",
    };
  }

  /** Undo a voucher redemption so the code becomes usable again. */
  private async restoreVoucherRedemption(
    tx: Prisma.TransactionClient,
    payment: any,
  ): Promise<void> {
    const redemption = await tx.voucherRedemption.findFirst({
      where: {
        userId: payment.userId,
        metadata: { path: ["orderId"], equals: payment.orderId },
      },
    });
    if (!redemption) return;

    await tx.voucher.updateMany({
      where: { id: redemption.voucherId, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
    await tx.voucherRedemption.deleteMany({ where: { id: redemption.id } });
  }

  /**
   * A full refund revokes exactly the entitlements THIS payment granted:
   * purchase grants carry `metadata.orderId`; voucher grants carry
   * `metadata.voucherId` (resolved through the redemption row). Nothing else
   * is touched — a partially refunded purchase keeps access.
   */
  private async revokeOrderEntitlements(
    tx: Prisma.TransactionClient,
    payment: any,
  ): Promise<void> {
    const redemption = await tx.voucherRedemption.findFirst({
      where: {
        userId: payment.userId,
        metadata: { path: ["orderId"], equals: payment.orderId },
      },
    });

    const or: Prisma.EntitlementWhereInput[] = [
      { metadata: { path: ["orderId"], equals: payment.orderId } },
    ];
    if (redemption?.voucherId) {
      or.push({
        metadata: { path: ["voucherId"], equals: redemption.voucherId },
      });
    }

    const entitlements = await tx.entitlement.findMany({
      where: {
        tenantId: payment.tenantId,
        userId: payment.userId,
        status: "ACTIVE",
        OR: or,
      },
    });

    for (const entitlement of entitlements) {
      await tx.entitlement.update({
        where: { id: entitlement.id },
        data: {
          status: "REVOKED",
          metadata: {
            ...((entitlement.metadata as Record<string, any>) ?? {}),
            revokedAt: new Date().toISOString(),
            revokedReason: `refund:${payment.id}`,
          },
        },
      });
    }
  }

  /**
   * Settle a refund from a provider webhook (bundle C). Resolves the in-flight
   * refund row (or records an externally-initiated refund as a delta), then
   * reuses the same single settlement path as the API flow. Never throws on
   * "nothing to do" — returns an outcome for the inbox to audit.
   */
  async settleRefundFromProvider(params: {
    tenantId: string;
    paymentId: string;
    provider: string;
    providerRefundId?: string;
    /** Cumulative refunded total reported by the provider payload, if any. */
    refundAmountMinor?: bigint;
    webhookEventId?: string;
  }): Promise<"settled" | "already_settled" | "no_op"> {
    return this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, params.tenantId);

      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
      });
      if (!payment || payment.tenantId !== params.tenantId) return "no_op";

      let refund: any = null;
      if (params.providerRefundId) {
        refund = await tx.refund.findFirst({
          where: {
            paymentId: payment.id,
            providerRefundId: params.providerRefundId,
          },
        });
        if (refund && refund.status === "SUCCEEDED") return "already_settled";
      }

      if (!refund || !["PENDING", "PROCESSING"].includes(refund.status)) {
        refund = await tx.refund.findFirst({
          where: {
            paymentId: payment.id,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!refund) {
        // No local refund was in flight — e.g. a refund initiated from the
        // provider dashboard. Reverse exactly the delta the provider reports
        // (falling back to "the rest of the payment") and synthesize the row.
        const agg = await tx.refund.aggregate({
          where: { paymentId: payment.id, status: "SUCCEEDED" },
          _sum: { amountMinor: true },
        });
        const already = agg._sum.amountMinor ?? 0n;
        const target = params.refundAmountMinor ?? payment.amountMinor;
        const delta = target - already;
        if (delta <= 0n) return "no_op";

        refund = await tx.refund.create({
          data: {
            tenantId: params.tenantId,
            paymentId: payment.id,
            orderId: payment.orderId,
            userId: payment.userId,
            requestedBy: `provider:${params.provider}`,
            amountMinor: delta,
            currency: payment.currency,
            reason: "provider_callback",
            status: "PROCESSING",
            metadata: {
              source: "external",
              webhookEventId: params.webhookEventId ?? null,
            },
          },
        });
      }

      const outcome = await this.applyRefundSettlement(
        tx,
        payment,
        refund,
        params.provider,
        params.providerRefundId,
      );

      return outcome.settled ? "settled" : "already_settled";
    });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
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
      // "PAID" is not a PaymentIntentStatus — a settled intent is SUCCEEDED
      // (the old check made every completed-intent replay look failed).
      success:
        intent.status === "PROCESSING" ||
        intent.status === "SUCCEEDED" ||
        intent.status === "REQUIRES_ACTION",
      paymentIntentId: intent.id,
      providerPaymentId: intent.externalIntentId,
      providerTransactionId: intent.providerTransactionId,
      errorCode: intent.status === "FAILED" ? "INTENT_FAILED" : undefined,
    };
  }
}
