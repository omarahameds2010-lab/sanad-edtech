import { describe, expect, it } from "vitest";
import {
  ApiError,
  type AssignmentSubmissionSummary,
  type StudentAssignmentView,
} from "../../../lib/api";
import {
  assignmentStatusCopy,
  deriveAssignmentState,
  hasCompletedAttempt,
  isLessonLockedError,
  latestGradedSubmission,
  latestSubmittedSubmission,
  prerequisiteLabel,
} from "./overview";

function submission(
  over: Partial<AssignmentSubmissionSummary> = {},
): AssignmentSubmissionSummary {
  return {
    id: "s1",
    status: "SUBMITTED",
    attemptNumber: 1,
    submittedAt: "2026-10-27T10:00:00.000Z",
    score: null,
    ...over,
  };
}

function view(over: Partial<StudentAssignmentView> = {}): StudentAssignmentView {
  return {
    id: "a1",
    title: "واجب",
    timerMinutes: 300,
    passingScore: 60,
    maxAttempts: 3,
    allowLateSubmission: false,
    status: "PUBLISHED",
    lessonId: "l1",
    studentAttemptCount: 0,
    canAttempt: true,
    activeSubmission: null,
    ...over,
  };
}

describe("assignment retake overview", () => {
  it("counts completion from submitted attempts, not the active card state", () => {
    const attempts = [
      submission({ id: "s1", attemptNumber: 1 }),
      submission({
        id: "s2",
        attemptNumber: 2,
        status: "IN_PROGRESS",
        submittedAt: null,
      }),
    ];

    expect(hasCompletedAttempt(attempts)).toBe(true);
    expect(
      hasCompletedAttempt([
        submission({
          id: "s3",
          status: "IN_PROGRESS",
          submittedAt: null,
        }),
      ]),
    ).toBe(false);
  });

  it("selects the latest submitted attempt without relying on array order", () => {
    const latest = latestSubmittedSubmission([
      submission({ id: "s2", attemptNumber: 2 }),
      submission({ id: "s1", attemptNumber: 1 }),
    ]);

    expect(latest?.id).toBe("s2");
  });

  it("finds an older graded attempt behind a newer ungraded retake", () => {
    const graded = latestGradedSubmission([
      submission({
        id: "s2",
        attemptNumber: 2,
        status: "SUBMITTED",
        submittedAt: "2026-10-27T12:00:00.000Z",
      }),
      submission({
        id: "s1",
        attemptNumber: 1,
        status: "GRADED",
        score: 82,
        gradedAt: "2026-10-27T11:00:00.000Z",
      }),
    ]);

    expect(graded).toMatchObject({ id: "s1", score: 82 });
  });

  it("keeps IN_PROGRESS ahead of a completed previous attempt", () => {
    const state = deriveAssignmentState(
      "PUBLISHED",
      view({
        studentAttemptCount: 1,
        activeSubmission: {
          id: "s2",
          status: "IN_PROGRESS",
          attemptNumber: 2,
          startedAt: "2026-10-27T12:00:00.000Z",
          submittedAt: null,
        },
      }),
      { viewFailed: false, locked: false },
    );

    expect(state).toBe("active");
  });

  it("renders the active status even when the previous attempt was graded", () => {
    const copy = assignmentStatusCopy({
      item: { status: "PUBLISHED" },
      state: "active",
      view: view({
        studentAttemptCount: 1,
        activeSubmission: {
          id: "s2",
          status: "IN_PROGRESS",
          attemptNumber: 2,
          startedAt: "2026-10-27T12:00:00.000Z",
          submittedAt: null,
        },
      }),
      latest: submission({ id: "s1", status: "GRADED", score: 82 }),
      latestGraded: submission({ id: "s1", status: "GRADED", score: 82 }),
    });

    expect(copy.label).toBe("قيد الحل");
  });

  it("turns a locked lesson into a lock state with a prerequisite", () => {
    const state = deriveAssignmentState("PUBLISHED", null, {
      viewFailed: false,
      locked: true,
    });

    expect(state).toBe("locked");
    expect(prerequisiteLabel("ENTER_ASSIGNMENT")).toBe(
      "سلّم الواجب السابق أولًا",
    );
    expect(prerequisiteLabel("ENTER_EXAM")).toBe(
      "أكمل الاختبار السابق أولًا",
    );
  });

  it("recognizes only the explicit LESSON_LOCKED error", () => {
    expect(
      isLessonLockedError(new ApiError(403, "locked", "LESSON_LOCKED")),
    ).toBe(true);
    expect(isLessonLockedError(new ApiError(403, "other"))).toBe(false);
  });
});
