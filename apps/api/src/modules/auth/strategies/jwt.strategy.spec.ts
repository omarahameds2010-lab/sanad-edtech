import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy", () => {
  const strategy = new JwtStrategy({
    get: () => "test-secret",
  } as any);

  it("exposes sub so controllers can use req.user.sub", async () => {
    const user = await strategy.validate({
      sub: "user-1",
      tenantId: "tenant-1",
      role: "STUDENT",
    });

    expect(user.sub).toBe("user-1");
    expect(user.id).toBe("user-1");
    expect(user.tenantId).toBe("tenant-1");
  });

  it("rejects payloads missing tenantId or sub", async () => {
    await expect(
      strategy.validate({ sub: "user-1" } as any),
    ).rejects.toThrow();
    await expect(
      strategy.validate({ tenantId: "tenant-1" } as any),
    ).rejects.toThrow();
  });
});
