import { BadRequestException, ConflictException } from "@nestjs/common";
import * as argon2 from "argon2";
import { AuthService } from "./auth.service";

/**
 * Tests are behavioural: they drive the service through a stateful in-memory
 * Prisma fake, so what is asserted is what the code actually does to a
 * database — not merely that certain methods were called.
 */
function createFakePrisma() {
  const sessions = new Map<string, any>();
  const users = new Map<string, any>();
  let idCounter = 0;

  function match(row: any, where: any): boolean {
    if (where.id !== undefined && row.id !== where.id) return false;
    if (where.familyId !== undefined && row.familyId !== where.familyId)
      return false;
    if (where.userId !== undefined && row.userId !== where.userId) return false;
    if (where.revokedAt === null && row.revokedAt != null) return false;
    // Operator form used by the claim guard, e.g. { gt: someDate }.
    const expiry = where.expiresAt;
    if (expiry && typeof expiry === "object") {
      if (expiry.gt !== undefined && !(row.expiresAt > expiry.gt)) return false;
      if (expiry.lt !== undefined && !(row.expiresAt < expiry.lt)) return false;
    }
    return true;
  }

  const sessionStore = {
    create: jest.fn(async ({ data }: any) => {
      const id = `${data.userId ?? "s"}-${++idCounter}`;
      const row = {
        id,
        revokedAt: null,
        revokedReason: null,
        lastRotatedAt: null,
        ...data,
      };
      sessions.set(id, row);
      return { ...row };
    }),

    update: jest.fn(async ({ where, data }: any) => {
      const row = sessions.get(where.id);
      if (!row) throw new Error(`session ${where.id} not found`);
      Object.assign(row, data);
      return { ...row };
    }),

    updateMany: jest.fn(async ({ where, data }: any) => {
      let count = 0;
      for (const row of sessions.values()) {
        if (match(row, where)) {
          Object.assign(row, data);
          count++;
        }
      }
      return { count };
    }),

    findUnique: jest.fn(async ({ where, include }: any = {}) => {
      let row: any = null;
      if (where?.id) {
        row = sessions.get(where.id) ?? null;
      } else if (where?.refreshTokenLookup) {
        for (const candidate of sessions.values()) {
          if (candidate.refreshTokenLookup === where.refreshTokenLookup) {
            row = candidate;
            break;
          }
        }
      }
      if (!row) return null;
      const copy = { ...row };
      if (include?.user) copy.user = users.get(row.userId) ?? null;
      return copy;
    }),
  };

  const prisma: any = {
    session: {
      ...sessionStore,
      findMany: jest.fn(async ({ where, orderBy }: any = {}) => {
        let rows = [...sessions.values()];
        if (where?.userId !== undefined) {
          rows = rows.filter((r) => r.userId === where.userId);
        }
        if (where?.revokedAt === null) {
          rows = rows.filter((r) => r.revokedAt == null);
        }
        if (orderBy?.createdAt === "desc") {
          rows = rows.reverse();
        }
        return rows.map((r) => ({ ...r }));
      }),
    },
    securityEvent: {
      create: jest.fn(async ({ data }: any) => ({ id: "e1", ...data })),
    },
    device: {
      upsert: jest.fn(async ({ create }: any) => ({ id: "d1", ...create })),
    },
    $transaction: jest.fn(async (arg: any) => {
      // Batch form: an array of promises resolved together in one round-trip.
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      // Interactive form: a callback that receives the client.
      return arg(prisma);
    }),
  };

  return { prisma, sessions, users, idCounter: () => idCounter };
}

function seedUser(fake: ReturnType<typeof createFakePrisma>, id = "u1") {
  const user = {
    id,
    tenantId: "t1",
    role: "STUDENT",
    name: "طالب",
    status: "ACTIVE",
  };
  fake.users.set(id, user);
  return user;
}

