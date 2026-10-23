import { describe, expect, it } from "vitest";
import {
  buildGrowthSummary,
  buildScoreBlueprint,
  hasSubmittedWork,
  localDayKey,
  type AttemptLike,
} from "./progress";

function attempt(overrides: Partial<AttemptLike>): AttemptLike {
  return {
    id: "a1",
    status: "SUBMITTED",
    submittedAt: new Date(2026, 9, 23, 10, 0).toISOString(),
    content: "إجابة",
    ...overrides,
  };
}

describe("hasSubmittedWork", () => {
  it("rejects an entered attempt with no answer", () => {
    expect(
      hasSubmittedWork(
        attempt({ content: "   ", attachments: [], status: "SUBMITTED" }),
      ),
    ).toBe(false);
  });

  it("accepts text, attachments, graded and late attempts", () => {
    expect(hasSubmittedWork(attempt({ content: "نص" }))).toBe(true);
    expect(
      hasSubmittedWork(
        attempt({ content: null, attachments: [{ name: "x.pdf" }] }),
      ),
    ).toBe(true);
    expect(
      hasSubmittedWork(attempt({ content: null, status: "GRADED" })),
    ).toBe(true);
    expect(hasSubmittedWork(attempt({ content: null, status: "LATE" }))).toBe(
      true,
    );
  });
});

describe("buildGrowthSummary", () => {
  const today = new Date(2026, 9, 23, 18, 0);

  it("returns a flat bridge when there is no work", () => {
    const summary = buildGrowthSummary([], today);
    expect(summary.total).toBe(0);
    expect(summary.streak).toBe(0);
    expect(summary.activeDays).toBe(0);
    expect(summary.points).toHaveLength(14);
    expect(summary.points.every((point) => point.cumulative === 0)).toBe(true);
  });

  it("keeps the line flat on missed days and continues afterwards", () => {
    const summary = buildGrowthSummary(
      [
        attempt({
          id: "a1",
          submittedAt: new Date(2026, 9, 20, 9, 0).toISOString(),
        }),
        attempt({
          id: "a2",
          submittedAt: new Date(2026, 9, 23, 9, 0).toISOString(),
        }),
      ],
      today,
    );
    expect(summary.total).toBe(2);
    expect(summary.activeDays).toBe(2);
    expect(summary.points.at(-1)?.cumulative).toBe(2);
    const day21 = summary.points.find((point) => point.key === "2026-10-21");
    const day22 = summary.points.find((point) => point.key === "2026-10-22");
    expect(day21?.count).toBe(0);
    expect(day22?.cumulative).toBe(1);
  });

  it("counts consecutive days ending today, or yesterday after a gap", () => {
    const summary = buildGrowthSummary(
      [
        attempt({
          id: "a1",
          submittedAt: new Date(2026, 9, 21, 9, 0).toISOString(),
        }),
        attempt({
          id: "a2",
          submittedAt: new Date(2026, 9, 22, 9, 0).toISOString(),
        }),
      ],
      today,
    );
    expect(summary.streak).toBe(2);
  });

  it("ignores an empty entered attempt", () => {
    const summary = buildGrowthSummary(
      [attempt({ content: "", attachments: [], status: "SUBMITTED" })],
      today,
    );
    expect(summary.total).toBe(0);
  });

  it("uses local calendar days", () => {
    expect(localDayKey(new Date(2026, 0, 2, 23, 30))).toBe("2026-01-02");
  });
});

describe("buildScoreBlueprint", () => {
  it("returns null without approved grades", () => {
    expect(
      buildScoreBlueprint([
        attempt({ status: "SUBMITTED", score: null }),
        attempt({ id: "a2", status: "GRADED", score: null }),
      ]),
    ).toBeNull();
  });

  it("orders approved grades and reports the real delta", () => {
    const blueprint = buildScoreBlueprint([
      attempt({
        id: "new",
        status: "GRADED",
        score: 88,
        gradedAt: new Date(2026, 9, 22).toISOString(),
      }),
      attempt({
        id: "old",
        status: "GRADED",
        score: 64,
        gradedAt: new Date(2026, 9, 20).toISOString(),
      }),
    ]);
    expect(blueprint?.points.map((point) => point.id)).toEqual(["old", "new"]);
    expect(blueprint?.first).toBe(64);
    expect(blueprint?.latest).toBe(88);
    expect(blueprint?.delta).toBe(24);
  });
});
