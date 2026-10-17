import type { CourseProgression, ProgressionItem } from "@/app/lib/api";

/**
 * Derived metrics for the Courses Canvas.
 *
 * These functions exist so that every number rendered on screen traces back to
 * a server envelope. The enrollment payload carries no progress field at all,
 * so progress is computed from the progression (lock) endpoint rather than
 * fabricated.
 */

export interface CourseMetrics {
  /** Total nodes (lessons/exams/assignments) in the course. */
  total: number;
  /** Nodes the server reports as not-locked. */
  open: number;
  /** Nodes still locked behind a progression rule. */
  locked: number;
  /** Whole-percent progress, 0–100. Rounded, never estimated. */
  percent: number;
}

export function deriveCourseMetrics(
  progression: ProgressionItem[] | undefined | null,
): CourseMetrics {
  const nodes = progression ?? [];

  if (nodes.length === 0) {
    return { total: 0, open: 0, locked: 0, percent: 0 };
  }

  // `isLocked` is the server's own verdict, so "not locked" is exactly the set
  // of nodes a student may open — nothing about pass/fail or scores is assumed.
  const open = nodes.filter((n) => !n.isLocked).length;

  return {
    total: nodes.length,
    open,
    locked: nodes.length - open,
    percent: Math.round((open / nodes.length) * 100),
  };
}

/** A course's real title, straight from the enrollment envelope. */
export function courseTitleOf(enrollment: {
  course?: { title?: string } | null;
}): string {
  return enrollment.course?.title ?? "";
}

/**
 * Arabic copy for a lock constraint, keyed off the server's unlockType.
 *
 * Only ENTER_ASSIGNMENT and ENTER_EXAM are active in this phase
 * (see ARCHITECTURE.md). Both are mapped to the platform's own rule so the text
 * is never invented; an unknown type falls back to the server's own
 * description rather than a guess.
 */
const UNLOCK_COPY: Record<string, string> = {
  ENTER_EXAM: "يدخل هذا المسار تلقائياً فور دخول امتحان الوحدة السابقة",
  ENTER_ASSIGNMENT: "يدخل هذا المسار تلقائياً فور فتح واجب الوحدة السابقة",
};

export function lockExplanationOf(node: ProgressionItem): string {
  const type = node.unlockInfo?.unlockType;
  if (type && UNLOCK_COPY[type]) return UNLOCK_COPY[type];
  return node.unlockInfo?.description ?? "";
}

/** Nodes still locked, in course order. */
export function lockedNodesOf(
  progression: ProgressionItem[] | undefined | null,
): ProgressionItem[] {
  return (progression ?? []).filter((n) => n.isLocked);
}

/** Nodes the student may open, in course order. */
export function openNodesOf(
  progression: ProgressionItem[] | undefined | null,
): ProgressionItem[] {
  return (progression ?? []).filter((n) => !n.isLocked);
}

/** Human-facing label for a node type. */
export function nodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LESSON: "درس",
    EXAM: "امتحان",
    ASSIGNMENT: "واجب",
  };
  return labels[type] ?? type;
}

/** A single course joined with its server-computed metrics. */
export interface CourseEntry {
  courseId: string;
  title: string;
  slug: string;
  enrollmentStatus: string;
  metrics: CourseMetrics;
  lockedNodes: ProgressionItem[];
  openNodes: ProgressionItem[];
  raw: CourseProgression;
}

/**
 * Pick the "featured" node: the course with the highest open-node velocity.
 *
 * With a single enrolled course this is simply that course. Ties break on the
 * earliest course id so the choice is deterministic and never random.
 */
export function pickFeatured(entries: CourseEntry[]): CourseEntry | null {
  if (entries.length === 0) return null;

  return [...entries].sort((a, b) => {
    if (b.metrics.open !== a.metrics.open)
      return b.metrics.open - a.metrics.open;
    if (b.metrics.percent !== a.metrics.percent) {
      return b.metrics.percent - a.metrics.percent;
    }
    return a.courseId.localeCompare(b.courseId);
  })[0];
}
