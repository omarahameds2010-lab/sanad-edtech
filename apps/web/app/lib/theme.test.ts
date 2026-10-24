import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, normalizeTheme } from "./theme";

describe("normalizeTheme", () => {
  it("accepts the explicit light register", () => {
    expect(normalizeTheme("light")).toBe("light");
  });

  it("falls back to graphite for empty or unknown values", () => {
    expect(normalizeTheme(null)).toBe(DEFAULT_THEME);
    expect(normalizeTheme(undefined)).toBe(DEFAULT_THEME);
    expect(normalizeTheme("")).toBe(DEFAULT_THEME);
    expect(normalizeTheme("dark")).toBe(DEFAULT_THEME);
    expect(normalizeTheme("sepia")).toBe(DEFAULT_THEME);
  });
});
