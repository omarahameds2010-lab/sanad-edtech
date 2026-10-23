import { describe, expect, it } from "vitest";
import {
  isPortfolioSaved,
  readPortfolio,
  removePortfolioEntry,
  savePortfolioEntry,
  type PortfolioEntry,
  type StorageLike,
} from "./portfolio";

function memoryStorage(seed: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

function entry(overrides: Partial<PortfolioEntry> = {}): PortfolioEntry {
  return {
    submissionId: "sub-1",
    assignmentTitle: "الجملة الاسمية",
    score: 95,
    submittedAt: "2026-10-23T12:00:00.000Z",
    gradedAt: "2026-10-24T09:00:00.000Z",
    content: "المبتدأ مرفوع والخبر مرفوع.",
    feedback: "صياغة دقيقة.",
    savedAt: "2026-10-24T10:00:00.000Z",
    ...overrides,
  };
}

describe("academic portfolio", () => {
  it("returns an empty list for missing or malformed storage", () => {
    expect(readPortfolio(memoryStorage())).toEqual([]);
    expect(
      readPortfolio(memoryStorage({ "sanad:academic-portfolio:v1": "{" })),
    ).toEqual([]);
  });

  it("saves the newest reviewed answer once and reports it as saved", () => {
    const storage = memoryStorage();
    const first = savePortfolioEntry(entry(), storage);
    expect(first).toHaveLength(1);
    expect(isPortfolioSaved("sub-1", first)).toBe(true);

    const second = savePortfolioEntry(
      entry({
        submissionId: "sub-2",
        assignmentTitle: "أنواع الخبر",
        savedAt: "2026-10-25T10:00:00.000Z",
      }),
      storage,
    );
    expect(second.map((item) => item.submissionId)).toEqual(["sub-2", "sub-1"]);

    const updated = savePortfolioEntry(
      entry({ score: 100, savedAt: "2026-10-26T10:00:00.000Z" }),
      storage,
    );
    expect(updated).toHaveLength(2);
    expect(updated[0]).toMatchObject({ submissionId: "sub-1", score: 100 });
  });

  it("caps the portfolio and removes an entry by submission id", () => {
    const storage = memoryStorage();
    for (let index = 0; index < 35; index += 1) {
      savePortfolioEntry(
        entry({
          submissionId: `sub-${index}`,
          savedAt: `2026-10-${String(index + 1).padStart(2, "0")}T10:00:00.000Z`,
        }),
        storage,
      );
    }
    const capped = readPortfolio(storage);
    expect(capped).toHaveLength(30);
    expect(capped[0]?.submissionId).toBe("sub-34");

    const remaining = removePortfolioEntry("sub-34", storage);
    expect(remaining).toHaveLength(29);
    expect(remaining.some((item) => item.submissionId === "sub-34")).toBe(false);
  });

  it("limits stored answer and feedback text", () => {
    const storage = memoryStorage();
    const [saved] = savePortfolioEntry(
      entry({ content: "ا".repeat(5000), feedback: "ب".repeat(1500) }),
      storage,
    );
    expect(saved?.content).toHaveLength(4000);
    expect(saved?.feedback).toHaveLength(1000);
  });
});
