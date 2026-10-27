import { describe, expect, it } from "vitest";
import type {
  CourseStructure,
  StructureLesson,
  StudentAssignmentView,
  StudentExamView,
  StudentLesson,
} from "@/app/lib/api";
import {
  flattenCurriculum,
  formatDuration,
  mapWithConcurrency,
  nextTask,
  questionCountLabel,
  summarizeCurriculum,
  taskCountLabel,
  taskHref,
  taskMeta,
  taskNote,
  taskStatus,
  type CurriculumTask,
} from "./curriculum";

function lesson(over: Partial<StructureLesson> & { id: string }): StructureLesson {
  return {
    title: over.id,
    type: "VIDEO",
    orderIndex: 0,
    duration: null,
    lockStatus: "UNLOCKED",
    unlockType: "NONE",
    ...over,
  };
}

function task(
  over: Partial<StructureLesson> & { id: string },
  details?: CurriculumTask["details"],
): CurriculumTask {
  return {
    lesson: lesson(over),
    sectionId: "s1",
    sectionTitle: "الوحدة الأولى",
    sectionOrderIndex: 0,
    details,
  };
}

function examView(over: Partial<StudentExamView> = {}): StudentExamView {
  return {
    id: "e1",
    title: "اختبار",
    timerMinutes: 70,
    passingScore: 60,
    maxAttempts: 2,
    showResults: true,
    showCorrectAnswers: false,
    status: "PUBLISHED",
    lessonId: "l1",
    questions: [],
    questionCount: 0,
    studentAttemptCount: 0,
    canAttempt: true,
    activeAttempt: null,
    ...over,
  };
}

function assignmentView(
  over: Partial<StudentAssignmentView> = {},
): StudentAssignmentView {
  return {
    id: "a1",
    title: "واجب",
    timerMinutes: 300,
    passingScore: null,
    maxAttempts: 1,
    allowLateSubmission: true,
    status: "PUBLISHED",
    lessonId: "l1",
    studentAttemptCount: 0,
    canAttempt: true,
    activeSubmission: null,
    ...over,
  };
}

function studentLesson(
  over: Partial<StudentLesson> = {},
): StudentLesson {
  return {
    lesson: {
      id: "l1",
      title: "درس",
      type: "VIDEO",
      description: null,
      duration: 720,
      orderIndex: 0,
      status: "PUBLISHED",
    },
    access: { isLocked: false, unlockType: "NONE", lockStatus: "UNLOCKED" },
    assignment: null,
    exam: null,
    videos: [],
    ...over,
  };
}

describe("formatDuration", () => {
  it("formats short lessons in minutes", () => {
    expect(formatDuration(60)).toBe("دقيقة واحدة");
    expect(formatDuration(120)).toBe("دقيقتان");
    expect(formatDuration(180)).toBe("3 دقائق");
    expect(formatDuration(720)).toBe("12 دقيقة");
    expect(formatDuration(4200)).toBe("70 دقيقة");
    expect(formatDuration(5400)).toBe("ساعة و30 دقيقة");
  });

  it("formats long timers in hours", () => {
    expect(formatDuration(120 * 60)).toBe("ساعتان");
    expect(formatDuration(180 * 60)).toBe("3 ساعات");
    expect(formatDuration(300 * 60)).toBe("5 ساعات");
  });

  it("returns null for missing or invalid durations", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(-10)).toBeNull();
  });
});

describe("Arabic count labels", () => {
  it("uses the correct task plural", () => {
    expect(taskCountLabel(1)).toBe("مهمة واحدة");
    expect(taskCountLabel(2)).toBe("مهمتان");
    expect(taskCountLabel(4)).toBe("4 مهام");
    expect(taskCountLabel(12)).toBe("12 مهمة");
  });

  it("uses the correct question plural", () => {
    expect(questionCountLabel(1)).toBe("سؤال واحد");
    expect(questionCountLabel(2)).toBe("سؤالان");
    expect(questionCountLabel(3)).toBe("3 أسئلة");
    expect(questionCountLabel(15)).toBe("15 سؤالًا");
  });
});

