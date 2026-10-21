export type PendingKind = "assignment" | "exam";

export type LoadState = "loading" | "ready" | "failed";

export interface PendingRow {
  id: string;
  kind: PendingKind;
  title: string;
  studentName: string;
  studentPhone: string | null;
  submittedAt: string;
  status: string;
  href: string;
}

export interface PendingSummary {
  rows: PendingRow[];
  /** Null when at least one queue could not be read. */
  total: number | null;
  capped: boolean;
  failed: boolean;
  byExam: Record<string, number>;
}

export interface LiveExamRow {
  id: string;
  title: string;
  lessonTitle: string | null;
  timerMinutes: number;
  pending: number | null;
  href: string;
}

export interface CourseBar {
  id: string;
  title: string;
  count: number;
}
