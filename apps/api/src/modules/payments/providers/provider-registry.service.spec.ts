import { ProviderRegistryService } from "./provider-registry.service";
import { ProviderConfig } from "./payment-provider.interface";

/**
 * Audit 2026-10-16 §5.3: the registry used to register a provider only when a
 * `payment.providers` config block existed — and none was ever shipped, so
 * zero providers registered and e-payments failed silently. Registration now
 * derives from env-credential presence; explicit config still wins.
 */
describe("ProviderRegistryService (env-derived registration, audit #5)", () => {
  function build(
    env: Record<string, string>,
    configBlock?: Record<string, ProviderConfig>,
  ) {
    const configService = {
      get: jest.fn((key: string) =>
        key === "payment.providers" ? configBlock : env[key],
      ),
    };
    const registry = new ProviderRegistryService(
      configService as any,
      { name: "paymob" } as any,
      { name: "fawry" } as any,
      { name: "voucher" } as any,
      { name: "instapay" } as any,
      { name: "vodafone_cash" } as any,
      { name: "eand_money" } as any,
    );
    return registry;
  }

  it("registers paymob when its full credential set is in the environment", async () => {
    const registry = build({
      PAYMOB_API_KEY: "key",
      PAYMOB_INTEGRATION_ID: "123",
      PAYMOB_HMAC_SECRET: "secret",
    });

    await registry.onModuleInit();

    expect(registry.getProvider("paymob")).toBeDefined();
    expect(registry.getHealthStatus("paymob")?.status).toBe("HEALTHY");
  });

  it("does not register paymob when credentials are incomplete", async () => {
    const registry = build({ PAYMOB_API_KEY: "key" });

    await registry.onModuleInit();

    expect(registry.getProvider("paymob")).toBeUndefined();
  });

  it("registers fawry only with merchant code, secret key AND secure hash key", async () => {
    const partial = build({
      FAWRY_MERCHANT_CODE: "merchant",
      FAWRY_SECRET_KEY: "secret",
    });
    await partial.onModuleInit();
    expect(partial.getProvider("fawry")).toBeUndefined();

    const complete = build({
      FAWRY_MERCHANT_CODE: "merchant",
      FAWRY_SECRET_KEY: "secret",
      FAWRY_SECURE_HASH_KEY: "hash",
    });
    await complete.onModuleInit();
    expect(complete.getProvider("fawry")).toBeDefined();
  });

  it("keeps the fail-closed stubs disabled without explicit config", async () => {
    const registry = build({
      PAYMOB_API_KEY: "key",
      PAYMOB_INTEGRATION_ID: "123",
      PAYMOB_HMAC_SECRET: "secret",
    });

    await registry.onModuleInit();

    expect(registry.getProvider("instapay")).toBeUndefined();
    expect(registry.getProvider("vodafone_cash")).toBeUndefined();
    expect(registry.getProvider("eand_money")).toBeUndefined();
  });

  it("lets an explicit payment.providers config override the env default", async () => {
    const registry = build(
      {
        PAYMOB_API_KEY: "key",
        PAYMOB_INTEGRATION_ID: "123",
        PAYMOB_HMAC_SECRET: "secret",
      },
      {
        paymob: {
          name: "paymob",
          enabled: false,
          environment: "sandbox",
          credentials: {},
        },
      },
    );

    await registry.onModuleInit();

    expect(registry.getProvider("paymob")).toBeUndefined();
    expect(registry.getHealthStatus("paymob")?.status).toBe("DISABLED");
  });
});
