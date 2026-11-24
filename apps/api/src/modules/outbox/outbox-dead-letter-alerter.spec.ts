import { createHmac } from "node:crypto";
import { OutboxDeadLetterAlerter } from "./outbox-dead-letter-alerter";

const ENV_KEYS = [
  "OUTBOX_ALERT_WEBHOOK_URL",
  "OUTBOX_ALERT_WEBHOOK_SECRET",
  "OUTBOX_WEBHOOK_TIMEOUT_MS",
] as const;

const ALERT = {
  tenantId: "tenant-1",
  eventId: "event-1",
  eventType: "payment.paid",
  attempt: 3,
  error: "http-400",
};

describe("OutboxDeadLetterAlerter", () => {
  let saved: Record<string, string | undefined>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    saved = {};
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    process.env.OUTBOX_WEBHOOK_TIMEOUT_MS = "1000";
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
  });

  it("stays disabled unless both the URL and secret are set", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    const alerter = new OutboxDeadLetterAlerter();

    await expect(alerter.send(ALERT)).resolves.toMatchObject({
      sent: false,
      skipped: true,
    });

    process.env.OUTBOX_ALERT_WEBHOOK_URL = "https://alerts.example.test/hook";
    await expect(alerter.send(ALERT)).resolves.toMatchObject({
      sent: false,
      skipped: true,
      reason: "OUTBOX_ALERT_WEBHOOK_SECRET is not set",
    });

    delete process.env.OUTBOX_ALERT_WEBHOOK_URL;
    process.env.OUTBOX_ALERT_WEBHOOK_SECRET = "alert-secret";
    await expect(alerter.send(ALERT)).resolves.toMatchObject({
      sent: false,
      skipped: true,
      reason: "OUTBOX_ALERT_WEBHOOK_URL is not set",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a payload-free HMAC-signed alert", async () => {
    process.env.OUTBOX_ALERT_WEBHOOK_URL = "https://alerts.example.test/hook";
    process.env.OUTBOX_ALERT_WEBHOOK_SECRET = "alert-secret";
    const fetchMock = jest.fn().mockResolvedValue({ status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;
    const alerter = new OutboxDeadLetterAlerter();

    await expect(alerter.send(ALERT)).resolves.toEqual({
      sent: true,
      skipped: false,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://alerts.example.test/hook");
    expect(init).toMatchObject({
      method: "POST",
      redirect: "error",
    });

    const body = init.body as string;
    const parsed = JSON.parse(body);
    expect(parsed).toEqual(
      expect.objectContaining({
        alert: "outbox.dead_letter",
        tenantId: "tenant-1",
        eventId: "event-1",
        eventType: "payment.paid",
        attempt: 3,
        error: "http-400",
      }),
    );
    expect(parsed).not.toHaveProperty("payload");
    expect(body).not.toContain("alert-secret");
    expect(Number.isNaN(Date.parse(parsed.deadAt))).toBe(false);

    const timestamp = init.headers["X-SANAD-Timestamp"];
    const signature = init.headers["X-SANAD-Signature"];
    const expected = createHmac("sha256", "alert-secret")
      .update(`${timestamp}.${body}`)
      .digest("hex");
    expect(signature).toBe(`sha256=${expected}`);
    expect(init.headers["X-SANAD-Alert-Id"]).toBe("event-1");
  });

  it("does not throw when the alert receiver rejects the request", async () => {
    process.env.OUTBOX_ALERT_WEBHOOK_URL = "https://alerts.example.test/hook";
    process.env.OUTBOX_ALERT_WEBHOOK_SECRET = "alert-secret";
    global.fetch = jest
      .fn()
      .mockResolvedValue({ status: 503 }) as unknown as typeof fetch;
    const alerter = new OutboxDeadLetterAlerter();

    await expect(alerter.send(ALERT)).resolves.toEqual({
      sent: false,
      skipped: false,
      reason: "http-503",
    });
  });

  it("does not throw when the alert receiver is unreachable", async () => {
    process.env.OUTBOX_ALERT_WEBHOOK_URL = "https://alerts.example.test/hook";
    process.env.OUTBOX_ALERT_WEBHOOK_SECRET = "alert-secret";
    global.fetch = jest
      .fn()
      .mockRejectedValue(
        new Error("connect ECONNREFUSED"),
      ) as unknown as typeof fetch;
    const alerter = new OutboxDeadLetterAlerter();

    await expect(alerter.send(ALERT)).resolves.toEqual({
      sent: false,
      skipped: false,
      reason: "network-error",
    });
  });
});
