import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { ResourcesService } from "./resources.service";

describe("ResourcesService", () => {
  let service: ResourcesService;
  let prisma: any;

  const tenantId = "tenant1";
  const userId = "user1";

  beforeEach(() => {
    prisma = {
      lesson: { findFirst: jest.fn() },
      resource: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      enrollment: { findFirst: jest.fn() },
    };
    service = new ResourcesService(prisma);
  });

  describe("createResource", () => {
    it("throws NotFoundException if lesson missing", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(
        service.createResource(tenantId, "l1", { title: "x", type: "PDF" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("requires assetId for PDF", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      await expect(
        service.createResource(tenantId, "l1", { title: "x", type: "PDF" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("requires url for LINK", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      await expect(
        service.createResource(tenantId, "l1", { title: "x", type: "LINK" }),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates a PDF resource with auto position", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      prisma.resource.aggregate.mockResolvedValue({ _max: { position: 2 } });
      prisma.resource.create.mockResolvedValue({
        id: "r1",
        type: "PDF",
        position: 3,
      });

      const result = await service.createResource(tenantId, "l1", {
        title: "Ch1",
        type: "PDF",
        assetId: "a1",
      });

      expect(prisma.resource.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ position: 3, type: "PDF" }),
        }),
      );
      expect(result.id).toBe("r1");
    });
  });

  describe("getAccessUrl", () => {
    it("throws ForbiddenException when not enrolled and not free", async () => {
      prisma.resource.findFirst.mockResolvedValue({
        id: "r1",
        lessonId: "l1",
        type: "PDF",
        assetId: "a1",
      });
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        isFree: false,
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.getAccessUrl(tenantId, userId, "r1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("returns a signed URL for enrolled PDF resource", async () => {
      prisma.resource.findFirst.mockResolvedValue({
        id: "r1",
        lessonId: "l1",
        type: "PDF",
        assetId: "asset_1",
      });
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        isFree: false,
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });

      const result = await service.getAccessUrl(tenantId, userId, "r1");

      expect(result.url).toContain("https://storage.example.com/");
      expect(result.url).toContain("sig=");
      expect(result.url).toContain("exp=");
      expect(result.expiresAt).toBeDefined();
    });

    it("returns the direct URL for LINK resources", async () => {
      prisma.resource.findFirst.mockResolvedValue({
        id: "r1",
        lessonId: "l1",
        type: "LINK",
        url: "https://example.com/doc",
      });
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        isFree: true,
        section: { courseId: "c1" },
      });

      const result = await service.getAccessUrl(tenantId, userId, "r1");
      expect(result.url).toBe("https://example.com/doc");
      expect(result.expiresAt).toBeNull();
    });
  });

  describe("updateResource / deleteResource", () => {
    it("update throws NotFoundException for missing resource", async () => {
      prisma.resource.findFirst.mockResolvedValue(null);
      await expect(
        service.updateResource(tenantId, "r1", { title: "x" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("delete removes resource", async () => {
      prisma.resource.findFirst.mockResolvedValue({ id: "r1" });
      prisma.resource.delete.mockResolvedValue({});
      const result = await service.deleteResource(tenantId, "r1");
      expect(result.success).toBe(true);
    });
  });
});
