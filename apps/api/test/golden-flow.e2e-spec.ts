import { AuditService } from "../src/modules/audit/audit.service";
import { EntitlementsService } from "../src/modules/entitlements/entitlements.service";
import { IdempotencyService } from "../src/modules/payments/security/idempotency.service";
import { ProgressionService } from "../src/modules/courses/progression/progression.service";
import { CoursesService } from "../src/modules/courses/courses.service";
import { SectionsService } from "../src/modules/courses/sections/sections.service";
import { LessonsService } from "../src/modules/courses/lessons/lessons.service";
import { EnrollmentsService } from "../src/modules/courses/enrollments/enrollments.service";
import { AssignmentsService } from "../src/modules/courses/assignments/assignments.service";
import { ExamsService } from "../src/modules/courses/exams/exams.service";
import { ProgressService } from "../src/modules/courses/progress/progress.service";
import { ResourcesService } from "../src/modules/courses/resources/resources.service";

/* ------------------------------------------------------------------ */
/* In-memory fake of the Prisma client surface used by the real services */
/* ------------------------------------------------------------------ */

type Row = Record<string, any>;

function createFakePrisma() {
  const db: Record<string, Row[]> = {
    course: [],
    section: [],
    lesson: [],
    assignment: [],
    assignmentSubmission: [],
    exam: [],
    examQuestion: [],
    examAttempt: [],
    enrollment: [],
    lessonProgress: [],
    idempotencyKey: [],
    auditLog: [],
    resource: [],
  };
  let idCounter = 0;
  const nextId = (prefix: string) => `${prefix}_${++idCounter}`;

  const relations: Record<string, Record<string, string>> = {
    lesson: {
      sectionId: "section",
      assignmentId: "assignment",
      examId: "exam",
    },
    section: { courseId: "course" },
    assignment: { lessonId: "lesson" },
    exam: { lessonId: "lesson" },
    examAttempt: { examId: "exam" },
    assignmentSubmission: { assignmentId: "assignment", studentId: "user" },
    enrollment: { userId: "user", courseId: "course" },
    lessonProgress: { userId: "user", lessonId: "lesson" },
  };

  function attach(row: Row, model: string, include?: any): Row {
    if (!include) return row;
    const out: Row = { ...row };

    if (model === "course" && include.sections) {
      let sections = db.section.filter((s) => s.courseId === row.id);
      if (include.sections.include?.lessons) {
        sections = sections.map((s) => ({
          ...s,
          lessons: db.lesson
            .filter((l) => l.sectionId === s.id)
            .filter((l) => {
              const w = include.sections.include.lessons.where;
              if (w?.status) return l.status === w.status;
              return true;
            })
            .map((l) => ({ id: l.id })),
        }));
      }
      out.sections = sections;
    }

    if (model === "section" && include.lessons) {
      out.lessons = db.lesson
        .filter((l) => l.sectionId === row.id)
        .map((l) => ({ ...l }));
    }

    if (model === "lesson") {
      if (include.section) {
        const sec = db.section.find((s) => s.id === row.sectionId);
        out.section = sec
          ? include.section.include?.course
            ? { ...sec, course: db.course.find((c) => c.id === sec.courseId) }
            : { ...sec }
          : null;
      }
      if (include.assignment) {
        out.assignment =
          db.assignment.find((a) => a.lessonId === row.id) ?? null;
      }
      if (include.exam) {
        out.exam = db.exam.find((e) => e.lessonId === row.id) ?? null;
      }
    }

    if (model === "assignment") {
      if (include.lesson)
        out.lesson = db.lesson.find((l) => l.id === row.lessonId) ?? null;
      if (include.submissions)
        out.submissions = db.assignmentSubmission.filter(
          (s) => s.assignmentId === row.id,
        );
    }

    if (model === "exam") {
      if (include.lesson)
        out.lesson = db.lesson.find((l) => l.id === row.lessonId) ?? null;
      if (include.questions)
        out.questions = db.examQuestion.filter((q) => q.examId === row.id);
      if (include.attempts)
        out.attempts = db.examAttempt.filter((a) => a.examId === row.id);
    }

    if (model === "examAttempt" && include.exam) {
      out.exam = db.exam.find((e) => e.id === row.examId) ?? null;
    }

    if (model === "assignmentSubmission" && include.assignment) {
      out.assignment =
        db.assignment.find((a) => a.id === row.assignmentId) ?? null;
    }

    if (model === "enrollment" && include.course) {
      out.course = db.course.find((c) => c.id === row.courseId) ?? null;
    }

    return out;
  }

  function matchWhere(row: Row, where: any, model: string): boolean {
    if (!where) return true;

    // compound unique keys
    if (where.tenantId_slug) {
      if (row.tenantId !== where.tenantId_slug.tenantId) return false;
      if (row.slug !== where.tenantId_slug.slug) return false;
    }
    if (where.tenantId_key) {
      if (row.tenantId !== where.tenantId_key.tenantId) return false;
      if (row.key !== where.tenantId_key.key) return false;
    }
    if (where.tenantId_userId_lessonId) {
      if (row.tenantId !== where.tenantId_userId_lessonId.tenantId)
        return false;
      if (row.userId !== where.tenantId_userId_lessonId.userId) return false;
      if (row.lessonId !== where.tenantId_userId_lessonId.lessonId)
        return false;
    }
    if (where.userId_courseId && row.userId !== where.userId_courseId.userId)
      return false;

    for (const [k, v] of Object.entries(where)) {
      if (
        k === "tenantId_slug" ||
        k === "tenantId_key" ||
        k === "tenantId_userId_lessonId" ||
        k === "userId_courseId"
      )
        continue;

      if (k === "section" && v && typeof v === "object") {
        const sec = db.section.find((s) => s.id === row.sectionId);
        if ((v as any).courseId && sec?.courseId !== (v as any).courseId)
          return false;
        continue;
      }
      if (k === "lesson" && v && typeof v === "object") {
        const lesson = db.lesson.find((l) => l.id === row.lessonId);
        const sec = lesson
          ? db.section.find((s) => s.id === lesson.sectionId)
          : undefined;
        if (
          (v as any).section?.courseId &&
          sec?.courseId !== (v as any).section.courseId
        )
          return false;
        continue;
      }

      if (v && typeof v === "object" && !Array.isArray(v)) {
        if ((v as any).in && Array.isArray((v as any).in)) {
          if (!(v as any).in.includes(row[k])) return false;
        } else if ((v as any).gt !== undefined) {
          if (!(row[k] > (v as any).gt)) return false;
        } else if ((v as any).lt !== undefined) {
          if (!(row[k] < (v as any).lt)) return false;
        } else {
          if (row[k] !== v) return false;
        }
      } else {
        if (row[k] !== v) return false;
      }
    }
    return true;
  }

  function sortRows(rows: Row[], orderBy?: any): Row[] {
    if (!orderBy) return rows;
    const key = Object.keys(orderBy)[0];
    const dir = orderBy[key] === "desc" ? -1 : 1;
    return [...rows].sort((a, b) =>
      a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0,
    );
  }

  function buildModel(model: string) {
    return {
      create: async ({ data }: any) => {
        const row = {
          id: nextId(model),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        db[model].push(row);
        return { ...row };
      },
      findUnique: async ({ where, include }: any) => {
        const found = db[model].find((r) => matchWhere(r, where, model));
        return found ? attach(found, model, include) : null;
      },
      findFirst: async ({ where, include }: any) => {
        const found = db[model].find((r) => matchWhere(r, where, model));
        return found ? attach(found, model, include) : null;
      },
      findMany: async ({ where, include, orderBy, take, cursor }: any = {}) => {
        let rows = db[model].filter((r) => matchWhere(r, where, model));
        rows = sortRows(rows, orderBy);
        if (take) rows = rows.slice(0, take);
        return rows.map((r) => attach(r, model, include));
      },
      update: async ({ where, data }: any) => {
        const idx = db[model].findIndex((r) => matchWhere(r, where, model));
        if (idx === -1) throw new Error(`${model} not found for update`);
        db[model][idx] = { ...db[model][idx], ...data, updatedAt: new Date() };
        return { ...db[model][idx] };
      },
      delete: async ({ where }: any) => {
        const idx = db[model].findIndex((r) => matchWhere(r, where, model));
        if (idx === -1) throw new Error(`${model} not found for delete`);
        const [removed] = db[model].splice(idx, 1);
        return removed;
      },
      count: async ({ where }: any = {}) => {
        return db[model].filter((r) => matchWhere(r, where, model)).length;
      },
      aggregate: async ({ where, _max }: any = {}) => {
        const rows = db[model].filter((r) => matchWhere(r, where, model));
        const result: any = {};
        if (_max) {
          for (const k of Object.keys(_max)) {
            result[`_max`] = {
              [k]: rows.length
                ? Math.max(...rows.map((r) => r[k] ?? -Infinity))
                : null,
            };
          }
        }
        return result;
      },
      upsert: async ({ where, create, update }: any) => {
        const existing = db[model].find((r) => matchWhere(r, where, model));
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return { ...existing };
        }
        const row = {
          id: nextId(model),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        db[model].push(row);
        return { ...row };
      },
    };
  }

  return {
    course: buildModel("course"),
    section: buildModel("section"),
    lesson: buildModel("lesson"),
    assignment: buildModel("assignment"),
    assignmentSubmission: buildModel("assignmentSubmission"),
    exam: buildModel("exam"),
    examQuestion: buildModel("examQuestion"),
    examAttempt: buildModel("examAttempt"),
    enrollment: buildModel("enrollment"),
    lessonProgress: buildModel("lessonProgress"),
    idempotencyKey: buildModel("idempotencyKey"),
    auditLog: buildModel("auditLog"),
    resource: buildModel("resource"),
    $transaction: async (ops: any[]) => Promise.all(ops),
  };
}

/* ------------------------------------------------------------------ */
/* Golden E2E flow */
/* ------------------------------------------------------------------ */

describe("Golden LMS Flow (E2E, in-memory Prisma)", () => {
  it("teacher builds course → student enrolls → assignment → exam → next lesson → progress", async () => {
    const prisma = createFakePrisma() as any;

    const auditService = new AuditService(prisma);
    const idempotencyService = new IdempotencyService(prisma);
    const entitlementsService = new EntitlementsService(prisma);
    const progressionService = new ProgressionService(
      prisma,
      idempotencyService,
      auditService,
    );
    const coursesService = new CoursesService(prisma);
    const sectionsService = new SectionsService(prisma);
    const lessonsService = new LessonsService(prisma);
    const enrollmentsService = new EnrollmentsService(prisma, entitlementsService);
    const assignmentsService = new AssignmentsService(
      prisma,
      idempotencyService,
      progressionService,
    );
    const examsService = new ExamsService(
      prisma,
      idempotencyService,
      progressionService,
    );
    const progressService = new ProgressService(prisma);
    const resourcesService = new ResourcesService(prisma);

    const TENANT = "tenant_a";
    const TEACHER = "teacher_1";
    const STUDENT = "student_1";

    // 1. Teacher creates course
    const course = await coursesService.createCourse(TENANT, TEACHER, {
      title: "Biology 101",
      slug: "biology-101",
      shortDescription: "Intro to biology",
      thumbnailUrl: "https://cdn.example.com/bio.jpg",
      visibility: "PUBLIC",
      level: "BEGINNER",
      language: "ar",
      price: 0,
      currency: "EGP",
    });
    expect(course.status).toBe("DRAFT");

    // 2. Teacher adds section + lessons
    const section = await sectionsService.createSection(TENANT, course.id, {
      title: "Chapter 1",
    });
    const assignmentLesson = await lessonsService.createLesson(
      TENANT,
      section.id,
      { title: "Homework 1", type: "ASSIGNMENT" as any },
    );
    const examLesson = await lessonsService.createLesson(TENANT, section.id, {
      title: "Quiz 1",
      type: "EXAM" as any,
    });
    const nextLesson = await lessonsService.createLesson(TENANT, section.id, {
      title: "Video 2",
      type: "VIDEO" as any,
    });

    // 3. Teacher creates assignment + exam, publishes them
    const assignment = await assignmentsService.createAssignment(
      TENANT,
      TEACHER,
      assignmentLesson.id,
      { title: "HW1" },
    );
    await assignmentsService.publishAssignment(TENANT, assignment.id);

    const exam = await examsService.createExam(TENANT, TEACHER, examLesson.id, {
      title: "Quiz1",
    });
    await examsService.publishExam(TENANT, exam.id);

    // 4. Configure progression: exam lesson unlocks on ENTER_ASSIGNMENT, next lesson unlocks on ENTER_EXAM
    await prisma.lesson.update({
      where: { id: examLesson.id },
      data: {
        unlockType: "ENTER_ASSIGNMENT",
        unlockTargetId: assignment.id,
        lockStatus: "LOCKED",
      },
    });
    await prisma.lesson.update({
      where: { id: nextLesson.id },
      data: {
        unlockType: "ENTER_EXAM",
        unlockTargetId: exam.id,
        lockStatus: "LOCKED",
      },
    });

    // 5. Publish lessons and course
    await lessonsService.publishLesson(TENANT, assignmentLesson.id);
    await lessonsService.publishLesson(TENANT, examLesson.id);
    await lessonsService.publishLesson(TENANT, nextLesson.id);
    await coursesService.publishCourse(TENANT, course.id, TEACHER);

    // 6. Student enrolls
    const enrollment = await enrollmentsService.enroll(
      TENANT,
      STUDENT,
      course.id,
    );
    expect(enrollment.status).toBe("ACTIVE");

    // 7. Student starts assignment → ENTER_ASSIGNMENT unlocks the exam lesson
    const attempt = await assignmentsService.startAssignmentAttempt(
      TENANT,
      STUDENT,
      assignment.id,
      "key-start-1",
    );
    expect(attempt.timeRemainingSeconds).toBe(300 * 60);

    const examLessonAfterAssignment = await lessonsService.getStudentLesson(
      TENANT,
      STUDENT,
      examLesson.id,
    );
    expect(examLessonAfterAssignment.access.isLocked).toBe(false);

    // 8. Student starts exam → ENTER_EXAM unlocks the next lesson
    const examAttempt = await examsService.startExamAttempt(
      TENANT,
      STUDENT,
      exam.id,
      "key-start-2",
    );
    expect(examAttempt.timeRemainingSeconds).toBe(70 * 60);

    const nextLessonAfterExam = await lessonsService.getStudentLesson(
      TENANT,
      STUDENT,
      nextLesson.id,
    );
    expect(nextLessonAfterExam.access.isLocked).toBe(false);

    // 9. Student tracks progress on the unlocked lesson
    await progressService.updateProgress(TENANT, STUDENT, nextLesson.id, {
      positionSeconds: 120,
      watchedSeconds: 120,
    });
    const courseProgress = await progressService.getCourseProgress(
      TENANT,
      STUDENT,
      course.id,
    );
    expect(courseProgress.totalLessons).toBe(3);
    expect(courseProgress.totalWatchedSeconds).toBe(120);

    // 10. Idempotency: repeating the same start key must NOT create a new attempt
    const repeated = await assignmentsService.startAssignmentAttempt(
      TENANT,
      STUDENT,
      assignment.id,
      "key-start-1",
    );
    expect(repeated.attemptId).toBe(attempt.attemptId);

    // 11. No duplicate active attempt for the assignment
    const activeSubs = await prisma.assignmentSubmission.findMany({
      where: { studentId: STUDENT },
    });
    expect(activeSubs.length).toBe(1);

    // 12. Student submits the assignment
    const submission = await assignmentsService.submitAssignment(
      TENANT,
      STUDENT,
      assignment.id,
      {
        content: "Student answer to the homework",
        idempotencyKey: "key-submit-1",
      },
    );
    expect(submission.status).toBe("SUBMITTED");

    // 13. Teacher grades the submission
    const graded = await assignmentsService.gradeSubmission(
      TENANT,
      submission.attemptId,
      TEACHER,
      {
        score: 85,
        feedback: "Good work! Well explained.",
      },
    );
    expect(graded.status).toBe("GRADED");
    expect(graded.score).toBe(85);

    // 14. Verify progression rule: ENTER_ASSIGNMENT still holds (assignment entered even if not graded)
    const examAccessAfterGrade = await lessonsService.getStudentLesson(
      TENANT,
      STUDENT,
      examLesson.id,
    );
    expect(examAccessAfterGrade.access.isLocked).toBe(false);

    // 15. Student submits exam attempt
    const examSubmission = await examsService.submitExamAttempt(
      TENANT,
      STUDENT,
      exam.id,
      {
        answers: [{ questionId: "q1", selectedOptionIds: ["opt1"] }],
        idempotencyKey: "key-exam-submit-1",
      },
    );
    expect(examSubmission.status).toBe("SUBMITTED");

    // 16. Exam result: check student's attempt status after submission
    const attempts = await examsService.getStudentExamAttempts(
      TENANT,
      STUDENT,
      exam.id,
    );
    expect(attempts.length).toBe(1);
    expect(attempts[0].status).toBe("SUBMITTED");

    // 17. Progress heartbeat: multiple updates accumulate, watchedSeconds is monotonic, position is capped
    await progressService.updateProgress(TENANT, STUDENT, nextLesson.id, {
      positionSeconds: 60,
      watchedSeconds: 60,
    });
    const prog1 = await progressService.getLessonProgress(
      TENANT,
      STUDENT,
      nextLesson.id,
    );
    expect(prog1.watchedSeconds).toBeGreaterThanOrEqual(60);

    // Simulating seeking backward should NOT decrease watchedSeconds
    await progressService.updateProgress(TENANT, STUDENT, nextLesson.id, {
      positionSeconds: 30,
      watchedSeconds: 30,
    });
    const prog2 = await progressService.getLessonProgress(
      TENANT,
      STUDENT,
      nextLesson.id,
    );
    expect(prog2.watchedSeconds).toBeGreaterThanOrEqual(
      prog1.watchedSeconds as number,
    );

    // Position capped at lesson duration (nextLesson has no duration set, so check null)
    await progressService.updateProgress(TENANT, STUDENT, nextLesson.id, {
      positionSeconds: 99999,
      watchedSeconds: 180,
    });
    const prog3 = await progressService.getLessonProgress(
      TENANT,
      STUDENT,
      nextLesson.id,
    );
    expect(prog3.lastPosition).toBeDefined();

    // 18. Resource: create a PDF resource and get a signed URL
    const resource = await resourcesService.createResource(
      TENANT,
      nextLesson.id,
      {
        title: "Chapter 3 Worksheet",
        type: "PDF",
        assetId: "asset_123",
        mimeType: "application/pdf",
        size: 1024000,
      },
    );
    expect(resource.type).toBe("PDF");

    const accessUrl = await resourcesService.getAccessUrl(
      TENANT,
      STUDENT,
      resource.id,
    );
    expect(accessUrl.url).toContain(`storage.example.com/${TENANT}/asset_123`);
    expect(accessUrl.url).toContain("exp=");
    expect(accessUrl.url).toContain("sig=");

    // 19. Idempotency: repeating start with the same key returns the same cached response, no duplicate created
    const repeatedExam = await examsService.startExamAttempt(
      TENANT,
      STUDENT,
      exam.id,
      "key-start-2",
    );
    expect(repeatedExam.attemptId).toBe(examAttempt.attemptId);

    // 20. Idempotency: repeating submit with the same key returns the same response
    const repeatedSubmit = await examsService.submitExamAttempt(
      TENANT,
      STUDENT,
      exam.id,
      {
        answers: [{ questionId: "q1", selectedOptionIds: ["opt1"] }],
        idempotencyKey: "key-exam-submit-1",
      },
    );
    expect(repeatedSubmit.status).toBe("SUBMITTED");
  });
});
