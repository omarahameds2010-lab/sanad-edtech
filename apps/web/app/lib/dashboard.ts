/**
 * Pure dashboard math (unit-tested). Percentages always derive from
 * server lock states — the client never invents progress.
 */
import type { AssignmentSubmissionSummary, ProgressionItem } from "./api";

export interface CourseProgress {
  total: number;
  open: number;
  percent: number;
}

/** Share of non-locked lessons, rounded 0–100. Empty courses yield 0. */
export function computeCourseProgress(
  items: ProgressionItem[],
): CourseProgress {
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

/* -------------------------------------------------------------------- */
/* Command Center helpers — every number derives from server payloads.  */
/* -------------------------------------------------------------------- */

/** Lesson types that count as watchable content (exams/quizzes excluded). */
export const CONTENT_TYPES = ["VIDEO", "PDF", "RESOURCE", "LIVE"] as const;

/** Watchable lessons that are not locked across the given items. */
export function countOpenContent(items: ProgressionItem[]): number {
  return items.filter(
    (i) =>
      i.lockStatus !== "LOCKED" &&
      (CONTENT_TYPES as readonly string[]).includes(i.type),
  ).length;
}

/** Average of per-course unlock percents, rounded. No courses → 0. */
export function overallPercent(percents: number[]): number {
  if (percents.length === 0) return 0;
  const sum = percents.reduce((a, b) => a + b, 0);
  return Math.round(sum / percents.length);
}

/** Arabic count label for enrolled courses ("كورس واحد", "كورسين", "3 كورسات"). */
export function enrolledCoursesLabel(count: number): string {
  if (count === 1) return "كورس واحد";
  if (count === 2) return "كورسين";
  if (count >= 3 && count <= 10) return `${count} كورسات`;
  return `${count} كورس`;
}

export type ActivityKind = "unlock" | "exam" | "assignment" | "enroll";

export interface ActivityEvent {
  /** ISO timestamp — always server-provided, never synthesized. */
  at: string;
  kind: ActivityKind;
  /** Human label of the source item. */
  label: string;
}

export interface CourseFeed {
  courseId: string;
  courseTitle: string;
  items: ProgressionItem[];
}

export interface ActivityInput {
  courses: CourseFeed[];
  enrollments: Array<{ startsAt: string; label: string }>;
  attempts: Array<{ submittedAt: string | null; label: string }>;
  submissions: Array<{ submittedAt: string | null; label: string }>;
}

/** Every timestamp here comes from the server; nothing is synthesized. */
export function buildActivityEvents(input: ActivityInput): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const e of input.enrollments)
    events.push({ at: e.startsAt, kind: "enroll", label: e.label });
  for (const course of input.courses)
    for (const item of course.items) {
      const at = item.unlockInfo?.unlockedAt;
      if (at) events.push({ at, kind: "unlock", label: item.title });
    }
  for (const a of input.attempts)
    if (a.submittedAt)
      events.push({ at: a.submittedAt, kind: "exam", label: a.label });
  for (const s of input.submissions)
    if (s.submittedAt)
      events.push({ at: s.submittedAt, kind: "assignment", label: s.label });
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

export interface DayBucket {
  /** Local midnight of this day. */
  dayStart: Date;
  events: ActivityEvent[];
}

/** Daily buckets ending with today. Events outside the window are dropped. */
export function bucketEventsByDay(
  events: ActivityEvent[],
  now: Date,
  days = 7,
): DayBucket[] {
  const anchor = new Date(now);
  anchor.setHours(0, 0, 0, 0);
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    buckets.push({
      dayStart: new Date(anchor.getTime() - i * 24 * 3600 * 1000),
      events: [],
    });
  }
  for (const ev of events) {
    const d = new Date(ev.at);
    if (Number.isNaN(d.getTime())) continue;
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const idx =
      days -
      1 -
      Math.round((anchor.getTime() - dayStart.getTime()) / (24 * 3600 * 1000));
    const bucket = idx >= 0 && idx < days ? buckets[idx] : undefined;
    if (bucket) bucket.events.push(ev);
  }
  return buckets;
}

