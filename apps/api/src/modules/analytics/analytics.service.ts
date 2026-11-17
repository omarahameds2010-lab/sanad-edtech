import { Injectable } from "@nestjs/common";
import {
  AttemptStatus,
  CourseStatus,
  EnrollmentStatus,
  SubmissionStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { PlansService } from "../plans/plans.service";
import { PrismaService } from "../tenants/prisma.service";

export interface TeacherAnalyticsOverview {
  generatedAt: string;
  windowDays: number;
  maxWindowDays: number;
  totals: {
    activeStudents: number;
    newStudents: number;
    activeEnrollments: number;
    publishedCourses: number;
    publishedAssignments: number;
    publishedExams: number;
    completedLessons: number;
    lessonCompletionRate: number;
    pendingGrading: number;
  };
  enrollmentTrend: Array<{ date: string; count: number }>;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    enrollments: number;
    lessons: number;
    completedLessons: number;
    completionRate: number;
  }>;
  assignments: {
    submitted: number;
    graded: number;
    pending: number;
    averageScore: number | null;
  };
  exams: {
    attempts: number;
    graded: number;
    passed: number;
    pending: number;
    averageScore: number | null;
    passRate: number | null;
  };
  recentActivity: Array<{
    id: string;
    kind: "assignment" | "exam";
    title: string;
    studentName: string;
    status: string;
    score: number | null;
    at: string;
  }>;
}

