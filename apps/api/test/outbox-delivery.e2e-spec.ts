import { createHmac } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { PrismaClient } from "@prisma/client";
import { runWithTenantId } from "../src/common/prisma/tenant-context";
import { AuditService } from "../src/modules/audit/audit.service";
import { HttpOutboxTransport } from "../src/modules/outbox/http-outbox.transport";
import { OutboxAdminService } from "../src/modules/outbox/outbox-admin.service";
import { OutboxDispatcherService } from "../src/modules/outbox/outbox-dispatcher.service";
import { OutboxService } from "../src/modules/outbox/outbox.service";
import { PrismaService } from "../src/modules/tenants/prisma.service";

/**
 * Real local-sink proof for outbox delivery.
 *
 * Skipped unless OUTBOX_E2E=1 and the RLS owner/app URLs are set. The test
 * starts an HTTP receiver, inserts an event with the owner connection, runs the
 * real dispatcher as app_user, and verifies the HMAC, RLS-scoped read, retry,
 * dead-letter, and published states.
 */

const ADMIN_URL = process.env.RLS_ADMIN_URL;
const APP_URL = process.env.RLS_APP_URL;
const ENABLED = process.env.OUTBOX_E2E === "1" && Boolean(ADMIN_URL && APP_URL);
const describeOutbox = ENABLED ? describe : describe.skip;

const SECRET = "outbox-e2e-secret";

interface SinkRequest {
  body: string;
  headers: Record<string, string | string[] | undefined>;
}

