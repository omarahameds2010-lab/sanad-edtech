import * as crypto from "crypto";
import { VoucherProvider } from "./voucher.provider";

describe("VoucherProvider.redeemVoucher — crash-resume ordering (bundle C)", () => {
  let prisma: any;
  let entitlementsService: any;
  let outboxService: any;
  let service: VoucherProvider;

  const tenantId = "t1";
  const userId = "u1";
  const courseId = "c1";
  const code = "V-1";
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  function voucherRow(overrides: any = {}) {
    return {
      id: "v1",
      tenantId,
      codeHash,
      usedCount: 0,
      maxUses: 1,
      disabledAt: null,
      expiresAt: new Date("2027-01-01T00:00:00Z"),
      courseId,
      discountType: "FIXED_AMOUNT",
      discountValue: 0,
      ...overrides,
    };
  }

  let tx: any;

  beforeEach(() => {
    tx = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      voucher: {
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          ...voucherRow(),
          usedCount: data?.usedCount?.increment ? 1 : 0,
        })),
      },
      voucherRedemption: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: "red1",
          ...data,
        })),
      },
    };

    prisma = {
      voucher: { findUnique: jest.fn().mockResolvedValue(voucherRow()) },
      voucherRedemption: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    };

    entitlementsService = {
      grantCourseEntitlement: jest
        .fn()
        .mockResolvedValue([{ id: "e1", resourceType: "course" }]),
    };
    outboxService = { publish: jest.fn().mockResolvedValue(undefined) };

    service = new VoucherProvider(prisma, entitlementsService, outboxService);
  });

  it("resumes the SAME checkout before the exhaustion check — usedCount is never touched", async () => {
    // The crashed attempt already consumed the only use.
    prisma.voucher.findUnique.mockResolvedValue(
      voucherRow({ usedCount: 1, maxUses: 1 }),
    );
    prisma.voucherRedemption.findUnique.mockResolvedValue({
      id: "red1",
      voucherId: "v1",
      userId,
      metadata: { intentId: "i1", orderId: "o1" },
    });

    const result = await service.redeemVoucher(
      tenantId,
      userId,
      code,
      courseId,
      {
        intentId: "i1",
        orderId: "o1",
      },
    );

    expect(result.success).toBe(true);
    expect(tx.voucher.update).not.toHaveBeenCalled();
    expect(tx.voucherRedemption.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(entitlementsService.grantCourseEntitlement).not.toHaveBeenCalled();
    expect(outboxService.publish).not.toHaveBeenCalled();
  });

  it("still rejects a DIFFERENT intent on an exhausted voucher (no resume for strangers)", async () => {
    prisma.voucher.findUnique.mockResolvedValue(
      voucherRow({ usedCount: 1, maxUses: 1 }),
    );
    prisma.voucherRedemption.findUnique.mockResolvedValue({
      id: "red1",
      voucherId: "v1",
      userId,
      metadata: { intentId: "i1" },
    });

    const result = await service.redeemVoucher(
      tenantId,
      userId,
      code,
      courseId,
      {
        intentId: "i2",
      },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("VOUCHER_EXHAUSTED");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns ALREADY_REDEEMED for a prior redemption while capacity remains", async () => {
    prisma.voucher.findUnique.mockResolvedValue(voucherRow({ maxUses: 5 }));
    prisma.voucherRedemption.findUnique.mockResolvedValue({
      id: "red1",
      voucherId: "v1",
      userId,
      metadata: { intentId: "i1" },
    });

    const result = await service.redeemVoucher(
      tenantId,
      userId,
      code,
      courseId,
      {
        intentId: "i2",
      },
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("ALREADY_REDEEMED");
  });

  it("redeems fresh vouchers normally (increment + redemption + grants in one transaction)", async () => {
    const result = await service.redeemVoucher(
      tenantId,
      userId,
      code,
      courseId,
      {
        intentId: "i9",
        orderId: "o9",
      },
    );

    expect(result.success).toBe(true);
    expect(tx.voucher.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { usedCount: { increment: 1 } },
      }),
    );
    expect(tx.voucherRedemption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          voucherId: "v1",
          userId,
          metadata: { intentId: "i9", orderId: "o9" },
        }),
      }),
    );
    expect(entitlementsService.grantCourseEntitlement).toHaveBeenCalledWith(
      tenantId,
      userId,
      courseId,
      "voucher",
      expect.objectContaining({ voucherId: "v1", redemptionId: "red1" }),
      tx,
    );
    expect(outboxService.publish).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ eventType: "voucher.redeemed" }),
    );
  });
});
