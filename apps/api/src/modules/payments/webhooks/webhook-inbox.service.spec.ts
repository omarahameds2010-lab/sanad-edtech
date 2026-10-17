import { Prisma } from "@prisma/client";
import { WebhookInboxService } from "./webhook-inbox.service";

/**
 * Regression suite for audit 2026-10-16 §5.1 (payment webhooks), extended by
 * bundle B (real webhook round trip):
 *  - raw body must exist before anything else,
 *  - signature verification runs before persistence,
 *  - dedup is keyed on the PROVIDER-derived event id (not the http header),
 *  - the raw payload is stored and later consumed by the event handlers,
 *  - replays / unique-constraint races never explode or double-queue,
 *  - a paid event with no matching intent is FAILED (visible, retryable) and
 *    a redelivery for a settled transaction is a no-op,
 *  - a PENDING claim resumes the completion instead of silently no-oping.
 */
describe("WebhookInboxService (audit #5)", () => {
  const flushImmediates = () =>
    new Promise<void>((resolve) => setImmediate(resolve));

  const buildProvider = () => ({ verifyWebhook: jest.fn() }) as any;

  function build() {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      paymentIntent: { findFirst: jest.fn(), update: jest.fn() },
      payment: { create: jest.fn(), findFirst: jest.fn() },
      refund: { updateMany: jest.fn() },
      paymentRiskEvent: { create: jest.fn() },
    };
    const registry = { getProvider: jest.fn() };
    const provider = buildProvider();
    registry.getProvider.mockReturnValue(provider);
    const orchestrator = {
      completePayment: jest.fn().mockResolvedValue({}),
      settleRefundFromProvider: jest.fn(),
    };
    const idempotency = {
      checkAndStore: jest.fn(),
      markCompleted: jest.fn(),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };

    const service = new WebhookInboxService(
      prisma as any,
      registry as any,
      orchestrator as any,
      idempotency as any,
      audit as any,
      {} as any,
    );

    return {
      service,
      prisma,
      registry,
      provider,
      orchestrator,
      idempotency,
      audit,
    };
  }

  const uniqueViolation = () =>
    new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });

  it("rejects a webhook with no raw body before touching any provider", async () => {
    const { service, registry } = build();

    await expect(
      service.receiveWebhook("paymob", undefined as any, {}, "secret"),
    ).rejects.toThrow(/Missing raw body/);
    expect(registry.getProvider).not.toHaveBeenCalled();
  });

  it("verifies first, stores the raw payload, and dedups by the provider event id (not the header)", async () => {
    const { service, prisma, provider } = build();
    const processSpy = jest
      .spyOn(service, "processEvent")
      .mockResolvedValue(undefined);

    provider.verifyWebhook.mockResolvedValue({
      valid: true,
      externalEventId: "tx-1",
      eventType: "payment.paid",
    });
    prisma.webhookEvent.findUnique.mockResolvedValue(null);
    prisma.webhookEvent.create.mockResolvedValue({ id: "evt-1" });

    const body = Buffer.from(
      JSON.stringify({ type: "TRANSACTION", obj: { id: 1 } }),
    );
    const result = await service.receiveWebhook(
      "paymob",
      body,
      { "x-event-id": "header-9" },
      "secret",
    );

    expect(result).toEqual({ received: true, eventId: "evt-1" });
    // The dedup key is the provider id even when a header is present —
    // the old code searched by header and stored by provider id (P2002).
    expect(prisma.webhookEvent.findUnique).toHaveBeenCalledWith({
      where: {
        provider_externalEventId: {
          provider: "paymob",
          externalEventId: "tx-1",
        },
      },
    });
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "paymob",
        externalEventId: "tx-1",
        eventType: "payment.paid",
        signatureVerified: true,
        processingStatus: "PENDING",
        rawPayload: { type: "TRANSACTION", obj: { id: 1 } },
      }),
    });

    await flushImmediates();
    expect(processSpy).toHaveBeenCalledTimes(1);
    expect(processSpy).toHaveBeenCalledWith("evt-1");
  });

  it("returns the original row for a replayed webhook without re-queueing", async () => {
    const { service, prisma, provider } = build();
    const processSpy = jest
      .spyOn(service, "processEvent")
      .mockResolvedValue(undefined);

    provider.verifyWebhook.mockResolvedValue({
      valid: true,
      externalEventId: "tx-1",
      eventType: "payment.paid",
    });
    prisma.webhookEvent.findUnique.mockResolvedValue({ id: "evt-old" });

    const result = await service.receiveWebhook(
      "paymob",
      Buffer.from("{}"),
      {},
      "secret",
    );

    expect(result).toEqual({ received: true, eventId: "evt-old" });
    expect(prisma.webhookEvent.create).not.toHaveBeenCalled();

    await flushImmediates();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it("records invalid signatures safely (hash-keyed) and throws", async () => {
    const { service, prisma, provider } = build();
    const processSpy = jest
      .spyOn(service, "processEvent")
      .mockResolvedValue(undefined);

    provider.verifyWebhook.mockResolvedValue({
      valid: false,
      errorCode: "INVALID_SIGNATURE",
    });
    prisma.webhookEvent.create.mockResolvedValue({ id: "evt-bad" });

    await expect(
      service.receiveWebhook("paymob", Buffer.from('{"a":1}'), {}, "secret"),
    ).rejects.toThrow(/Invalid webhook signature/);

    expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "paymob",
        externalEventId: expect.stringMatching(/^[0-9a-f]{64}$/),
        eventType: "SIGNATURE_INVALID",
        signatureVerified: false,
        processingStatus: "FAILED",
      }),
    });

    await flushImmediates();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it("survives a P2002 when the same invalid payload is probed again", async () => {
    const { service, prisma, provider } = build();
    provider.verifyWebhook.mockResolvedValue({
      valid: false,
      errorCode: "INVALID_SIGNATURE",
    });
    prisma.webhookEvent.create.mockRejectedValue(uniqueViolation());

    await expect(
      service.receiveWebhook("paymob", Buffer.from('{"a":1}'), {}, "secret"),
    ).rejects.toThrow(/Invalid webhook signature/);
  });

  it("returns the winning row when a concurrent retry wins the insert race", async () => {
    const { service, prisma, provider } = build();
    const processSpy = jest
      .spyOn(service, "processEvent")
      .mockResolvedValue(undefined);

    provider.verifyWebhook.mockResolvedValue({
      valid: true,
      externalEventId: "tx-1",
      eventType: "payment.paid",
    });
    prisma.webhookEvent.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "evt-race" });
    prisma.webhookEvent.create.mockRejectedValue(uniqueViolation());

    const result = await service.receiveWebhook(
      "paymob",
      Buffer.from("{}"),
      {},
      "secret",
    );

    expect(result).toEqual({ received: true, eventId: "evt-race" });

    await flushImmediates();
    expect(processSpy).not.toHaveBeenCalled();
  });

  it("processes a paid Paymob event end to end (unwrap {obj}, match intent, complete)", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    const intent = {
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 10000n,
      currency: "EGP",
      requestedMethod: "CARD",
      status: "PROCESSING",
      metadata: {},
    };

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-1",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        type: "TRANSACTION",
        obj: {
          id: 999,
          success: true,
          pending: false,
          amount_cents: 10000,
          order: { id: 123, merchant_order_id: "order-1" },
        },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue(intent);
    idempotency.checkAndStore.mockResolvedValue({ isNew: true });
    prisma.payment.create.mockResolvedValue({ id: "pay-1" });

    await service.processEvent("evt-1");

    expect(prisma.paymentIntent.findFirst).toHaveBeenCalledWith({
      where: { orderId: "order-1", provider: "paymob", status: "PROCESSING" },
    });
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        provider: "paymob",
        status: "PAID",
        providerTransactionId: "999",
      }),
    });
    expect(orchestrator.completePayment).toHaveBeenCalledWith(
      "t-1",
      "pay-1",
      "order-1",
      "u-1",
      "paymob",
    );
    expect(idempotency.markCompleted).toHaveBeenCalledWith(
      "t-1",
      "webhook_payment_paymob_999",
      { paymentId: "pay-1" },
    );
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-1" },
      data: { processingStatus: "PROCESSED" },
    });
  });

  it("falls back to externalIntentId when merchant_order_id is absent", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    const intent = {
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 5000n,
      currency: "EGP",
      requestedMethod: "WALLET",
      metadata: {},
    };

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-2",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: { obj: { id: 7, order: { id: 555 } } },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(intent);
    idempotency.checkAndStore.mockResolvedValue({ isNew: true });
    prisma.payment.create.mockResolvedValue({ id: "pay-2" });

    await service.processEvent("evt-2");

    expect(prisma.paymentIntent.findFirst).toHaveBeenNthCalledWith(1, {
      where: { orderId: "555", provider: "paymob", status: "PROCESSING" },
    });
    expect(prisma.paymentIntent.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        externalIntentId: "555",
        provider: "paymob",
        status: "PROCESSING",
      },
    });
    expect(orchestrator.completePayment).toHaveBeenCalledWith(
      "t-1",
      "pay-2",
      "order-1",
      "u-1",
      "paymob",
    );
  });

  it("replays a COMPLETED idempotency claim without touching the payment", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-3",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 999, order: { merchant_order_id: "order-1" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 10000n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: {},
    });
    idempotency.checkAndStore.mockResolvedValue({
      isNew: false,
      response: { paymentId: "pay-old" },
    });

    await service.processEvent("evt-3");

    expect(prisma.payment.findFirst).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(orchestrator.completePayment).not.toHaveBeenCalled();
  });

  it("fails the event instead of swallowing a paid event with no intent and no settled payment", async () => {
    const { service, prisma, orchestrator } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-5",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 42, order: { merchant_order_id: "order-x" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue(null);
    prisma.payment.findFirst.mockResolvedValue(null);

    await expect(service.processEvent("evt-5")).rejects.toThrow(
      /INTENT_NOT_FOUND/,
    );

    expect(orchestrator.completePayment).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-5" },
      data: {
        processingStatus: "FAILED",
        errorCode: expect.stringContaining("INTENT_NOT_FOUND"),
      },
    });
  });

  it("treats a paid redelivery for an already-settled transaction as a duplicate no-op", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-6",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 42, order: { merchant_order_id: "order-x" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue(null);
    prisma.payment.findFirst.mockResolvedValue({ id: "pay-settled" });

    await service.processEvent("evt-6");

    expect(idempotency.checkAndStore).not.toHaveBeenCalled();
    expect(orchestrator.completePayment).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-6" },
      data: { processingStatus: "PROCESSED" },
    });
  });

  it("resumes a PENDING idempotency claim by completing the existing PAID payment", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-7",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 999, order: { merchant_order_id: "order-1" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 10000n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: {},
    });
    idempotency.checkAndStore.mockResolvedValue({ isNew: false });
    prisma.payment.findFirst.mockResolvedValue({ id: "pay-resume" });

    await service.processEvent("evt-7");

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(orchestrator.completePayment).toHaveBeenCalledWith(
      "t-1",
      "pay-resume",
      "order-1",
      "u-1",
      "paymob",
    );
    expect(idempotency.markCompleted).toHaveBeenCalledWith(
      "t-1",
      "webhook_payment_paymob_999",
      { paymentId: "pay-resume" },
    );
  });

  it("recreates the payment row when a PENDING claim died before inserting it", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-8",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 999, order: { merchant_order_id: "order-1" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 10000n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: {},
    });
    idempotency.checkAndStore.mockResolvedValue({ isNew: false });
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({ id: "pay-retry" });

    await service.processEvent("evt-8");

    expect(orchestrator.completePayment).toHaveBeenCalledWith(
      "t-1",
      "pay-retry",
      "order-1",
      "u-1",
      "paymob",
    );
    expect(idempotency.markCompleted).toHaveBeenCalledWith(
      "t-1",
      "webhook_payment_paymob_999",
      { paymentId: "pay-retry" },
    );
  });

  it("marks the event FAILED and rethrows when completion fails", async () => {
    const { service, prisma, orchestrator, idempotency } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-4",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: { id: 999, order: { merchant_order_id: "order-1" } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: "int-1",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-1",
      amountMinor: 10000n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: {},
    });
    idempotency.checkAndStore.mockResolvedValue({ isNew: true });
    prisma.payment.create.mockResolvedValue({ id: "pay-4" });
    orchestrator.completePayment.mockRejectedValue(new Error("ledger down"));

    await expect(service.processEvent("evt-4")).rejects.toThrow("ledger down");

    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-4" },
      data: { processingStatus: "FAILED", errorCode: "ledger down" },
    });
  });

  it("handles a failed payment event: updates the intent and records FAILED", async () => {
    const { service, prisma } = build();

    const intent = {
      id: "int-9",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-9",
      amountMinor: 2500n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: { note: "keep" },
    };

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-9",
      provider: "fawry",
      eventType: "payment.failed",
      rawPayload: { merchantRefNum: "order-9", failure_code: "DECLINED" },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue(intent);
    prisma.payment.create.mockResolvedValue({ id: "pay-9" });

    await service.processEvent("evt-9");

    expect(prisma.paymentIntent.update).toHaveBeenCalledWith({
      where: { id: "int-9" },
      data: expect.objectContaining({
        status: "FAILED",
        metadata: expect.objectContaining({ failureCode: "DECLINED" }),
      }),
    });
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-9",
        provider: "fawry",
        status: "FAILED",
        failureCode: "DECLINED",
      }),
    });
  });

  it("does not pile up FAILED rows when the provider redelivers a failure", async () => {
    const { service, prisma } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-10",
      provider: "fawry",
      eventType: "payment.failed",
      rawPayload: { merchantRefNum: "order-9", failure_code: "DECLINED" },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.paymentIntent.findFirst.mockResolvedValue({
      id: "int-9",
      tenantId: "t-1",
      userId: "u-1",
      orderId: "order-9",
      amountMinor: 2500n,
      currency: "EGP",
      requestedMethod: "CARD",
      metadata: {},
    });
    prisma.payment.findFirst.mockResolvedValue({ id: "pay-fail" });

    await service.processEvent("evt-10");

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.paymentIntent.update).not.toHaveBeenCalled();
  });

  it("retries FAILED events but never re-processes SIGNATURE_INVALID records", async () => {
    const { service, prisma } = build();
    prisma.webhookEvent.findMany.mockResolvedValue([]);
    const processSpy = jest
      .spyOn(service, "processEvent")
      .mockResolvedValue(undefined);

    const retried = await service.retryFailedWebhooks();

    expect(retried).toBe(0);
    expect(processSpy).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.findMany).toHaveBeenCalledWith({
      where: {
        processingStatus: "FAILED",
        eventType: { not: "SIGNATURE_INVALID" },
      },
      take: 50,
    });
  });

  it("never lets a processing failure escape the fire-and-forget queue", async () => {
    const { service } = build();
    const rejections: unknown[] = [];
    const onRejection = (reason: unknown) => rejections.push(reason);
    process.on("unhandledRejection", onRejection);
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      jest.spyOn(service, "processEvent").mockRejectedValue(new Error("boom"));
      await (service as any).queueForProcessing("evt-x");
      await flushImmediates();
      await new Promise((r) => setTimeout(r, 25));
    } finally {
      process.removeListener("unhandledRejection", onRejection);
      errSpy.mockRestore();
    }

    // An escaping rejection would take the API process down in production.
    expect(rejections).toHaveLength(0);
  });

  it("detects a SECOND charge: different transaction id for an already settled order (bundle C)", async () => {
    const { service, prisma, orchestrator } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-sc",
      provider: "paymob",
      eventType: "payment.paid",
      rawPayload: {
        obj: {
          id: 777,
          success: true,
          order: { merchant_order_id: "order-1" },
        },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    // 1st lookup: no PROCESSING intent. 2nd: the settled intent for the order.
    prisma.paymentIntent.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "int-1", orderId: "order-1" });
    // 1st lookup: "777" is not on file. 2nd: the settled payment — a DIFFERENT
    // transaction id for the same order.
    prisma.payment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: "pay-1",
      tenantId: "t-1",
      userId: "u-1",
      providerTransactionId: "111",
      status: "PAID",
    });

    await expect(service.processEvent("evt-sc")).rejects.toThrow(
      /SECOND_CHARGE_DETECTED/,
    );

    expect(prisma.paymentRiskEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: "t-1",
        paymentId: "pay-1",
        eventType: "SECOND_CHARGE_DETECTED",
        severity: "HIGH",
        details: expect.objectContaining({
          incomingTransactionId: "777",
          settledTransactionId: "111",
          orderId: "order-1",
        }),
      }),
    });
    expect(orchestrator.completePayment).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-sc" },
      data: {
        processingStatus: "FAILED",
        errorCode: expect.stringContaining("SECOND_CHARGE_DETECTED"),
      },
    });
  });

  it("settles a Paymob refund callback through the orchestrator (parent_transaction match)", async () => {
    const { service, prisma, orchestrator, audit } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-r1",
      provider: "paymob",
      eventType: "payment.refunded",
      rawPayload: {
        obj: {
          id: 554400,
          success: true,
          is_refunded: true,
          parent_transaction: 999,
          refunded_amount_cents: 10000,
          order: { merchant_order_id: "order-1" },
        },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.payment.findFirst.mockResolvedValue({
      id: "pay-1",
      tenantId: "t-1",
      userId: "u-1",
      providerTransactionId: "999",
      status: "REFUND_PENDING",
    });
    orchestrator.settleRefundFromProvider.mockResolvedValue("settled");

    await service.processEvent("evt-r1");

    expect(prisma.payment.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        provider: "paymob",
        providerTransactionId: "999",
        status: { in: ["PAID", "REFUND_PENDING", "REFUNDED"] },
      },
    });
    expect(orchestrator.settleRefundFromProvider).toHaveBeenCalledWith({
      tenantId: "t-1",
      paymentId: "pay-1",
      provider: "paymob",
      providerRefundId: "554400",
      refundAmountMinor: 10000n,
      webhookEventId: "evt-r1",
    });
    expect(audit.log).toHaveBeenCalledWith(
      "t-1",
      "webhook",
      "REFUND_SETTLED_WEBHOOK",
      "refund",
      "pay-1",
      expect.objectContaining({ providerRefundId: "554400" }),
    );
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-r1" },
      data: { processingStatus: "PROCESSED" },
    });
  });

  it("does not audit a refund callback that has nothing to settle", async () => {
    const { service, prisma, orchestrator, audit } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-r2",
      provider: "paymob",
      eventType: "payment.refunded",
      rawPayload: {
        obj: {
          id: 554401,
          is_refunded: true,
          parent_transaction: 999,
          order: { merchant_order_id: "order-1" },
        },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.payment.findFirst.mockResolvedValue({
      id: "pay-1",
      tenantId: "t-1",
      userId: "u-1",
      providerTransactionId: "999",
      status: "REFUNDED",
    });
    orchestrator.settleRefundFromProvider.mockResolvedValue("no_op");

    await service.processEvent("evt-r2");

    expect(orchestrator.settleRefundFromProvider).toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-r2" },
      data: { processingStatus: "PROCESSED" },
    });
  });

  it("ignores a refund callback whose payment cannot be resolved", async () => {
    const { service, prisma, orchestrator } = build();

    prisma.webhookEvent.findUnique.mockResolvedValue({
      id: "evt-r3",
      provider: "paymob",
      eventType: "payment.refunded",
      rawPayload: {
        obj: { id: 111, is_refunded: true, order: { id: 222 } },
      },
    });
    prisma.webhookEvent.update.mockResolvedValue({});
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.paymentIntent.findFirst.mockResolvedValue(null);

    await service.processEvent("evt-r3");

    expect(orchestrator.settleRefundFromProvider).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).toHaveBeenLastCalledWith({
      where: { id: "evt-r3" },
      data: { processingStatus: "PROCESSED" },
    });
  });
});
