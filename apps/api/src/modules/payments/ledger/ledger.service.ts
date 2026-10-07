import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { Prisma, LedgerEntryType } from "@prisma/client";

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async recordPayment(
    tx: Prisma.TransactionClient,
    tenantId: string,
    payment: {
      id: string;
      amountMinor: bigint;
      currency: string;
      orderId: string;
      userId: string;
      provider: string;
    },
    providerName: string,
  ): Promise<void> {
    // Double-entry: Customer pays (Platform Receivable increases)
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        paymentId: payment.id,
        orderId: payment.orderId,
        accountCode: "PLATFORM_RECEIVABLE",
        entryType: "DEBIT",
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        reference: `payment:${payment.id}`,
        metadata: { provider: providerName, userId: payment.userId },
      },
    });

    // Double-entry: Customer cash clearing (Customer pays)
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        paymentId: payment.id,
        orderId: payment.orderId,
        accountCode: "CUSTOMER_CLEARING",
        entryType: "CREDIT",
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        reference: `payment:${payment.id}`,
        metadata: { provider: providerName, userId: payment.userId },
      },
    });
  }

  async recordRefund(
    tx: Prisma.TransactionClient,
    tenantId: string,
    refund: {
      id: string;
      amountMinor: bigint;
      currency: string;
      paymentId: string;
      orderId: string;
      userId: string;
    },
    providerName: string,
  ): Promise<void> {
    // Reverse: Platform Receivable decreases
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        refundId: refund.id,
        orderId: refund.orderId,
        accountCode: "PLATFORM_RECEIVABLE",
        entryType: "CREDIT",
        amountMinor: refund.amountMinor,
        currency: refund.currency,
        reference: `refund:${refund.id}`,
        metadata: { provider: providerName, userId: refund.userId },
      },
    });

    // Reverse: Customer clearing decreases
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        refundId: refund.id,
        orderId: refund.orderId,
        accountCode: "CUSTOMER_CLEARING",
        entryType: "DEBIT",
        amountMinor: refund.amountMinor,
        currency: refund.currency,
        reference: `refund:${refund.id}`,
        metadata: { provider: providerName, userId: refund.userId },
      },
    });
  }

  async recordSettlement(
    tx: Prisma.TransactionClient,
    tenantId: string,
    settlement: {
      id: string;
      teacherId: string;
      netAmountMinor: bigint;
      currency: string;
      periodStart: Date;
      periodEnd: Date;
    },
  ): Promise<void> {
    // Teacher payable increases
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        accountCode: "TEACHER_PAYABLE",
        entryType: "CREDIT",
        amountMinor: settlement.netAmountMinor,
        currency: settlement.currency,
        reference: `settlement:${settlement.id}`,
        metadata: {
          teacherId: settlement.teacherId,
          periodStart: settlement.periodStart.toISOString(),
          periodEnd: settlement.periodEnd.toISOString(),
        },
      },
    });

    // Platform cash decreases
    await tx.ledgerEntry.create({
      data: {
        tenantId,
        accountCode: "PLATFORM_CASH",
        entryType: "DEBIT",
        amountMinor: settlement.netAmountMinor,
        currency: settlement.currency,
        reference: `settlement:${settlement.id}`,
        metadata: { teacherId: settlement.teacherId },
      },
    });
  }

  async validateLedgerInvariants(
    tenantId: string,
    accountCode?: string,
  ): Promise<{ valid: boolean; imbalances: any[] }> {
    const where: Prisma.LedgerEntryWhereInput = { tenantId };
    if (accountCode) where.accountCode = accountCode;

    const entries = await this.prisma.ledgerEntry.findMany({ where });

    const balances = new Map<string, bigint>();
    for (const entry of entries) {
      const current = balances.get(entry.accountCode) || 0n;
      const delta =
        entry.entryType === "DEBIT" ? entry.amountMinor : -entry.amountMinor;
      balances.set(entry.accountCode, current + delta);
    }

    const imbalances = [];
    for (const [account, balance] of balances) {
      if (balance !== 0n) {
        imbalances.push({ accountCode: account, balance: balance.toString() });
      }
    }

    return { valid: imbalances.length === 0, imbalances };
  }

  async getAccountBalance(
    tenantId: string,
    accountCode: string,
  ): Promise<bigint> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { tenantId, accountCode },
      select: { entryType: true, amountMinor: true },
    });

    let balance = 0n;
    for (const entry of entries) {
      balance +=
        entry.entryType === "DEBIT" ? entry.amountMinor : -entry.amountMinor;
    }
    return balance;
  }

  async getTenantLedgerSummary(
    tenantId: string,
  ): Promise<
    Record<string, { debit: string; credit: string; balance: string }>
  > {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { tenantId },
      select: { accountCode: true, entryType: true, amountMinor: true },
    });

    const summary: Record<string, { debit: bigint; credit: bigint }> = {};
    for (const entry of entries) {
      if (!summary[entry.accountCode])
        summary[entry.accountCode] = { debit: 0n, credit: 0n };
      if (entry.entryType === "DEBIT") {
        summary[entry.accountCode].debit += entry.amountMinor;
      } else {
        summary[entry.accountCode].credit += entry.amountMinor;
      }
    }

    const result: Record<
      string,
      { debit: string; credit: string; balance: string }
    > = {};
    for (const [account, { debit, credit }] of Object.entries(summary)) {
      result[account] = {
        debit: debit.toString(),
        credit: credit.toString(),
        balance: (debit - credit).toString(),
      };
    }
    return result;
  }
}
