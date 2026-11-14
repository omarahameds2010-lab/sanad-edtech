import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpException,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";

describe("EnrollmentsService", () => {
  let service: EnrollmentsService;
  let prisma: any;
  let entitlements: any;

  const tenantId = "tenant1";
  const userId = "user1";

  beforeEach(() => {
    prisma = {
      course: { findFirst: jest.fn() },
      enrollment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    entitlements = {
      grantCourseEntitlement: jest.fn().mockResolvedValue([]),
      checkAccess: jest.fn(),
    };
    service = new EnrollmentsService(prisma, entitlements);
  });

  describe("enroll", () => {
    it("throws NotFoundException when course missing", async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      await expect(service.enroll(tenantId, userId, "c1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws BadRequestException when course not published", async () => {
      prisma.course.findFirst.mockResolvedValue({ id: "c1", status: "DRAFT" });
      await expect(service.enroll(tenantId, userId, "c1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws ConflictException when already enrolled (active)", async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: "c1",
        status: "PUBLISHED",
      });
      prisma.enrollment.findFirst.mockResolvedValue({
        id: "e1",
        status: "ACTIVE",
      });
      await expect(service.enroll(tenantId, userId, "c1")).rejects.toThrow(
        ConflictException,
      );
    });

    it("creates enrollment when course published and no active enrollment", async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: "c1",
        status: "PUBLISHED",
        price: 0,
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      prisma.enrollment.create.mockResolvedValue({
        id: "e1",
        status: "ACTIVE",
      });

      const result = await service.enroll(tenantId, userId, "c1");

      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACTIVE",
            userId,
            courseId: "c1",
            source: "student",
          }),
        }),
      );
      expect(result.status).toBe("ACTIVE");
      expect(entitlements.grantCourseEntitlement).toHaveBeenCalledWith(
        tenantId,
        userId,
        "c1",
        "admin_grant",
      );
      expect(entitlements.checkAccess).not.toHaveBeenCalled();
    });

    it("rejects a paid course with 402 PAYMENT_REQUIRED before creating an enrollment", async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: "c1",
        status: "PUBLISHED",
        price: "199.00",
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      entitlements.checkAccess.mockResolvedValue({
        allowed: false,
        reason: "NO_ENTITLEMENT",
      });

      await expect(service.enroll(tenantId, userId, "c1")).rejects.toThrow(
        HttpException,
      );

      try {
        await service.enroll(tenantId, userId, "c1");
      } catch (error) {
        expect((error as HttpException).getStatus()).toBe(402);
        expect((error as HttpException).getResponse()).toMatchObject({
          code: "PAYMENT_REQUIRED",
        });
      }

      expect(prisma.enrollment.create).not.toHaveBeenCalled();
      expect(entitlements.grantCourseEntitlement).not.toHaveBeenCalled();
    });

    it("enrolls a paid buyer from the existing entitlement without minting admin_grant", async () => {
      prisma.course.findFirst.mockResolvedValue({
        id: "c1",
        status: "PUBLISHED",
        price: "199.00",
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);
      entitlements.checkAccess.mockResolvedValue({
        allowed: true,
        entitlement: { source: "voucher" },
      });
      prisma.enrollment.create.mockResolvedValue({
        id: "e1",
        status: "ACTIVE",
        source: "voucher",
      });

      const result = await service.enroll(tenantId, userId, "c1");

      expect(entitlements.checkAccess).toHaveBeenCalledWith(
        userId,
        "course",
        "c1",
      );
      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: "voucher",
            status: "ACTIVE",
          }),
        }),
      );
      expect(entitlements.grantCourseEntitlement).not.toHaveBeenCalled();
      expect(result.status).toBe("ACTIVE");
    });
  });

  describe("cancelEnrollment", () => {
    it("throws BadRequestException when not active", async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: "e1",
        status: "CANCELLED",
      });
      await expect(
        service.cancelEnrollment(tenantId, userId, "e1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("cancels an active enrollment", async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: "e1",
        status: "ACTIVE",
      });
      prisma.enrollment.update.mockResolvedValue({
        id: "e1",
        status: "CANCELLED",
      });
      const result = await service.cancelEnrollment(tenantId, userId, "e1");
      expect(result.status).toBe("CANCELLED");
    });
  });

  describe("reactivateEnrollment", () => {
    it("is idempotent when already active", async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: "e1",
        status: "ACTIVE",
      });
      const result = await service.reactivateEnrollment(tenantId, "e1");
      expect(result.status).toBe("ACTIVE");
      expect(prisma.enrollment.update).not.toHaveBeenCalled();
    });
  });
});
