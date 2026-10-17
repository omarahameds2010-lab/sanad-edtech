import { describe, expect, it } from "vitest";
import {
  agendaStateOf,
  bucketEventsByDay,
  buildActivityEvents,
  buildAgenda,
  computeBadges,
  computeCourseProgress,
  countOpenContent,
  enrolledCoursesLabel,
  findResumeTarget,
  firstNameOf,
  latestFeedback,
  overallPercent,
  statusLabel,
  streakDays,
  unlockReasonLabel,
  type ActivityEvent,
  type CourseFeed,
} from "./dashboard";
import type { ProgressionItem } from "./api";

function item(id: string, lockStatus: string): ProgressionItem {
  return {
    id,
    title: id,
    type: "VIDEO",
    lockStatus,
    isLocked: lockStatus === "LOCKED",
    isUnlocked: lockStatus === "UNLOCKED",
    isAvailable: lockStatus === "AVAILABLE",
  };
}

function pItem(
  over: Partial<ProgressionItem> & { id: string },
): ProgressionItem {
  return {
    title: over.id,
    type: "VIDEO",
    lockStatus: "UNLOCKED",
    isLocked: false,
    isUnlocked: true,
    isAvailable: false,
    ...over,
  };
}

function event(at: string): ActivityEvent {
  return { at, kind: "exam", label: "حدث" };
}

const AR = new Date(2026, 9, 17, 18, 0, 0); // 2026-10-17 18:00 local

describe("computeCourseProgress", () => {
  it("counts non-locked lessons", () => {
    expect(
      computeCourseProgress([
        item("a", "UNLOCKED"),
        item("b", "LOCKED"),
        item("c", "AVAILABLE"),
        item("d", "LOCKED"),
      ]),
    ).toEqual({ total: 4, open: 2, percent: 50 });
  });

  it("returns zero for empty courses", () => {
    expect(computeCourseProgress([])).toEqual({
      total: 0,
      open: 0,
      percent: 0,
    });
  });

  it("rounds to whole percent", () => {
    expect(
      computeCourseProgress([
        item("a", "UNLOCKED"),
        item("b", "LOCKED"),
        item("c", "LOCKED"),
      ]).percent,
    ).toBe(33);
  });
});

describe("firstNameOf", () => {
  it("takes the first token", () => {
    expect(firstNameOf("OMAR AHMED SAMIR MOHAM Mohamed")).toBe("OMAR");
    expect(firstNameOf("  سارة علي  ")).toBe("سارة");
  });

  it("falls back gracefully", () => {
    expect(firstNameOf("")).toBe("صديق سند");
    expect(firstNameOf(null)).toBe("صديق سند");
  });
});

describe("countOpenContent", () => {
  it("counts unlocked watchable lessons only", () => {
    expect(
      countOpenContent([
        pItem({ id: "v1", type: "VIDEO" }),
        pItem({ id: "e1", type: "EXAM" }),
        pItem({
          id: "v2",
          type: "VIDEO",
          lockStatus: "LOCKED",
          isLocked: true,
          isUnlocked: false,
        }),
        pItem({ id: "p1", type: "PDF" }),
      ]),
    ).toBe(2);
  });
});

describe("overallPercent", () => {
  it("averages and rounds", () => {
    expect(overallPercent([100, 100])).toBe(100);
    expect(overallPercent([50, 100])).toBe(75);
    expect(overallPercent([1, 2])).toBe(2);
    expect(overallPercent([])).toBe(0);
  });
});

describe("enrolledCoursesLabel", () => {
  it("uses correct Arabic plural forms", () => {
    expect(enrolledCoursesLabel(1)).toBe("كورس واحد");
    expect(enrolledCoursesLabel(2)).toBe("كورسين");
    expect(enrolledCoursesLabel(3)).toBe("3 كورسات");
    expect(enrolledCoursesLabel(10)).toBe("10 كورسات");
    expect(enrolledCoursesLabel(11)).toBe("11 كورس");
  });
});

describe("buildActivityEvents", () => {
  it("collects only real timestamps and sorts ascending", () => {
    const events = buildActivityEvents({
      courses: [
        {
          courseId: "c1",
          courseTitle: "كورس",
          items: [
            pItem({
              id: "l1",
              unlockInfo: {
                unlockType: "ENTER_EXAM",
                unlockTargetId: "e1",
                unlockedAt: "2026-10-17T13:29:06.000Z",
                description: "",
              },
            }),
            pItem({ id: "l2" }),
          ],
        },
      ],
      enrollments: [{ startsAt: "2026-10-17T13:21:00.000Z", label: "بدء" }],
      attempts: [
        { submittedAt: "2026-10-17T13:30:10.000Z", label: "اختبار" },
        { submittedAt: null, label: "جاري" },
      ],
      submissions: [{ submittedAt: "2026-10-17T14:25:13.000Z", label: "واجب" }],
    });
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.kind)).toEqual([
      "enroll",
      "unlock",
      "exam",
      "assignment",
    ]);
  });
});