function sha256Hex(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require("crypto");
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("AuthService", () => {
  let service: AuthService;
  let fake: ReturnType<typeof createFakePrisma>;
  let usersService: any;
  let jwtService: any;

  beforeEach(() => {
    fake = createFakePrisma();
    seedUser(fake);
    usersService = { create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue("access-token") };
    service = new AuthService(usersService, jwtService, fake.prisma);
  });

  // -------------------------------------------------------------------------
  describe("register", () => {
    it("creates the user and logs them in", async () => {
      usersService.create.mockResolvedValue({
        id: "u1",
        tenantId: "t1",
        role: "STUDENT",
        name: "طالب جديد",
      });

      const result = await service.register("t1", {
        name: "طالب جديد",
        phone: "01012345678",
        password: "password123",
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: "t1", role: "STUDENT" }),
      );
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.user.id).toBe("u1");
    });

    it("rejects privileged roles", async () => {
      await expect(
        service.register("t1", {
          name: "x",
          phone: "01012345678",
          password: "password123",
          role: "ADMIN" as any,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it("propagates duplicate-phone conflicts", async () => {
      usersService.create.mockRejectedValue(
        new ConflictException("User with this phone already exists"),
      );

      await expect(
        service.register("t1", {
          name: "x",
          phone: "01012345678",
          password: "password123",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // -------------------------------------------------------------------------
  describe("login — token issuance", () => {
    it("never writes the raw refresh token to the database", async () => {
      const { tokens } = await service.login(seedUser(fake));

      const rows = [...fake.sessions.values()];
      expect(rows).toHaveLength(1);
      expect(rows[0].refreshTokenHash).toBeTruthy();
      expect(rows[0].refreshTokenHash).not.toBe(tokens.refreshToken);
      expect(rows[0].refreshTokenLookup).not.toBe(tokens.refreshToken);
    });

    it("stores an Argon2id hash, not a plain sha256", async () => {
      const { tokens } = await service.login(seedUser(fake));
      const row = [...fake.sessions.values()][0];

      // Argon2id encoded hashes begin with $argon2id$.
      expect(row.refreshTokenHash.startsWith("$argon2id$")).toBe(true);
      // ...and the searchable lookup is the deterministic sha256 of the token.
      expect(row.refreshTokenLookup).toBe(sha256Hex(tokens.refreshToken));
    });

    it("uses 256 bits of CSPRNG entropy", async () => {
      const { tokens } = await service.login(seedUser(fake));
      // 32 bytes base64url = 43 chars, no padding.
      expect(tokens.refreshToken).toHaveLength(43);
      expect(tokens.refreshToken).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("issues a distinct refresh token on every login", async () => {
      const a = await service.login(seedUser(fake));
      const b = await service.login(seedUser(fake));
      expect(a.tokens.refreshToken).not.toBe(b.tokens.refreshToken);
    });

    it("keys the family on the root session id", async () => {
      const { tokens } = await service.login(seedUser(fake));
      const row = [...fake.sessions.values()].find(
        (s) => s.refreshTokenLookup === sha256Hex(tokens.refreshToken),
      );
      expect(row.familyId).toBe(row.id);
    });

    it("sets an absolute 7-day expiry", async () => {
      const before = Date.now();
      const { tokens } = await service.login(seedUser(fake));
      const row = [...fake.sessions.values()].find(
        (s) => s.refreshTokenLookup === sha256Hex(tokens.refreshToken),
      );

      const weeksInMs = 7 * 24 * 60 * 60 * 1000;
      expect(row.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + weeksInMs,
      );
      expect(row.expiresAt.getTime()).toBeLessThanOrEqual(
        Date.now() + weeksInMs,
      );
    });

    it("links the session to the device when a fingerprint is given", async () => {
      await service.login(seedUser(fake), "fp-abc");
      expect(fake.prisma.device.upsert).toHaveBeenCalled();
      const row = [...fake.sessions.values()][0];
      expect(row.deviceId).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  describe("refreshTokens", () => {
    async function loginAndGetToken() {
      const { tokens } = await service.login(seedUser(fake));
      return tokens;
    }

    it("issues a NEW refresh token and revokes the old row", async () => {
      const tokens = await loginAndGetToken();

      const rotated = await service.refreshTokens(tokens.refreshToken);

      expect(rotated.refreshToken).not.toBe(tokens.refreshToken);

      const retired = [...fake.sessions.values()].find(
        (s) => s.refreshTokenLookup === sha256Hex(tokens.refreshToken),
      );
      expect(retired.revokedAt).toBeInstanceOf(Date);
      expect(retired.revokedReason).toBe("ROTATED");
      expect(retired.replacedById).toBeTruthy();
    });

    it("keeps the successor in the SAME family", async () => {
      const tokens = await loginAndGetToken();
      const original = [...fake.sessions.values()][0];

      const rotated = await service.refreshTokens(tokens.refreshToken);

      const successor = [...fake.sessions.values()].find(
        (s) => s.refreshTokenLookup === sha256Hex(rotated.refreshToken),
      );
      expect(successor.familyId).toBe(original.familyId);
      expect(successor.revokedAt).toBeNull();
    });

    it("NEVER extends the absolute expiry on rotation", async () => {
      const tokens = await loginAndGetToken();
      const original = [...fake.sessions.values()][0];

      await service.refreshTokens(tokens.refreshToken);

      const successor = [...fake.sessions.values()].find(
        (s) => s.refreshTokenLookup !== sha256Hex(tokens.refreshToken),
      );
      expect(successor.expiresAt.getTime()).toBe(original.expiresAt.getTime());
    });

    it("chains multiple rotations, each one revoking its predecessor", async () => {
      let tokens = await loginAndGetToken();
      const seen: string[] = [tokens.refreshToken];

      for (let i = 0; i < 4; i++) {
        tokens = await service.refreshTokens(tokens.refreshToken);
        seen.push(tokens.refreshToken);
      }

      // Every ancestor is retired; only the newest is live.
      const live = [...fake.sessions.values()].filter((s) => !s.revokedAt);
      expect(live).toHaveLength(1);
      expect(live[0].refreshTokenLookup).toBe(sha256Hex(tokens.refreshToken));

      const retired = [...fake.sessions.values()].filter((s) => s.revokedAt);
      expect(retired).toHaveLength(4);
      expect(retired.every((s) => s.revokedReason === "ROTATED")).toBe(true);
      expect(seen).toHaveLength(5);
    });

    it("treats a replayed ancestor token as THEFT and revokes the family", async () => {
      let tokens = await loginAndGetToken();
      const stale = tokens.refreshToken;

      // Two legitimate rotations move the live token forward twice.
      tokens = await service.refreshTokens(tokens.refreshToken);
      tokens = await service.refreshTokens(tokens.refreshToken);

      const familiesBefore = new Set(
        [...fake.sessions.values()].map((s) => s.familyId),
      ).size;

      // Capture the live row BEFORE the replay, so the assertion is about the
      // state the thief actually targeted rather than the aftermath.
      const liveBefore = [...fake.sessions.values()].find((s) => !s.revokedAt);
      expect(liveBefore).toBeTruthy();

      await expect(service.refreshTokens(stale)).rejects.toMatchObject({
        response: { code: "SESSION_FAMILY_REVOKED" },
      });

      // Every row in the family is dead. Note the semantics: rows A and B were
      // already retired as ROTATED, so only the still-live successor C is
      // re-stamped THEFT_DETECTED — `revokeFamily` only touches live rows.
      const familyRows = [...fake.sessions.values()].filter(
        (s) => s.familyId === "u1-1",
      );
      expect(familyRows).toHaveLength(3);
      expect(familyRows.every((s) => s.revokedAt !== null)).toBe(true);
      expect(liveBefore!.revokedAt).toBeInstanceOf(Date);
      expect(familiesBefore).toBe(1);

      // ...and it is recorded as an immediate CRITICAL security_event, written
      // inside the same transaction as the revocation so the two can never
      // disagree.
      expect(fake.prisma.securityEvent.create).toHaveBeenCalledTimes(1);
      expect(fake.prisma.securityEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "t1",
          userId: "u1",
          eventType: "SESSION_REUSE_DETECTED",
          severity: "CRITICAL",
          metadata: expect.objectContaining({
            familyId: "u1-1",
            revokedReason: "THEFT_DETECTED",
            sessionsRevoked: 1,
          }),
        }),
      });

      // And the victim's own (legitimate) token is now useless too.
      await expect(
        service.refreshTokens(tokens.refreshToken),
      ).rejects.toMatchObject({ response: { code: "SESSION_FAMILY_REVOKED" } });
    });

    it("rejects an unknown token without revealing why", async () => {
      await expect(service.refreshTokens("never-issued")).rejects.toMatchObject(
        {
          response: { code: "REFRESH_INVALID" },
        },
      );
    });

    it("rejects an empty token distinctly from a stale one", async () => {
      await expect(service.refreshTokens("")).rejects.toMatchObject({
        response: { code: "REFRESH_MISSING" },
      });
    });

    it("rejects a token whose sha256 collides but whose Argon2 hash does not", async () => {
      const tokens = await loginAndGetToken();
      const row = [...fake.sessions.values()][0];

      // The row is still findable by its deterministic lookup, but the stored
      // Argon2id hash now belongs to a DIFFERENT secret. The sha256 index can
      // only narrow the search — the hash is what actually authenticates.
      row.refreshTokenHash = await argon2.hash("a-completely-different-secret");

      await expect(
        service.refreshTokens(tokens.refreshToken),
      ).rejects.toMatchObject({ response: { code: "REFRESH_INVALID" } });
    });

    it("refuses to refresh an expired session and does not rotate it", async () => {
      const tokens = await loginAndGetToken();
      const row = [...fake.sessions.values()][0];
      row.expiresAt = new Date(Date.now() - 1000);

      await expect(
        service.refreshTokens(tokens.refreshToken),
      ).rejects.toMatchObject({ response: { code: "REFRESH_EXPIRED" } });

      // No successor was minted for a dead session.
      expect([...fake.sessions.values()]).toHaveLength(1);
      expect(row.revokedAt).toBeNull();
    });

    it("refuses to refresh a suspended account", async () => {
      const tokens = await loginAndGetToken();
      fake.users.get("u1").status = "SUSPENDED";

      await expect(
        service.refreshTokens(tokens.refreshToken),
      ).rejects.toMatchObject({ response: { code: "SESSION_INACTIVE" } });
    });

    it("claims the row atomically via a guarded updateMany (not a read-then-write)", async () => {
      // The claim's `revokedAt: null` guard is what makes rotation safe under
      // concurrency. If it is ever loosened, two callers can both mint a
      // successor and the family silently forks.
      const tokens = await loginAndGetToken();
      await service.refreshTokens(tokens.refreshToken);

      expect(fake.prisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          id: expect.any(String),
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        data: expect.objectContaining({ revokedReason: "ROTATED" }),
      });
    });

    it("does not use an interactive transaction (it cannot survive this connection pool)", async () => {
      // Regression guard: an `$transaction(async tx => …)` reserves a dedicated
      // connection across several round-trips. With connection_limit=3 behind
      // a connection-dropping proxy that shape dies consistently, while every
      // single statement query succeeds.
      const tokens = await loginAndGetToken();
      await service.refreshTokens(tokens.refreshToken);
      expect(fake.prisma.$transaction).not.toHaveBeenCalled();
    });

    it("survives two CONCURRENT refreshes of the same token — exactly one wins", async () => {
      // This is the race the claim guard exists for. Two tabs (or a retried
      // request) present the same token at the same moment.
      const tokens = await loginAndGetToken();

      const results = await Promise.allSettled([
        service.refreshTokens(tokens.refreshToken),
        service.refreshTokens(tokens.refreshToken),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      // The loser is told the family was revoked — fail closed, not silent.
      expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
        response: { code: "SESSION_FAMILY_REVOKED" },
      });

      // The loser must never leave an orphan successor behind.
      // Claim-first means it created nothing at all.
      const allRows = [...fake.sessions.values()];
      expect(allRows.filter((s) => s.revokedReason === "ROTATED")).toHaveLength(
        1,
      );
      expect(allRows.every((s) => s.revokedAt !== null)).toBe(true);

      // ...and the theft signal was raised even though the loser may have found
      // zero rows left to revoke (the winner had already retired them all).
      expect(fake.prisma.securityEvent.create).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("logout", () => {
    it("revokes the family of the presented refresh token", async () => {
      const { tokens } = await service.login(seedUser(fake));
      await service.logoutFromRefresh(tokens.refreshToken);

      const rows = [...fake.sessions.values()];
      expect(rows.every((s) => s.revokedReason === "LOGOUT")).toBe(true);
    });

    it("is a no-op for an unknown token", async () => {
      await expect(service.logoutFromRefresh("nope")).resolves.toBeUndefined();
      expect(fake.prisma.session.updateMany).not.toHaveBeenCalled();
    });

    it("keeps routine logout out of the security feed", async () => {
      // Only theft signals belong there. A user signing out is not an incident,
      // and diluting the feed is how real alerts get missed.
      const { tokens } = await service.login(seedUser(fake));
      await service.logoutFromRefresh(tokens.refreshToken);

      expect(fake.prisma.securityEvent.create).not.toHaveBeenCalled();
    });

    it("signs out every device on demand", async () => {
      await service.login(seedUser(fake, "u1"));
      await service.login(seedUser(fake, "u2"));
      // A second device for u1 creates a second family.
      await service.login(seedUser(fake, "u1"));

      await service.logoutEverywhere("u1");

      const u1Rows = [...fake.sessions.values()].filter(
        (s) => s.userId === "u1",
      );
      const u2Rows = [...fake.sessions.values()].filter(
        (s) => s.userId === "u2",
      );
      expect(u1Rows.every((s) => s.revokedReason === "USER_REVOKED")).toBe(
        true,
      );
      expect(u2Rows.every((s) => s.revokedAt === null)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe("listActiveSessions", () => {
    it("hides rotated chain rows", async () => {
      let { tokens } = await service.login(seedUser(fake));
      await service.refreshTokens(tokens.refreshToken);

      const active = await service.listActiveSessions("u1");

      // Only the live token survives; every retired ancestor is filtered out.
      expect(active).toHaveLength(1);
      expect(active[0].id).toBeTruthy();
      expect(active[0].familyId).toBeTruthy();
      expect(active[0].expiresAt).toBeInstanceOf(Date);
    });
  });
});
