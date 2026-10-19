import { describe, expect, it } from "vitest";
import type { ProgressionItem } from "@/app/lib/api";
import {
  deriveCourseMetrics,
  lockExplanationOf,
  lockedNodesOf,
  nodeTypeLabel,
  openNodesOf,
  pickFeatured,
  type CourseEntry,
} from "./metrics";

function node(
  id: string,
  overrides: Partial<ProgressionItem> = {},
): ProgressionItem {
  return {
    id,
    title: `node-${id}`,
    type: "LESSON",
    orderIndex: 0,
    lockStatus: "UNLOCKED",
    isLocked: false,
    isUnlocked: true,
    isAvailable: false,
    unlockInfo: null,
    ...overrides,
  };
}

/** Mirrors the real seed: 3 open, 1 locked behind ENTER_EXAM. */
const SEED: ProgressionItem[] = [
  node("a", { orderIndex: 0 }),
  node("b", { orderIndex: 1, type: "EXAM", title: "اختبار" }),
  node("c", {
    orderIndex: 2,
    lockStatus: "LOCKED",
    isLocked: true,
    isUnlocked: false,
    unlockInfo: {
      unlockType: "ENTER_EXAM",
      unlockTargetId: "exam-1",
      description: "Unlocks when you enter the exam",
    },
  }),
  node("d", { orderIndex: 3, type: "ASSIGNMENT", title: "واجب" }),
];

function entry(courseId: string, progression: ProgressionItem[]): CourseEntry {
  return {
    courseId,
    title: `course-${courseId}`,
    slug: courseId,
    enrollmentStatus: "ACTIVE",
    metrics: deriveCourseMetrics(progression),
    lockedNodes: lockedNodesOf(progression),
    openNodes: openNodesOf(progression),
    raw: { courseId, userId: "", progression },
  };
}

describe("deriveCourseMetrics", () => {
  it("reports 75% for the real seed (3 open of 4 total)", () => {
    expect(deriveCourseMetrics(SEED)).toEqual({
      total: 4,
      open: 3,
      locked: 1,
      percent: 75,
    });
  });

  it("never reports a percentage when there is no progression data", () => {
    // A course whose progression could not be read must not fabricate a number.
    expect(deriveCourseMetrics(null)).toEqual({
      total: 0,
      open: 0,
      locked: 0,
      percent: 0,
    });
    expect(deriveCourseMetrics([])).toEqual({
      total: 0,
      open: 0,
      locked: 0,
      percent: 0,
    });
  });

  it("rounds rather than truncating", () => {
    const oneOfThree = [node("x"), node("y"), node("z", { isLocked: true })];
    expect(deriveCourseMetrics(oneOfThree).percent).toBe(67);
  });

  it("counts AVAILABLE nodes as open without a pass requirement", () => {
    const available = node("x", {
      lockStatus: "AVAILABLE",
      isLocked: false,
      isUnlocked: false,
      isAvailable: true,
    });
    expect(deriveCourseMetrics([available, node("y", { isLocked: true })]).percent).toBe(50);
  });
});

describe("lockExplanationOf", () => {
  it("uses the platform's Arabic rule for ENTER_EXAM", () => {
    const locked = SEED.find((n) => n.isLocked)!;
    expect(lockExplanationOf(locked)).toContain("يدخل هذا المسار تلقائياً");
  });

  it("uses the platform's Arabic rule for ENTER_ASSIGNMENT", () => {
    const locked = node("x", {
      isLocked: true,
      unlockInfo: {
        unlockType: "ENTER_ASSIGNMENT",
        unlockTargetId: "a-1",
        description: "Unlocks when you enter the assignment",
      },
    });
    expect(lockExplanationOf(locked)).toContain("واجب الوحدة السابقة");
  });

  it("falls back to the server description for an unknown type", () => {
    const locked = node("x", {
      isLocked: true,
      unlockInfo: {
        unlockType: "SOMETHING_NEW",
        unlockTargetId: "t",
        description: "Unlocks when the teacher says so",
      },
    });
    expect(lockExplanationOf(locked)).toBe("Unlocks when the teacher says so");
  });

  it("returns an empty string for a locked node with no info", () => {
    expect(lockExplanationOf(node("x", { isLocked: true }))).toBe("");
  });
});

describe("pickFeatured", () => {
  it("returns null with no courses", () => {
    expect(pickFeatured([])).toBeNull();
  });

  it("picks the highest-velocity course", () => {
    const slower = entry("a", [node("1"), node("2", { isLocked: true })]);
    const faster = entry("b", SEED);

    expect(pickFeatured([slower, faster])!.courseId).toBe("b");
  });

  it("breaks ties deterministically on course id", () => {
    const a = entry("aaa", SEED);
    const b = entry("bbb", SEED);
    expect(pickFeatured([b, a])!.courseId).toBe("aaa");
    expect(pickFeatured([a, b])!.courseId).toBe("aaa");
  });
});

describe("nodeTypeLabel", () => {
  it("translates the known node types into Arabic", () => {
    expect(nodeTypeLabel("LESSON")).toBe("درس");
    expect(nodeTypeLabel("EXAM")).toBe("امتحان");
    expect(nodeTypeLabel("ASSIGNMENT")).toBe("واجب");
  });

  it("passes an unknown type straight through rather than hiding it", () => {
    expect(nodeTypeLabel("QUIZ")).toBe("QUIZ");
  });
});
