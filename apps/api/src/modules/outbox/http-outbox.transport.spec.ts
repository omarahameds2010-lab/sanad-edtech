import { createHmac } from "node:crypto";
import { HttpOutboxTransport } from "./http-outbox.transport";
import type { OutboxEnvelope } from "./outbox.types";

const ENV_KEYS = [
  "OUTBOX_WEBHOOK_URL",
  "OUTBOX_WEBHOOK_SECRET",
  "OUTBOX_WEBHOOK_TIMEOUT_MS",
] as const;

const envelope: OutboxEnvelope = {
  id: "event-1",
  type: "payment.paid",
  version: 1,
  tenantId: "tenant-1",
  occurredAt: "2026-11-19T12:00:00.000Z",
  aggregate: { type: "payment", id: "payment-1" },
  payload: { amountMinor: "19900" },
};

describe("HttpOutboxTransport", () => {
  let saved: Record<string, string | undefined>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    saved = {};
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    originalFetch = global.fetch;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("is disabled without a URL or signing secret", async () => {
    const transport = new HttpOutboxTransport();
    expect(transport.enabled).toBe(false);
    expect(transport.disabledReason).toContain("OUTBOX_WEBHOOK_URL");
    await expect(transport.deliver(envelope)).resolves.toEqual({
      ok: false,
      retryable: false,
      error: "outbox-delivery-not-configured",
    });
  });

  it("is disabled when the URL is set but the secret is missing", () => {
    process.env.OUTBOX_WEBHOOK_URL = "https://example.test/outbox";
    const transport = new HttpOutboxTransport();
    expect(transport.enabled).toBe(false);
    expect(transport.disabledReason).toContain("OUTBOX_WEBHOOK_SECRET");
  });

  it("signs and posts the event envelope", async () => {
    process.env.OUTBOX_WEBHOOK_URL = "https://example.test/outbox";
    process.env.OUTBOX_WEBHOOK_SECRET = "test-secret";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ status: 202 } as Response);
    const transport = new HttpOutboxTransport();

    await expect(transport.deliver(envelope)).resolves.toEqual({
      ok: true,
      retryable: false,
      status: 202,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/outbox");
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("error");
    expect(init?.body).toBe(JSON.stringify(envelope));

    const headers = init?.headers as Record<string, string>;
    expect(headers["X-SANAD-Event-Id"]).toBe("event-1");
    const expected = createHmac("sha256", "test-secret")
      .update(`${headers["X-SANAD-Timestamp"]}.${init?.body}`)
      .digest("hex");
    expect(headers["X-SANAD-Signature"]).toBe(`sha256=${expected}`);
  });

  it("marks 5xx and 429 responses as retryable", async () => {
    process.env.OUTBOX_WEBHOOK_URL = "https://example.test/outbox";
    process.env.OUTBOX_WEBHOOK_SECRET = "test-secret";

    for (const status of [500, 503, 429]) {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({ status } as Response);
      const transport = new HttpOutboxTransport();
      await expect(transport.deliver(envelope)).resolves.toEqual({
        ok: false,
        retryable: true,
        status,
        error: `http-${status}`,
      });
    }
  });

  it("treats other 4xx responses as permanent failures", async () => {
    process.env.OUTBOX_WEBHOOK_URL = "https://example.test/outbox";
    process.env.OUTBOX_WEBHOOK_SECRET = "test-secret";
    jest.spyOn(global, "fetch").mockResolvedValue({ status: 400 } as Response);

    const transport = new HttpOutboxTransport();
    await expect(transport.deliver(envelope)).resolves.toEqual({
      ok: false,
      retryable: false,
      status: 400,
      error: "http-400",
    });
  });

  it("treats network failures as retryable", async () => {
    process.env.OUTBOX_WEBHOOK_URL = "https://example.test/outbox";
    process.env.OUTBOX_WEBHOOK_SECRET = "test-secret";
    jest
      .spyOn(global, "fetch")
      .mockRejectedValue(new Error("connection refused"));

    const transport = new HttpOutboxTransport();
    await expect(transport.deliver(envelope)).resolves.toEqual({
      ok: false,
      retryable: true,
      error: "network-error",
    });
  });
});
