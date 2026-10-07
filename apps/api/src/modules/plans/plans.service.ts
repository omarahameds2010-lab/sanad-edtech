import { Injectable } from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import {
  Prisma,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from "@prisma/client";

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly" | "lifetime";
  features: PlanFeature[];
  limits: PlanLimits;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder: number;
}

export interface PlanFeature {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  value?: any;
  limits?: Record<string, number>;
}

export interface PlanLimits {
  maxCourses?: number;
  maxStudents?: number;
  maxTeachers?: number;
  maxStorageGB?: number;
  maxVideoMinutes?: number;
  maxLiveSessions?: number;
  maxLiveParticipants?: number;
  maxAiTokensPerMonth?: number;
  maxApiRequestsPerMonth?: number;
  maxEmailPerMonth?: number;
  maxWhatsAppPerMonth?: number;
  maxDomains?: number;
  maxAdmins?: number;
  retentionDays?: number;
  // supportLevel is a string, not a number - handled separately
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialEnd?: Date;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionStatus =
  "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED";

@Injectable()
export class PlansService {
  private readonly plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      displayName: "مجاني",
      description: "للبدء والتجربة",
      price: 0,
      currency: "EGP",
      interval: "monthly",
      isActive: true,
      sortOrder: 0,
      features: [
        { key: "courses", name: "الدورات", enabled: true, limits: { max: 1 } },
        { key: "students", name: "الطلاب", enabled: true, limits: { max: 50 } },
        { key: "videoPlayback", name: "تشغيل الفيديو", enabled: true },
        { key: "exams", name: "الاختبارات", enabled: true },
        { key: "certificates", name: "الشهادات", enabled: true },
        { key: "assignments", name: "الواجبات", enabled: true },
        { key: "customDomain", name: "نطاق مخصص", enabled: true },
        { key: "branding", name: "العلامة التجارية", enabled: true },
        { key: "landingTemplates", name: "قوالب الهبوط", enabled: true },
      ],
      limits: {
        maxCourses: 1,
        maxStudents: 50,
        maxTeachers: 1,
        maxStorageGB: 1,
        maxVideoMinutes: 60,
        maxLiveSessions: 0,
        maxLiveParticipants: 0,
        maxAiTokensPerMonth: 0,
        maxApiRequestsPerMonth: 0,
        maxEmailPerMonth: 100,
        maxWhatsAppPerMonth: 0,
        maxDomains: 1,
        maxAdmins: 1,
        retentionDays: 30,
      },
    },
    {
      id: "starter",
      name: "Starter",
      displayName: "البداية",
      description: "للمدرسين الجدد",
      price: 299,
      currency: "EGP",
      interval: "monthly",
      isActive: true,
      sortOrder: 1,
      features: [
        { key: "courses", name: "الدورات", enabled: true, limits: { max: 5 } },
        {
          key: "students",
          name: "الطلاب",
          enabled: true,
          limits: { max: 200 },
        },
        { key: "videoPlayback", name: "تشغيل الفيديو", enabled: true },
        { key: "exams", name: "الاختبارات", enabled: true },
        { key: "certificates", name: "الشهادات", enabled: true },
        { key: "assignments", name: "الواجبات", enabled: true },
        {
          key: "analytics",
          name: "التحليلات",
          enabled: true,
          limits: { retentionDays: 30 },
        },
        { key: "customDomain", name: "نطاق مخصص", enabled: true },
        { key: "branding", name: "العلامة التجارية", enabled: true },
        { key: "landingTemplates", name: "قوالب الهبوط", enabled: true },
      ],
      limits: {
        maxCourses: 5,
        maxStudents: 200,
        maxTeachers: 2,
        maxStorageGB: 5,
        maxVideoMinutes: 500,
        maxLiveSessions: 0,
        maxLiveParticipants: 0,
        maxAiTokensPerMonth: 0,
        maxApiRequestsPerMonth: 1000,
        maxEmailPerMonth: 1000,
        maxWhatsAppPerMonth: 100,
        maxDomains: 1,
        maxAdmins: 2,
        retentionDays: 30,
      },
    },
    {
      id: "pro",
      name: "Pro",
      displayName: "احترافي",
      description: "للمدرسين النشطين",
      price: 799,
      currency: "EGP",
      interval: "monthly",
      isActive: true,
      isPopular: true,
      sortOrder: 2,
      features: [
        { key: "courses", name: "الدورات", enabled: true, limits: { max: 20 } },
        {
          key: "students",
          name: "الطلاب",
          enabled: true,
          limits: { max: 1000 },
        },
        { key: "videoPlayback", name: "تشغيل الفيديو", enabled: true },
        { key: "exams", name: "الاختبارات", enabled: true },
        {
          key: "liveSessions",
          name: "الجلسات المباشرة",
          enabled: true,
          limits: { maxParticipants: 100 },
        },
        { key: "certificates", name: "الشهادات", enabled: true },
        { key: "assignments", name: "الواجبات", enabled: true },
        { key: "community", name: "المجتمع", enabled: true },
        { key: "gamification", name: "الألعاب", enabled: true },
        {
          key: "analytics",
          name: "التحليلات",
          enabled: true,
          limits: { retentionDays: 365 },
        },
        {
          key: "ai",
          name: "ميزات الذكاء الاصطناعي",
          enabled: true,
          limits: { monthlyTokens: 100000 },
        },
        { key: "customDomain", name: "نطاق مخصص", enabled: true },
        { key: "branding", name: "العلامة التجارية", enabled: true },
        { key: "landingTemplates", name: "قوالب الهبوط", enabled: true },
        { key: "affiliate", name: "برنامج الشركاء", enabled: true },
      ],
      limits: {
        maxCourses: 20,
        maxStudents: 1000,
        maxTeachers: 5,
        maxStorageGB: 20,
        maxVideoMinutes: 5000,
        maxLiveSessions: 20,
        maxLiveParticipants: 100,
        maxAiTokensPerMonth: 100000,
        maxApiRequestsPerMonth: 10000,
        maxEmailPerMonth: 10000,
        maxWhatsAppPerMonth: 1000,
        maxDomains: 2,
        maxAdmins: 5,
        retentionDays: 365,
      },
    },
    {
      id: "business",
      name: "Business",
      displayName: "الأعمال",
      description: "للمؤسسات والأكاديميات",
      price: 1999,
      currency: "EGP",
      interval: "monthly",
      isActive: true,
      sortOrder: 3,
      features: [
        {
          key: "courses",
          name: "الدورات",
          enabled: true,
          limits: { max: 100 },
        },
        {
          key: "students",
          name: "الطلاب",
          enabled: true,
          limits: { max: 5000 },
        },
        { key: "videoPlayback", name: "تشغيل الفيديو", enabled: true },
        { key: "exams", name: "الاختبارات", enabled: true },
        {
          key: "liveSessions",
          name: "الجلسات المباشرة",
          enabled: true,
          limits: { maxParticipants: 500 },
        },
        { key: "certificates", name: "الشهادات", enabled: true },
        { key: "assignments", name: "الواجبات", enabled: true },
        { key: "community", name: "المجتمع", enabled: true },
        { key: "gamification", name: "الألعاب", enabled: true },
        { key: "parentsPortal", name: "بوابة أولياء الأمور", enabled: true },
        {
          key: "analytics",
          name: "التحليلات",
          enabled: true,
          limits: { retentionDays: 1095 },
        },
        {
          key: "ai",
          name: "ميزات الذكاء الاصطناعي",
          enabled: true,
          limits: { monthlyTokens: 1000000 },
        },
        { key: "customDomain", name: "نطاق مخصص", enabled: true },
        { key: "branding", name: "العلامة التجارية", enabled: true },
        { key: "landingTemplates", name: "قوالب الهبوط", enabled: true },
        { key: "whiteLabel", name: "العلامة البيضاء", enabled: true },
        {
          key: "apiAccess",
          name: "الوصول للـ API",
          enabled: true,
          limits: { rateLimit: 1000 },
        },
        { key: "webhooks", name: "Webhooks", enabled: true },
        { key: "affiliate", name: "برنامج الشركاء", enabled: true },
        { key: "mobileApp", name: "تطبيق الموبايل", enabled: true },
      ],
      limits: {
        maxCourses: 100,
        maxStudents: 5000,
        maxTeachers: 20,
        maxStorageGB: 100,
        maxVideoMinutes: 20000,
        maxLiveSessions: 100,
        maxLiveParticipants: 500,
        maxAiTokensPerMonth: 1000000,
        maxApiRequestsPerMonth: 100000,
        maxEmailPerMonth: 50000,
        maxWhatsAppPerMonth: 5000,
        maxDomains: 5,
        maxAdmins: 20,
        retentionDays: 1095,
      },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      displayName: "المؤسسات الكبرى",
      description: "للجامعات والمؤسسات الكبيرة",
      price: 4999,
      currency: "EGP",
      interval: "monthly",
      isActive: true,
      sortOrder: 4,
      features: [
        { key: "courses", name: "الدورات", enabled: true, limits: { max: -1 } },
        { key: "students", name: "الطلاب", enabled: true, limits: { max: -1 } },
        { key: "videoPlayback", name: "تشغيل الفيديو", enabled: true },
        { key: "exams", name: "الاختبارات", enabled: true },
        {
          key: "liveSessions",
          name: "الجلسات المباشرة",
          enabled: true,
          limits: { maxParticipants: 2000 },
        },
        { key: "certificates", name: "الشهادات", enabled: true },
        { key: "assignments", name: "الواجبات", enabled: true },
        { key: "community", name: "المجتمع", enabled: true },
        { key: "gamification", name: "الألعاب", enabled: true },
        { key: "parentsPortal", name: "بوابة أولياء الأمور", enabled: true },
        {
          key: "analytics",
          name: "التحليلات",
          enabled: true,
          limits: { retentionDays: -1 },
        },
        {
          key: "ai",
          name: "ميزات الذكاء الاصطناعي",
          enabled: true,
          limits: { monthlyTokens: 10000000 },
        },
        { key: "customDomain", name: "نطاق مخصص", enabled: true },
        { key: "branding", name: "العلامة التجارية", enabled: true },
        { key: "landingTemplates", name: "قوالب الهبوط", enabled: true },
        { key: "whiteLabel", name: "العلامة البيضاء", enabled: true },
        {
          key: "apiAccess",
          name: "الوصول للـ API",
          enabled: true,
          limits: { rateLimit: 10000 },
        },
        { key: "webhooks", name: "Webhooks", enabled: true },
        { key: "affiliate", name: "برنامج الشركاء", enabled: true },
        { key: "mobileApp", name: "تطبيق الموبايل", enabled: true },
      ],
      limits: {
        maxCourses: -1,
        maxStudents: -1,
        maxTeachers: -1,
        maxStorageGB: -1,
        maxVideoMinutes: -1,
        maxLiveSessions: -1,
        maxLiveParticipants: 2000,
        maxAiTokensPerMonth: 10000000,
        maxApiRequestsPerMonth: -1,
        maxEmailPerMonth: -1,
        maxWhatsAppPerMonth: -1,
        maxDomains: -1,
        maxAdmins: -1,
        retentionDays: -1,
      },
    },
  ];

  constructor(private prisma: PrismaService) {}

  getAllPlans(): Plan[] {
    return this.plans
      .filter((p) => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPlan(planId: string): Plan | undefined {
    return this.plans.find((p) => p.id === planId);
  }

  getPlanLimits(planId: string): PlanLimits | undefined {
    return this.getPlan(planId)?.limits;
  }

  getPlanFeatures(planId: string): PlanFeature[] | undefined {
    return this.getPlan(planId)?.features;
  }

  isFeatureEnabled(planId: string, featureKey: string): boolean {
    const plan = this.getPlan(planId);
    if (!plan) return false;
    const feature = plan.features.find((f) => f.key === featureKey);
    return feature?.enabled ?? false;
  }

  getFeatureLimit(
    planId: string,
    featureKey: string,
    limitKey: string,
  ): number | undefined {
    const plan = this.getPlan(planId);
    if (!plan) return undefined;
    const feature = plan.features.find((f) => f.key === featureKey);
    return feature?.limits?.[limitKey];
  }

  async getTenantPlan(tenantId: string): Promise<Plan | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { planId: true },
    });
    if (!tenant?.planId) return null;
    return this.getPlan(tenant.planId);
  }

  async getTenantLimits(tenantId: string): Promise<PlanLimits | null> {
    const plan = await this.getTenantPlan(tenantId);
    return plan?.limits || null;
  }

  async checkLimit(
    tenantId: string,
    limitKey: keyof PlanLimits,
    currentUsage: number,
  ): Promise<{
    allowed: boolean;
    limit: number;
    currentUsage: number;
    remaining: number;
  }> {
    const limits = await this.getTenantLimits(tenantId);
    if (!limits)
      return { allowed: true, limit: -1, currentUsage, remaining: -1 };

    const limit = limits[limitKey];
    if (limit === undefined || limit === -1) {
      return { allowed: true, limit: -1, currentUsage, remaining: -1 };
    }

    const allowed = currentUsage < limit;
    return {
      allowed,
      limit,
      currentUsage,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  async getTenantSubscription(tenantId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription) return null;
    return {
      ...subscription,
      metadata: subscription.metadata as Record<string, any> | null,
      status: subscription.status as SubscriptionStatus,
    };
  }

  async createSubscription(
    tenantId: string,
    planId: string,
    options?: { trialDays?: number },
  ): Promise<Subscription> {
    const plan = this.getPlan(planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const now = new Date();
    const trialDays = options?.trialDays || 0;
    const trialEnd =
      trialDays > 0
        ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;
    const periodEnd =
      trialEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      update: {
        planId,
        status: trialDays > 0 ? "TRIALING" : "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
      },
      create: {
        tenantId,
        planId,
        status: trialDays > 0 ? "TRIALING" : "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as Record<string, any> | null,
      status: subscription.status as SubscriptionStatus,
    };
  }

  async cancelSubscription(
    tenantId: string,
    atPeriodEnd = true,
  ): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        cancelAtPeriodEnd: atPeriodEnd,
        cancelledAt: atPeriodEnd ? null : new Date(),
        status: atPeriodEnd ? "ACTIVE" : "CANCELED",
      },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as Record<string, any> | null,
      status: subscription.status as SubscriptionStatus,
    };
  }

  async updateSubscriptionPlan(
    tenantId: string,
    newPlanId: string,
  ): Promise<Subscription> {
    const plan = this.getPlan(newPlanId);
    if (!plan) throw new Error(`Plan ${newPlanId} not found`);

    const subscription = await this.prisma.subscription.update({
      where: { tenantId },
      data: { planId: newPlanId },
    });

    return {
      ...subscription,
      metadata: subscription.metadata as Record<string, any> | null,
      status: subscription.status as SubscriptionStatus,
    };
  }

  async isSubscriptionActive(tenantId: string): Promise<boolean> {
    const sub = await this.getTenantSubscription(tenantId);
    if (!sub) return false;
    return (
      ["ACTIVE", "TRIALING"].includes(sub.status) &&
      sub.currentPeriodEnd > new Date()
    );
  }
}