type ScoreGroup = {
  _count: number;
  _avg: { score: number | null };
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plansService: PlansService,
  ) {}

  async getTeacherOverview(
    tenantId: string,
    requestedDays = 30,
  ): Promise<TeacherAnalyticsOverview> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { planId: true },
    });
    const plan = this.plansService.getPlan(tenant?.planId ?? "free");
    const retentionDays = plan?.limits.retentionDays ?? 30;
    const maxWindowDays = this.maxWindowDays(retentionDays);
    const windowDays = Math.min(
      this.normaliseDays(requestedDays),
      maxWindowDays,
    );
    const now = new Date();
    const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const [
      activeStudents,
      newStudents,
      courses,
      publishedAssignments,
      publishedExams,
      enrollments,
      progress,
      assignmentGroups,
      examGroups,
      passedExams,
      recentAssignments,
      recentExams,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          tenantId,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId,
          role: UserRole.STUDENT,
          createdAt: { gte: since },
        },
      }),
      this.prisma.course.findMany({
        where: { tenantId, status: CourseStatus.PUBLISHED },
        select: {
          id: true,
          title: true,
          slug: true,
          sections: {
            select: {
              lessons: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.assignment.count({
        where: { tenantId, status: "PUBLISHED" },
      }),
      this.prisma.exam.count({
        where: { tenantId, status: "PUBLISHED" },
      }),
      this.prisma.enrollment.findMany({
        where: { tenantId, status: EnrollmentStatus.ACTIVE },
        select: { courseId: true, createdAt: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: { tenantId, completedAt: { not: null } },
        select: { lessonId: true },
      }),
      this.prisma.assignmentSubmission.groupBy({
        by: ["status"],
        where: { tenantId, submittedAt: { not: null } },
        _count: true,
        _avg: { score: true },
      }),
      this.prisma.examAttempt.groupBy({
        by: ["status"],
        where: {
          tenantId,
          status: {
            in: [
              AttemptStatus.SUBMITTED,
              AttemptStatus.GRADED,
              AttemptStatus.TIMED_OUT,
            ],
          },
        },
        _count: true,
        _avg: { score: true },
      }),
      this.prisma.examAttempt.count({
        where: { tenantId, passed: true },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: { tenantId, submittedAt: { not: null } },
        orderBy: { submittedAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          startedAt: true,
          assignment: { select: { title: true } },
          student: { select: { name: true } },
        },
      }),
      this.prisma.examAttempt.findMany({
        where: {
          tenantId,
          status: {
            in: [
              AttemptStatus.SUBMITTED,
              AttemptStatus.GRADED,
              AttemptStatus.TIMED_OUT,
            ],
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          score: true,
          submittedAt: true,
          startedAt: true,
          exam: { select: { title: true } },
          student: { select: { name: true } },
        },
      }),
    ]);

    const publishedCourseIds = new Set(courses.map((course) => course.id));
    const publishedEnrollments = enrollments.filter((enrollment) =>
      publishedCourseIds.has(enrollment.courseId),
    );

    const courseLessonIds = new Map<string, string[]>();
    const courseIdByLessonId = new Map<string, string>();
    for (const course of courses) {
      const lessonIds = course.sections.flatMap((section) =>
        section.lessons.map((lesson) => lesson.id),
      );
      courseLessonIds.set(course.id, lessonIds);
      for (const lessonId of lessonIds) {
        courseIdByLessonId.set(lessonId, course.id);
      }
    }

    const enrollmentCountByCourse = new Map<string, number>();
    for (const enrollment of publishedEnrollments) {
      enrollmentCountByCourse.set(
        enrollment.courseId,
        (enrollmentCountByCourse.get(enrollment.courseId) ?? 0) + 1,
      );
    }

    const completedByCourse = new Map<string, number>();
    let completedLessons = 0;
    for (const row of progress) {
      const courseId = courseIdByLessonId.get(row.lessonId);
      if (!courseId) continue;
      completedLessons += 1;
      completedByCourse.set(
        courseId,
        (completedByCourse.get(courseId) ?? 0) + 1,
      );
    }

    const courseRows = courses
      .map((course) => {
        const lessons = courseLessonIds.get(course.id)?.length ?? 0;
        const courseEnrollments = enrollmentCountByCourse.get(course.id) ?? 0;
        const courseCompleted = completedByCourse.get(course.id) ?? 0;
        const possible = courseEnrollments * lessons;

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          enrollments: courseEnrollments,
          lessons,
          completedLessons: courseCompleted,
          completionRate: possible
            ? this.percent(courseCompleted / possible)
            : 0,
        };
      })
      .sort(
        (a, b) =>
          b.enrollments - a.enrollments || a.title.localeCompare(b.title, "ar"),
      );

    const totalPossibleLessons = courseRows.reduce(
      (sum, course) => sum + course.enrollments * course.lessons,
      0,
    );

    const assignmentCounts = new Map(
      assignmentGroups.map((group) => [group.status, group._count]),
    );
    const assignmentSubmitted = assignmentGroups.reduce(
      (sum, group) => sum + group._count,
      0,
    );
    const assignmentGraded =
      (assignmentCounts.get(SubmissionStatus.GRADED) ?? 0) +
      (assignmentCounts.get(SubmissionStatus.RETURNED) ?? 0);
    const assignmentPending =
      (assignmentCounts.get(SubmissionStatus.SUBMITTED) ?? 0) +
      (assignmentCounts.get(SubmissionStatus.LATE) ?? 0);

    const examCounts = new Map(
      examGroups.map((group) => [group.status, group._count]),
    );
    const examAttempts = examGroups.reduce(
      (sum, group) => sum + group._count,
      0,
    );
    const examGraded = examCounts.get(AttemptStatus.GRADED) ?? 0;
    const examPending =
      (examCounts.get(AttemptStatus.SUBMITTED) ?? 0) +
      (examCounts.get(AttemptStatus.TIMED_OUT) ?? 0);

    const recentActivity = [
      ...recentAssignments.map((submission) => ({
        id: `assignment:${submission.id}`,
        kind: "assignment" as const,
        title: submission.assignment.title,
        studentName: submission.student.name,
        status: submission.status,
        score: submission.score,
        at: (
          submission.submittedAt ?? submission.startedAt
        ).toISOString(),
      })),
      ...recentExams.map((attempt) => ({
        id: `exam:${attempt.id}`,
        kind: "exam" as const,
        title: attempt.exam.title,
        studentName: attempt.student.name,
        status: attempt.status,
        score: attempt.score,
        at: (attempt.submittedAt ?? attempt.startedAt).toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);

    return {
      generatedAt: now.toISOString(),
      windowDays,
      maxWindowDays,
      totals: {
        activeStudents,
        newStudents,
        activeEnrollments: publishedEnrollments.length,
        publishedCourses: courses.length,
        publishedAssignments,
        publishedExams,
        completedLessons,
        lessonCompletionRate: totalPossibleLessons
          ? this.percent(completedLessons / totalPossibleLessons)
          : 0,
        pendingGrading: assignmentPending + examPending,
      },
      enrollmentTrend: this.buildEnrollmentTrend(
        publishedEnrollments,
        windowDays,
        now,
      ),
      courses: courseRows,
      assignments: {
        submitted: assignmentSubmitted,
        graded: assignmentGraded,
        pending: assignmentPending,
        averageScore: this.weightedScore(assignmentGroups),
      },
      exams: {
        attempts: examAttempts,
        graded: examGraded,
        passed: passedExams,
        pending: examPending,
        averageScore: this.weightedScore(examGroups),
        passRate: examGraded ? this.percent(passedExams / examGraded) : null,
      },
      recentActivity,
    };
  }

  private normaliseDays(value: number): number {
    if (!Number.isFinite(value)) return 30;
    return Math.min(90, Math.max(7, Math.trunc(value)));
  }

  private maxWindowDays(retentionDays: number): number {
    const retention =
      Number.isFinite(retentionDays) && retentionDays > 0
        ? retentionDays
        : 90;
    return Math.max(7, Math.min(90, Math.trunc(retention)));
  }

  private percent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, Math.round(value * 100)));
  }

  private weightedScore(groups: ScoreGroup[]): number | null {
    let weighted = 0;
    let total = 0;

    for (const group of groups) {
      const average = group._avg.score;
      if (average === null || !Number.isFinite(average) || group._count <= 0) {
        continue;
      }
      weighted += average * group._count;
      total += group._count;
    }

    return total ? Math.round(weighted / total) : null;
  }

  private buildEnrollmentTrend(
    enrollments: Array<{ createdAt: Date }>,
    windowDays: number,
    now: Date,
  ): Array<{ date: string; count: number }> {
    const buckets = new Map<string, number>();
    const cursor = new Date(now);
    cursor.setUTCHours(0, 0, 0, 0);

    for (let index = windowDays - 1; index >= 0; index -= 1) {
      const day = new Date(cursor);
      day.setUTCDate(day.getUTCDate() - index);
      buckets.set(day.toISOString().slice(0, 10), 0);
    }

    for (const enrollment of enrollments) {
      const key = enrollment.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
    }

    return Array.from(buckets, ([date, count]) => ({ date, count }));
  }
}
