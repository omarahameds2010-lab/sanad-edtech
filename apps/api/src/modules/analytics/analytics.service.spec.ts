import { AnalyticsService } from "./analytics.service";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function buildPlans(retentionDays = 30) {
  return {
    getPlan: jest.fn().mockReturnValue({
      limits: { retentionDays },
    }),
  };
}

function buildPrisma() {
  return {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ planId: "starter" }),
    },
    user: {
      count: jest
        .fn()
        .mockResolvedValueOnce(12) // active students
        .mockResolvedValueOnce(3), // new students in the window
    },
    course: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "c1",
          title: "كورس أول",
          slug: "course-1",
          sections: [
            { lessons: [{ id: "l1" }, { id: "l2" }] },
          ],
        },
        {
          id: "c2",
          title: "كورس ثاني",
          slug: "course-2",
          sections: [{ lessons: [{ id: "l3" }] }],
        },
      ]),
    },
    assignment: {
      count: jest.fn().mockResolvedValue(4),
    },
    exam: {
      count: jest.fn().mockResolvedValue(3),
    },
    enrollment: {
      findMany: jest.fn().mockResolvedValue([
        { courseId: "c1", createdAt: daysAgo(0) },
        { courseId: "c1", createdAt: daysAgo(5) },
        { courseId: "c2", createdAt: daysAgo(10) },
        // An enrollment in an unpublished course must not enter the totals.
        { courseId: "c-unpublished", createdAt: daysAgo(1) },
      ]),
    },
    lessonProgress: {
      findMany: jest.fn().mockResolvedValue([
        { lessonId: "l1" },
        { lessonId: "l3" },
        // Progress in an unpublished course must not enter the totals.
        { lessonId: "l-unpublished" },
      ]),
    },
    assignmentSubmission: {
      groupBy: jest.fn().mockResolvedValue([
        { status: "SUBMITTED", _count: 1, _avg: { score: 70 } },
        { status: "GRADED", _count: 2, _avg: { score: 85.5 } },
        { status: "LATE", _count: 1, _avg: { score: null } },
      ]),
      findMany: jest.fn().mockResolvedValue([
        {
          id: "sub-1",
          status: "SUBMITTED",
          score: 70,
          submittedAt: daysAgo(1),
          startedAt: daysAgo(2),
          assignment: { title: "واجب أول" },
          student: { name: "عمر" },
        },
      ]),
    },
    examAttempt: {
      groupBy: jest.fn().mockResolvedValue([
        { status: "GRADED", _count: 2, _avg: { score: 75 } },
        { status: "SUBMITTED", _count: 1, _avg: { score: null } },
      ]),
      count: jest.fn().mockResolvedValue(1),
      findMany: jest.fn().mockResolvedValue([
        {
          id: "attempt-1",
          status: "GRADED",
          score: 75,
          submittedAt: daysAgo(3),
          startedAt: daysAgo(4),
          exam: { title: "اختبار أول" },
          student: { name: "عمر" },
        },
      ]),
    },
  };
}

describe("AnalyticsService.getTeacherOverview", () => {
  it("derives tenant-scoped totals from real rows", async () => {
    const prisma = buildPrisma();
    const service = new AnalyticsService(prisma as any, buildPlans() as any);

    const overview = await service.getTeacherOverview("t1", 30);

    expect(overview.windowDays).toBe(30);
    expect(overview.maxWindowDays).toBe(30);
    expect(overview.totals).toEqual({
      activeStudents: 12,
      newStudents: 3,
      activeEnrollments: 3,
      publishedCourses: 2,
      publishedAssignments: 4,
      publishedExams: 3,
      completedLessons: 2,
      lessonCompletionRate: 40,
      pendingGrading: 3,
    });

    expect(overview.courses).toEqual([
      {
        id: "c1",
        title: "كورس أول",
        slug: "course-1",
        enrollments: 2,
        lessons: 2,
        completedLessons: 1,
        completionRate: 25,
      },
      {
        id: "c2",
        title: "كورس ثاني",
        slug: "course-2",
        enrollments: 1,
        lessons: 1,
        completedLessons: 1,
        completionRate: 100,
      },
    ]);

    expect(overview.assignments).toEqual({
      submitted: 4,
      graded: 2,
      pending: 2,
      averageScore: 80,
    });
    expect(overview.exams).toEqual({
      attempts: 3,
      graded: 2,
      passed: 1,
      pending: 1,
      averageScore: 75,
      passRate: 50,
    });

    expect(overview.enrollmentTrend).toHaveLength(30);
    expect(
      overview.enrollmentTrend.reduce((sum, day) => sum + day.count, 0),
    ).toBe(3);
    expect(overview.recentActivity).toEqual([
      expect.objectContaining({
        id: "assignment:sub-1",
        kind: "assignment",
        title: "واجب أول",
        studentName: "عمر",
        score: 70,
      }),
      expect.objectContaining({
        id: "exam:attempt-1",
        kind: "exam",
        title: "اختبار أول",
        studentName: "عمر",
        score: 75,
      }),
    ]);

    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "t1", status: "PUBLISHED" },
      }),
    );
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "t1", status: "ACTIVE" },
      }),
    );
  });

  it("clamps the requested window to the plan retention limit", async () => {
    const service = new AnalyticsService(
      buildPrisma() as any,
      buildPlans(30) as any,
    );

    expect((await service.getTeacherOverview("t1", 1)).windowDays).toBe(7);
    expect((await service.getTeacherOverview("t1", 999)).windowDays).toBe(30);
    expect(
      (await service.getTeacherOverview("t1", Number.NaN)).windowDays,
    ).toBe(30);
  });

  it("allows 90 days when the plan retains more history", async () => {
    const service = new AnalyticsService(
      buildPrisma() as any,
      buildPlans(365) as any,
    );

    const overview = await service.getTeacherOverview("t1", 90);

    expect(overview.windowDays).toBe(90);
    expect(overview.maxWindowDays).toBe(90);
    expect(overview.enrollmentTrend).toHaveLength(90);
  });

  it("returns zero-safe values for an empty tenant", async () => {
    const prisma: any = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ planId: "free" }),
      },
      user: { count: jest.fn().mockResolvedValue(0) },
      course: { findMany: jest.fn().mockResolvedValue([]) },
      assignment: { count: jest.fn().mockResolvedValue(0) },
      exam: { count: jest.fn().mockResolvedValue(0) },
      enrollment: { findMany: jest.fn().mockResolvedValue([]) },
      lessonProgress: { findMany: jest.fn().mockResolvedValue([]) },
      assignmentSubmission: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      examAttempt: {
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new AnalyticsService(prisma, buildPlans(30) as any);

    const overview = await service.getTeacherOverview("t-empty", 7);

    expect(overview.totals).toMatchObject({
      activeStudents: 0,
      activeEnrollments: 0,
      publishedCourses: 0,
      completedLessons: 0,
      lessonCompletionRate: 0,
      pendingGrading: 0,
    });
    expect(overview.assignments.averageScore).toBeNull();
    expect(overview.exams.averageScore).toBeNull();
    expect(overview.exams.passRate).toBeNull();
    expect(overview.enrollmentTrend).toHaveLength(7);
    expect(overview.recentActivity).toEqual([]);
  });
});