describe("bucketEventsByDay", () => {
  it("buckets by local day and drops out-of-window events", () => {
    const inTwoDaysAgo = new Date(2026, 9, 15, 12, 0, 0).toISOString();
    const today = new Date(2026, 9, 17, 15, 30, 0).toISOString();
    const tooOld = new Date(2026, 9, 9, 12, 0, 0).toISOString();
    const buckets = bucketEventsByDay(
      [event(inTwoDaysAgo), event(today), event(tooOld)],
      AR,
      7,
    );
    expect(buckets).toHaveLength(7);
    expect(buckets.map((b) => b.events.length)).toEqual([0, 0, 0, 0, 1, 0, 1]);
  });
});

describe("streakDays", () => {
  const d = (day: number) => new Date(2026, 9, day, 10, 0, 0).toISOString();

  it("counts consecutive days ending today", () => {
    expect(streakDays([{ at: d(17) }, { at: d(16) }, { at: d(15) }], AR)).toBe(
      3,
    );
    expect(streakDays([{ at: d(17) }], AR)).toBe(1);
    expect(streakDays([], AR)).toBe(0);
    expect(streakDays([{ at: d(14) }], AR)).toBe(0);
  });

  it("still counts a chain that ended yesterday", () => {
    expect(streakDays([{ at: d(16) }, { at: d(15) }], AR)).toBe(2);
  });

  it("counts each day once regardless of activity volume", () => {
    expect(streakDays([{ at: d(17) }, { at: d(17) }, { at: d(16) }], AR)).toBe(
      2,
    );
  });
});

describe("computeBadges", () => {
  it("keeps everything locked with empty data", () => {
    const badges = computeBadges({
      attempts: [],
      submissions: [],
      grants: [],
      streak: 0,
    });
    expect(badges.map((b) => b.earned)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(badges.find((b) => b.id === "streak-3")?.progress).toEqual({
      have: 0,
      need: 3,
    });
  });

  it("earns badges strictly from real data", () => {
    const badges = computeBadges({
      attempts: [{ submittedAt: "2026-10-17T13:30:00.000Z", passed: true }],
      submissions: [{ submittedAt: "2026-10-17T14:25:00.000Z" }],
      grants: [{ at: "2026-10-17T13:29:00.000Z" }],
      streak: 3,
    });
    expect(badges.find((b) => b.id === "first-submission")).toMatchObject({
      earned: true,
      earnedAt: "2026-10-17T13:30:00.000Z",
    });
    expect(badges.find((b) => b.id === "path-key")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "exam-pass")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "streak-3")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "five-submissions")?.progress).toEqual({
      have: 2,
      need: 5,
    });
  });

  it("never marks a pass without a passed attempt", () => {
    const badges = computeBadges({
      attempts: [{ submittedAt: "2026-10-17T13:30:00.000Z", passed: null }],
      submissions: [],
      grants: [],
      streak: 0,
    });
    expect(badges.find((b) => b.id === "exam-pass")?.earned).toBe(false);
  });
});

describe("findResumeTarget", () => {
  it("picks the latest granted content lesson and skips non-content grants", () => {
    const courses: CourseFeed[] = [
      {
        courseId: "c1",
        courseTitle: "كورس ١",
        items: [
          pItem({
            id: "l1",
            unlockInfo: {
              unlockType: "ENTER_EXAM",
              unlockTargetId: "e1",
              unlockedAt: "2026-10-17T13:29:06.000Z",
              description: "",
            },
          }),
          pItem({
            id: "x1",
            type: "EXAM",
            unlockInfo: {
              unlockType: "ENTER_EXAM",
              unlockTargetId: "e1",
              unlockedAt: "2026-10-17T18:00:00.000Z",
              description: "",
            },
          }),
        ],
      },
      {
        courseId: "c2",
        courseTitle: "كورس ٢",
        items: [
          pItem({
            id: "l2",
            unlockInfo: {
              unlockType: "ENTER_ASSIGNMENT",
              unlockTargetId: "a1",
              unlockedAt: "2026-10-17T12:00:00.000Z",
              description: "",
            },
          }),
        ],
      },
    ];
    const target = findResumeTarget(courses);
    expect(target?.lessonId).toBe("l1");
    expect(target?.courseTitle).toBe("كورس ١");
  });

  it("returns null when nothing was granted", () => {
    expect(
      findResumeTarget([
        { courseId: "c1", courseTitle: "ك", items: [pItem({ id: "l1" })] },
      ]),
    ).toBeNull();
  });
});

