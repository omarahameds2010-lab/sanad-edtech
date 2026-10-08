import { describe, expect, it } from "vitest";
import {
  buildSubmitPayload,
  countAnswered,
  formatCountdown,
  getRemainingSeconds,
} from "./exam";
import type { ExamQuestionView } from "./api";

const QUESTIONS: ExamQuestionView[] = [
  { id: "q1", type: "MCQ", text: "1+1؟", points: 1, position: 0 },
  { id: "q2", type: "ESSAY", text: "اشرح", points: 2, position: 1 },
];

describe("getRemainingSeconds", () => {
  it("derives whole seconds from the server expiresAt", () => {
    const expiresAt = "2026-10-08T12:00:00.000Z";
    const now = new Date("2026-10-08T11:59:30.000Z").getTime();
    expect(getRemainingSeconds(expiresAt, now)).toBe(30);
  });

  it("never goes negative after expiry", () => {
    const expiresAt = "2026-10-08T12:00:00.000Z";
    const now = new Date("2026-10-08T12:05:00.000Z").getTime();
    expect(getRemainingSeconds(expiresAt, now)).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(4200)).toBe("1:10:00");
    expect(formatCountdown(61)).toBe("1:01");
    expect(formatCountdown(9)).toBe("0:09");
  });

  it("adds hours for long exams", () => {
    expect(formatCountdown(5400)).toBe("1:30:00");
  });
});

describe("buildSubmitPayload", () => {
  it("emits one entry per question with null for unanswered", () => {
    expect(buildSubmitPayload(QUESTIONS, { q1: "a" })).toEqual([
      { questionId: "q1", answer: "a" },
      { questionId: "q2", answer: null },
    ]);
  });
});

describe("countAnswered", () => {
  it("ignores empty and blank answers", () => {
    expect(
      countAnswered(QUESTIONS, { q1: "b", q2: "   " }),
    ).toBe(1);
  });
});