describeOutbox("Outbox delivery (real DB + local HTTP sink)", () => {
  let admin: PrismaClient;
  let appPrisma: PrismaService;
  let outbox: OutboxService;
  let dispatcher: OutboxDispatcherService;
  let adminService: OutboxAdminService;
  let server: Server;
  let sinkUrl: string;
  let tenantId: string;
  let sinkMode: "ok" | "500" | "400" = "ok";
  const requests: SinkRequest[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = APP_URL;
    process.env.OUTBOX_WEBHOOK_SECRET = SECRET;
    process.env.OUTBOX_WEBHOOK_TIMEOUT_MS = "2000";

    admin = new PrismaClient({ datasources: { db: { url: ADMIN_URL } } });
    const tenant = await admin.tenant.create({
      data: {
        name: "Outbox E2E",
        slug: `outbox-e2e-${Date.now()}`,
        status: "ACTIVE",
      },
    });
    tenantId = tenant.id;

    server = createServer(async (req, res) => {
      const body = await readBody(req);
      requests.push({ body, headers: req.headers });
      const status = sinkMode === "ok" ? 200 : Number(sinkMode);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: status === 200 }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("outbox-e2e-sink-did-not-bind");
    }
    sinkUrl = `http://127.0.0.1:${address.port}/outbox`;
    process.env.OUTBOX_WEBHOOK_URL = sinkUrl;

    appPrisma = new PrismaService();
    await appPrisma.onModuleInit();
    outbox = new OutboxService(appPrisma);
    dispatcher = new OutboxDispatcherService(
      appPrisma,
      outbox,
      new HttpOutboxTransport(),
    );
    adminService = new OutboxAdminService(appPrisma, new AuditService(appPrisma));
  }, 30_000);

  afterEach(async () => {
    await admin.outboxEvent.deleteMany({ where: { tenantId } });
    await admin.auditLog.deleteMany({ where: { tenantId } });
    requests.length = 0;
    sinkMode = "ok";
  });

  afterAll(async () => {
    if (admin && tenantId) {
      await admin.outboxEvent.deleteMany({ where: { tenantId } });
      await admin.auditLog.deleteMany({ where: { tenantId } });
      await admin.tenant.deleteMany({ where: { id: tenantId } });
    }
    await appPrisma?.onModuleDestroy();
    await admin?.$disconnect();
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    delete process.env.OUTBOX_WEBHOOK_URL;
    delete process.env.OUTBOX_WEBHOOK_SECRET;
    delete process.env.OUTBOX_WEBHOOK_TIMEOUT_MS;
  });

  function eventId(): string {
    return `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function insertEvent(id: string) {
    return admin.outboxEvent.create({
      data: {
        id,
        tenantId,
        eventType: "e2e.outbox.test",
        eventVersion: 1,
        aggregateType: "e2e",
        aggregateId: "aggregate-1",
        payload: { hello: "world", id },
      },
    });
  }

  it("delivers a tenant event, verifies HMAC, and stamps publishedAt", async () => {
    const id = eventId();
    await insertEvent(id);

    const result = await dispatcher.sweep();

    expect(result.failedTenants).toBe(0);
    expect(requests).toHaveLength(1);
    const request = requests[0];
    const body = request.body;
    const headers = request.headers;
    const timestamp = headers["x-sanad-timestamp"] as string;
    const signature = headers["x-sanad-signature"] as string;
    const expected = createHmac("sha256", SECRET)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    expect(headers["x-sanad-event-id"]).toBe(id);
    expect(signature).toBe(`sha256=${expected}`);
    expect(JSON.parse(body)).toEqual(
      expect.objectContaining({
        id,
        type: "e2e.outbox.test",
        tenantId,
        payload: { hello: "world", id },
      }),
    );

    const stored = await admin.outboxEvent.findUniqueOrThrow({ where: { id } });
    expect(stored.publishedAt).not.toBeNull();
    expect(stored.deadAt).toBeNull();
  });

  it("retries a 500 and succeeds once the receiver recovers", async () => {
    const id = eventId();
    await insertEvent(id);
    sinkMode = "500";

    const failed = await dispatcher.sweep();
    expect(failed.retried).toBe(1);
    const afterFailure = await admin.outboxEvent.findUniqueOrThrow({
      where: { id },
    });
    expect(afterFailure.publishedAt).toBeNull();
    expect(afterFailure.retryCount).toBe(1);
    expect(afterFailure.nextAttemptAt).not.toBeNull();
    expect(afterFailure.lastError).toBe("http-500");

    await admin.outboxEvent.update({
      where: { id },
      data: { nextAttemptAt: null },
    });
    sinkMode = "ok";
    const delivered = await dispatcher.sweep();
    expect(delivered.delivered).toBe(1);

    const afterSuccess = await admin.outboxEvent.findUniqueOrThrow({
      where: { id },
    });
    expect(afterSuccess.publishedAt).not.toBeNull();
    expect(afterSuccess.deadAt).toBeNull();
  });

  it("dead-letters a permanent 4xx", async () => {
    const id = eventId();
    await insertEvent(id);
    sinkMode = "400";

    const result = await dispatcher.sweep();
    expect(result.dead).toBe(1);

    const stored = await admin.outboxEvent.findUniqueOrThrow({ where: { id } });
    expect(stored.publishedAt).toBeNull();
    expect(stored.deadAt).not.toBeNull();
    expect(stored.lastError).toBe("http-400");
  });

  it("lists and requeues a dead letter through the admin service", async () => {
    const id = eventId();
    await insertEvent(id);
    sinkMode = "400";

    await dispatcher.sweep();

    const listed = await runWithTenantId(tenantId, () =>
      adminService.listDeadLetters(tenantId),
    );
    expect(listed.total).toBe(1);
    expect(listed.items[0]).toMatchObject({
      id,
      eventType: "e2e.outbox.test",
      retryCount: 1,
      lastError: "http-400",
    });
    expect(listed.items[0]).not.toHaveProperty("payload");

    const retried = await runWithTenantId(tenantId, () =>
      adminService.retryDeadLetter(tenantId, id),
    );
    expect(retried).toMatchObject({ id, requeued: true });

    const stored = await admin.outboxEvent.findUniqueOrThrow({ where: { id } });
    expect(stored.deadAt).toBeNull();
    expect(stored.retryCount).toBe(0);
    expect(stored.lastError).toBeNull();
    expect(stored.nextAttemptAt).not.toBeNull();

    const audit = await admin.auditLog.findFirst({
      where: { tenantId, resourceId: id },
    });
    expect(audit?.action).toBe("OUTBOX_DEAD_LETTER_RETRIED");
  });

  it("does not redeliver an already-published event", async () => {
    const id = eventId();
    await insertEvent(id);
    await dispatcher.sweep();
    const count = requests.length;

    await dispatcher.sweep();
    expect(requests).toHaveLength(count);
  });
});

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
