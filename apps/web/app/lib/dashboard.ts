/**
 * Pure dashboard math (unit-tested). Percentages always derive from
 * server lock states — the client never invents progress.
 */
import type { ProgressionItem } from "./api";

export interface CourseProgress {
  total: number;
  open: number;
  percent: number;
}

/** Share of non-locked lessons, rounded 0–100. Empty courses yield 0. */
export function computeCourseProgress(items: ProgressionItem[]): CourseProgress {
  const total = items.length;
  if (total === 0) return { total: 0, open: 0, percent: 0 };
  const open = items.filter((l) => l.lockStatus !== "LOCKED").length;
  return { total, open, percent: Math.round((open / total) * 100) };
}

/** First display name token ("OMAR AHMED SAMIR MOHAM Mohamed" → "Omar"). */
export function firstNameOf(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return first === "" ? "صديق سند" : first;
}
