import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { EntitlementsService } from "../../entitlements/entitlements.service";

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private entitlementsService: EntitlementsService,
  ) {}

  async enroll(tenantId: string, userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) throw new NotFoundException("Course not found");
    if (course.status !== "PUBLISHED") {
      throw new BadRequestException("Course is not available for enrollment");
    }

    const existing = await this.prisma.enrollment.findFirst({
      where: { tenantId, userId, courseId, status: "ACTIVE" },
    });

    if (existing) {
      throw new ConflictException("Already enrolled in this course");
    }

    // Paid courses are access-controlled by an ACTIVE course entitlement.
    // Without this gate the public course page could enroll a student for
    // free by calling this endpoint directly. Checkout grants the entitlement
    // first, so a paid buyer still lands here exactly once (or hits the
    // existing-enrollment conflict above).
    const isPaid = Number(course.price) > 0;
    let enrollmentSource = "student";

    if (isPaid) {
      const access = await this.entitlementsService.checkAccess(
        userId,
        "course",
        courseId,
      );

      if (!access.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            code: "PAYMENT_REQUIRED",
            message: "This course requires a completed purchase",
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      enrollmentSource = access.entitlement?.source ?? "purchase";
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        tenantId,
        userId,
        courseId,
        status: "ACTIVE",
        source: enrollmentSource,
        startsAt: new Date(),
      },
    });

    // Free direct enrollment must unlock the loop (lessons/exams/assignments),
    // mirroring the purchase flow — otherwise guards reject everything.
    // Paid enrollment already has that entitlement from checkout; granting an
    // admin_grant here would be a second, misleading source of access.
    if (!isPaid) {
      await this.entitlementsService.grantCourseEntitlement(
        tenantId,
        userId,
        courseId,
        "admin_grant",
      );
    }

    return enrollment;
  }

  async listEnrollments(tenantId: string, userId: string, status?: string) {
    const where: any = { tenantId, userId };
    if (status) where.status = status;

    return this.prisma.enrollment.findMany({
      where,
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEnrollment(tenantId: string, userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, tenantId, userId },
      include: {
        course: { select: { id: true, title: true, slug: true, status: true } },
      },
    });

    if (!enrollment) throw new NotFoundException("Enrollment not found");
    return enrollment;
  }

  async cancelEnrollment(
    tenantId: string,
    userId: string,
    enrollmentId: string,
  ) {
    const enrollment = await this.getEnrollment(tenantId, userId, enrollmentId);

    if (enrollment.status !== "ACTIVE") {
      throw new BadRequestException("Only active enrollments can be cancelled");
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "CANCELLED" },
    });
  }

  async suspendEnrollment(tenantId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, tenantId },
    });
    if (!enrollment) throw new NotFoundException("Enrollment not found");
    if (enrollment.status !== "ACTIVE")
      throw new BadRequestException("Only active enrollments can be suspended");

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "EXPIRED" },
    });
  }

  async reactivateEnrollment(tenantId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, tenantId },
    });
    if (!enrollment) throw new NotFoundException("Enrollment not found");
    if (enrollment.status === "ACTIVE") return enrollment;

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "ACTIVE" },
    });
  }
}