describe("taskMeta", () => {
  it("combines type, timer and real question count", () => {
    const t = task(
      { id: "exam", type: "EXAM", duration: 4200 },
      {
        examView: examView({
          questions: [
            { id: "q1" },
            { id: "q2" },
            { id: "q3" },
          ] as StudentExamView["questions"],
        }),
      },
    );
    expect(taskMeta(t)).toBe("اختبار · 70 دقيقة · 3 أسئلة");
  });

  it("uses the video duration when the structure has one", () => {
    expect(taskMeta(task({ id: "video", type: "VIDEO", duration: 720 }))).toBe(
      "فيديو · 12 دقيقة",
    );
  });

  it("does not invent a question count when the exam view is absent", () => {
    expect(taskMeta(task({ id: "exam", type: "EXAM", duration: 4200 }))).toBe(
      "اختبار · 70 دقيقة",
    );
  });

  it("keeps a video row about the video even when an exam is linked", () => {
    const t = task(
      { id: "video", type: "VIDEO", duration: 720 },
      {
        studentLesson: studentLesson({
          exam: { id: "e1", title: "اختبار", timerMinutes: 70, status: "PUBLISHED" },
          videos: [
            {
              id: "v1",
              title: "فيديو",
              provider: "youtube",
              providerVideoId: "abc",
              status: "READY",
              duration: 180,
            },
          ],
        }),
        examView: examView({
          questions: [{ id: "q1" }] as StudentExamView["questions"],
        }),
      },
    );
    expect(taskMeta(t)).toBe("فيديو · 3 دقائق");
  });
});

