import { Injectable, Inject, forwardRef } from "@nestjs/common";
import {
  PolicyEngine,
  AuthorizationContext,
  PolicyDecision,
  Action,
  ResourceType,
  Entitlement,
  PolicyCondition,
} from "./policy-engine";
import { PrismaService } from "../tenants/prisma.service";
import { TenantService } from "../tenants/tenant.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import {
  EntitlementsService,
  Entitlement as EntitlementType,
} from "../entitlements/entitlements.service";

@Injectable()
export class AuthorizationService {
  constructor(
    private policyEngine: PolicyEngine,
    private prisma: PrismaService,
    private tenantService: TenantService,
    @Inject(forwardRef(() => FeatureFlagsService))
    private featureFlagsService: FeatureFlagsService,
    @Inject(forwardRef(() => EntitlementsService))
    private entitlementsService: EntitlementsService,
  ) {}

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
    // Enrich context with feature flags and entitlements if not provided
    if (!context.featureFlags) {
      context.featureFlags = await this.featureFlagsService.getTenantFlags(
        context.tenantId,
      );
    }

    if (!context.entitlements) {
      context.entitlements = await this.entitlementsService.getUserEntitlements(
        context.userId,
      );
    }

    return this.policyEngine.can(context, action, resourceType, resource);
  }

  async canOrThrow(
    context: AuthorizationContext,
    action: Action,
    resourceType: ResourceType,
    resource?: {
      id?: string;
      tenantId?: string;
      ownerId?: string;
      [key: string]: any;
    },
  ): Promise<void> {
    const decision = await this.can(context, action, resourceType, resource);
    if (!decision.allowed) {
      throw new AuthorizationError(
        decision.reason || "FORBIDDEN",
        decision.conditions,
      );
    }
  }

  // Convenience methods for common checks
  async canWatchLesson(
    context: AuthorizationContext,
    lessonId: string,
    lesson?: any,
  ) {
    return this.can(context, "watch", "lesson", { id: lessonId, ...lesson });
  }

  async canAttemptExam(
    context: AuthorizationContext,
    examId: string,
    exam?: any,
  ) {
    return this.can(context, "attempt", "exam", { id: examId, ...exam });
  }

  async canSubmitAttempt(
    context: AuthorizationContext,
    examId: string,
    attempt?: any,
  ) {
    return this.can(context, "submit", "attempt", { id: examId, ...attempt });
  }

  async canManageCourse(
    context: AuthorizationContext,
    courseId: string,
    course?: any,
  ) {
    return this.can(context, "manage", "course", { id: courseId, ...course });
  }

  async canCreateCourse(context: AuthorizationContext) {
    return this.can(context, "create", "course");
  }

  async canReadCourse(
    context: AuthorizationContext,
    courseId: string,
    course?: any,
  ) {
    return this.can(context, "read", "course", { id: courseId, ...course });
  }

  async canUpdateCourse(
    context: AuthorizationContext,
    courseId: string,
    course?: any,
  ) {
    return this.can(context, "update", "course", { id: courseId, ...course });
  }

  async canDeleteCourse(
    context: AuthorizationContext,
    courseId: string,
    course?: any,
  ) {
    return this.can(context, "delete", "course", { id: courseId, ...course });
  }

  async canPublishCourse(
    context: AuthorizationContext,
    courseId: string,
    course?: any,
  ) {
    return this.can(context, "publish", "course", { id: courseId, ...course });
  }

  async canManageLesson(
    context: AuthorizationContext,
    lessonId: string,
    lesson?: any,
  ) {
    return this.can(context, "manage", "lesson", { id: lessonId, ...lesson });
  }

  async canCreateLesson(context: AuthorizationContext, courseId: string) {
    return this.can(context, "create", "lesson", { courseId });
  }

  async canReadLesson(
    context: AuthorizationContext,
    lessonId: string,
    lesson?: any,
  ) {
    return this.can(context, "read", "lesson", { id: lessonId, ...lesson });
  }

  async canManageExam(
    context: AuthorizationContext,
    examId: string,
    exam?: any,
  ) {
    return this.can(context, "manage", "exam", { id: examId, ...exam });
  }

  async canGradeAttempt(
    context: AuthorizationContext,
    attemptId: string,
    attempt?: any,
  ) {
    return this.can(context, "grade", "attempt", { id: attemptId, ...attempt });
  }

  async canReadAttempt(
    context: AuthorizationContext,
    attemptId: string,
    attempt?: any,
  ) {
    return this.can(context, "read", "attempt", { id: attemptId, ...attempt });
  }

  async canManageEnrollment(
    context: AuthorizationContext,
    enrollmentId: string,
    enrollment?: any,
  ) {
    return this.can(context, "manage", "enrollment", {
      id: enrollmentId,
      ...enrollment,
    });
  }

  async canEnroll(context: AuthorizationContext, courseId: string) {
    return this.can(context, "enroll", "enrollment", { courseId });
  }

  async canReadEnrollment(
    context: AuthorizationContext,
    enrollmentId: string,
    enrollment?: any,
  ) {
    return this.can(context, "read", "enrollment", {
      id: enrollmentId,
      ...enrollment,
    });
  }

  async canManageUser(
    context: AuthorizationContext,
    userId: string,
    user?: any,
  ) {
    return this.can(context, "manage", "user", { id: userId, ...user });
  }

  async canReadUser(context: AuthorizationContext, userId: string, user?: any) {
    return this.can(context, "read", "user", { id: userId, ...user });
  }

  async canUpdateUser(
    context: AuthorizationContext,
    userId: string,
    user?: any,
  ) {
    return this.can(context, "update", "user", { id: userId, ...user });
  }

  async canManageVoucher(
    context: AuthorizationContext,
    voucherId: string,
    voucher?: any,
  ) {
    return this.can(context, "manage", "voucher", {
      id: voucherId,
      ...voucher,
    });
  }

  async canCreateVoucher(context: AuthorizationContext) {
    return this.can(context, "create", "voucher");
  }

  async canReadAnalytics(context: AuthorizationContext) {
    return this.can(context, "read", "analytics");
  }

  async canExportAnalytics(context: AuthorizationContext) {
    return this.can(context, "export", "analytics");
  }

  async canManageTenantSettings(context: AuthorizationContext) {
    return this.can(context, "manage", "settings");
  }

  async canReadTenantSettings(context: AuthorizationContext) {
    return this.can(context, "read", "settings");
  }

  async canManageCertificate(
    context: AuthorizationContext,
    certificateId: string,
    certificate?: any,
  ) {
    return this.can(context, "manage", "certificate", {
      id: certificateId,
      ...certificate,
    });
  }

  async canCreateCertificate(context: AuthorizationContext, courseId: string) {
    return this.can(context, "create", "certificate", { courseId });
  }

  async canReadCertificate(
    context: AuthorizationContext,
    certificateId: string,
    certificate?: any,
  ) {
    return this.can(context, "read", "certificate", {
      id: certificateId,
      ...certificate,
    });
  }

  async canManageAssignment(
    context: AuthorizationContext,
    assignmentId: string,
    assignment?: any,
  ) {
    return this.can(context, "manage", "assignment", {
      id: assignmentId,
      ...assignment,
    });
  }

  async canSubmitAssignment(
    context: AuthorizationContext,
    assignmentId: string,
    assignment?: any,
  ) {
    return this.can(context, "submit", "assignment", {
      id: assignmentId,
      ...assignment,
    });
  }

  async canManageQuestion(
    context: AuthorizationContext,
    questionId: string,
    question?: any,
  ) {
    return this.can(context, "manage", "question", {
      id: questionId,
      ...question,
    });
  }

  async canReadQuestionBank(context: AuthorizationContext) {
    return this.can(context, "read", "questionBank");
  }

  async canManageQuestionBank(context: AuthorizationContext) {
    return this.can(context, "manage", "questionBank");
  }

  async canManageVideo(
    context: AuthorizationContext,
    videoId: string,
    video?: any,
  ) {
    return this.can(context, "manage", "video", { id: videoId, ...video });
  }

  async canWatchVideo(
    context: AuthorizationContext,
    videoId: string,
    video?: any,
  ) {
    return this.can(context, "watch", "video", { id: videoId, ...video });
  }

  async canManageLiveSession(
    context: AuthorizationContext,
    sessionId: string,
    session?: any,
  ) {
    return this.can(context, "manage", "liveSession", {
      id: sessionId,
      ...session,
    });
  }

  async canJoinLiveSession(
    context: AuthorizationContext,
    sessionId: string,
    session?: any,
  ) {
    return this.can(context, "join", "liveSession", {
      id: sessionId,
      ...session,
    });
  }

  async canModerateCommunity(context: AuthorizationContext) {
    return this.can(context, "moderate", "community");
  }

  async canCreateNotification(context: AuthorizationContext) {
    return this.can(context, "create", "notification");
  }

  // Build authorization context from request
  async buildContext(request: any): Promise<AuthorizationContext> {
    const user = request.user;
    const tenantId = request.tenantId;

    if (!user || !tenantId) {
      throw new Error("User or tenant context not available");
    }

    return {
      userId: user.sub || user.id,
      tenantId,
      role: user.role,
      permissions: user.permissions,
      deviceId: request.deviceId,
      ip: request.ip,
    };
  }
}

export class AuthorizationError extends Error {
  constructor(
    public readonly code: string,
    public readonly conditions?: PolicyCondition[],
  ) {
    super(`Authorization failed: ${code}`);
    this.name = "AuthorizationError";
  }
}
