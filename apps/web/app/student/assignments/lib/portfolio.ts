export interface PortfolioEntry {
  submissionId: string;
  assignmentTitle: string;
  score: number;
  submittedAt: string;
  gradedAt: string | null;
  content: string;
  feedback: string;
  savedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PORTFOLIO_KEY = "sanad:academic-portfolio:v1";
const PORTFOLIO_LIMIT = 30;

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPortfolioEntry(value: unknown): value is PortfolioEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.submissionId === "string" &&
    typeof entry.assignmentTitle === "string" &&
    typeof entry.score === "number" &&
    Number.isFinite(entry.score) &&
    typeof entry.submittedAt === "string" &&
    (entry.gradedAt === null || typeof entry.gradedAt === "string") &&
    typeof entry.content === "string" &&
    typeof entry.feedback === "string" &&
    typeof entry.savedAt === "string"
  );
}

/**
 * Local, device-scoped portfolio. It stores the student's own reviewed answer
 * only after the student explicitly asks to keep it.
 */
export function readPortfolio(storage?: StorageLike): PortfolioEntry[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  try {
    const raw = store.getItem(PORTFOLIO_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPortfolioEntry).slice(0, PORTFOLIO_LIMIT);
  } catch {
    return [];
  }
}

export function savePortfolioEntry(
  entry: PortfolioEntry,
  storage?: StorageLike,
): PortfolioEntry[] {
  const store = resolveStorage(storage);
  if (!store) {
    throw new Error("Portfolio storage is unavailable");
  }
  const safeEntry: PortfolioEntry = {
    ...entry,
    content: entry.content.slice(0, 4000),
    feedback: entry.feedback.slice(0, 1000),
  };
  const next = [
    safeEntry,
    ...readPortfolio(store).filter(
      (item) => item.submissionId !== safeEntry.submissionId,
    ),
  ].slice(0, PORTFOLIO_LIMIT);
  store.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  return next;
}

export function removePortfolioEntry(
  submissionId: string,
  storage?: StorageLike,
): PortfolioEntry[] {
  const store = resolveStorage(storage);
  if (!store) return [];
  const next = readPortfolio(store).filter(
    (entry) => entry.submissionId !== submissionId,
  );
  try {
    store.setItem(PORTFOLIO_KEY, JSON.stringify(next));
  } catch {
    return readPortfolio(store);
  }
  return next;
}

export function isPortfolioSaved(
  submissionId: string,
  entries: PortfolioEntry[],
): boolean {
  return entries.some((entry) => entry.submissionId === submissionId);
}
