import { describe, expect, it } from "vitest";
import { computeCourseProgress, firstNameOf } from "./dashboard";
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
      computeCourseProgress([item("a", "UNLOCKED"), item("b", "LOCKED"), item("c", "LOCKED")])
        .percent,
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
