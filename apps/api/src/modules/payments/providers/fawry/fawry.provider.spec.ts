import * as crypto from "crypto";
import { FawryProvider } from "./fawry.provider";

/**
 * Audit 2026-10-16 §5.1/§5.3: Fawry webhook verification called
 * `crypto.timingSafeEqual` without a length check — a malformed signature
 * header threw RangeError (500) instead of returning invalid (401). The tests
 * below also pin the production body shape: Nest delivers the raw body as a
 * Buffer (`rawBody: true`), never as a string.
 */
describe("FawryProvider.verifyWebhook (audit #5)", () => {
  const MERCHANT = "merchant-code";
  const HASH_KEY = "secure-hash-key";

  function build() {
    const configService = {
      get: jest.fn(
        (key: string) =>
          ({
            FAWRY_MERCHANT_CODE: MERCHANT,
            FAWRY_SECURE_HASH_KEY: HASH_KEY,
          })[key as any],
      ),
    };
    return new FawryProvider(configService as any);
  }

  const payload = {
    referenceNumber: "ref-1",
    merchantRefNumber: "order-1",
    customerProfileId: "cust-1",
    paymentAmount: 100,
    orderAmount: 100,
    orderStatus: "PAID",
    paymentMethod: "CARD",
  };

  it("rejects a malformed (short) signature without throwing", async () => {
    const provider = build();

    const result = await provider.verifyWebhook({
      provider: "fawry",
      rawBody: Buffer.from(JSON.stringify(payload)),
      headers: { signature: "abc" },
      secret: HASH_KEY,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_SIGNATURE");
  });

  it("accepts a correctly signed callback with a Buffer body (as Nest provides)", async () => {
    const provider = build();
    const expected = crypto
      .createHash("sha256")
      .update(
        `${MERCHANT}${payload.referenceNumber}${payload.merchantRefNumber}${payload.customerProfileId}${payload.paymentAmount}${payload.orderAmount}${payload.orderStatus}${payload.paymentMethod}${HASH_KEY}`,
      )
      .digest("hex");

    const result = await provider.verifyWebhook({
      provider: "fawry",
      rawBody: Buffer.from(JSON.stringify(payload)),
      headers: { signature: expected },
      secret: HASH_KEY,
    });

    expect(result.valid).toBe(true);
    expect(result.externalEventId).toBe("ref-1");
  });

  it("rejects a non-JSON body without throwing", async () => {
    const provider = build();

    const result = await provider.verifyWebhook({
      provider: "fawry",
      rawBody: Buffer.from("not-json"),
      headers: { signature: "a".repeat(64) },
      secret: HASH_KEY,
    });

    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("INVALID_PAYLOAD");
  });
});
