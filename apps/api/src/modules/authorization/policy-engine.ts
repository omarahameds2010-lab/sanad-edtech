import { Injectable } from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";

export type ResourceType =
  | "course"
  | "lesson"
  | "exam"
  | "attempt"
  | "enrollment"
  | "order"
  | "payment"
  | "voucher"
  | "user"
  | "tenant"
  | "certificate"
  | "assignment"
  | "question"
  | "questionBank"
  | "video"
  | "liveSession"
  | "community"
  | "notification"
  | "analytics"
  | "settings"
  | "section";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "enroll"
  | "unenroll"
  | "watch"
  | "submit"
  | "grade"
  | "attempt"
  | "download"
  | "join"
  | "moderate"
  | "manage"
  | "view"
  | "export"
  | "configure"
  | "redeem"
  | "archive"
  | "reorder"
  | "refund" // money-out action on a captured payment (bundle C)
  | "evaluate"; // AI evaluation action

export interface AuthorizationContext {
  userId: string;
  tenantId: string;
  role: string;
  permissions?: string[];
  featureFlags?: Record<string, any>;
  entitlements?: Entitlement[];
  deviceId?: string;
  ip?: string;
}

export interface Entitlement {
  resourceType: string;
  resourceId: string;
  source: "purchase" | "voucher" | "subscription" | "admin_grant" | "trial";
  startsAt?: Date;
  expiresAt?: Date;
  status: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  conditions?: PolicyCondition[];
}

export interface PolicyCondition {
  type:
    | "time"
    | "ownership"
    | "entitlement"
    | "feature"
    | "plan"
    | "device"
    | "location"
    | "custom";
  field?: string;
  operator?:
    "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
  value?: any;
  message?: string;
}

export interface PolicyRule {
  id: string;
  name: string;
  description?: string;
  resourceType: ResourceType;
  action: Action;
  effect: "allow" | "deny";
  priority: number;
  conditions: PolicyCondition[];
  roles?: string[];
  tenantIds?: string[];
  isActive: boolean;
}

@Injectable()
export class PolicyEngine {
  constructor(private prisma: PrismaService) {}

  async can(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
    resource?: {
      id?: string;
      tenantId?: string;
      ownerId?: string;
      [key: string]: any;
    },
  ): Promise<PolicyDecision> {
    const decisions: PolicyDecision[] = [];

    // 1. Check tenant isolation first
    const tenantDecision = this.checkTenantIsolation(context, resource);
    decisions.push(tenantDecision);
    if (!tenantDecision.allowed) return tenantDecision;

    // 2. Check RBAC permissions
    const rbacDecision = await this.checkRBAC(context, action, resourceType);
    decisions.push(rbacDecision);
    if (!rbacDecision.allowed) return rbacDecision;

    // 3. Check resource ownership
    const ownershipDecision = this.checkOwnership(context, resource);
    decisions.push(ownershipDecision);
    if (!ownershipDecision.allowed) return ownershipDecision;

    // 4. Check entitlements
    const entitlementDecision = await this.checkEntitlements(
      context,
      action,
      resourceType,
      resource,
    );
    decisions.push(entitlementDecision);
    if (!entitlementDecision.allowed) return entitlementDecision;

    // 5. Check feature flags
    const featureDecision = await this.checkFeatureFlags(
      context,
      action,
      resourceType,
    );
    decisions.push(featureDecision);
    if (!featureDecision.allowed) return featureDecision;

    // 6. Check tenant policies (custom rules)
    const tenantPolicyDecision = await this.checkTenantPolicies(
      context,
      action,
      resourceType,
      resource,
    );
    decisions.push(tenantPolicyDecision);
    if (!tenantPolicyDecision.allowed) return tenantPolicyDecision;

    // 7. Check plan limits
    const planDecision = await this.checkPlanLimits(
      context,
      action,
      resourceType,
    );
    decisions.push(planDecision);
    if (!planDecision.allowed) return planDecision;

    // All checks passed
    return {
      allowed: true,
      conditions: decisions.flatMap((d) => d.conditions || []),
    };
  }

  private checkTenantIsolation(
    context: AuthorizationContext,
    resource?: { tenantId?: string },
  ): PolicyDecision {
    if (resource?.tenantId && resource.tenantId !== context.tenantId) {
      return {
        allowed: false,
        reason: "CROSS_TENANT_ACCESS_DENIED",
        conditions: [
          {
            type: "custom",
            message: "Access denied: resource belongs to a different tenant",
          },
        ],
      };
    }
    return { allowed: true };
  }

