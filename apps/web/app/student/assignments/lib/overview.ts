import {
  ApiError,
  type AssignmentSubmissionSummary,
  type StudentAssignmentView,
} from "../../../lib/api";

export type AssignmentState =
  | "available"
  | "active"
  | "submitted"
  | "expired"
  | "locked"
  | "unavailable"
  | "unknown";

export type AssignmentTone = "green" | "neutral" | "red" | "muted";

export const ASSIGNMENT_ITEM_STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "متاح",
  DRAFT: "مسودة",
  CLOSED: "مغلق",
  ARCHIVED: "مؤرشف",
};

export const ASSIGNMENT_STATE_COPY: Record<
  AssignmentState,
  { label: string; tone: AssignmentTone }
> = {
  available: { label: "متاح", tone: "green" },
  active: { label: "قيد الحل", tone: "green" },
  submitted: { label: "تم التسليم", tone: "neutral" },
  expired: { label: "فات موعده", tone: "red" },
  locked: { label: "مقفل", tone: "muted" },
  unavailable: { label: "غير متاح", tone: "muted" },
  unknown: { label: "حالة غير مقروءة", tone: "muted" },
};

export function isLessonLockedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "LESSON_LOCKED";
}

/**
 * Completion is a persisted fact, not the current card state. A student who
 * finished attempt 1 and started attempt 2 is still "completed" in the stats;
 * the active retake must not make the completion percentage drop.
 */
export function hasCompletedAttempt(
  submissions: AssignmentSubmissionSummary[],
): boolean {
  return submissions.some((submission) => submission.submittedAt !== null);
}

function attemptNumber(submission: AssignmentSubmissionSummary): number {
  return typeof submission.attemptNumber === "number"
    ? submission.attemptNumber
    : 0;
}

function dateValue(value: string | null | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function latestSubmittedSubmission(
  submissions: AssignmentSubmissionSummary[],
): AssignmentSubmissionSummary | null {
  const submitted = submissions.filter(
    (submission) => submission.submittedAt !== null,
  );
  if (submitted.length === 0) return null;

  return [...submitted].sort((a, b) => {
    const byAttempt = attemptNumber(b) - attemptNumber(a);
    if (byAttempt !== 0) return byAttempt;
    return dateValue(b.submittedAt) - dateValue(a.submittedAt);
  })[0];
}

/**
 * The latest graded row is not necessarily the latest submitted row. A student
 * can have an older graded attempt followed by an ungraded retake, so scanning
 * only `submissions[0]` hides a real result.
 */
export function latestGradedSubmission(
  submissions: AssignmentSubmissionSummary[],
): AssignmentSubmissionSummary | null {
  const graded = submissions.filter(
    (submission) =>
      submission.status === "GRADED" && submission.score !== null,
  );
  if (graded.length === 0) return null;

  return [...graded].sort((a, b) => {
    const byGradedAt = dateValue(b.gradedAt) - dateValue(a.gradedAt);
    if (byGradedAt !== 0) return byGradedAt;
    const bySubmittedAt =
      dateValue(b.submittedAt) - dateValue(a.submittedAt);
    if (bySubmittedAt !== 0) return bySubmittedAt;
    return attemptNumber(b) - attemptNumber(a);
  })[0];
}

export function deriveAssignmentState(
  itemStatus: string,
  view: StudentAssignmentView | null,
  options: { viewFailed: boolean; locked: boolean },
): AssignmentState {
  if (options.locked) return "locked";
  if (itemStatus !== "PUBLISHED") return "unavailable";
  if (options.viewFailed || !view) return "unknown";

  // IN_PROGRESS wins over previous submissions. The student is inside a new
  // attempt; showing "تم التسليم" or a prior grade as the primary state would
  // hide the work that is still open.
  if (view.activeSubmission) {
    return view.isExpired ? "expired" : "active";
  }

  if (view.studentAttemptCount > 0) return "submitted";
  if (view.canAttempt) return "available";
  return "unavailable";
}

export function assignmentStatusCopy(row: {
  item: { status: string };
  state: AssignmentState;
  view: StudentAssignmentView | null;
  latest: AssignmentSubmissionSummary | null;
  latestGraded: AssignmentSubmissionSummary | null;
}): { label: string; tone: AssignmentTone } {
  if (row.item.status !== "PUBLISHED" && row.state === "unavailable") {
    return {
      label:
        ASSIGNMENT_ITEM_STATUS_LABELS[row.item.status] ?? row.item.status,
      tone: "muted",
    };
  }

  if (row.state === "locked") return ASSIGNMENT_STATE_COPY.locked;

  // The active attempt is the latest truth even when an older attempt was
  // graded. Never let the old "تم التصحيح" badge cover an open retake.
  if (row.view?.activeSubmission) {
    return row.state === "expired"
      ? { label: "انتهى وقت الحل", tone: "red" }
      : ASSIGNMENT_STATE_COPY.active;
  }

  if (
    row.latest?.status === "GRADED" &&
    row.latest.score !== null
  ) {
    return { label: "تم التصحيح", tone: "neutral" };
  }

  if (row.latestGraded) {
    return { label: "تم تصحيح محاولة سابقة", tone: "neutral" };
  }

  return ASSIGNMENT_STATE_COPY[row.state];
}

export function prerequisiteLabel(unlockType?: string | null): string {
  if (unlockType === "ENTER_ASSIGNMENT") {
    return "سلّم الواجب السابق أولًا";
  }
  if (unlockType === "ENTER_EXAM") {
    return "أكمل الاختبار السابق أولًا";
  }
  return "أكمل الخطوة السابقة أولًا";
}
