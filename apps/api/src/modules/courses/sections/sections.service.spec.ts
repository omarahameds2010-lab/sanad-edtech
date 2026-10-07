import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { SectionsService } from "./sections.service";

describe("SectionsService", () => {
  let service: SectionsService;
  let prisma: any;

  const tenantId = "tenant1";

  beforeEach(() => {
    prisma = {
      course: { findFirst: jest.fn() },
      section: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        aggregate: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    service = new SectionsService(prisma);
  });

  describe("createSection", () => {
    it("throws NotFoundException if course not found", async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      await expect(
        service.createSection(tenantId, "c1", { title: "S1" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("auto-assigns next orderIndex", async () => {
      prisma.course.findFirst.mockResolvedValue({ id: "c1" });
      prisma.section.aggregate.mockResolvedValue({ _max: { orderIndex: 2 } });
      prisma.section.create.mockResolvedValue({ id: "s1", orderIndex: 3 });

      const result = await service.createSection(tenantId, "c1", {
        title: "S3",
      });

      expect(prisma.section.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderIndex: 3 }),
        }),
      );
      expect(result.orderIndex).toBe(3);
    });

    it("throws ConflictException on duplicate orderIndex", async () => {
      prisma.course.findFirst.mockResolvedValue({ id: "c1" });
      prisma.section.findFirst.mockResolvedValue({ id: "s_existing" });
      await expect(
        service.createSection(tenantId, "c1", { title: "S", orderIndex: 1 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("reorderSections", () => {
    it("throws BadRequestException when a section does not belong to the course", async () => {
      prisma.section.findMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
      await expect(
        service.reorderSections(tenantId, "c1", [
          { id: "s_other", position: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it("reorders atomically in a transaction", async () => {
      prisma.course.findFirst.mockResolvedValue({ id: "c1" });
      prisma.section.findMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
      prisma.section.update.mockImplementation((args: any) =>
        Promise.resolve(args),
      );
      prisma.$transaction.mockImplementation((ops: any) => Promise.all(ops));

      await service.reorderSections(tenantId, "c1", [
        { id: "s1", position: 2 },
        { id: "s2", position: 1 },
      ]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.section.update).toHaveBeenCalledTimes(2);
    });
  });

  describe("deleteSection", () => {
    it("throws NotFoundException for wrong tenant", async () => {
      prisma.section.findFirst.mockResolvedValue(null);
      await expect(service.deleteSection(tenantId, "s1")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
