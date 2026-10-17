import * as crypto from "crypto";
import { PaymobProvider } from "./paymob.provider";

/**
 * Audit 2026-10-16 §5.3: Paymob callback HMAC is computed over a
 * concatenation of specific fields (documented order), not the raw body.
 * These tests pin the concatenation and the malformed-signature behaviour.
 */
describe("PaymobProvider.verifyWebhook (audit #5)", () => {
  const SECRET = "test-hmac-secret";

  function build(config: Record<string, any> = {}) {
    const configService = {
      get: jest.fn(
        (key: string) =>
          ({
            PAYMOB_HMAC_SECRET: SECRET,
            ...config,
          })[key as any],
      ),
    };
    return new PaymobProvider(configService as any);
  }

  function sign(obj: Record<string, any>): string {
    // Independent restatement of Paymob's documented field order.
    const concatenated = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ]
      .map((v) => (v === undefined || v === null ? "" : String(v)))
      .join("");
    return crypto
      .createHmac("sha512", SECRET)
      .update(concatenated)
      .digest("hex");
  }

  const transaction = {
    id: 123456,
    amount_cents: 10000,
    created_at: "2026-10-17T00:00:00.000000",
    currency: "EGP",
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 777,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    owner: 42,
    pending: false,
    source_data: { pan: "2345", sub_type: "MasterCard", type: "card" },
    success: true,
    order: { id: 987654 },
  };

  it("accepts a correctly field-signed callback (Buffer body, as Nest provides)", async () => {
    const provider = build();
    const body = Buffer.from(
      JSON.stringify({ type: "TRANSACTION", obj: transaction }),
    );

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: body,
      headers: { hmac: sign(transaction) },
      secret: SECRET,
    });

    expect(result.valid).toBe(true);
    expect(result.eventType).toBe("payment.paid");
    expect(result.externalEventId).toBe("123456");
    expect(result.rawPayload).toEqual({
      type: "TRANSACTION",
      obj: transaction,
    });
  });

  it("rejects a tampered payload even with a well-formed signature", async () => {
    const provider = build();
    const tampered = { ...transaction, amount_cents: 1 };
    const body = Buffer.from(JSON.stringify({ obj: tampered }));

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: body,
      headers: { hmac: sign(transaction) },
      secret: SECRET,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_SIGNATURE");
  });

  it("rejects a malformed hmac header without throwing (length guard)", async () => {
    const provider = build();
    const body = Buffer.from(JSON.stringify({ obj: transaction }));

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: body,
      headers: { hmac: "zzzz" },
      secret: SECRET,
    });

    expect(result.valid).toBe(false);
  });

  it("rejects a non-JSON body without throwing", async () => {
    const provider = build();

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: "not-json",
      headers: { hmac: "a".repeat(128) },
      secret: SECRET,
    });

    expect(result.valid).toBe(false);
  });

  it("classifies a refund callback as payment.refunded even though success=true (bundle C)", async () => {
    const provider = build();
    const refundTransaction = {
      ...transaction,
      id: 555444,
      has_parent_transaction: true,
      is_refunded: true,
    };
    const body = Buffer.from(
      JSON.stringify({ type: "TRANSACTION", obj: refundTransaction }),
    );

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: body,
      headers: { hmac: sign(refundTransaction) },
      secret: SECRET,
    });

    // Before bundle C the paid-check ran first and a refund callback mapped to
    // `payment.paid`, so refunds from Paymob could never settle.
    expect(result.valid).toBe(true);
    expect(result.eventType).toBe("payment.refunded");
    expect(result.externalEventId).toBe("555444");
    expect(result.transactionId).toBe("555444");
  });

  it("classifies a voided transaction as payment.cancelled", async () => {
    const provider = build();
    const voidedTransaction = {
      ...transaction,
      id: 666777,
      is_voided: true,
      success: false,
    };
    const body = Buffer.from(JSON.stringify({ obj: voidedTransaction }));

    const result = await provider.verifyWebhook({
      provider: "paymob",
      rawBody: body,
      headers: { hmac: sign(voidedTransaction) },
      secret: SECRET,
    });

    expect(result.valid).toBe(true);
    expect(result.eventType).toBe("payment.cancelled");
  });
});

describe("PaymobProvider.refund (bundle C)", () => {
  const SECRET = "test-hmac-secret";
  const originalFetch = global.fetch;

  function build() {
    const configService = {
      get: jest.fn(
        (key: string) =>
          ({
            PAYMOB_HMAC_SECRET: SECRET,
            PAYMOB_BASE_URL: "http://paymob.stub",
            PAYMOB_API_KEY: "api-key",
          })[key as any],
      ),
    };
    return new PaymobProvider(configService as any);
  }

  const refundInput = {
    providerPaymentId: "999",
    providerTransactionId: "999",
    amountMinor: 5000n,
    currency: "EGP",
    reason: "student dropped out",
    idempotencyKey: "ref-1",
  };

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it("accepts an accepted refund and keeps Paymob's refund transaction id", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ token: "tok" }) })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, id: 553311 }),
      });
    (global as any).fetch = fetchMock;

    const result = await build().refund(refundInput as any);

    expect(result.success).toBe(true);
    expect(result.providerRefundId).toBe("553311");
    expect(result.status).toBe("SUCCEEDED");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://paymob.stub/acceptance/void_refund/refund",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("fails visibly when Paymob rejects the refund (the old code returned success:true anyway)", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ token: "tok" }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          success: false,
          message: "Cannot refund a voided transaction",
        }),
      });
    (global as any).fetch = fetchMock;

    const result = await build().refund(refundInput as any);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("REFUND_REJECTED");
    expect(result.errorMessage).toBe("Cannot refund a voided transaction");
    expect(result.providerRefundId).toBeUndefined();
  });

  it("fails visibly on an HTTP error even when the body is not JSON", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ token: "tok" }) })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("not json");
        },
      });
    (global as any).fetch = fetchMock;

    const result = await build().refund(refundInput as any);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("REFUND_REJECTED");
    expect(result.errorMessage).toContain("502");
  });
});
