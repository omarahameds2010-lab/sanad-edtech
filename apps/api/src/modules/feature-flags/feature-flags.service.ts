import { Injectable } from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  type: "boolean" | "string" | "number" | "json";
  defaultValue: any;
  config?: {
    planRules?: PlanRule[];
    tenantOverrides?: TenantOverride[];
    userTargeting?: UserTargeting[];
  };
}

export interface PlanRule {
  planId: string;
  enabled: boolean;
  value?: any;
  limits?: Record<string, number>;
}

export interface TenantOverride {
  tenantId: string;
  enabled: boolean;
  value?: any;
}

export interface UserTargeting {
  userId?: string;
  role?: string;
  segment?: string;
  enabled: boolean;
  value?: any;
}

export interface FeatureFlagEvaluation {
  key: string;
  enabled: boolean;
  value: any;
  source: "default" | "plan" | "tenant" | "user";
}

interface TenantConfigData {
  featureFlags?: Record<string, { enabled: boolean; value?: any }>;
}

@Injectable()
export class FeatureFlagsService {
  // Built-in feature flags
  private readonly builtInFlags: FeatureFlag[] = [
    {
      key: "videoPlayback",
      name: "Video Playback",
      description: "Enable video playback for students",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "exams",
      name: "Exams",
      description: "Enable exam functionality",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "liveSessions",
      name: "Live Sessions",
      description: "Enable live streaming sessions",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "pro", enabled: true, limits: { maxParticipants: 100 } },
          {
            planId: "business",
            enabled: true,
            limits: { maxParticipants: 500 },
          },
          {
            planId: "enterprise",
            enabled: true,
            limits: { maxParticipants: 2000 },
          },
        ],
      },
    },
    {
      key: "certificates",
      name: "Certificates",
      description: "Enable certificate generation",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "payments",
      name: "Payments",
      // The payment orchestrator gates every non-voucher checkout on
      // `flags.payments?.enabled`, but no such flag existed in this list — so
      // `getTenantFlags` never returned the key and EVERY card/wallet intent
      // was rejected with "Payments not enabled for this tenant" (found while
      // proving bundle C live: `POST /payments/intents` could not be reached
      // by any real checkout). Enabled by default; tenants/plans can turn it
      // off through the normal override/plan-rule pipeline.
      description: "Enable card/wallet checkout for this tenant",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "assignments",
      name: "Assignments",
      description: "Enable assignment submission",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "community",
      name: "Community",
      description: "Enable community features (Q&A, discussions)",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "starter", enabled: false },
          { planId: "pro", enabled: true },
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "gamification",
      name: "Gamification",
      description: "Enable points, badges, leaderboards",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "pro", enabled: true },
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "analytics",
      name: "Analytics",
      description: "Enable advanced analytics dashboard",
      enabled: true,
      type: "boolean",
      defaultValue: true,
      config: {
        planRules: [
          { planId: "free", enabled: false },
          { planId: "starter", enabled: true, limits: { retentionDays: 30 } },
          { planId: "pro", enabled: true, limits: { retentionDays: 365 } },
          {
            planId: "business",
            enabled: true,
            limits: { retentionDays: 1095 },
          },
          {
            planId: "enterprise",
            enabled: true,
            limits: { retentionDays: -1 },
          },
        ],
      },
    },
    {
      key: "ai",
      name: "AI Features",
      description: "Enable AI-powered features (quiz generation, summaries)",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "pro", enabled: true, limits: { monthlyTokens: 100000 } },
          {
            planId: "business",
            enabled: true,
            limits: { monthlyTokens: 1000000 },
          },
          {
            planId: "enterprise",
            enabled: true,
            limits: { monthlyTokens: 10000000 },
          },
        ],
      },
    },
    {
      key: "parentsPortal",
      name: "Parents Portal",
      description: "Enable parent access to student progress",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "mobileApp",
      name: "Mobile App Access",
      description: "Enable mobile app access for students",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "affiliate",
      name: "Affiliate Program",
      description: "Enable affiliate marketing program",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "pro", enabled: true },
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "whiteLabel",
      name: "White Label",
      description: "Enable white-label customization",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "apiAccess",
      name: "API Access",
      description: "Enable public API access",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "business", enabled: true, limits: { rateLimit: 1000 } },
          { planId: "enterprise", enabled: true, limits: { rateLimit: 10000 } },
        ],
      },
    },
    {
      key: "webhooks",
      name: "Webhooks",
      description: "Enable outgoing webhooks",
      enabled: false,
      type: "boolean",
      defaultValue: false,
      config: {
        planRules: [
          { planId: "business", enabled: true },
          { planId: "enterprise", enabled: true },
        ],
      },
    },
    {
      key: "customDomain",
      name: "Custom Domain",
      description: "Allow custom domain configuration",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "branding",
      name: "Custom Branding",
      description: "Enable custom branding (logo, colors, fonts)",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
    {
      key: "landingTemplates",
      name: "Landing Page Templates",
      description: "Enable multiple landing page templates",
      enabled: true,
      type: "boolean",
      defaultValue: true,
    },
  ];

  constructor(private prisma: PrismaService) {}

  async getTenantFlags(
    tenantId: string,
    planId?: string,
  ): Promise<Record<string, FeatureFlagEvaluation>> {
    // Get tenant config
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    // Get tenant's plan if not provided
    if (!planId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { planId: true },
      });
      planId = tenant?.planId || "free";
    }

    const configData = (tenantConfig?.config as TenantConfigData) || {};
    const tenantOverrides = configData.featureFlags || {};
    const result: Record<string, FeatureFlagEvaluation> = {};

    for (const flag of this.builtInFlags) {
      let evaluation: FeatureFlagEvaluation = {
        key: flag.key,
        enabled: flag.defaultValue,
        value: flag.defaultValue,
        source: "default",
      };

      // 1. Check plan rules
      if (flag.config?.planRules && planId) {
        const planRule = flag.config.planRules.find((r) => r.planId === planId);
        if (planRule) {
          evaluation = {
            key: flag.key,
            enabled: planRule.enabled,
            value: planRule.value ?? planRule.enabled,
            source: "plan",
          };
        }
      }

      // 2. Check tenant overrides (highest priority after plan)
      if (tenantOverrides[flag.key] !== undefined) {
        const override = tenantOverrides[flag.key];
        evaluation = {
          key: flag.key,
          enabled: override.enabled,
          value: override.value ?? override.enabled,
          source: "tenant",
        };
      }

      result[flag.key] = evaluation;
    }

    return result;
  }

  async getFlag(
    tenantId: string,
    key: string,
    planId?: string,
  ): Promise<FeatureFlagEvaluation> {
    const flags = await this.getTenantFlags(tenantId, planId);
    return (
      flags[key] || { key, enabled: false, value: false, source: "default" }
    );
  }

  async isEnabled(
    tenantId: string,
    key: string,
    planId?: string,
  ): Promise<boolean> {
    const flag = await this.getFlag(tenantId, key, planId);
    return flag.enabled;
  }

  async getFlagValue<T>(
    tenantId: string,
    key: string,
    planId?: string,
  ): Promise<T | null> {
    const flag = await this.getFlag(tenantId, key, planId);
    return flag.enabled ? (flag.value as T) : null;
  }

  async setTenantOverride(
    tenantId: string,
    key: string,
    enabled: boolean,
    value?: any,
  ): Promise<void> {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    const configData = (tenantConfig?.config as TenantConfigData) || {};
    const featureFlags = configData.featureFlags || {};

    featureFlags[key] = { enabled, value };

    await this.prisma.tenantConfig.upsert({
      where: { tenantId },
      update: {
        config: { featureFlags } as any,
        version: { increment: 1 },
      },
      create: {
        tenantId,
        config: { featureFlags } as any,
      },
    });
  }

  async removeTenantOverride(tenantId: string, key: string): Promise<void> {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    if (!tenantConfig) return;

    const configData = (tenantConfig.config as TenantConfigData) || {};
    const featureFlags = configData.featureFlags || {};

    if (!featureFlags[key]) return;

    delete featureFlags[key];

    await this.prisma.tenantConfig.update({
      where: { tenantId },
      data: {
        config: { featureFlags } as any,
        version: { increment: 1 },
      },
    });
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return this.builtInFlags;
  }

  async getFlagsByCategory(category: string): Promise<FeatureFlag[]> {
    // Could categorize flags in the future
    return this.builtInFlags;
  }
}