describe("task status", () => {
  it("locks a locked structure node", () => {
    expect(
      taskStatus(
        task({
          id: "locked",
          type: "VIDEO",
          lockStatus: "LOCKED",
          unlockType: "ENTER_EXAM",
        }),
      ),
    ).toEqual({ label: "مقفل", tone: "locked", pulse: false });
  });

  it("describes an open video without enrichment", () => {
    expect(taskStatus(task({ id: "video", type: "VIDEO" }))).toEqual({
      label: "شاهد الآن",
      tone: "emerald",
      pulse: true,
    });
  });

  it("does not borrow a linked exam status for a video row", () => {
    expect(
      taskStatus(
        task(
          { id: "video", type: "VIDEO" },
          {
            studentLesson: studentLesson({
              exam: {
                id: "e1",
                title: "اختبار",
                timerMinutes: 70,
                status: "PUBLISHED",
              },
            }),
            examView: examView({
              studentAttemptCount: 1,
              canAttempt: false,
              maxAttempts: 1,
            }),
          },
        ),
      ),
    ).toEqual({ label: "شاهد الآن", tone: "emerald", pulse: true });
  });

  it("describes an untouched exam", () => {
    expect(
      taskStatus(
        task({ id: "exam", type: "EXAM" }, { examView: examView() }),
      ),
    ).toEqual({ label: "ابدأ الآن", tone: "emerald", pulse: true });
  });

  it("marks an in-progress exam as resume", () => {
    expect(
      taskStatus(
        task(
          { id: "exam", type: "EXAM" },
          {
            examView: examView({
              activeAttempt: {
                id: "at1",
                status: "IN_PROGRESS",
                startedAt: "2026-10-24T10:00:00.000Z",
              },
              studentAttemptCount: 1,
            }),
          },
        ),
      ),
    ).toEqual({ label: "أكمل الاختبار", tone: "emerald", pulse: true });
  });

  it("offers a retry when the server says another attempt is allowed", () => {
    expect(
      taskStatus(
        task(
          { id: "exam", type: "EXAM" },
          {
            examView: examView({
              studentAttemptCount: 1,
              canAttempt: true,
              maxAttempts: 2,
            }),
          },
        ),
      ),
    ).toEqual({ label: "إعادة المحاولة", tone: "emerald", pulse: true });
  });

  it("marks a finished exam as submitted", () => {
    expect(
      taskStatus(
        task(
          { id: "exam", type: "EXAM" },
          {
            examView: examView({
              studentAttemptCount: 1,
              canAttempt: false,
              maxAttempts: 1,
            }),
          },
        ),
      ),
    ).toEqual({ label: "تم التسليم", tone: "emerald", pulse: false });
  });

  it("describes an assignment pending teacher review", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              activeSubmission: {
                id: "sub1",
                status: "SUBMITTED",
                submittedAt: "2026-10-24T10:00:00.000Z",
                content: "إجابة مكتوبة",
              },
            }),
          },
        ),
      ),
    ).toEqual({ label: "قيد المراجعة", tone: "amber", pulse: false });
  });

  it("asks the student to finish an attempt they only opened", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              canAttempt: false,
              activeSubmission: {
                id: "sub1",
                status: "SUBMITTED",
                submittedAt: "2026-10-24T10:00:00.000Z",
                content: "",
                attachments: [],
              },
            }),
          },
        ),
      ),
    ).toEqual({ label: "أكمل الواجب", tone: "emerald", pulse: true });
  });

  it("marks an expired, unanswered attempt as time over", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              canAttempt: false,
              isExpired: true,
              activeSubmission: {
                id: "sub1",
                status: "SUBMITTED",
                submittedAt: "2026-10-24T10:00:00.000Z",
                content: "   ",
                attachments: [],
              },
            }),
          },
        ),
      ),
    ).toEqual({ label: "انتهى الوقت", tone: "muted", pulse: false });
  });

  it("does not call a rejected submission returned for correction", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              activeSubmission: {
                id: "sub1",
                status: "REJECTED",
                submittedAt: "2026-10-24T10:00:00.000Z",
                content: "إجابة متأخرة",
              },
            }),
          },
        ),
      ),
    ).toEqual({ label: "لم يُقبل", tone: "amber", pulse: false });
  });

  it("describes a graded assignment", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              activeSubmission: {
                id: "sub1",
                status: "GRADED",
                submittedAt: "2026-10-24T10:00:00.000Z",
              },
            }),
          },
        ),
      ),
    ).toEqual({ label: "تم التصحيح", tone: "emerald", pulse: false });
  });

  it("describes an unstarted assignment", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          { assignmentView: assignmentView() },
        ),
      ),
    ).toEqual({ label: "ابدأ الآن", tone: "emerald", pulse: true });
  });

  it("offers a retry for a past assignment attempt", () => {
    expect(
      taskStatus(
        task(
          { id: "assignment", type: "ASSIGNMENT" },
          {
            assignmentView: assignmentView({
              studentAttemptCount: 1,
              canAttempt: true,
              maxAttempts: 2,
              activeSubmission: null,
            }),
          },
        ),
      ),
    ).toEqual({ label: "إعادة المحاولة", tone: "emerald", pulse: true });
  });
});

describe("task links", () => {
  it("links direct to the exam once enrichment returns its id", () => {
    const t = task(
      { id: "lesson-exam", type: "EXAM" },
      {
        studentLesson: studentLesson({
          exam: { id: "e1", title: "اختبار", timerMinutes: 70, status: "PUBLISHED" },
        }),
      },
    );
    expect(taskHref(t, "c1")).toBe("/student/exams/e1");
  });

  it("links direct to the assignment once enrichment returns its id", () => {
    const t = task(
      { id: "lesson-assignment", type: "ASSIGNMENT" },
      {
        studentLesson: studentLesson({
          assignment: { id: "a1", title: "واجب" },
        }),
      },
    );
    expect(taskHref(t, "c1")).toBe("/student/assignments/a1");
  });

  it("falls back to the lesson hub and carries the course context", () => {
    expect(
      taskHref(task({ id: "lesson-video", type: "VIDEO" }), "course-1"),
    ).toBe("/student/lessons/lesson-video?course=course-1");
  });

  it("keeps a video link on the video even when an exam is linked", () => {
    const t = task(
      { id: "lesson-video", type: "VIDEO" },
      {
        studentLesson: studentLesson({
          exam: { id: "e1", title: "اختبار", timerMinutes: 70, status: "PUBLISHED" },
        }),
      },
    );
    expect(taskHref(t, "course-1")).toBe(
      "/student/lessons/lesson-video?course=course-1",
    );
  });

  it("returns no destination for a locked task", () => {
    expect(
      taskHref(
        task({ id: "locked", type: "VIDEO", lockStatus: "LOCKED" }),
        "c1",
      ),
    ).toBeNull();
  });
});

