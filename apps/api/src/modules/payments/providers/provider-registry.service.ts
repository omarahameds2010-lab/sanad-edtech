import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PaymentProvider,
  ProviderConfig,
  ProviderHealthStatus,
} from "./payment-provider.interface";
import { PaymobProvider } from "./paymob/paymob.provider";
import { FawryProvider } from "./fawry/fawry.provider";
import { InstapayProvider } from "./instapay/instapay.provider";
import { VodafoneCashProvider } from "./vodafone-cash/vodafone-cash.provider";
import { EandMoneyProvider } from "./eand-money/eand-money.provider";
import { VoucherProvider } from "./voucher/voucher.provider";

@Injectable()
export class ProviderRegistryService implements OnModuleInit {
  private providers = new Map<string, PaymentProvider>();
  private configs = new Map<string, ProviderConfig>();
  private healthStatus = new Map<string, ProviderHealthStatus>();

  constructor(
    private configService: ConfigService,
    private paymobProvider: PaymobProvider,
    private fawryProvider: FawryProvider,
    private voucherProvider: VoucherProvider,
    private instapayProvider: InstapayProvider,
    private vodafoneCashProvider: VodafoneCashProvider,
    private eandMoneyProvider: EandMoneyProvider,
  ) {}

  async onModuleInit() {
    await this.loadConfigs();
    await this.registerProviders();
  }

  private async loadConfigs() {
    const configured =
      this.configService.get<Record<string, ProviderConfig>>(
        "payment.providers",
      ) || {};

    // The repo ships no `payment.providers` config block, so zero providers
    // ever registered and e-payments failed silently (audit 2026-10-16 §5.3).
    // Fall back to env-credential presence per real provider; an explicit
    // `payment.providers` config still wins when present.
    const providersConfig: Record<string, ProviderConfig> = {
      ...this.envDerivedConfigs(),
      ...configured,
    };

    for (const [name, config] of Object.entries(providersConfig)) {
      this.configs.set(name, config);
      this.healthStatus.set(name, {
        provider: name,
        status: config.enabled ? "HEALTHY" : "DISABLED",
        lastCheck: new Date(),
      });
    }
  }

  /**
   * Providers whose full credential set is present in the environment are
   * enabled by default. Only providers with real API integrations take part;
   * the fail-closed stubs (instapay / vodafone_cash / eand_money) still need
   * an explicit `payment.providers` entry to activate.
   */
  private envDerivedConfigs(): Record<string, ProviderConfig> {
    const has = (...keys: string[]) =>
      keys.every((key) => !!this.configService.get<string>(key));
    const environment =
      process.env.NODE_ENV === "production" ? "production" : "sandbox";

    const configs: Record<string, ProviderConfig> = {};

    if (has("PAYMOB_API_KEY", "PAYMOB_INTEGRATION_ID", "PAYMOB_HMAC_SECRET")) {
      configs.paymob = {
        name: "paymob",
        enabled: true,
        environment,
        credentials: { source: "env" },
      };
    }

    if (
      has("FAWRY_MERCHANT_CODE", "FAWRY_SECRET_KEY", "FAWRY_SECURE_HASH_KEY")
    ) {
      configs.fawry = {
        name: "fawry",
        enabled: true,
        environment,
        credentials: { source: "env" },
      };
    }

    return configs;
  }

  private async registerProviders() {
    const providerInstances: PaymentProvider[] = [
      this.paymobProvider,
      this.fawryProvider,
      this.voucherProvider,
      this.instapayProvider,
      this.vodafoneCashProvider,
      this.eandMoneyProvider,
    ];

    for (const provider of providerInstances) {
      const config = this.configs.get(provider.name);
      if (config?.enabled) {
        this.providers.set(provider.name, provider);
      }
    }
  }

  getProvider(name: string): PaymentProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): PaymentProvider[] {
    return Array.from(this.providers.values()).filter((p) => {
      const config = this.configs.get(p.name);
      return config?.enabled;
    });
  }

  getProviderCapabilities(name: string): ProviderConfig | undefined {
    return this.configs.get(name);
  }

  getAllCapabilities(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }

  async checkProviderHealth(name: string): Promise<ProviderHealthStatus> {
    const provider = this.providers.get(name);
    const config = this.configs.get(name);

    if (!provider || !config?.enabled) {
      return {
        provider: name,
        status: "DISABLED",
        lastCheck: new Date(),
      };
    }

    const startTime = Date.now();
    let status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" = "HEALTHY";
    let errorRate = 0;

    try {
      await this.performHealthCheck(provider);
    } catch (error) {
      status = "UNAVAILABLE";
      errorRate = 1;
    }

    const latencyMs = Date.now() - startTime;
    const health: ProviderHealthStatus = {
      provider: name,
      status,
      lastCheck: new Date(),
      latencyMs,
      errorRate,
    };

    this.healthStatus.set(name, health);
    return health;
  }

  private async performHealthCheck(provider: PaymentProvider): Promise<void> {
    if (!provider.name) {
      throw new Error("Provider not properly initialized");
    }
  }

  getHealthStatus(name: string): ProviderHealthStatus | undefined {
    return this.healthStatus.get(name);
  }

  getAllHealthStatuses(): ProviderHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  isProviderAvailable(name: string): boolean {
    const health = this.healthStatus.get(name);
    return health?.status === "HEALTHY" || health?.status === "DEGRADED";
  }

  disableProvider(name: string): void {
    const health = this.healthStatus.get(name);
    if (health) {
      health.status = "DISABLED";
      this.healthStatus.set(name, health);
    }
  }

  enableProvider(name: string): void {
    const health = this.healthStatus.get(name);
    if (health) {
      health.status = "HEALTHY";
      this.healthStatus.set(name, health);
    }
  }
}
