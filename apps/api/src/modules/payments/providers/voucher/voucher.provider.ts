import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../tenants/prisma.service";
import { applyTenantContext } from "../../../../common/prisma/tenant-context";
import { EntitlementsService } from "../../../entitlements/entitlements.service";
import { OutboxService } from "../../../outbox/outbox.service";
import {
  PaymentProvider,
  ProviderCapabilities,
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  ProviderPaymentStatus,
  VerifyProviderPaymentInput,
  VerifyWebhookInput,
  VerifiedWebhookResult,
} from "../payment-provider.interface";
import { VoucherDiscountType, Voucher } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class VoucherProvider implements PaymentProvider {
  readonly name = "voucher";
  readonly capabilities: ProviderCapabilities = {
    cards: false,
    wallets: false,
    bankTransfer: false,
    instantPayment: false,
    refunds: false,
    partialRefunds: false,
    webhooks: false,
    hostedCheckout: false,
  };

  constructor(
    private prisma: PrismaService,
    private entitlementsService: EntitlementsService,
    private outboxService: OutboxService,
  ) {}

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    return {
      success: false,
      errorCode: "INVALID_OPERATION",
      errorMessage: "Use redeemVoucher method for voucher payments",
    };
  }

  async redeemVoucher(
    tenantId: string,
    userId: string,
    code: string,
    courseId?: string,
    metadata?: Record<string, any>,
  ): Promise<{
    success: boolean;
    voucher?: Voucher;
    entitlements?: any[];
    errorCode?: string;
    errorMessage?: string;
  }> {
    const codeHash = this.hashCode(code);

    const voucher = await this.prisma.voucher.findUnique({
      where: { tenantId_codeHash: { tenantId, codeHash } },
    });

    if (!voucher) {
      return {
        success: false,
        errorCode: "VOUCHER_NOT_FOUND",
        errorMessage: "Invalid voucher code",
      };
    }

    const validationError = this.validateVoucher(voucher, courseId, userId);
    if (validationError) {
      return { success: false, ...validationError };
    }

    const existingRedemption = await this.prisma.voucherRedemption.findUnique({
      where: { voucherId_userId: { voucherId: voucher.id, userId } },
    });

    if (existingRedemption) {
      return {
        success: false,
        errorCode: "ALREADY_REDEEMED",
        errorMessage: "Voucher already redeemed by this user",
      };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Interactive tx clients are not auto-wrapped: set the RLS tenant
      // context for the whole transaction first.
      await applyTenantContext(tx, tenantId);

      const updatedVoucher = await tx.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } },
      });

      const redemption = await tx.voucherRedemption.create({
        data: {
          tenantId,
          voucherId: voucher.id,
          userId,
          metadata,
        },
      });

      let entitlements: any[] = [];
      if (voucher.courseId) {
        entitlements = await this.entitlementsService.grantCourseEntitlement(
          tenantId,
          userId,
          voucher.courseId,
          "voucher",
          { voucherId: voucher.id, redemptionId: redemption.id },
          tx,
        );
      }

      return { voucher: updatedVoucher, entitlements };
    });

    await this.outboxService.publish(tenantId, {
      eventType: "voucher.redeemed",
      aggregateType: "voucher",
      aggregateId: voucher.id,
      payload: {
        voucherId: voucher.id,
        userId,
        courseId: voucher.courseId,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
      },
    });

    return {
      success: true,
      voucher: result.voucher,
      entitlements: result.entitlements,
    };
  }

  private validateVoucher(
    voucher: Voucher,
    courseId?: string,
    userId?: string,
  ): { errorCode: string; errorMessage: string } | null {
    if (voucher.disabledAt) {
      return {
        errorCode: "VOUCHER_DISABLED",
        errorMessage: "Voucher has been disabled",
      };
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return {
        errorCode: "VOUCHER_EXPIRED",
        errorMessage: "Voucher has expired",
      };
    }

    if (voucher.usedCount >= voucher.maxUses) {
      return {
        errorCode: "VOUCHER_EXHAUSTED",
        errorMessage: "Voucher usage limit reached",
      };
    }

    if (courseId && voucher.courseId && voucher.courseId !== courseId) {
      return {
        errorCode: "VOUCHER_COURSE_MISMATCH",
        errorMessage: "Voucher not valid for this course",
      };
    }

    return null;
  }

  private hashCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    return { status: "CREATED" };
  }

  async verifyPayment(
    input: VerifyProviderPaymentInput,
  ): Promise<ProviderPaymentStatus> {
    return this.getPaymentStatus({
      providerTransactionId: input.providerTransactionId,
      providerPaymentId: input.providerTransactionId,
      orderId: input.orderId,
    });
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    return { valid: false, errorCode: "NOT_SUPPORTED" };
  }

  async createVoucher(
    tenantId: string,
    data: {
      code: string;
      discountType: VoucherDiscountType;
      discountValue: number;
      maxUses?: number;
      courseId?: string;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    },
  ): Promise<Voucher> {
    const codeHash = this.hashCode(data.code);

    const existing = await this.prisma.voucher.findUnique({
      where: { tenantId_codeHash: { tenantId, codeHash } },
    });

    if (existing) {
      throw new ConflictException("Voucher code already exists");
    }

    return this.prisma.voucher.create({
      data: {
        tenantId,
        codeHash,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxUses: data.maxUses || 1,
        courseId: data.courseId,
        expiresAt: data.expiresAt,
        metadata: data.metadata,
      },
    });
  }

  async getVoucher(tenantId: string, code: string): Promise<Voucher | null> {
    const codeHash = this.hashCode(code);
    return this.prisma.voucher.findUnique({
      where: { tenantId_codeHash: { tenantId, codeHash } },
    });
  }

  async listVouchers(
    tenantId: string,
    filters?: { courseId?: string; active?: boolean },
  ) {
    return this.prisma.voucher.findMany({
      where: {
        tenantId,
        ...(filters?.courseId && { courseId: filters.courseId }),
        ...(filters?.active !== undefined && {
          disabledAt: filters.active ? null : { not: null },
          expiresAt: filters.active ? { gte: new Date() } : undefined,
        }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async disableVoucher(tenantId: string, voucherId: string): Promise<Voucher> {
    return this.prisma.voucher.update({
      where: { id: voucherId, tenantId },
      data: { disabledAt: new Date() },
    });
  }
}
