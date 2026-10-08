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
};
