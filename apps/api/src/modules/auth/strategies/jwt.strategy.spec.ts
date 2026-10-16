import { UnauthorizedException } from "@nestjs/common";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  const strategy = new JwtStrategy({
    get: () => "test-secret",
  } as any);

  const payload = { sub: "user-1", tenantId: "tenant-1", role: "STUDENT" };
  const req = (tenantId?: string) => ({ tenantId }) as any;

  it("exposes sub so controllers can use req.user.sub", async () => {
    const user = await strategy.validate(req("tenant-1"), payload);

    expect(user.sub).toBe("user-1");
    expect(user.id).toBe("user-1");
    expect(user.tenantId).toBe("tenant-1");
  });

  it("accepts the token when it matches the host-resolved tenant", async () => {
    const user = await strategy.validate(req("tenant-1"), payload);

    expect(user.role).toBe("STUDENT");
  });

  it("rejects payloads missing tenantId or sub", async () => {
    await expect(
      strategy.validate(req("tenant-1"), { sub: "user-1" } as any),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      strategy.validate(req("tenant-1"), { tenantId: "tenant-1" } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rejects a token minted for another tenant (cross-tenant replay)", async () => {
    await expect(strategy.validate(req("tenant-2"), payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("fails closed when the host tenant was not resolved", async () => {
    await expect(strategy.validate(req(undefined), payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
