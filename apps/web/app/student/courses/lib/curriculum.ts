import type {
  CourseStructure,
  StructureLesson,
  StudentAssignmentView,
  StudentExamView,
  StudentLesson,
} from "@/app/lib/api";

/**
 * Presentation helpers for the student curriculum and lesson workspace.
 *
 * Every label, duration, status and link below is derived from a server
 * envelope (the course structure, the student-lesson payload, the assignment
 * view or the exam view). Nothing is estimated: when an enrichment request
 * has not returned yet, the function falls back to the structure's own
 * lock/type/duration instead of inventing a score or a status.
 */

export type TaskIconKind =
  | "play"
  | "exam"
  | "assignment"
  | "file"
  | "live"
  | "book";

export type TaskTone = "emerald" | "amber" | "muted" | "locked";

export interface TaskStatus {
  label: string;
  tone: TaskTone;
  pulse: boolean;
}

export interface TaskDetails {
  studentLesson?: StudentLesson;
  assignmentView?: StudentAssignmentView;
  examView?: StudentExamView;
}

export interface CurriculumTask {
  lesson: StructureLesson;
  sectionId: string;
  sectionTitle: string;
  sectionOrderIndex: number;
  details?: TaskDetails;
}

export interface CurriculumSummary {
  total: number;
  open: number;
  locked: number;
  percent: number;
  units: number;
}

