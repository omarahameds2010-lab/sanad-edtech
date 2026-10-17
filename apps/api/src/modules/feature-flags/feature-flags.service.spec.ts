import { FeatureFlagsService } from "./feature-flags.service";

describe("FeatureFlagsService.getTenantFlags — payments flag (bundle C)", () => {
  let prisma: any;
  let service: FeatureFlagsService;

  beforeEach(() => {
    prisma = {
      tenantConfig: { findUnique: jest.fn().mockResolvedValue(null) },
      tenant: { findUnique: jest.fn().mockResolvedValue({ planId: "free" }) },
    };
    service = new FeatureFlagsService(prisma);
  });

  it("exposes payments enabled by default — checkout must not be hard-blocked", async () => {
    const flags = await service.getTenantFlags("t1");

    // Before bundle C the key did not exist at all: `flags.payments?.enabled`
    // was always undefined, so every card/wallet intent answered 403
    // "Payments not enabled for this tenant".
    expect(flags.payments).toBeDefined();
    expect(flags.payments.enabled).toBe(true);
    expect(flags.payments.source).toBe("default");
  });

  it("honours a tenant override disabling payments", async () => {
    prisma.tenantConfig.findUnique.mockResolvedValue({
      config: { featureFlags: { payments: { enabled: false } } },
    });

    const flags = await service.getTenantFlags("t1");

    expect(flags.payments.enabled).toBe(false);
    expect(flags.payments.source).toBe("tenant");
  });
});
