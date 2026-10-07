import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { Prisma, RiskSeverity } from "@prisma/client";

export interface RiskFactors {
  rapidAttempts: number;
  accountsPerDevice: number;
  ipRisk: number;
  amountAnomaly: number;
  voucherAbuse: number;
  providerAnomalies: number;
}

@Injectable()
export class PaymentRiskService {
  constructor(private prisma: PrismaService) {}

  private readonly weights = {
    rapidAttempts: 20,
    accountsPerDevice: 25,
    ipRisk: 15,
    amountAnomaly: 15,
    voucherAbuse: 25,
    providerAnomalies: 20,
  };

  private readonly thresholds = {
    low: 30,
    medium: 60,
    high: 80,
  };

  async scorePaymentAttempt(
    tenantId: string,
    userId: string,
    amountMinor: bigint,
    paymentMethod: string,
  ): Promise<number> {
    const factors = await this.gatherRiskFactors(tenantId, userId, amountMinor);
    const score = this.calculateScore(factors);

    // Log risk event if score is significant
    if (score >= this.thresholds.low) {
      await this.logRiskEvent(
        tenantId,
        userId,
        "PAYMENT_ATTEMPT_RISK",
        score,
        factors,
      );
    }

    return score;
  }

  private async gatherRiskFactors(
    tenantId: string,
    userId: string,
    amountMinor: bigint,
  ): Promise<RiskFactors> {
    const [
      recentAttempts,
      deviceAccounts,
      ipAttempts,
      userAvgAmount,
      voucherAttempts,
      providerFailures,
    ] = await Promise.all([
      // Rapid attempts in last 10 minutes
      this.prisma.paymentAttempt.count({
        where: {
          tenantId,
          payment: { userId },
          initiatedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
      }),
      // Accounts on same device
      this.prisma.device.groupBy({
        by: ["fingerprint"],
        where: { userId, tenantId },
        _count: { userId: true },
      }),
      // IP-based attempts in last hour
      this.prisma.paymentAttempt.count({
        where: {
          tenantId,
          initiatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
      // User's average payment amount
      this.prisma.payment.aggregate({
        where: { tenantId, userId, status: "PAID" },
        _avg: { amountMinor: true },
      }),
      // Voucher redemption attempts
      this.prisma.voucherRedemption.count({
        where: {
          tenantId,
          userId,
          redeemedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
      // Provider failures
      this.prisma.paymentAttempt.count({
        where: {
          tenantId,
          payment: { userId },
          status: "FAILED",
          initiatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      }),
    ]);

    const accountsPerDevice = Math.max(
      ...deviceAccounts.map((d) => d._count.userId),
      1,
    );
    const avgAmount = Number(userAvgAmount._avg.amountMinor || 0n);
    const currentAmount = Number(amountMinor);
    const amountDeviation =
      avgAmount > 0 ? Math.abs(currentAmount - avgAmount) / avgAmount : 0;

    return {
      rapidAttempts: recentAttempts,
      accountsPerDevice: accountsPerDevice - 1,
      ipRisk: Math.min(ipAttempts / 10, 1),
      amountAnomaly: Math.min(amountDeviation * 10, 1),
      voucherAbuse: Math.min(voucherAttempts / 5, 1),
      providerAnomalies: Math.min(providerFailures / 3, 1),
    };
  }

  private calculateScore(factors: RiskFactors): number {
    let score = 0;
    score += factors.rapidAttempts * this.weights.rapidAttempts;
    score += factors.accountsPerDevice * this.weights.accountsPerDevice;
    score += factors.ipRisk * this.weights.ipRisk * 100;
    score += factors.amountAnomaly * this.weights.amountAnomaly * 100;
    score += factors.voucherAbuse * this.weights.voucherAbuse;
    score += factors.providerAnomalies * this.weights.providerAnomalies;
    return Math.min(Math.round(score), 100);
  }

  async logRiskEvent(
    tenantId: string,
    userId: string,
    eventType: string,
    score: number,
    details: RiskFactors,
  ): Promise<void> {
    let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (score >= this.thresholds.high) severity = "CRITICAL";
    else if (score >= this.thresholds.medium) severity = "HIGH";
    else if (score >= this.thresholds.low) severity = "MEDIUM";

    await this.prisma.paymentRiskEvent.create({
      data: {
        tenantId,
        userId,
        eventType,
        severity: severity as any,
        score,
        details: details as any,
      },
    });
  }

  async getRiskProfile(
    tenantId: string,
    userId: string,
  ): Promise<{
    currentScore: number;
    recentEvents: any[];
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }> {
    const recentEvents = await this.prisma.paymentRiskEvent.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const currentScore = recentEvents[0]?.score || 0;
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (currentScore >= this.thresholds.high) riskLevel = "CRITICAL";
    else if (currentScore >= this.thresholds.medium) riskLevel = "HIGH";
    else if (currentScore >= this.thresholds.low) riskLevel = "MEDIUM";

    return { currentScore, recentEvents, riskLevel };
  }

  async checkVoucherAbuse(
    tenantId: string,
    userId: string,
  ): Promise<{ abusive: boolean; score: number }> {
    const recentRedemptions = await this.prisma.voucherRedemption.count({
      where: {
        tenantId,
        userId,
        redeemedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });

    const failedVouchers = await this.prisma.voucher.findMany({
      where: { tenantId, disabledAt: { not: null } },
      take: 10,
    });

    let score = 0;
    if (recentRedemptions > 5) score += 40;
    if (recentRedemptions > 10) score += 30;
    if (failedVouchers.length > 0) score += 20;

    return { abusive: score >= 50, score: Math.min(score, 100) };
  }
}