const TYPE_LABELS: Record<string, string> = {
  VIDEO: "فيديو",
  PDF: "ملف",
  QUIZ: "اختبار قصير",
  LIVE: "بث مباشر",
  ASSIGNMENT: "واجب",
  EXAM: "اختبار",
  RESOURCE: "مورد",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function typeIconKind(type: string): TaskIconKind {
  switch (type) {
    case "VIDEO":
      return "play";
    case "EXAM":
    case "QUIZ":
      return "exam";
    case "ASSIGNMENT":
      return "assignment";
    case "PDF":
    case "RESOURCE":
      return "file";
    case "LIVE":
      return "live";
    default:
      return "book";
  }
}

function hoursLabel(hours: number): string {
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتان";
  if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
  return `${hours} ساعة`;
}

function minutesLabel(minutes: number): string {
  if (minutes === 1) return "دقيقة واحدة";
  if (minutes === 2) return "دقيقتان";
  if (minutes >= 3 && minutes <= 10) return `${minutes} دقائق`;
  return `${minutes} دقيقة`;
}

/** Formats a server duration in seconds as a natural Arabic reading. */
export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const minutes = Math.round(seconds / 60);
  if (minutes <= 0) return null;
  if (minutes < 90) return minutesLabel(minutes);

  if (minutes < 120) {
    const remainder = minutes - 60;
    return `ساعة و${minutesLabel(remainder)}`;
  }

  if (minutes % 60 === 0) {
    return hoursLabel(minutes / 60);
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hoursLabel(hours)} و${minutesLabel(remainder)}`;
}

export function taskCountLabel(count: number): string {
  if (count === 1) return "مهمة واحدة";
  if (count === 2) return "مهمتان";
  if (count >= 3 && count <= 10) return `${count} مهام`;
  return `${count} مهمة`;
}

export function questionCountLabel(count: number): string {
  if (count === 1) return "سؤال واحد";
  if (count === 2) return "سؤالان";
  if (count >= 3 && count <= 10) return `${count} أسئلة`;
  return `${count} سؤالًا`;
}

const UNLOCK_COPY: Record<string, string> = {
  ENTER_ASSIGNMENT: "يُفتح بعد فتح الواجب السابق",
  ENTER_EXAM: "يُفتح بعد دخول الاختبار السابق",
  COMPLETE_ASSIGNMENT: "يُفتح بعد إنهاء الواجب السابق",
  COMPLETE_EXAM: "يُفتح بعد إنهاء الاختبار السابق",
  PASS_EXAM: "يُفتح بعد اجتياز الاختبار السابق",
  SCORE_THRESHOLD: "يُفتح بعد تحقيق الدرجة المطلوبة",
  TIME_ELAPSED: "يُفتح بعد مرور الوقت المحدد",
  MANUAL: "يفتحه المعلم يدويًا",
};

/** Arabic copy for the server's own unlock rule. Never guesses a target. */
export function unlockReason(unlockType: string | null | undefined): string | null {
  if (!unlockType || unlockType === "NONE") return null;
  return UNLOCK_COPY[unlockType] ?? "يُفتح بعد إكمال الخطوة السابقة";
}

export function taskMeta(task: CurriculumTask): string {
  const parts: string[] = [typeLabel(task.lesson.type)];
  const isExamTask =
    task.lesson.type === "EXAM" || task.lesson.type === "QUIZ";
  const isAssignmentTask = task.lesson.type === "ASSIGNMENT";
  const exam = isExamTask ? task.details?.examView : undefined;
  const assignment = isAssignmentTask
    ? task.details?.assignmentView
    : undefined;

  const assessmentMinutes = assignment?.timerMinutes ?? exam?.timerMinutes;
  const videoDuration = task.details?.studentLesson?.videos?.[0]?.duration;
  const videoSeconds =
    task.lesson.type === "VIDEO" && videoDuration && videoDuration > 0
      ? videoDuration
      : null;

  const timerSeconds = assessmentMinutes
    ? assessmentMinutes * 60
    : videoSeconds ??
      task.lesson.duration ??
      task.details?.studentLesson?.lesson.duration ??
      null;

  const duration = formatDuration(timerSeconds);
  if (duration) parts.push(duration);

  if (exam && exam.questions.length > 0) {
    parts.push(questionCountLabel(exam.questions.length));
  }

  return parts.join(" · ");
}

export function taskNote(task: CurriculumTask): string | null {
  if (task.lesson.lockStatus === "LOCKED") {
    return unlockReason(task.lesson.unlockType);
  }
  return null;
}

function hasAssignmentAnswer(view: StudentAssignmentView): boolean {
  const submission = view.activeSubmission;
  if (!submission) return false;
  return (
    Boolean(submission.content?.trim()) ||
    (Array.isArray(submission.attachments) && submission.attachments.length > 0)
  );
}

function assignmentStatus(view: StudentAssignmentView): TaskStatus {
  if (view.status !== "PUBLISHED") {
    return { label: "غير متاح", tone: "muted", pulse: false };
  }

  const submission = view.activeSubmission;
  if (submission) {
    switch (submission.status) {
      case "GRADED":
        return { label: "تم التصحيح", tone: "emerald", pulse: false };
      case "SUBMITTED":
        // The API uses SUBMITTED for both an attempt the student only
        // entered (empty answer, timer running) and an answer that was
        // actually sent. Content/attachments are the runtime signal — the
        // same distinction the assignment workspace makes.
        if (hasAssignmentAnswer(view)) {
          return { label: "قيد المراجعة", tone: "amber", pulse: false };
        }
        if (view.isExpired) {
          return { label: "انتهى الوقت", tone: "muted", pulse: false };
        }
        return { label: "أكمل الواجب", tone: "emerald", pulse: true };
      case "LATE":
        return { label: "تم التسليم متأخرًا", tone: "amber", pulse: false };
      case "REJECTED":
        return { label: "لم يُقبل", tone: "amber", pulse: false };
      case "RETURNED":
        return { label: "أُعيد للتصحيح", tone: "amber", pulse: false };
      default:
        return { label: "قيد المتابعة", tone: "amber", pulse: true };
    }
  }

  if (view.studentAttemptCount > 0) {
    const canRetry =
      view.canAttempt &&
      view.studentAttemptCount < Math.max(1, view.maxAttempts);
    if (canRetry) {
      return { label: "إعادة المحاولة", tone: "emerald", pulse: true };
    }
    return { label: "تم التسليم", tone: "emerald", pulse: false };
  }

  if (view.canAttempt === false) {
    return { label: "غير متاح", tone: "muted", pulse: false };
  }

  return { label: "ابدأ الآن", tone: "emerald", pulse: true };
}

function examStatus(view: StudentExamView): TaskStatus {
  if (view.status !== "PUBLISHED") {
    return { label: "غير متاح", tone: "muted", pulse: false };
  }

  if (view.activeAttempt) {
    return { label: "أكمل الاختبار", tone: "emerald", pulse: true };
  }

  if (view.studentAttemptCount > 0) {
    const canRetry =
      view.canAttempt &&
      view.studentAttemptCount < Math.max(1, view.maxAttempts);
    if (canRetry) {
      return { label: "إعادة المحاولة", tone: "emerald", pulse: true };
    }
    return { label: "تم التسليم", tone: "emerald", pulse: false };
  }

  if (view.canAttempt === false) {
    return { label: "غير متاح", tone: "muted", pulse: false };
  }

  return { label: "ابدأ الآن", tone: "emerald", pulse: true };
}

export function taskStatus(task: CurriculumTask): TaskStatus {
  if (task.lesson.lockStatus === "LOCKED") {
    return { label: "مقفل", tone: "locked", pulse: false };
  }
  if (task.lesson.lockStatus === "EXPIRED") {
    return { label: "منتهي", tone: "muted", pulse: false };
  }

  const isExamTask =
    task.lesson.type === "EXAM" || task.lesson.type === "QUIZ";
  const isAssignmentTask = task.lesson.type === "ASSIGNMENT";
  const exam = isExamTask ? task.details?.examView : undefined;
  if (exam) return examStatus(exam);

  const assignment = isAssignmentTask
    ? task.details?.assignmentView
    : undefined;
  if (assignment) return assignmentStatus(assignment);

  // The structure says this task is open; the enrichment view may still be
  // in flight. Give the student the correct verb without inventing progress.
  switch (task.lesson.type) {
    case "VIDEO":
      return { label: "شاهد الآن", tone: "emerald", pulse: true };
    case "PDF":
    case "RESOURCE":
      return { label: "افتح الملف", tone: "emerald", pulse: true };
    case "LIVE":
      return { label: "انضم الآن", tone: "emerald", pulse: true };
    case "QUIZ":
    case "EXAM":
    case "ASSIGNMENT":
      return { label: "ابدأ الآن", tone: "emerald", pulse: true };
    default:
      return { label: "متاح", tone: "emerald", pulse: false };
  }
}

/**
 * Direct destination for a task when the enrichment payload gives us the
 * exam/assignment id. Otherwise the lesson page becomes the honest hub.
 */
export function taskHref(
  task: CurriculumTask,
  courseId: string,
): string | null {
  if (
    task.lesson.lockStatus === "LOCKED" ||
    task.lesson.lockStatus === "EXPIRED"
  ) {
    return null;
  }

  const isExamTask =
    task.lesson.type === "EXAM" || task.lesson.type === "QUIZ";
  const isAssignmentTask = task.lesson.type === "ASSIGNMENT";

  if (isExamTask) {
    const examId = task.details?.studentLesson?.exam?.id;
    if (examId) return `/student/exams/${examId}`;
  }

  if (isAssignmentTask) {
    const assignmentId = task.details?.studentLesson?.assignment?.id;
    if (assignmentId) return `/student/assignments/${assignmentId}`;
  }

  return `/student/lessons/${task.lesson.id}?course=${encodeURIComponent(courseId)}`;
}

export function flattenCurriculum(structure: CourseStructure): CurriculumTask[] {
  return structure.sections.flatMap((section) =>
    section.lessons.map((lesson) => ({
      lesson,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionOrderIndex: section.orderIndex,
    })),
  );
}

export function summarizeCurriculum(
  tasks: CurriculumTask[],
): CurriculumSummary {
  const total = tasks.length;
  const locked = tasks.filter((t) => t.lesson.lockStatus === "LOCKED").length;
  const blocked = tasks.filter(
    (t) =>
      t.lesson.lockStatus === "LOCKED" ||
      t.lesson.lockStatus === "EXPIRED",
  ).length;
  const open = total - blocked;
  return {
    total,
    open,
    locked,
    percent: total === 0 ? 0 : Math.round((open / total) * 100),
    units: new Set(tasks.map((t) => t.sectionId)).size,
  };
}

export function nextTask(
  tasks: CurriculumTask[],
  currentLessonId: string,
): CurriculumTask | null {
  const index = tasks.findIndex((t) => t.lesson.id === currentLessonId);
  if (index === -1) return null;
  return tasks[index + 1] ?? null;
}

/**
 * Runs async work with a small concurrency ceiling while preserving order.
 * Used to enrich a curriculum without opening one request per lesson at the
 * same instant on long courses.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const width = Math.max(1, Math.min(limit, items.length));
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: width }, () => run()));
  return results;
}