/** Distinct local days with any activity — consecutive back from today (or yesterday). */
export function streakDays(events: Array<{ at: string }>, now: Date): number {
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const days = new Set(events.map((e) => dayKey(new Date(e.at))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface BadgeState {
  id: string;
  title: string;
  desc: string;
  earned: boolean;
  /** Known exact earn date when derivable. Null when unknown — never invented. */
  earnedAt: string | null;
  /** Real progress toward the condition (earned badges omit it). */
  progress: { have: number; need: number } | null;
}

export interface BadgeInput {
  attempts: Array<{ submittedAt: string | null; passed: boolean | null }>;
  submissions: Array<{ submittedAt: string | null }>;
  /** Server-granted unlocks (unlockInfo.unlockedAt). */
  grants: Array<{ at: string }>;
  streak: number;
}

export function computeBadges(input: BadgeInput): BadgeState[] {
  const submits = [
    ...input.attempts.map((a) => a.submittedAt),
    ...input.submissions.map((s) => s.submittedAt),
  ]
    .filter((d): d is string => Boolean(d))
    .sort();
  const firstSubmit = submits.length > 0 ? (submits[0] ?? null) : null;
  const passedDates = input.attempts
    .filter((a) => a.passed === true && a.submittedAt)
    .map((a) => a.submittedAt as string)
    .sort();
  const passedAt = passedDates.length > 0 ? (passedDates[0] ?? null) : null;
  const grantDates = input.grants.map((g) => g.at).sort();
  const grantAt = grantDates.length > 0 ? (grantDates[0] ?? null) : null;

  return [
    {
      id: "first-submission",
      title: "أول تسليم",
      desc: "سلّمت أول واجب أو اختبار",
      earned: submits.length > 0,
      earnedAt: firstSubmit,
      progress: null,
    },
    {
      id: "path-key",
      title: "مفتاح المسار",
      desc: "أول درس اتفتح لك بعد خطوة إجبارية",
      earned: grantAt !== null,
      earnedAt: grantAt,
      progress: null,
    },
    {
      id: "exam-pass",
      title: "ناجح",
      desc: "نجحت في اختبار",
      earned: passedAt !== null,
      earnedAt: passedAt,
      progress: null,
    },
    {
      id: "streak-3",
      title: "سلسلة ٣ أيام",
      desc: "نشاط متواصل ٣ أيام",
      earned: input.streak >= 3,
      earnedAt: null,
      progress: { have: Math.min(input.streak, 3), need: 3 },
    },
    {
      id: "five-submissions",
      title: "خمس تسليمات",
      desc: "٥ تسليمات واجبات أو اختبارات",
      earned: submits.length >= 5,
      earnedAt: null,
      progress: { have: Math.min(submits.length, 5), need: 5 },
    },
  ];
}

export interface ResumeTarget {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  unlockedAt: string;
  unlockType: string | null;
}

/** Latest server-granted content unlock across enrolled courses — never inferred. */
export function findResumeTarget(courses: CourseFeed[]): ResumeTarget | null {
  let best: ResumeTarget | null = null;
  for (const course of courses) {
    for (const item of course.items) {
      const info = item.unlockInfo;
      if (!info?.unlockedAt) continue;
      if (!(CONTENT_TYPES as readonly string[]).includes(item.type)) continue;
      if (!best || info.unlockedAt > best.unlockedAt) {
        best = {
          lessonId: item.id,
          lessonTitle: item.title,
          courseId: course.courseId,
          courseTitle: course.courseTitle,
          unlockedAt: info.unlockedAt,
          unlockType: info.unlockType ?? null,
        };
      }
    }
  }
  return best;
}

/** Arabic rendering of the server's unlockType enum — unknown values stay generic. */
export function unlockReasonLabel(
  unlockType: string | null | undefined,
): string {
  switch (unlockType) {
    case "ENTER_ASSIGNMENT":
      return "بعد دخولك الواجب السابق";
    case "ENTER_EXAM":
      return "بعد دخولك الاختبار السابق";
    case "COMPLETE_ASSIGNMENT":
      return "بعد إتمام الواجب السابق";
    case "COMPLETE_EXAM":
      return "بعد إتمام الاختبار السابق";
    case "PASS_EXAM":
      return "بعد نجاحك في الاختبار السابق";
    case "SCORE_THRESHOLD":
      return "بعد تحقيق درجة محددة";
    case "TIME_ELAPSED":
      return "بعد مرور الوقت المطلوب";
    case "MANUAL":
      return "فتحه لك مدرسك";
    default:
      return "مفتوح لك في مسارك";
  }
}

/** Student-facing attempt/submission status label. Unknown values pass through. */
export function statusLabel(status: string): string {
  switch (status) {
    case "IN_PROGRESS":
      return "جاري الآن";
    case "SUBMITTED":
      return "بانتظار التصحيح";
    case "GRADED":
      return "مُصحّح";
    case "EXPIRED":
    case "TIMED_OUT":
      return "انتهى الوقت";
    case "CANCELLED":
      return "ملغي";
    default:
      return status;
  }
}

export type AgendaState = "active" | "pending" | "done" | "todo";

export interface AgendaItem {
  id: string;
  title: string;
  href: string;
  courseTitle: string | null;
  state: AgendaState;
  statusLabel: string;
  at: string | null;
}

export interface AgendaInput {
  exams: Array<{ id: string; title: string; lessonId: string }>;
  assignments: Array<{ id: string; title: string; lessonId: string }>;
  attemptsByExam: Record<
    string,
    Array<{ status: string; submittedAt: string | null }>
  >;
  submissionsByAssignment: Record<
    string,
    Array<{ status: string; submittedAt: string | null }>
  >;
  courseTitleByLessonId: Record<string, string>;
}

interface AttemptLike {
  status: string;
  submittedAt: string | null;
}

/** Prefer a running attempt; otherwise the most recently submitted row. */
function latestAttempt(rows: AttemptLike[]): AttemptLike | null {
  const running = rows.find((r) => r.status === "IN_PROGRESS");
  if (running) return running;
  const dated = rows
    .filter((r) => r.submittedAt)
    .slice()
    .sort((a, b) =>
      (a.submittedAt as string).localeCompare(b.submittedAt as string),
    );
  const last = dated.length > 0 ? dated[dated.length - 1] : undefined;
  if (last) return last;
  return rows.length > 0 ? (rows[0] ?? null) : null;
}

export function agendaStateOf(status: string | null): AgendaState {
  if (!status) return "todo";
  if (status === "IN_PROGRESS") return "active";
  if (status === "SUBMITTED") return "pending";
  if (status === "GRADED") return "done";
  return "todo";
}

/** Task rail built from real exam/assignment states; no fabricated deadlines. */
export function buildAgenda(input: AgendaInput): AgendaItem[] {
  const items: AgendaItem[] = [];
  const push = (
    id: string,
    title: string,
    href: string,
    lessonId: string,
    latest: AttemptLike | null,
  ) => {
    items.push({
      id,
      title,
      href,
      courseTitle: input.courseTitleByLessonId[lessonId] ?? null,
      state: agendaStateOf(latest?.status ?? null),
      statusLabel: latest ? statusLabel(latest.status) : "لم يبدأ",
      at: latest?.submittedAt ?? null,
    });
  };
  for (const ex of input.exams)
    push(
      ex.id,
      ex.title,
      `/student/exams/${ex.id}`,
      ex.lessonId,
      latestAttempt(input.attemptsByExam[ex.id] ?? []),
    );
  for (const as of input.assignments)
    push(
      as.id,
      as.title,
      `/student/assignments/${as.id}`,
      as.lessonId,
      latestAttempt(input.submissionsByAssignment[as.id] ?? []),
    );
  const order: Record<AgendaState, number> = {
    active: 0,
    pending: 1,
    todo: 2,
    done: 3,
  };
  return items.sort(
    (a, b) =>
      order[a.state] - order[b.state] || (b.at ?? "").localeCompare(a.at ?? ""),
  );
}

export interface FeedbackEntry {
  assignmentId: string;
  assignmentTitle: string;
  lessonId: string;
  score: number | null;
  feedback: string;
  submittedAt: string;
}

/** Latest submission that carries real teacher feedback. */
export function latestFeedback(
  assignments: Array<{ id: string; title: string; lessonId: string }>,
  submissionsByAssignment: Record<string, AssignmentSubmissionSummary[]>,
): FeedbackEntry | null {
  let best: FeedbackEntry | null = null;
  for (const a of assignments) {
    for (const s of submissionsByAssignment[a.id] ?? []) {
      const text = (s.feedback ?? "").trim();
      if (!text || !s.submittedAt) continue;
      if (!best || s.submittedAt > best.submittedAt) {
        best = {
          assignmentId: a.id,
          assignmentTitle: a.title,
          lessonId: a.lessonId,
          score: s.score,
          feedback: text,
          submittedAt: s.submittedAt,
        };
      }
    }
  }
  return best;
}
