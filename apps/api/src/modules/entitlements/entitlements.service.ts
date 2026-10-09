import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import {
  Prisma,
  EntitlementStatus as PrismaEntitlementStatus,
} from "@prisma/client";

export type EntitlementSource =
  "purchase" | "voucher" | "subscription" | "admin_grant" | "trial";
export type EntitlementStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING";

export interface Entitlement {
  id: string;
  tenantId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  source: EntitlementSource;
  startsAt?: Date;
  expiresAt?: Date;
  status: EntitlementStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEntitlementInput {
  tenantId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  source: EntitlementSource;
  startsAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface GrantEntitlementInput extends CreateEntitlementInput {
  orderId?: string;
  voucherId?: string;
}

@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  // Resource types that can have entitlements
  private readonly entitleableResources = [
    "course",
    "lesson",
    "exam",
    "video",
    "liveSession",
    "certificate",
    "assignment",
    "questionBank",
    "community",
  ];

  private mapEntitlement(e: any): Entitlement {
    return {
      ...e,
      source: e.source as EntitlementSource,
      status: e.status as EntitlementStatus,
    };
  }

  private toEntitlementStatus(status: string): EntitlementStatus {
    return status.toUpperCase() as EntitlementStatus;
  }

  async getUserEntitlements(
    userId: string,
    status: EntitlementStatus[] = ["ACTIVE"],
  ): Promise<Entitlement[]> {
    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        userId,
        status: { in: status as PrismaEntitlementStatus[] },
      },
      orderBy: { createdAt: "desc" },
    });
    return entitlements.map(this.mapEntitlement);
  }

  async getEntitlement(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<Entitlement | null> {
    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        resourceType,
        resourceId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
    });
    return entitlement ? this.mapEntitlement(entitlement) : null;
  }

  async hasEntitlement(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<boolean> {
    const entitlement = await this.getEntitlement(
      userId,
      resourceType,
      resourceId,
    );
    if (!entitlement) return false;

    // Check expiration
    if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
      return false;
    }

    // Check start date
    if (entitlement.startsAt && entitlement.startsAt > new Date()) {
      return false;
    }

    return entitlement.status === "ACTIVE";
  }

  async grantEntitlement(input: GrantEntitlementInput): Promise<Entitlement> {
    // Check if already has active entitlement
    const existing = await this.getEntitlement(
      input.userId,
      input.resourceType,
      input.resourceId,
    );
    if (existing && existing.status === "ACTIVE") {
      // Update existing entitlement if new one has later expiry
      if (
        input.expiresAt &&
        (!existing.expiresAt || input.expiresAt > existing.expiresAt)
      ) {
        return this.updateEntitlement(existing.id, {
          expiresAt: input.expiresAt,
          metadata: { ...existing.metadata, ...input.metadata },
        });
      }
      return existing;
    }

    // Create new entitlement
    const created = await this.prisma.entitlement.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        source: input.source,
        startsAt: input.startsAt || new Date(),
        expiresAt: input.expiresAt,
        status: "ACTIVE",
        metadata: input.metadata || {},
      },
    });
    return this.mapEntitlement(created);
  }

  async grantCourseEntitlement(
    tenantId: string,
    userId: string,
    courseId: string,
    source: EntitlementSource,
    metadata?: Record<string, any>,
  ): Promise<Entitlement[]> {
    // Grant entitlement to course
    const courseEntitlement = await this.grantEntitlement({
      tenantId,
      userId,
      resourceType: "course",
      resourceId: courseId,
      source,
      metadata,
    });

    // Get all lessons in the course and grant entitlements
    const lessons = await this.prisma.lesson.findMany({
      where: {
        tenantId,
        section: { courseId },
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    const lessonEntitlements = await Promise.all(
      lessons.map((lesson) =>
        this.grantEntitlement({
          tenantId,
          userId,
          resourceType: "lesson",
          resourceId: lesson.id,
          source,
          metadata: { courseId, ...metadata },
        }),
      ),
    );

    // Get exams for the course
    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        lesson: { section: { courseId } },
      },
      select: { id: true },
    });

    const examEntitlements = await Promise.all(
      exams.map((exam) =>
        this.grantEntitlement({
          tenantId,
          userId,
          resourceType: "exam",
          resourceId: exam.id,
          source,
          metadata: { courseId, ...metadata },
        }),
      ),
    );

    // Get assignments for the course
    const assignments = await this.prisma.assignment.findMany({
      where: {
        tenantId,
        status: "PUBLISHED",
        lesson: { section: { courseId } },
      },
      select: { id: true },
    });

    const assignmentEntitlements = await Promise.all(
      assignments.map((assignment) =>
        this.grantEntitlement({
          tenantId,
          userId,
          resourceType: "assignment",
          resourceId: assignment.id,
          source,
          metadata: { courseId, ...metadata },
        }),
      ),
    );

    return [
      courseEntitlement,
      ...lessonEntitlements,
      ...examEntitlements,
      ...assignmentEntitlements,
    ];
  }

  async revokeEntitlement(id: string, reason?: string): Promise<Entitlement> {
    const updated = await this.prisma.entitlement.update({
      where: { id },
      data: {
        status: "REVOKED",
        metadata: { revokedAt: new Date(), revokedReason: reason },
      },
    });
    return this.mapEntitlement(updated);
  }

  async revokeUserEntitlements(
    userId: string,
    resourceType?: string,
  ): Promise<number> {
    const where: any = { userId, status: "ACTIVE" };
    if (resourceType) where.resourceType = resourceType;

    const result = await this.prisma.entitlement.updateMany({
      where,
      data: {
        status: "REVOKED",
        metadata: { revokedAt: new Date() },
      },
    });

    return result.count;
  }

  async expireEntitlements(): Promise<number> {
    const result = await this.prisma.entitlement.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return result.count;
  }

  async updateEntitlement(
    id: string,
    data: Partial<
      Omit<
        Entitlement,
        "id" | "tenantId" | "userId" | "createdAt" | "updatedAt"
      >
    >,
  ): Promise<Entitlement> {
    const updated = await this.prisma.entitlement.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
    return this.mapEntitlement(updated);
  }

  async getTenantEntitlements(
    tenantId: string,
    filters?: {
      userId?: string;
      resourceType?: string;
      status?: EntitlementStatus;
    },
  ): Promise<Entitlement[]> {
    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        tenantId,
        ...filters,
        status: filters?.status as PrismaEntitlementStatus | undefined,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    return entitlements.map(this.mapEntitlement);
  }

  async getEntitlementStats(tenantId: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    bySource: Record<string, number>;
    byResourceType: Record<string, number>;
  }> {
    const [total, active, expired, revoked, bySource, byResourceType] =
      await Promise.all([
        this.prisma.entitlement.count({ where: { tenantId } }),
        this.prisma.entitlement.count({
          where: { tenantId, status: "ACTIVE" },
        }),
        this.prisma.entitlement.count({
          where: { tenantId, status: "EXPIRED" },
        }),
        this.prisma.entitlement.count({
          where: { tenantId, status: "REVOKED" },
        }),
        this.prisma.entitlement.groupBy({
          by: ["source"],
          where: { tenantId },
          _count: { source: true },
        }),
        this.prisma.entitlement.groupBy({
          by: ["resourceType"],
          where: { tenantId },
          _count: { resourceType: true },
        }),
      ]);

    return {
      total,
      active,
      expired,
      revoked,
      bySource: bySource.reduce(
        (acc, item) => ({ ...acc, [item.source]: item._count.source }),
        {},
      ),
      byResourceType: byResourceType.reduce(
        (acc, item) => ({
          ...acc,
          [item.resourceType]: item._count.resourceType,
        }),
        {},
      ),
    };
  }

  // Check if user has access to a specific resource through any entitlement
  async checkAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<{ allowed: boolean; entitlement?: Entitlement; reason?: string }> {
    const entitlement = await this.getEntitlement(
      userId,
      resourceType,
      resourceId,
    );

    if (!entitlement) {
      return { allowed: false, reason: "NO_ENTITLEMENT" };
    }

    if (entitlement.status !== "ACTIVE") {
      return { allowed: false, reason: `ENTITLEMENT_${entitlement.status}` };
    }

    if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
      return { allowed: false, reason: "ENTITLEMENT_EXPIRED" };
    }

    if (entitlement.startsAt && entitlement.startsAt > new Date()) {
      return { allowed: false, reason: "ENTITLEMENT_NOT_STARTED" };
    }

    return { allowed: true, entitlement };
  }
}