  private async checkRBAC(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
  ): Promise<PolicyDecision> {
    // Super admin bypasses all RBAC
    if (context.role === "SUPER_ADMIN") {
      return { allowed: true };
    }

    // Define role permissions
    const rolePermissions: Record<string, Record<ResourceType, Action[]>> = {
      ADMIN: {
        course: [
          "create",
          "read",
          "update",
          "delete",
          "publish",
          "unpublish",
          "manage",
        ],
        section: [
          "create",
          "read",
          "update",
          "delete",
          "publish",
          "unpublish",
          "manage",
          "reorder",
        ],
        lesson: [
          "create",
          "read",
          "update",
          "delete",
          "publish",
          "unpublish",
          "manage",
        ],
        exam: [
          "create",
          "read",
          "update",
          "delete",
          "publish",
          "unpublish",
          "grade",
          "manage",
        ],
        attempt: ["read", "grade", "manage"],
        enrollment: ["create", "read", "update", "delete", "manage"],
        order: ["read", "manage"],
        // `refund` is listed explicitly: moving money back out of a captured
        // payment is the one payment action that must never ride on a generic
        // "manage" grant (bundle C).
        payment: ["read", "manage", "refund"],
        voucher: ["create", "read", "update", "delete", "manage"],
        user: ["read", "update", "manage"],
        tenant: ["read", "update", "configure"],
        certificate: ["create", "read", "manage"],
        assignment: ["create", "read", "update", "delete", "grade", "manage"],
        question: ["create", "read", "update", "delete", "manage"],
        questionBank: ["create", "read", "update", "delete", "manage"],
        video: ["create", "read", "update", "delete", "manage"],
        liveSession: ["create", "read", "update", "delete", "manage"],
        community: ["read", "moderate", "manage"],
        notification: ["create", "read", "manage"],
        analytics: ["read", "export", "manage"],
        settings: ["read", "update", "manage"],
      },
      TEACHER: {
        course: ["create", "read", "update", "publish", "unpublish"],
        section: [
          "create",
          "read",
          "update",
          "delete",
          "publish",
          "unpublish",
          "reorder",
        ],
        lesson: ["create", "read", "update", "publish", "unpublish"],
        exam: ["create", "read", "update", "publish", "unpublish", "grade"],
        attempt: ["read", "grade"],
        enrollment: ["read"],
        order: ["read"],
        payment: ["read"],
        voucher: ["create", "read"],
        user: ["read"],
        tenant: ["read"],
        certificate: ["create", "read"],
        assignment: [
          "create",
          "read",
          "update",
          "publish",
          "grade",
          "evaluate",
        ],
        question: ["create", "read", "update", "delete"],
        questionBank: ["create", "read", "update", "delete"],
        video: ["create", "read", "update", "delete"],
        liveSession: ["create", "read", "update", "delete", "manage"],
        community: ["read", "moderate"],
        notification: ["create", "read"],
        analytics: ["read"],
        settings: ["read", "update"],
      },
      STUDENT: {
        course: ["read"],
        section: ["read"],
        lesson: ["read", "watch"],
        exam: ["read", "attempt", "submit"],
        attempt: ["create", "read", "submit"],
        enrollment: ["create", "read", "enroll"],
        order: ["create", "read"],
        payment: ["create", "read"],
        voucher: ["read"],
        user: ["read", "update"],
        tenant: ["read"],
        certificate: ["read"],
        // NOTE (demo): student self-evaluation is open; production needs
        // rate-limiting here (LLM cost per call once real models attach).
        assignment: ["read", "attempt", "submit", "evaluate"],
        question: ["read"],
        questionBank: [],
        video: ["watch"],
        liveSession: ["read", "join"],
        community: ["read", "create"],
        notification: ["read"],
        analytics: [],
        settings: ["read", "update"],
      },
      PARENT: {
        course: ["read"],
        section: ["read"],
        lesson: ["read"],
        exam: ["read"],
        attempt: ["read"],
        enrollment: ["read"],
        order: ["read"],
        payment: ["read"],
        voucher: [],
        user: ["read"],
        tenant: ["read"],
        certificate: ["read"],
        assignment: ["read"],
        question: [],
        questionBank: [],
        video: ["watch"],
        liveSession: ["read"],
        community: [],
        notification: ["read"],
        analytics: ["read"],
        settings: ["read"],
      },
    };

    const permissions = rolePermissions[context.role]?.[resourceType] || [];
    const hasPermission =
      permissions.includes(action) || permissions.includes("manage");

    if (!hasPermission) {
      return {
        allowed: false,
        reason: "INSUFFICIENT_PERMISSIONS",
        conditions: [
          {
            type: "custom",
            message: `Role ${context.role} does not have permission ${action} on ${resourceType}`,
          },
        ],
      };
    }

    return { allowed: true };
  }

