import { TenantResolverMiddleware } from "./tenant-resolver.middleware";

/**
 * Regression tests for the health/ready exemption.
 *
 * Nest applies the global prefix ("api") to middleware registered with
 * forRoutes("*"): Express mounts the middleware under /api/* and rewrites
 * req.path to "/" for every request. The middleware must therefore read
 * req.originalUrl to know the real path.
 */
describe("TenantResolverMiddleware", () => {
  const host = "sanad-edtech-production.up.railway.app";

  const makeReq = (originalUrl: string) =>
    ({
      headers: { host },
      // What Express leaves inside a wildcard-mounted middleware:
      path: "/",
      url: "/",
      originalUrl,
    }) as any;

  const makePrisma = (rows: unknown[] = []) => ({
    $queryRaw: jest.fn().mockResolvedValue(rows),
  });

  it("skips tenant resolution for GET /api/health", async () => {
    const prisma = makePrisma();
    const middleware = new TenantResolverMiddleware(prisma as any);
    const next = jest.fn();

    await middleware.use(makeReq("/api/health"), {} as any, next);

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("skips tenant resolution for /api/ready with a query string", async () => {
    const prisma = makePrisma();
    const middleware = new TenantResolverMiddleware(prisma as any);
    const next = jest.fn();

    await middleware.use(makeReq("/api/ready?verbose=1"), {} as any, next);

    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("resolves the tenant for non-exempt routes", async () => {
    const prisma = makePrisma([
      { id: "tenant-1", slug: "sanad", name: "Sanad", status: "ACTIVE" },
    ]);
    const middleware = new TenantResolverMiddleware(prisma as any);
    const req = makeReq("/api/auth/login");
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(req.tenantId).toBe("tenant-1");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown domains with 404", async () => {
    const prisma = makePrisma([]);
    const middleware = new TenantResolverMiddleware(prisma as any);
    const next = jest.fn();

    await expect(
      middleware.use(makeReq("/api/auth/login"), {} as any, next),
    ).rejects.toMatchObject({ status: 404 });
    expect(next).not.toHaveBeenCalled();
  });
});
