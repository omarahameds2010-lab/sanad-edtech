import { Prisma } from "@prisma/client";
import { WebhookInboxService } from "./webhook-inbox.service";

/**
 * Regression suite for audit 2026-10-16 §5.1 (payment webhooks):
 *  - raw body must exist before anything else,
 *  - signature verification runs before persistence,
 *  - dedup is keyed on the PROVIDER-derived event id (not the http header),
 *  - the raw payload is stored and later consumed by the event handlers,
 *  - replays / unique-constraint races never explode or double-queue.
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
      payment: { create: jest.fn() },
      refund: { updateMany: jest.fn() },
    };
    const registry = { getProvider: jest.fn() };
    const provider = buildProvider();
    registry.getProvider.mockReturnValue(provider);
    const orchestrator = { completePayment: jest.fn().mockResolvedValue({}) };
    const idempotency = {
      checkAndStore: jest.fn(),
      markCompleted: jest.fn(),
    };

    const service = new WebhookInboxService(
      prisma as any,
      registry as any,
      orchestrator as any,
      idempotency as any,
      {} as any,
      {} as any,
    );

    return {
      service,
      prisma,
      registry,
      provider,
      orchestrator,
      idempotency,
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

  it("does not double-complete when idempotency says the event was processed", async () => {
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
    idempotency.checkAndStore.mockResolvedValue({ isNew: false });

    await service.processEvent("evt-3");

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(orchestrator.completePayment).not.toHaveBeenCalled();
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
});
