import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PaymentOrchestratorService } from "./payment-orchestrator.service";

/**
 * Bundle A regression suite ("open the funnel"):
 *  - POST /orders must accept what JSON can actually carry (number/digit
 *    string) and still enforce server-side pricing (BigInt compare).
 *  - createPaymentIntent must replay cached results, reuse an existing intent
 *    row for the same (tenantId, idempotencyKey) instead of a P2002 insert,
 *    mark the key completed/failed, and never re-initiate a live provider
 *    payment on retries.
 */
describe("PaymentOrchestratorService (bundle A)", () => {
  let service: PaymentOrchestratorService;
  let prisma: any;
  let providerRegistry: any;
  let providerRouter: any;
  let voucherProvider: any;
  let entitlementsService: any;
  let featureFlags: any;
  let outbox: any;
  let ledger: any;
  let risk: any;
  let idempotency: any;
  let audit: any;

  const tenantId = "t1";
  const userId = "u1";
  const idempotencyKey = "idem-1";

  const providerResult = {
    success: true,
    providerPaymentId: "pp_1",
    providerTransactionId: "pt_1",
    redirectUrl: "https://pay.example/redirect",
    clientToken: "tok_1",
    expiresAt: new Date("2026-10-17T12:00:00Z"),
  };

  function providerMock(createPayment?: jest.Mock) {
    return {
      name: "paymob",
      createPayment:
        createPayment || jest.fn().mockResolvedValue({ ...providerResult }),
    };
  }

  const pendingOrder = {
    id: "o1",
    tenantId,
    userId,
    status: "PENDING",
    totalMinor: 29900n,
    currency: "EGP",
    items: [{ resourceType: "course", resourceId: "c1" }],
  };

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: userId }) },
      course: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ price: 299, title: "Algebra" }),
      },
      order: {
        create: jest.fn().mockResolvedValue({ id: "o1" }),
        findFirst: jest.fn().mockResolvedValue({ ...pendingOrder }),
        count: jest.fn().mockResolvedValue(0),
      },
      paymentIntent: {
        create: jest
          .fn()
          .mockImplementation(async ({ data }: any) => ({ id: "i1", ...data })),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest
          .fn()
          .mockImplementation(async ({ data }: any) => ({ id: "i1", ...data })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: "pay1",
          ...data,
        })),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    providerRegistry = {
      getProvider: jest.fn(),
      isProviderAvailable: jest.fn().mockReturnValue(true),
    };
    providerRouter = {
      selectProvider: jest.fn().mockResolvedValue(providerMock()),
    };
    voucherProvider = {
      name: "voucher",
      redeemVoucher: jest.fn().mockResolvedValue({
        success: true,
        voucher: { id: "v1" },
      }),
    };
    entitlementsService = {
      grantCourseEntitlement: jest.fn().mockResolvedValue({}),
    };
    featureFlags = {
      getTenantFlags: jest
        .fn()
        .mockResolvedValue({ payments: { enabled: true } }),
    };
    outbox = { publish: jest.fn().mockResolvedValue({}) };
    ledger = { recordPayment: jest.fn().mockResolvedValue({}) };
    risk = { scorePaymentAttempt: jest.fn().mockResolvedValue(5) };
    idempotency = {
      checkAndStore: jest
        .fn()
        .mockResolvedValue({ isNew: true, existingId: "k1" }),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    service = new PaymentOrchestratorService(
      prisma,
      providerRegistry,
      providerRouter,
      voucherProvider,
      entitlementsService,
      featureFlags,
      {} as any, // authorization
      outbox,
      ledger,
      risk,
      idempotency,
      audit,
      {} as any, // authz
    );
  });

  function wireTransaction() {
    const tx = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      payment: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          id: "pay1",
          amountMinor: 29900n,
          paymentIntentId: "i1",
        }),
      },
      order: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({
          id: "o1",
          items: [{ resourceType: "course", resourceId: "c1" }],
        }),
      },
      paymentIntent: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));
    return tx;
  }

  function orderInput(unitPriceMinor: any, quantity = 1) {
    return {
      tenantId,
      userId,
      items: [
        {
          resourceType: "course",
          resourceId: "c1",
          name: "Algebra",
          quantity,
          unitPriceMinor,
        },
      ],
    };
  }

  describe("createOrder — BigInt-safe pricing", () => {
    it("accepts the number JSON actually sends (29900) and charges server price", async () => {
      const result = await service.createOrder(orderInput(29900));

      expect(result.totalMinor).toBe(29900n);
      expect(prisma.order.create).toHaveBeenCalledTimes(1);
      const created = prisma.order.create.mock.calls[0][0].data;
      expect(created.subtotalMinor).toBe(29900n);
      expect(created.items.create[0].unitPriceMinor).toBe(29900n);
    });

    it("accepts a digit string", async () => {
      const result = await service.createOrder(orderInput("29900"));

      expect(result.totalMinor).toBe(29900n);
      expect(prisma.order.create).toHaveBeenCalledTimes(1);
    });

    it("multiplies quantity with BigInt math", async () => {
      const result = await service.createOrder(orderInput(29900, 2));

      expect(result.totalMinor).toBe(59800n);
      const created = prisma.order.create.mock.calls[0][0].data;
      expect(created.items.create[0].totalMinor).toBe(59800n);
    });

    it("still rejects a price that differs from the server price", async () => {
      await expect(service.createOrder(orderInput(29899))).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it("rejects garbage instead of charging it", async () => {
      await expect(service.createOrder(orderInput("29,900"))).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createOrder(orderInput(299.5))).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe("createPaymentIntent — provider flow", () => {
    const input = {
      tenantId,
      userId,
      orderId: "o1",
      paymentMethod: "CARD" as any,
    };

    it("creates the intent, initializes the provider and completes the key", async () => {
      const result = await service.createPaymentIntent(input, idempotencyKey);

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBe(providerResult.redirectUrl);
      expect(prisma.paymentIntent.create).toHaveBeenCalledTimes(1);
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PROCESSING" }),
        }),
      );
      expect(idempotency.markCompleted).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
        expect.objectContaining({ paymentIntentId: "i1" }),
      );
    });

    it("replays the cached response on retry — no second provider payment", async () => {
      idempotency.checkAndStore.mockResolvedValue({
        isNew: false,
        existingId: "k1",
        response: {
          success: true,
          paymentIntentId: "i1",
          redirectUrl: "https://cached.example",
        },
      });

      const result = await service.createPaymentIntent(input, idempotencyKey);

      expect(result.redirectUrl).toBe("https://cached.example");
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
      expect(prisma.paymentIntent.findUnique).not.toHaveBeenCalled();
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("returns the existing intent when the key is PENDING and the intent is PROCESSING", async () => {
      idempotency.checkAndStore.mockResolvedValue({
        isNew: false,
        existingId: "k1",
      });
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: "i1",
        status: "PROCESSING",
        externalIntentId: "pp_1",
      });

      const result = await service.createPaymentIntent(input, idempotencyKey);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe("i1");
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
      expect(idempotency.markCompleted).not.toHaveBeenCalled();
    });

    it("re-completes a renewed key when the prior intent is settled — no new provider call", async () => {
      idempotency.checkAndStore.mockResolvedValue({
        isNew: true,
        existingId: "k1",
      });
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: "i1",
        status: "SUCCEEDED",
        externalIntentId: "pp_1",
      });

      const result = await service.createPaymentIntent(input, idempotencyKey);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe("i1");
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
      expect(prisma.order.findFirst).not.toHaveBeenCalled();
      expect(providerRouter.selectProvider).not.toHaveBeenCalled();
      expect(idempotency.markCompleted).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
        expect.objectContaining({ paymentIntentId: "i1" }),
      );
    });

    it("RESUMES a FAILED intent row instead of inserting a second one (P2002 fix)", async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: "i1",
        status: "FAILED",
        idempotencyKey,
      });

      const result = await service.createPaymentIntent(input, idempotencyKey);

      expect(result.success).toBe(true);
      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "i1" },
          data: expect.objectContaining({
            status: "CREATED",
            metadata: expect.objectContaining({ resumedFrom: "FAILED" }),
          }),
        }),
      );
      expect(idempotency.markCompleted).toHaveBeenCalled();
    });

    it("marks the key failed and throws when the provider declines", async () => {
      providerRouter.selectProvider.mockResolvedValue(
        providerMock(
          jest.fn().mockResolvedValue({
            success: false,
            errorMessage: "Declined",
          }),
        ),
      );

      await expect(
        service.createPaymentIntent(input, idempotencyKey),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.paymentIntent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
      expect(idempotency.markFailed).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
      );
      expect(idempotency.markCompleted).not.toHaveBeenCalled();
    });

    it("rejects a non-pending order before touching the provider", async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...pendingOrder,
        status: "CONFIRMED",
      });

      await expect(
        service.createPaymentIntent(input, idempotencyKey),
      ).rejects.toThrow(BadRequestException);

      expect(providerRouter.selectProvider).not.toHaveBeenCalled();
    });

    it("conflicts on an EXPIRED prior intent for the same key", async () => {
      prisma.paymentIntent.findUnique.mockResolvedValue({
        id: "i1",
        status: "EXPIRED",
      });

      await expect(
        service.createPaymentIntent(input, idempotencyKey),
      ).rejects.toThrow(ConflictException);

      expect(prisma.paymentIntent.create).not.toHaveBeenCalled();
      expect(prisma.paymentIntent.update).not.toHaveBeenCalled();
    });

    it("blocks when payments are disabled for the tenant", async () => {
      featureFlags.getTenantFlags.mockResolvedValue({
        payments: { enabled: false },
      });

      await expect(
        service.createPaymentIntent(input, idempotencyKey),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("createPaymentIntent — voucher flow", () => {
    const voucherInput = {
      tenantId,
      userId,
      orderId: "o1",
      paymentMethod: "VOUCHER" as any,
      metadata: { voucherCode: "V-123" },
    };

    it("completes the order, settles the intent and stores the response", async () => {
      const tx = wireTransaction();

      const result = await service.createPaymentIntent(
        voucherInput,
        idempotencyKey,
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe("pay1");
      expect(voucherProvider.redeemVoucher).toHaveBeenCalledWith(
        tenantId,
        userId,
        "V-123",
        "c1",
        expect.objectContaining({ orderId: "o1" }),
      );
      expect(entitlementsService.grantCourseEntitlement).toHaveBeenCalled();
      expect(outbox.publish).toHaveBeenCalled();
      expect(tx.paymentIntent.updateMany).toHaveBeenCalled();
      expect(idempotency.markCompleted).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
        expect.objectContaining({ paymentId: "pay1" }),
      );
    });

    it("survives an order whose items are not loaded (courseId undefined)", async () => {
      prisma.order.findFirst.mockResolvedValue({
        ...pendingOrder,
        items: undefined,
      });
      wireTransaction();

      const result = await service.createPaymentIntent(
        voucherInput,
        idempotencyKey,
      );

      expect(result.success).toBe(true);
      expect(voucherProvider.redeemVoucher).toHaveBeenCalledWith(
        tenantId,
        userId,
        "V-123",
        undefined,
        expect.objectContaining({ orderId: "o1" }),
      );
    });

    it("marks the key failed when the voucher is rejected", async () => {
      voucherProvider.redeemVoucher.mockResolvedValue({
        success: false,
        errorMessage: "Voucher already used",
      });
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent(voucherInput, idempotencyKey),
      ).rejects.toThrow(BadRequestException);

      expect(idempotency.markFailed).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
      );
      expect(idempotency.markCompleted).not.toHaveBeenCalled();
    });

    it("never fails a paid intent — replays success if the payment already exists", async () => {
      voucherProvider.redeemVoucher.mockResolvedValue({
        success: false,
        errorMessage: "Voucher already used",
      });
      prisma.payment.findFirst.mockResolvedValue({
        id: "pay1",
        status: "PAID",
        providerTransactionId: "voucher_i1",
      });

      const result = await service.createPaymentIntent(
        voucherInput,
        idempotencyKey,
      );

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe("pay1");
      expect(idempotency.markCompleted).toHaveBeenCalledWith(
        tenantId,
        idempotencyKey,
        expect.objectContaining({ paymentId: "pay1" }),
      );
      expect(prisma.paymentIntent.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });
  });
});
