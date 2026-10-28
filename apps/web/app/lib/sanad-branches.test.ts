import { describe, expect, it } from "vitest";
import { SANAD_BRANCHES } from "./sanad-branches";

describe("SANAD branch selector", () => {
  it("exposes All plus the eight server-side Arabic branches", () => {
    expect(SANAD_BRANCHES.map((branch) => branch.id)).toEqual([
      "all",
      "nahw",
      "sarf",
      "balagha",
      "arood",
      "adab",
      "lugha",
      "quran",
      "sira",
    ]);
  });

  it("has unique Arabic labels and valid colors", () => {
    expect(new Set(SANAD_BRANCHES.map((branch) => branch.id)).size).toBe(9);
    expect(new Set(SANAD_BRANCHES.map((branch) => branch.label)).size).toBe(9);
    for (const branch of SANAD_BRANCHES) {
      expect(branch.label).toMatch(/[\u0600-\u06FF]/);
      expect(branch.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
