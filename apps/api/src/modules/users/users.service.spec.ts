import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";

describe("UsersService.getStudentDetail", () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), findMany: jest.fn() },
      enrollment: { findMany: jest.fn().mockResolvedValue([]) },
      examAttempt: { findMany: jest.fn().mockResolvedValue([]) },
      assignmentSubmission: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new UsersService(prisma);
  });

  it("throws when the student does not belong to the tenant", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.getStudentDetail("t1", "u9")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("returns profile plus learning history", async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: "u1",
      name: "طالب",
      role: "STUDENT",
      grade: "3 ثانوي",
      status: "ACTIVE",
    });
    prisma.enrollment.findMany.mockResolvedValue([
      { id: "e1", course: { id: "c1", title: "رياضيات" } },
    ]);
    prisma.examAttempt.findMany.mockResolvedValue([
      {
        id: "a1",
        status: "GRADED",
        score: 85,
        exam: { id: "e1", title: "اختبار" },
      },
    ]);

    const result = await service.getStudentDetail("t1", "u1");

    expect(result.user.name).toBe("طالب");
    expect(result.enrollments).toHaveLength(1);
    expect(result.examAttempts[0].score).toBe(85);
    expect(result.submissions).toEqual([]);
    // Never leaks secrets
    expect((result.user as any).passwordHash).toBeUndefined();
  });
});

describe("UsersService.listStudentsForTeacher", () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: { findMany: jest.fn() },
    };
    service = new UsersService(prisma);
  });

  it("returns only students enrolled in the teacher courses", async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        name: "طالب",
        phone: "01000000002",
        enrollments: [
          { status: "ACTIVE", course: { id: "c1", title: "رياضيات" } },
        ],
      },
    ]);

    const result = await service.listStudentsForTeacher("t1", "teacher1");

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "t1",
          role: "STUDENT",
          enrollments: {
            some: { course: { teacherId: "teacher1" } },
          },
        }),
      }),
    );
    expect(result).toHaveLength(1);
    expect((result[0] as any).passwordHash).toBeUndefined();
  });
});
