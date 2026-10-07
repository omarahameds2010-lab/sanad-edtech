import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";

describe("EnrollmentsService", () => {
  let service: EnrollmentsService;
  let prisma: any;

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
    service = new EnrollmentsService(prisma);
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
          }),
        }),
      );
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
