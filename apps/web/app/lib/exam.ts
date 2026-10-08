/**
 * Pure helpers for the exam-taking flow (unit-tested).
 * The server clock (expiresAt) is the source of truth; the client only
 * derives remaining seconds from it and never decides expiry itself.
 */

import type { ExamAnswer, ExamQuestionView } from "./api";

/** Whole seconds left until `expiresAtISO`, never negative. */
export function getRemainingSeconds(
  expiresAtISO: string,
  nowMs: number = Date.now(),
): number {
  const remaining = Math.floor((new Date(expiresAtISO).getTime() - nowMs) / 1000);
  return Math.max(0, remaining);
}

/** H:MM:SS for the countdown display (Arabic locale digits are handled by CSS). */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Build the submit payload: one entry per question, unanswered questions
 * serialize as null so the server sees the full question set.
 */
export function buildSubmitPayload(
  questions: ExamQuestionView[],
  answers: Record<string, unknown>,
): ExamAnswer[] {
  return questions.map((q) => ({
    questionId: q.id,
    answer: answers[q.id] ?? null,
  }));
}

/** Count of questions with a non-empty answer (for the progress indicator). */
export function countAnswered(
  questions: ExamQuestionView[],
  answers: Record<string, unknown>,
): number {
  return questions.filter((q) => {
    const a = answers[q.id];
    if (a === undefined || a === null) return false;
    if (typeof a === "string" && a.trim() === "") return false;
    return true;
  }).length;
}
