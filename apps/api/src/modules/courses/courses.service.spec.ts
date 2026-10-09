import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { CoursesService } from "./courses.service";

describe("CoursesService.getCourseStructure", () => {
  let service: CoursesService;
  let prisma: any;

  const sections = [
    {
      id: "sec1",
      title: "S1",
      orderIndex: 0,
      lessons: [
        {
          id: "l1",
          title: "L1",
          type: "VIDEO",
          orderIndex: 0,
          duration: 600,
          lockStatus: "UNLOCKED",
          unlockType: "NONE",
        },
      ],
    },
  ];

  beforeEach(() => {
    prisma = {
      course: { findFirst: jest.fn() },
      section: { findMany: jest.fn().mockResolvedValue(sections) },
      enrollment: { findFirst: jest.fn() },
    };
    service = new CoursesService(prisma);
  });

  it("returns full structure for an enrolled student", async () => {
    prisma.course.findFirst.mockResolvedValue({ id: "c1", title: "C1" });
    prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });

    const result = await service.getCourseStructureForStudent("t1", "c1", "u1");

    expect(result.course.id).toBe("c1");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].lessons[0].lockStatus).toBe("UNLOCKED");
  });

  it("rejects structure for non-enrolled students", async () => {
    prisma.course.findFirst.mockResolvedValue({ id: "c1" });
    prisma.enrollment.findFirst.mockResolvedValue(null);

    await expect(
      service.getCourseStructureForStudent("t1", "c1", "u1"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("public structure 404s on unknown slug", async () => {
    prisma.course.findFirst.mockResolvedValue(null);

    await expect(
      service.getCourseStructureBySlug("t1", "nope"),
    ).rejects.toThrow(NotFoundException);
  });
});