describe("unlockReasonLabel", () => {
  it("labels known unlock types in Arabic", () => {
    expect(unlockReasonLabel("ENTER_EXAM")).toBe("بعد دخولك الاختبار السابق");
    expect(unlockReasonLabel("MANUAL")).toBe("فتحه لك مدرسك");
  });

  it("stays generic for unknown or missing types", () => {
    expect(unlockReasonLabel("UNKNOWN")).toBe("مفتوح لك في مسارك");
    expect(unlockReasonLabel(null)).toBe("مفتوح لك في مسارك");
  });
});

describe("statusLabel", () => {
  it("labels known statuses", () => {
    expect(statusLabel("SUBMITTED")).toBe("بانتظار التصحيح");
    expect(statusLabel("GRADED")).toBe("مُصحّح");
    expect(statusLabel("IN_PROGRESS")).toBe("جاري الآن");
  });

  it("passes unknown values through untouched", () => {
    expect(statusLabel("WEIRD")).toBe("WEIRD");
  });
});

describe("agendaStateOf", () => {
  it("maps server states", () => {
    expect(agendaStateOf("IN_PROGRESS")).toBe("active");
    expect(agendaStateOf("SUBMITTED")).toBe("pending");
    expect(agendaStateOf("GRADED")).toBe("done");
    expect(agendaStateOf(null)).toBe("todo");
    expect(agendaStateOf("EXPIRED")).toBe("todo");
  });
});

describe("buildAgenda", () => {
  it("orders active → pending → todo → done and keeps real labels", () => {
    const items = buildAgenda({
      exams: [
        { id: "e1", title: "اختبار", lessonId: "l1" },
        { id: "e2", title: "اختبار٢", lessonId: "l2" },
      ],
      assignments: [
        { id: "a1", title: "واجب", lessonId: "l3" },
        { id: "a2", title: "واجب٢", lessonId: "l4" },
      ],
      attemptsByExam: {
        e1: [{ status: "SUBMITTED", submittedAt: "2026-10-17T13:30:00.000Z" }],
        e2: [{ status: "IN_PROGRESS", submittedAt: null }],
      },
      submissionsByAssignment: {
        a1: [{ status: "GRADED", submittedAt: "2026-10-17T12:00:00.000Z" }],
      },
      courseTitleByLessonId: { l1: "كورس" },
    });
    expect(items.map((i) => i.state)).toEqual([
      "active",
      "pending",
      "todo",
      "done",
    ]);
    expect(items.find((i) => i.id === "e1")?.statusLabel).toBe(
      "بانتظار التصحيح",
    );
    expect(items.find((i) => i.id === "a2")?.statusLabel).toBe("لم يبدأ");
    expect(items.find((i) => i.id === "e1")?.courseTitle).toBe("كورس");
  });
});

describe("latestFeedback", () => {
  it("returns the most recent submission that has feedback", () => {
    const result = latestFeedback(
      [{ id: "a1", title: "واجب", lessonId: "l1" }],
      {
        a1: [
          {
            id: "s1",
            status: "SUBMITTED",
            score: null,
            feedback: null,
            submittedAt: "2026-10-17T14:00:00.000Z",
          },
          {
            id: "s2",
            status: "GRADED",
            score: 18,
            feedback: "أحسنت في الواجب الأخير، استمر!",
            submittedAt: "2026-10-17T14:30:00.000Z",
          },
        ],
      },
    );
    expect(result?.feedback).toBe("أحسنت في الواجب الأخير، استمر!");
    expect(result?.score).toBe(18);
    expect(result?.assignmentTitle).toBe("واجب");
  });

  it("ignores blank feedback", () => {
    expect(
      latestFeedback([{ id: "a1", title: "و", lessonId: "l1" }], {
        a1: [
          {
            id: "s1",
            status: "GRADED",
            score: 10,
            feedback: "   ",
            submittedAt: "2026-10-17T14:00:00.000Z",
          },
        ],
      }),
    ).toBeNull();
  });
});