describe("taskNote", () => {
  it("explains a locked node with the server unlock rule", () => {
    expect(
      taskNote(
        task({
          id: "locked",
          type: "VIDEO",
          lockStatus: "LOCKED",
          unlockType: "ENTER_EXAM",
        }),
      ),
    ).toBe("يُفتح بعد دخول الاختبار السابق");
  });

  it("stays silent for an open node", () => {
    expect(taskNote(task({ id: "open" }))).toBeNull();
  });
});

describe("curriculum structure", () => {
  const structure = {
    course: {
      id: "c1",
      title: "كورس",
      slug: "course",
      shortDescription: null,
      description: null,
      thumbnailUrl: null,
      visibility: "PUBLIC",
      level: null,
      language: "ar",
      price: 0,
      currency: "EGP",
      status: "PUBLISHED",
      teacher: { name: "معلم" },
    },
    sections: [
      {
        id: "s1",
        title: "الوحدة الأولى",
        orderIndex: 0,
        lessons: [
          lesson({ id: "l1", orderIndex: 0 }),
          lesson({ id: "l2", orderIndex: 1, type: "EXAM" }),
          lesson({
            id: "l3",
            orderIndex: 2,
            type: "VIDEO",
            lockStatus: "LOCKED",
          }),
        ],
      },
      {
        id: "s2",
        title: "الوحدة الثانية",
        orderIndex: 1,
        lessons: [lesson({ id: "l4", orderIndex: 0, type: "ASSIGNMENT" })],
      },
    ],
  } satisfies CourseStructure;

  it("flattens sections in server order and keeps section context", () => {
    const tasks = flattenCurriculum(structure);
    expect(tasks.map((t) => t.lesson.id)).toEqual(["l1", "l2", "l3", "l4"]);
    expect(tasks[3].sectionTitle).toBe("الوحدة الثانية");
  });

  it("summarises only the server's lock verdict", () => {
    expect(summarizeCurriculum(flattenCurriculum(structure))).toEqual({
      total: 4,
      open: 3,
      locked: 1,
      percent: 75,
      units: 2,
    });
  });

  it("does not count an expired task as available", () => {
    const tasks = [
      ...flattenCurriculum(structure),
      task({ id: "l5", lockStatus: "EXPIRED" }),
    ];
    expect(summarizeCurriculum(tasks)).toEqual({
      total: 5,
      open: 3,
      locked: 1,
      percent: 60,
      units: 2,
    });
  });

  it("returns the next task in the reading order", () => {
    const tasks = flattenCurriculum(structure);
    expect(nextTask(tasks, "l2")?.lesson.id).toBe("l3");
    expect(nextTask(tasks, "l4")).toBeNull();
    expect(nextTask(tasks, "missing")).toBeNull();
  });
});

describe("mapWithConcurrency", () => {
  it("preserves order and respects the concurrency ceiling", async () => {
    let active = 0;
    let maxActive = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return n * 2;
    });

    expect(results).toEqual([2, 4, 6, 8, 10, 12]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("handles an empty list", async () => {
    await expect(mapWithConcurrency([], 3, async (n: number) => n)).resolves.toEqual(
      [],
    );
  });
});
