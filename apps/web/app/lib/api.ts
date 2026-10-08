/**
 * Typed HTTP client for the NestJS API.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL (demo default: http://localhost:3001).
 * - Auth is a Bearer access token obtained from POST /api/auth/login.
 *   The token is kept in memory (React context) — never in localStorage.
 * - Tenant is resolved server-side from the Host header, so the client
 *   sends no tenant identifier.
 * - Mutating exam calls carry an `idempotency-key` header for safe retries.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiOptions {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
}

export async function apiFetch<T>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.idempotencyKey
        ? { "idempotency-key": opts.idempotencyKey }
        : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      payload?.message ?? `Request failed with status ${res.status}`,
    );
  }

  // Most controllers wrap results in `{ data }`; auth/login returns raw JSON.
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Domain types (mirror the API DTOs; student views never contain answers)
// ---------------------------------------------------------------------------

export type ExamQuestionType =
  | "MCQ"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "MATCHING";

export interface ExamOption {
  id: string;
  text: string;
}

export interface ExamQuestionView {
  id: string;
  type: ExamQuestionType;
  text: string;
  explanation?: string | null;
  points: number;
  position: number;
  options?: ExamOption[] | null;
}

export interface ActiveAttemptRef {
  id: string;
  status: string;
  startedAt: string;
}

export interface StudentExamView {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  timerMinutes: number;
  passingScore: number;
  maxAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  status: string;
  lessonId: string;
  questions: ExamQuestionView[];
  studentAttemptCount: number;
  canAttempt: boolean;
  timeRemainingSeconds?: number;
  isExpired?: boolean;
  activeAttempt: ActiveAttemptRef | null;
}

export interface StartedAttempt {
  attemptId: string;
  examId: string;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  timeRemainingSeconds: number;
  timerMinutes: number;
  questions: ExamQuestionView[];
}

export interface EnterExamResult {
  attempt: StartedAttempt;
  unlocked: unknown;
}

export interface ExamTimer {
  expiresAt: string;
  timeRemainingSeconds: number;
  isExpired: boolean;
  status: string;
}

export interface ExamAnswer {
  questionId: string;
  answer: unknown;
}

export interface SubmitExamResult {
  attemptId: string;
  status: string;
  submittedAt: string;
  isTimedOut: boolean;
  message: string;
}

export interface StudentAttemptSummary {
  id: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
  timeRemainingSeconds?: number;
  isExpired?: boolean;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; role: string };
}

export interface ExamListItem {
  id: string;
  title: string;
  description?: string | null;
  timerMinutes: number;
  status: string;
  lessonId: string;
  lesson?: { id: string; title: string } | null;
}

export interface ExamListResult {
  exams: ExamListItem[];
  nextCursor: string | null;
}

export interface NextLessonRef {
  id: string;
  title: string;
  type: string;
}

export interface LessonVideo {
  id: string;
  title: string;
  provider: string;
  providerVideoId: string | null;
  status: string;
  duration: number | null;
}

export interface StudentLesson {
  lesson: {
    id: string;
    title: string;
    type: string;
    description: string | null;
    duration: number | null;
    orderIndex: number;
    status: string;
  };
  access: {
    isLocked: boolean;
    unlockType: string;
    lockStatus: string;
  };
  assignment: { id: string; title: string } | null;
  exam: { id: string; title: string; timerMinutes: number; status: string } | null;
  videos: LessonVideo[];
}

export interface TeacherExamQuestion extends ExamQuestionView {
  correctAnswer?: unknown;
}

export interface TeacherExamDetail {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  timerMinutes: number;
  passingScore: number;
  maxAttempts: number;
  status: string;
  lessonId: string;
  questions: TeacherExamQuestion[];
}

export interface GradingAttempt {
  id: string;
  examId: string;
  studentId: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
  answers: ExamAnswer[] | null;
  gradingData?: unknown;
  gradedAt?: string | null;
  gradedBy?: string | null;
  student: { id: string; name: string; phone: string; email: string | null };
  timeRemainingSeconds?: number;
  isExpired?: boolean;
}

export interface GradingQueueResult {
  attempts: GradingAttempt[];
  nextCursor: string | null;
}

export interface GradeAttemptResult {
  id: string;
  status: string;
  score: number;
  passed: boolean;
  gradedAt: string;
}

// ---------------------------------------------------------------------------
// Endpoint functions
// ---------------------------------------------------------------------------

export const api = {
  login: (phone: string, password: string) =>
    apiFetch<LoginResult>("/api/auth/login", {
      method: "POST",
      body: { phone, password },
    }),

  getStudentExamView: (token: string, examId: string) =>
    apiFetch<StudentExamView>(`/api/v1/exams/${examId}/view`, { token }),

  enterExam: (
    token: string,
    examId: string,
    lessonId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ) =>
    apiFetch<EnterExamResult>(`/api/v1/exams/${examId}/enter`, {
      token,
      method: "POST",
      body: { lessonId },
      idempotencyKey,
    }),

  getExamTimer: (token: string, examId: string) =>
    apiFetch<ExamTimer>(`/api/v1/exams/${examId}/timer`, { token }),

  submitExam: (
    token: string,
    examId: string,
    answers: ExamAnswer[],
    idempotencyKey: string = newIdempotencyKey(),
  ) =>
    apiFetch<SubmitExamResult>(`/api/v1/exams/${examId}/submit`, {
      token,
      method: "POST",
      body: { answers, idempotencyKey },
      idempotencyKey,
    }),

  getMyAttempts: (token: string, examId: string) =>
    apiFetch<StudentAttemptSummary[]>(
      `/api/v1/exams/${examId}/attempts/me`,
      { token },
    ),

  listExams: (token: string) =>
    apiFetch<ExamListResult>("/api/v1/exams?status=PUBLISHED", { token }),

  getNextLesson: (token: string, lessonId: string) =>
    apiFetch<NextLessonRef | null>(
      `/api/v1/progression/lessons/${lessonId}/next`,
      { token },
    ),

  getStudentLesson: (token: string, lessonId: string) =>
    apiFetch<StudentLesson>(`/api/v1/student/lessons/${lessonId}`, { token }),

  getTeacherExam: (token: string, examId: string) =>
    apiFetch<TeacherExamDetail>(
      `/api/v1/exams/${examId}?questions=true`,
      { token },
    ),

  getGradingQueue: (token: string, examId: string, status?: string) =>
    apiFetch<GradingQueueResult>(
      `/api/v1/exams/${examId}/attempts/grading${status ? `?status=${status}` : ""}`,
      { token },
    ),

  gradeAttempt: (
    token: string,
    attemptId: string,
    input: { score: number; feedback?: string },
  ) =>
    apiFetch<GradeAttemptResult>(`/api/v1/exams/attempts/${attemptId}/grade`, {
      token,
      method: "POST",
      body: input,
    }),
};
