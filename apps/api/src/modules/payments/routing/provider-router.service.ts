import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ProviderRegistryService } from "../providers/provider-registry.service";
import {
  PaymentProvider,
  PaymentMethod,
} from "../providers/payment-provider.interface";

export interface RoutingRule {
  method: PaymentMethod;
  currency?: string;
  minAmountMinor?: bigint;
  maxAmountMinor?: bigint;
  preferredProviders: string[];
  fallbackProviders: string[];
  tenantOverrides?: Record<string, { preferred: string[]; fallback: string[] }>;
}

@Injectable()
export class ProviderRouterService {
  private routingRules: RoutingRule[] = [];

  constructor(
    private providerRegistry: ProviderRegistryService,
    private configService: ConfigService,
  ) {
    this.loadRoutingRules();
  }

  private loadRoutingRules() {
    // Default routing rules - can be overridden by config
    this.routingRules = [
      {
        method: "CARD",
        preferredProviders: ["paymob", "fawry"],
        fallbackProviders: [],
      },
      {
        method: "MOBILE_WALLET",
        preferredProviders: ["paymob", "fawry"],
        fallbackProviders: [],
      },
      {
        method: "INSTANT_PAYMENT",
        preferredProviders: ["instapay", "paymob"],
        fallbackProviders: ["fawry"],
      },
      {
        method: "CASH_REFERENCE",
        preferredProviders: ["fawry", "paymob"],
        fallbackProviders: [],
      },
      {
        method: "VOUCHER",
        preferredProviders: ["voucher"],
        fallbackProviders: [],
      },
      {
        method: "MANUAL_TRANSFER",
        preferredProviders: [],
        fallbackProviders: [],
      },
    ];

    // Load from config if available
    const configRules = this.configService.get<RoutingRule[]>(
      "payment.routing.rules",
    );
    if (configRules) {
      this.routingRules = configRules;
    }
  }

  async selectProvider(
    tenantId: string,
    method: PaymentMethod,
    amountMinor: bigint,
    currency: string,
  ): Promise<PaymentProvider | null> {
    const rule = this.routingRules.find((r) => r.method === method);
    if (!rule) return null;

    // Check tenant-specific overrides
    let preferred = rule.preferredProviders;
    let fallback = rule.fallbackProviders;

    if (rule.tenantOverrides?.[tenantId]) {
      preferred = rule.tenantOverrides[tenantId].preferred || preferred;
      fallback = rule.tenantOverrides[tenantId].fallback || fallback;
    }

    // Check amount constraints
    if (rule.minAmountMinor && amountMinor < rule.minAmountMinor) return null;
    if (rule.maxAmountMinor && amountMinor > rule.maxAmountMinor) return null;

    // Check currency
    if (rule.currency && rule.currency !== currency) return null;

    // Try preferred providers first
    for (const providerName of preferred) {
      const provider = this.providerRegistry.getProvider(providerName);
      if (provider && this.providerRegistry.isProviderAvailable(providerName)) {
        if (this.providerSupportsMethod(provider, method)) {
          return provider;
        }
      }
    }

    // Try fallback providers
    for (const providerName of fallback) {
      const provider = this.providerRegistry.getProvider(providerName);
      if (provider && this.providerRegistry.isProviderAvailable(providerName)) {
        if (this.providerSupportsMethod(provider, method)) {
          return provider;
        }
      }
    }

    return null;
  }

  private providerSupportsMethod(
    provider: PaymentProvider,
    method: PaymentMethod,
  ): boolean {
    const caps = provider.capabilities;
    switch (method) {
      case "CARD":
        return caps.cards;
      case "MOBILE_WALLET":
        return caps.wallets;
      case "INSTANT_PAYMENT":
        return caps.instantPayment;
      case "CASH_REFERENCE":
        return caps.bankTransfer;
      case "VOUCHER":
        return true; // Voucher provider handles this
      default:
        return false;
    }
  }

  getAvailableMethods(tenantId: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [
      "CARD",
      "MOBILE_WALLET",
      "INSTANT_PAYMENT",
      "CASH_REFERENCE",
      "VOUCHER",
      "MANUAL_TRANSFER",
    ];
    return methods.filter((method) => {
      const rule = this.routingRules.find((r) => r.method === method);
      if (!rule) return false;
      return (
        rule.preferredProviders.length > 0 || rule.fallbackProviders.length > 0
      );
    });
  }

  getRoutingRule(method: PaymentMethod): RoutingRule | undefined {
    return this.routingRules.find((r) => r.method === method);
  }

  updateRoutingRule(rule: RoutingRule): void {
    const index = this.routingRules.findIndex((r) => r.method === rule.method);
    if (index >= 0) {
      this.routingRules[index] = rule;
    } else {
      this.routingRules.push(rule);
    }
  }
}