  private checkOwnership(
    context: AuthorizationContext,
    resource?: { ownerId?: string; userId?: string },
  ): PolicyDecision {
    if (!resource) return { allowed: true };

    const ownerId = resource.ownerId || resource.userId;
    if (
      ownerId &&
      ownerId !== context.userId &&
      context.role !== "ADMIN" &&
      context.role !== "TEACHER" &&
      context.role !== "SUPER_ADMIN"
    ) {
      return {
        allowed: false,
        reason: "NOT_RESOURCE_OWNER",
        conditions: [
          {
            type: "ownership",
            message: "You do not own this resource",
          },
        ],
      };
    }
    return { allowed: true };
  }

  private async checkEntitlements(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
    resource?: { id?: string },
  ): Promise<PolicyDecision> {
    // Actions that require entitlements
    const entitlementRequiredActions: Action[] = [
      "watch",
      "attempt",
      "submit",
      "download",
      "join",
    ];
    const entitlementRequiredResources: ResourceType[] = [
      "lesson",
      "exam",
      "video",
      "liveSession",
      "certificate",
      "assignment",
    ];

    if (
      !entitlementRequiredActions.includes(action) ||
      !entitlementRequiredResources.includes(resourceType)
    ) {
      return { allowed: true };
    }

    if (!resource?.id) {
      return { allowed: true }; // Can't check without resource ID
    }

    const entitlements = context.entitlements || [];
    const hasEntitlement = entitlements.some(
      (e) =>
        e.resourceType === resourceType &&
        e.resourceId === resource!.id &&
        e.status === "ACTIVE" &&
        (!e.startsAt || e.startsAt <= new Date()) &&
        (!e.expiresAt || e.expiresAt >= new Date()),
    );

    if (!hasEntitlement) {
      return {
        allowed: false,
        reason: "NO_ENTITLEMENT",
        conditions: [
          {
            type: "entitlement",
            message: `No active entitlement for ${resourceType} ${resource.id}`,
          },
        ],
      };
    }

    return { allowed: true };
  }

  private async checkFeatureFlags(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
  ): Promise<PolicyDecision> {
    // Map actions/resources to feature flags
    const featureMap: Record<string, string> = {
      "lesson:watch": "videoPlayback",
      "video:watch": "videoPlayback",
      "exam:attempt": "exams",
      "liveSession:join": "liveSessions",
      "certificate:create": "certificates",
      "assignment:submit": "assignments",
      "community:create": "community",
      "gamification:create": "gamification",
      "analytics:read": "analytics",
      "ai:generate": "ai",
    };

    const featureKey = `${resourceType}:${action}`;
    const featureFlag = featureMap[featureKey];

    if (!featureFlag) return { allowed: true };

    const flags = context.featureFlags || {};
    // getTenantFlags returns FeatureFlagEvaluation objects ({ enabled, value }),
    // while unit tests and older callers may pass raw booleans — accept both.
    // (Field audit 2026-10-16 §3.2: comparing `=== true` alone denied every
    // gated action at runtime with 403 FEATURE_DISABLED.)
    const flag = flags[featureFlag];
    const isEnabled = flag === true || flag?.enabled === true;

    if (!isEnabled) {
      return {
        allowed: false,
        reason: "FEATURE_DISABLED",
        conditions: [
          {
            type: "feature",
            field: featureFlag,
            message: `Feature ${featureFlag} is not enabled for this tenant`,
          },
        ],
      };
    }

    return { allowed: true };
  }

  private async checkTenantPolicies(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
    resource?: any,
  ): Promise<PolicyDecision> {
    // Load custom tenant policies from database
    // For now, return allowed - will be implemented with database policies
    return { allowed: true };
  }

  private async checkPlanLimits(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
  ): Promise<PolicyDecision> {
    // Check plan-based limits (e.g., max courses, max students, max video minutes)
    // For now, return allowed - will be implemented with plans module
    return { allowed: true };
  }
}
