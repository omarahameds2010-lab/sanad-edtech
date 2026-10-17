import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { PaymentOrchestratorService } from "../payment-orchestrator.service";
import { VoucherProvider } from "../providers/voucher/voucher.provider";
import { ProviderRegistryService } from "../providers/provider-registry.service";
import { ProviderRouterService } from "../routing/provider-router.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";
import { toBigIntMinor } from "../../../common/money/minor-units";

@Controller("payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private prisma: PrismaService,
    private orchestrator: PaymentOrchestratorService,
    private voucherProvider: VoucherProvider,
    private providerRegistry: ProviderRegistryService,
    private providerRouter: ProviderRouterService,
  ) {}

  /**
   * Create order with server-side pricing
   */
  @Post("orders")
  @RequirePermission({ action: "create", resourceType: "order" })
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Request() req,
    @Body()
    body: {
      items: {
        resourceType: string;
        resourceId: string;
        name: string;
        quantity: number;
        // HTTP JSON cannot carry a BigInt — clients send a number or a digit
        // string; the orchestrator canonicalizes before comparing.
        unitPriceMinor: number | string;
        metadata?: any;
      }[];
      currency?: string;
      metadata?: any;
    },
  ) {
    const result = await this.orchestrator.createOrder({
      tenantId: req.tenantId,
      userId: req.user.sub,
      items: body.items,
      currency: body.currency || "EGP",
      metadata: body.metadata,
    });
    return { order: result };
  }

  /**
   * Get order details
   */
  @Get("orders/:orderId")
  @RequirePermission({
    action: "read",
    resourceType: "order",
    resourceIdParam: "orderId",
  })
  async getOrder(@Request() req, @Param("orderId") orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId: req.tenantId },
      include: {
        items: true,
        payments: {
          select: {
            id: true,
            status: true,
            amountMinor: true,
            provider: true,
            createdAt: true,
          },
        },
        refunds: {
          select: {
            id: true,
            status: true,
            amountMinor: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return { order };
  }

  /**
   * List orders
   */
  @Get("orders")
  @RequirePermission({ action: "read", resourceType: "order" })
  async listOrders(
    @Request() req,
    @Query() query: { status?: string; page?: number; limit?: number },
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenantId: req.tenantId, userId: req.user.sub };
    if (query.status) where.status = query.status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            select: {
              resourceType: true,
              resourceId: true,
              name: true,
              totalMinor: true,
            },
          },
          payments: {
            select: {
              id: true,
              status: true,
              amountMinor: true,
              provider: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Create payment intent
   */
  @Post("intents")
  @RequirePermission({ action: "create", resourceType: "payment" })
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(
    @Request() req,
    @Body()
    body: {
      orderId: string;
      paymentMethod: string;
      requestedProvider?: string;
      returnUrl?: string;
      webhookUrl?: string;
      metadata?: any;
      idempotencyKey: string;
    },
  ) {
    const result = await this.orchestrator.createPaymentIntent(
      {
        tenantId: req.tenantId,
        userId: req.user.sub,
        orderId: body.orderId,
        paymentMethod: body.paymentMethod as any,
        requestedProvider: body.requestedProvider,
        returnUrl: body.returnUrl,
        webhookUrl: body.webhookUrl,
        metadata: body.metadata,
      },
      body.idempotencyKey,
    );

    return { paymentIntent: result };
  }

  /**
   * Get payment intent status
   */
  @Get("intents/:intentId")
  @RequirePermission({
    action: "read",
    resourceType: "payment",
    resourceIdParam: "intentId",
  })
  async getPaymentIntent(@Request() req, @Param("intentId") intentId: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: intentId, tenantId: req.tenantId },
      include: {
        attempts: {
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    });
    if (!intent) throw new NotFoundException("Payment intent not found");
    return { intent };
  }

  /**
   * Get available payment methods for tenant
   */
  @Get("methods")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getPaymentMethods(@Request() req) {
    const methods = this.providerRouter.getAvailableMethods(req.tenantId);
    const providerStatus = this.providerRegistry.getAllHealthStatuses();

    return {
      methods: methods.map((method) => ({
        id: method,
        available: true,
        providers: this.providerRegistry
          .getEnabledProviders()
          .filter((p) =>
            this.providerRouter["providerSupportsMethod"](p, method),
          )
          .map((p) => ({
            name: p.name,
            healthy: this.providerRegistry.isProviderAvailable(p.name),
          })),
      })),
      providerHealth: providerStatus,
    };
  }

  /**
   * Get payment status
   */
  @Get(":paymentId/status")
  @RequirePermission({
    action: "read",
    resourceType: "payment",
    resourceIdParam: "paymentId",
  })
  async getPaymentStatus(
    @Request() req,
    @Param("paymentId") paymentId: string,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId: req.tenantId },
      include: { order: { select: { id: true, number: true, status: true } } },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return { payment };
  }

  /**
   * Cancel payment intent
   */
  @Post(":paymentId/cancel")
  @RequirePermission({
    action: "manage",
    resourceType: "payment",
    resourceIdParam: "paymentId",
  })
  @HttpCode(HttpStatus.OK)
  async cancelPayment(@Request() req, @Param("paymentId") paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId: req.tenantId },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.status === "PAID")
      throw new BadRequestException("Cannot cancel paid payment");

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: "CANCELLED" },
    });

    if (payment.paymentIntentId) {
      await this.prisma.paymentIntent.update({
        where: { id: payment.paymentIntentId },
        data: { status: "CANCELLED" },
      });
    }

    return { cancelled: true };
  }

  /**
   * Refund a captured payment (bundle C).
   *
   * Money-out is idempotent by `idempotencyKey` (required) and returns the
   * same `refundId` on any replay. `amountMinor` is optional: omit it for a
   * full remaining refund. JSON cannot carry BigInt — pass a number or a
   * digit string; the orchestrator canonicalizes it.
   */
  @Post(":paymentId/refunds")
  @RequirePermission({
    action: "refund",
    resourceType: "payment",
    resourceIdParam: "paymentId",
  })
  @HttpCode(HttpStatus.CREATED)
  async refundPayment(
    @Request() req,
    @Param("paymentId") paymentId: string,
    @Body()
    body: {
      amountMinor?: number | string;
      reason?: string;
      idempotencyKey?: string;
    },
  ) {
    if (!body.idempotencyKey || !body.idempotencyKey.trim()) {
      throw new BadRequestException("idempotencyKey is required");
    }

    const refund = await this.orchestrator.processRefund({
      tenantId: req.tenantId,
      paymentId,
      amountMinor:
        body.amountMinor === undefined
          ? undefined
          : toBigIntMinor(body.amountMinor, "amountMinor"),
      reason: body.reason,
      requestedBy: req.user.sub,
      idempotencyKey: body.idempotencyKey,
    });

    return { refund };
  }

  // Voucher endpoints
  @Post("vouchers/redeem")
  @RequirePermission({ action: "create", resourceType: "voucher" })
  @HttpCode(HttpStatus.OK)
  async redeemVoucher(
    @Request() req,
    @Body() body: { code: string; courseId?: string; metadata?: any },
  ) {
    const result = await this.voucherProvider.redeemVoucher(
      req.tenantId,
      req.user.sub,
      body.code,
      body.courseId,
      body.metadata,
    );
    return result;
  }

  // Voucher admin endpoints
  @Post("vouchers")
  @RequirePermission({ action: "create", resourceType: "voucher" })
  @HttpCode(HttpStatus.CREATED)
  async createVoucher(
    @Request() req,
    @Body()
    body: {
      code: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      maxUses?: number;
      courseId?: string;
      expiresAt?: string;
      metadata?: any;
    },
  ) {
    const voucher = await this.voucherProvider.createVoucher(req.tenantId, {
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    return { voucher };
  }

  @Get("vouchers")
  @RequirePermission({ action: "read", resourceType: "voucher" })
  async listVouchers(
    @Request() req,
    @Query() query: { courseId?: string; active?: boolean },
  ) {
    const vouchers = await this.voucherProvider.listVouchers(req.tenantId, {
      courseId: query.courseId,
      active: query.active,
    });
    return { vouchers };
  }

  @Put("vouchers/:voucherId/disable")
  @RequirePermission({
    action: "manage",
    resourceType: "voucher",
    resourceIdParam: "voucherId",
  })
  async disableVoucher(@Request() req, @Param("voucherId") voucherId: string) {
    const voucher = await this.voucherProvider.disableVoucher(
      req.tenantId,
      voucherId,
    );
    return { voucher };
  }
}
