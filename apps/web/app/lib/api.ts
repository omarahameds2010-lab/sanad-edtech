/**
 * Typed HTTP client for the NestJS API.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL when set. The fail-safe defaults
 *   keep a deploy alive without env vars:
 *     · Browser — same-origin (""), so `/api/*` rides the Next rewrite that
 *       next.config.mjs points at the API in every environment.
 *     · Server — Node's fetch cannot resolve relative URLs, so it targets the
 *       production API origin on Vercel and :3002 elsewhere.
 * - Auth is a Bearer access token obtained from POST /api/auth/login.
 *   The token is kept in memory (React context) — never in localStorage.
 * - Tenant is resolved server-side from the Host header, so the client
 *   sends no tenant identifier.
 * - Mutating exam calls carry an `idempotency-key` header for safe retries.
 */

const PRODUCTION_API_ORIGIN = "https://sanad-edtech-production.up.railway.app";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? process.env.VERCEL
      ? PRODUCTION_API_ORIGIN
      : "http://localhost:3002"
    : "");

export interface ApiOptions {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  /** Set on the login call so a rejected password is never mistaken for an expired session. */
  skipAuthRetry?: boolean;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Fired on the window when the session is no longer usable.
 *
 * The auth provider listens and triggers the soft-exit UX. It is a DOM event
 * rather than a direct callback so the HTTP layer never has to import a React
 * module (and so non-React callers can subscribe too).
 */
export const SESSION_EXPIRED_EVENT = "sanad:session-expired";

export type SessionExpiredDetail = {
  /** The API's code, so the UI can tell theft from a plain expiry. */
  reason?: string;
};

export function emitSessionExpired(reason?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, {
      detail: { reason },
    }),
  );
}

/**
 * Every request carries `credentials: "include"`, without which the browser
 * simply will not send the HttpOnly session cookies — and the whole
 * server-side session model silently does nothing.
 */
function requestInit(opts: ApiOptions): RequestInit {
  return {
    method: opts.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts.idempotencyKey
        ? { "idempotency-key": opts.idempotencyKey }
        : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  };
}

/** The one endpoint that must never itself trigger a refresh. */
const REFRESH_PATH = "/api/auth/refresh";

export type RefreshResult =
  { ok: true; accessToken: string } | { ok: false; code?: string };

/**
 * Single-flight silent refresh.
 *
 * Several in-flight requests can hit 401 at the same moment — a dashboard
 * fires four queries on mount. Without this guard that becomes four refresh
 * calls, and because rotation revokes the token it replaces, three of them are
 * guaranteed to look like a replay, so the family gets revoked and the student
 * is thrown out of their own session. All callers therefore share one promise
 * and one rotation.
 */
let refreshInFlight: Promise<RefreshResult> | null = null;

export function refreshSession(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;

  const attempt = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const payload: any = await res.json().catch(() => null);

      if (!res.ok) {
        // Carry the server's own code: SESSION_FAMILY_REVOKED means theft was
        // detected, which the soft-exit UX should say out loud.
        return { ok: false, code: payload?.code };
      }

      const token = payload?.accessToken;
      return typeof token === "string"
        ? { ok: true, accessToken: token }
        : { ok: false, code: "REFRESH_MALFORMED" };
    } catch {
      return { ok: false, code: "NETWORK_ERROR" };
    }
  })();

  refreshInFlight = attempt;

  attempt
    .catch(() => null)
    .finally(() => {
      if (refreshInFlight === attempt) refreshInFlight = null;
    });

  return attempt;
}

/** The in-memory access token. The module holds it so every caller agrees. */
let memoryAccessToken: string | null = null;

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

async function sendRequest(
  path: string,
  opts: ApiOptions,
): Promise<{ response: Response; payload: any }> {
  const res = await fetch(`${API_BASE_URL}${path}`, requestInit(opts));
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  return { response: res, payload };
}

export async function apiFetch<T>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  let { response, payload } = await sendRequest(path, opts);

  // Silent recovery: the access token expired (it lives 15 minutes) but the
  // refresh cookie is still valid, so rotate and retry once. Only attempted for
  // authenticated calls, and never for the refresh endpoint itself.
  const isRefreshCall = path === REFRESH_PATH;
  const isAuthenticatedCall = Boolean(opts.token) || opts.method === undefined;

  if (
    response.status === 401 &&
    !isRefreshCall &&
    isAuthenticatedCall &&
    !opts.skipAuthRetry
  ) {
    const refreshed = await refreshSession();

    if (refreshed.ok) {
      const retried = await sendRequest(path, {
        ...opts,
        token: refreshed.accessToken,
      });
      response = retried.response;
      payload = retried.payload;
    } else {
      // The refresh cookie is gone too. Announce it with the server's own code
      // so the soft-exit screen can distinguish a theft revocation from a
      // plain weekly expiry.
      const code = refreshed.code ?? payload?.code;
      emitSessionExpired(code);
      throw new ApiError(401, payload?.message ?? "انتهت صلاحية الجلسة", code);
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? `Request failed with status ${response.status}`,
      payload?.code,
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
  "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "MATCHING";

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
  /** Count is always available; `questions` is empty until an attempt starts. */
  questionCount: number;
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
  /**
   * Kept in React memory only — never written to localStorage/sessionStorage.
   * The refresh token is deliberately absent: it lives solely in the HttpOnly
   * cookie, so no script on the page can read it.
   */
  accessToken: string;
  user: { id: string; name: string; role: string };
}

export interface RegisterInput {
  name: string;
  phone: string;
  password: string;
  role?: "STUDENT" | "TEACHER";
  grade?: string;
}

/** "/teacher" for teachers, "/student" for everyone else. */
export function landingForRole(role: string | null | undefined): string {
  return role === "TEACHER" ? "/teacher" : "/student";
}

/** Join first/last names, collapsing extra whitespace. */
export function buildFullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim().replace(/\s+/g, " ");
}

/** Egyptian mobile format enforced server-side (register DTO). */
export function isValidEgyptianPhone(phone: string): boolean {
  return /^01[0125][0-9]{8}$/.test(phone.trim());
}

export interface EnrollmentItem {
  id: string;
  status: string;
  startsAt: string;
  expiresAt: string | null;
  course: { id: string; title: string; slug: string; status: string };
}

export interface AssignmentListItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  lessonId: string;
  timerMinutes: number;
  lesson?: { id: string; title: string } | null;
}

export interface AssignmentListResult {
  assignments: AssignmentListItem[];
  nextCursor: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  grade: string | null;
}

export interface OrderListItem {
  id: string;
  number: string;
  currency: string;
  subtotalMinor: number | string;
  discountMinor: number | string;
  totalMinor: number | string;
  status: string;
  createdAt: string;
  items: Array<{
    resourceType: string;
    resourceId: string;
    name: string;
    totalMinor: number | string;
  }>;
  payments: Array<{
    id: string;
    status: string;
    amountMinor: number | string;
    provider: string;
  }>;
}

export interface OrderListResult {
  orders: OrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CurrentTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  visibility: string;
  language: string;
  price?: number;
  currency?: string;
  /** Prep grade (prep-1 | prep-2 | prep-3). */
  grade?: string;
}

export interface CreatedCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
}

/** Teacher-side course row (GET /api/v1/teacher/courses). */
export interface TeacherCourse {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  visibility?: string;
  level?: string | null;
  language?: string;
  price?: number | string;
  currency?: string;
  grade: string | null;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSectionLesson {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
  status: string;
}

export interface TeacherSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons?: TeacherSectionLesson[];
}

/** Full lesson row from the teacher API (includes attached exam/assignment). */
export interface TeacherLessonDetail {
  id: string;
  title: string;
  type: string;
  status: string;
  slug?: string;
  description?: string | null;
  duration?: number | null;
  orderIndex?: number;
  isFree?: boolean;
  videoId?: string | null;
  lockStatus?: string;
  unlockType?: string;
  sectionId: string;
  section: { id: string; courseId: string };
  exam?: {
    id: string;
    title: string;
    status: string;
    timerMinutes: number;
  } | null;
  assignment?: {
    id: string;
    title: string;
    status: string;
    timerMinutes: number;
  } | null;
}

export interface CreateExamInput {
  title: string;
  description?: string;
  instructions?: string;
  timerMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
}

export interface CreatedExam {
  id: string;
  lessonId: string;
  title: string;
  status: string;
}

export interface UpdateExamInput {
  title?: string;
  description?: string;
  instructions?: string;
  timerMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
  status?: string;
}

export interface CreateExamQuestionInput {
  type: ExamQuestionType;
  text: string;
  explanation?: string;
  points?: number;
  position?: number;
  options?: Array<{ id: string; text: string }>;
  correctAnswer?: unknown;
}

export interface CreatedExamQuestion {
  id: string;
  examId: string;
  type: string;
}

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  instructions?: string;
  timerMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  allowLateSubmission?: boolean;
}

export interface CreatedAssignment {
  id: string;
  lessonId: string;
  title: string;
  status: string;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  instructions?: string;
  timerMinutes?: number;
  passingScore?: number;
  maxAttempts?: number;
  allowLateSubmission?: boolean;
  status?: string;
}

export interface AttachYouTubeInput {
  lessonId: string;
  title: string;
  providerVideoId: string;
  description?: string;
}

export interface AttachedVideo {
  id: string;
  lessonId: string;
  provider: string;
  providerVideoId: string;
  status: string;
}

export interface StructureLesson {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
  duration: number | null;
  lockStatus: string;
  unlockType: string;
  isFree?: boolean;
}

export interface StructureSection {
  id: string;
  title: string;
  orderIndex: number;
  lessons: StructureLesson[];
}

export interface CourseStructure {
  course: {
    id: string;
    title: string;
    slug: string;
    shortDescription: string | null;
    description: string | null;
    thumbnailUrl: string | null;
    visibility: string;
    level: string | null;
    language: string;
    price: number | string;
    currency: string;
    status: string;
    teacher: { name: string };
  };
  sections: StructureSection[];
}

export interface StudentAssignmentView {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  timerMinutes: number;
  passingScore: number | null;
  maxAttempts: number;
  allowLateSubmission: boolean;
  status: string;
  lessonId: string;
  studentAttemptCount: number;
  canAttempt: boolean;
  timeRemainingSeconds?: number;
  isExpired?: boolean;
  activeSubmission: {
    id: string;
    status: string;
    submittedAt: string;
    content?: string | null;
    attachments?: unknown[] | null;
  } | null;
}

export interface StartAssignmentResult {
  attemptId: string;
  assignmentId: string;
  startedAt: string;
  expiresAt: string;
  timeRemainingSeconds: number;
  timerMinutes: number;
}

export interface EnterAssignmentResult {
  attempt: StartAssignmentResult;
  unlocked: { unlocked: number; lessonIds: string[] };
}

export interface AssignmentTimer {
  expiresAt: string;
  timeRemainingSeconds: number;
  isExpired: boolean;
  status: string;
}

export interface SubmitAssignmentResult {
  attemptId: string;
  status: string;
  submittedAt: string;
  isLate: boolean;
  message: string;
}

export interface AssignmentSubmissionSummary {
  id: string;
  status: string;
  score: number | null;
  feedback?: string | null;
  submittedAt: string;
  content?: string | null;
  attachments?: unknown[] | null;
  gradedAt?: string | null;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  timerMinutes: number;
  status: string;
}

export interface GradingSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string | null;
  status: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  student: { id: string; name: string; phone: string; email: string | null };
}

export interface SubmissionQueueResult {
  submissions: GradingSubmission[];
  nextCursor: string | null;
}

export interface GradeSubmissionResult {
  id: string;
  status: string;
  score: number;
}

export interface ProgressionUnlockInfo {
  unlockType: string;
  unlockTargetId: string;
  /** Server grant time — present only on student-granted unlocks. */
  unlockedAt?: string | null;
  /** The server's own explanation of the constraint. */
  description: string;
}

export interface ProgressionItem {
  id: string;
  title: string;
  type: string;
  /** Present in the server envelope; optional here for older responses. */
  orderIndex?: number;
  lockStatus: string;
  isLocked: boolean;
  isUnlocked: boolean;
  isAvailable: boolean;
  unlockInfo?: ProgressionUnlockInfo | null;
}

export interface CourseProgression {
  courseId: string;
  userId: string;
  progression: ProgressionItem[];
}

export interface TeacherStudent {
  id: string;
  name: string;
  phone: string | null;
  grade: string | null;
  status: string;
  enrollments: Array<{
    status: string;
    course: { id: string; title: string };
  }>;
}

export interface StudentFile {
  user: {
    id: string;
    name: string;
    role: string;
    grade: string | null;
    status: string;
  };
  enrollments: Array<{
    id: string;
    status: string;
    course: { id: string; title: string };
  }>;
  examAttempts: Array<{
    id: string;
    status: string;
    score: number | null;
    passed: boolean | null;
    submittedAt: string | null;
    attemptNumber: number;
    exam: { id: string; title: string };
  }>;
  submissions: Array<{
    id: string;
    status: string;
    score: number | null;
    submittedAt: string;
    assignment: { id: string; title: string };
  }>;
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

export interface PublicCourseCard {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  visibility: string;
  level: string | null;
  language: string;
  price: number | string;
  currency: string;
  teacher: { name: string };
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
  exam: {
    id: string;
    title: string;
    timerMinutes: number;
    status: string;
  } | null;
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

export interface AiCriterionResult {
  criterion_id: string;
  earned: number;
  max: number;
  evidence: string | null;
  evidence_type: "SUPPORTED" | "PARTIAL" | "ABSENT";
  feedback_ar: string;
}

export interface AiEvaluation {
  score: number;
  maxScore: number;
  feedback: string;
  criteria: AiCriterionResult[];
  knowledgeGap: string[];
  needsTeacherReview: boolean;
  reviewSignal: number;
  sanadRequestId: string;
  sanadSubmissionId: string;
  evaluatedAt: string;
}

export interface AskSanadPassage {
  chunk_id: string;
  source_id: string;
  branch: string;
  text: string;
  score: number;
}

export interface AskSanadResult {
  passages: AskSanadPassage[];
  branch: string;
}

// ---------------------------------------------------------------------------
// Endpoint functions
// ---------------------------------------------------------------------------

export const api = {
  login: (phone: string, password: string) =>
    apiFetch<LoginResult>("/api/auth/login", {
      method: "POST",
      body: { phone, password },
      // A wrong password must never be mistaken for an expired session and
      // kick off a silent refresh attempt.
      skipAuthRetry: true,
    }),

  register: (input: RegisterInput) =>
    apiFetch<LoginResult>("/api/auth/register", {
      method: "POST",
      body: input,
      skipAuthRetry: true,
    }),

  /**
   * Revokes the refresh family server-side and clears both HttpOnly cookies.
   * Without this call a client-side "logout" is only an illusion: the cookie
   * survives and the next page load restores the session.
   */
  logout: () =>
    apiFetch<{ message: string }>("/api/auth/logout", {
      method: "POST",
      skipAuthRetry: true,
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
    apiFetch<StudentAttemptSummary[]>(`/api/v1/exams/${examId}/attempts/me`, {
      token,
    }),

  listExams: (token: string) =>
    apiFetch<ExamListResult>("/api/v1/exams?status=PUBLISHED", { token }),

  /** Teacher index: every status so filters and totals are honest. */
  listTeacherExams: (token: string) =>
    apiFetch<ExamListResult>("/api/v1/exams", { token }),

  getNextLesson: (token: string, lessonId: string) =>
    apiFetch<NextLessonRef | null>(
      `/api/v1/progression/lessons/${lessonId}/next`,
      { token },
    ),

  getStudentLesson: (token: string, lessonId: string) =>
    apiFetch<StudentLesson>(`/api/v1/student/lessons/${lessonId}`, { token }),

  getTeacherExam: (token: string, examId: string) =>
    apiFetch<TeacherExamDetail>(`/api/v1/exams/${examId}?questions=true`, {
      token,
    }),

  getGradingQueue: (
    token: string,
    examId: string,
    status?: string,
    limit?: number,
  ) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit) params.set("limit", String(limit));
    const query = params.toString();
    return apiFetch<GradingQueueResult>(
      `/api/v1/exams/${examId}/attempts/grading${query ? `?${query}` : ""}`,
      { token },
    );
  },

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

  getMyEnrollments: (token: string) =>
    apiFetch<EnrollmentItem[]>("/api/v1/enrollments/me", { token }),

  listAssignments: (token: string) =>
    apiFetch<AssignmentListResult>("/api/v1/assignments", { token }),

  getProfile: (token: string) =>
    apiFetch<UserProfile>("/api/users/me", { token }),

  listOrders: (token: string) =>
    apiFetch<OrderListResult>("/api/payments/orders", { token }),

  getCurrentTenant: (token: string) =>
    apiFetch<CurrentTenant>("/api/tenants/current", { token }),

  createCourse: (token: string, input: CreateCourseInput) =>
    apiFetch<CreatedCourse>("/api/v1/teacher/courses", {
      token,
      method: "POST",
      body: input,
    }),

  listTeacherCourses: (token: string) =>
    apiFetch<TeacherCourse[]>("/api/v1/teacher/courses", { token }),

  getTeacherCourse: (token: string, courseId: string) =>
    apiFetch<TeacherCourse>(`/api/v1/teacher/courses/${courseId}`, { token }),

  updateTeacherCourse: (
    token: string,
    courseId: string,
    input: Partial<CreateCourseInput>,
  ) =>
    apiFetch<TeacherCourse>(`/api/v1/teacher/courses/${courseId}`, {
      token,
      method: "PATCH",
      body: input,
    }),

  publishCourse: (token: string, courseId: string) =>
    apiFetch<TeacherCourse>(`/api/v1/teacher/courses/${courseId}/publish`, {
      token,
      method: "POST",
      body: {},
    }),

  unpublishCourse: (token: string, courseId: string) =>
    apiFetch<TeacherCourse>(`/api/v1/teacher/courses/${courseId}/unpublish`, {
      token,
      method: "POST",
      body: {},
    }),

  listSections: (token: string, courseId: string) =>
    apiFetch<TeacherSection[]>(`/api/v1/teacher/courses/${courseId}/sections`, {
      token,
    }),

  createSection: (
    token: string,
    courseId: string,
    input: { title: string; orderIndex?: number },
  ) =>
    apiFetch<TeacherSection>(`/api/v1/teacher/courses/${courseId}/sections`, {
      token,
      method: "POST",
      body: input,
    }),

  createLesson: (
    token: string,
    sectionId: string,
    input: { title: string; type: string; description?: string },
  ) =>
    apiFetch<TeacherLessonDetail>(
      `/api/v1/teacher/sections/${sectionId}/lessons`,
      { token, method: "POST", body: input },
    ),

  getTeacherLesson: (token: string, lessonId: string) =>
    apiFetch<TeacherLessonDetail>(`/api/v1/teacher/lessons/${lessonId}`, {
      token,
    }),

  updateTeacherLesson: (
    token: string,
    lessonId: string,
    input: { title?: string; description?: string },
  ) =>
    apiFetch<TeacherLessonDetail>(`/api/v1/teacher/lessons/${lessonId}`, {
      token,
      method: "PATCH",
      body: input,
    }),

  publishLesson: (token: string, lessonId: string) =>
    apiFetch<TeacherLessonDetail>(
      `/api/v1/teacher/lessons/${lessonId}/publish`,
      { token, method: "POST", body: {} },
    ),

  unpublishLesson: (token: string, lessonId: string) =>
    apiFetch<TeacherLessonDetail>(
      `/api/v1/teacher/lessons/${lessonId}/unpublish`,
      { token, method: "POST", body: {} },
    ),

  deleteLesson: (token: string, lessonId: string) =>
    apiFetch<null>(`/api/v1/teacher/lessons/${lessonId}`, {
      token,
      method: "DELETE",
    }),

  getCourseStructureBySlug: (slug: string) =>
    apiFetch<CourseStructure>(`/api/v1/public/courses/${slug}/structure`),

  listPublicCourses: (search?: string) =>
    apiFetch<PublicCourseCard[]>(
      `/api/v1/public/courses${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),

  getStudentCourseStructure: (token: string, courseId: string) =>
    apiFetch<CourseStructure>(`/api/v1/student/courses/${courseId}/structure`, {
      token,
    }),

  enrollCourse: (token: string, courseId: string) =>
    apiFetch<{ id: string; status: string }>(
      `/api/v1/enrollments/courses/${courseId}/enroll`,
      { token, method: "POST", body: {} },
    ),

  getStudentAssignmentView: (token: string, assignmentId: string) =>
    apiFetch<StudentAssignmentView>(
      `/api/v1/assignments/${assignmentId}/view`,
      { token },
    ),

  startAssignment: (
    token: string,
    assignmentId: string,
    lessonId: string,
    idempotencyKey: string = newIdempotencyKey(),
  ) =>
    apiFetch<EnterAssignmentResult>(
      `/api/v1/assignments/${assignmentId}/enter`,
      { token, method: "POST", body: { lessonId }, idempotencyKey },
    ),

  getAssignmentTimer: (token: string, assignmentId: string) =>
    apiFetch<AssignmentTimer>(`/api/v1/assignments/${assignmentId}/timer`, {
      token,
    }),

  submitAssignment: (
    token: string,
    assignmentId: string,
    content: string,
    idempotencyKey: string = newIdempotencyKey(),
  ) =>
    apiFetch<SubmitAssignmentResult>(
      `/api/v1/assignments/${assignmentId}/submit`,
      {
        token,
        method: "POST",
        body: { content, idempotencyKey },
        idempotencyKey,
      },
    ),

  getMySubmissions: (token: string, assignmentId: string) =>
    apiFetch<AssignmentSubmissionSummary[]>(
      `/api/v1/assignments/${assignmentId}/submissions/me`,
      { token },
    ),

  getAssignment: (token: string, assignmentId: string) =>
    apiFetch<AssignmentDetail>(`/api/v1/assignments/${assignmentId}`, {
      token,
    }),

  getSubmissionQueue: (
    token: string,
    assignmentId: string,
    status?: string,
    limit?: number,
  ) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (limit) params.set("limit", String(limit));
    const query = params.toString();
    return apiFetch<SubmissionQueueResult>(
      `/api/v1/assignments/${assignmentId}/submissions${query ? `?${query}` : ""}`,
      { token },
    );
  },

  gradeSubmission: (
    token: string,
    submissionId: string,
    input: { score: number; feedback?: string },
  ) =>
    apiFetch<GradeSubmissionResult>(
      `/api/v1/assignments/submissions/${submissionId}/grade`,
      { token, method: "POST", body: input },
    ),

  evaluateWithAI: (
    token: string,
    assignmentId: string,
    input: {
      answer: string;
      question?: string;
      grading: {
        reference_answer: string;
        max_score: number;
        rubric_version: string;
        criteria: { id: string; description: string; max_score: number }[];
      };
      sourceIds?: string[];
      branches?: string[];
    },
  ) =>
    apiFetch<{ success: boolean; data: AiEvaluation; message: string }>(
      `/api/v1/assignments/${assignmentId}/evaluate-ai`,
      { token, method: "POST", body: input },
    ),

  askSanad: (
    token: string,
    assignmentId: string,
    input: { question: string; branch?: string },
  ) =>
    apiFetch<{ success: boolean; data: AskSanadResult }>(
      `/api/v1/assignments/${assignmentId}/ask-sanad`,
      { token, method: "POST", body: input },
    ),

  getStudentFile: (token: string, studentId: string) =>
    apiFetch<StudentFile>(`/api/users/${studentId}`, { token }),

  listStudents: (token: string) =>
    apiFetch<TeacherStudent[]>("/api/users/students", { token }),

  getStudentProgression: (token: string, courseId: string) =>
    apiFetch<CourseProgression>(`/api/v1/progression/courses/${courseId}`, {
      token,
    }),

  createExam: (token: string, lessonId: string, input: CreateExamInput) =>
    apiFetch<CreatedExam>(`/api/v1/exams/lessons/${lessonId}/exams`, {
      token,
      method: "POST",
      body: input,
    }),

  updateExam: (token: string, examId: string, input: UpdateExamInput) =>
    apiFetch<CreatedExam>(`/api/v1/exams/${examId}`, {
      token,
      method: "PATCH",
      body: input,
    }),

  publishExam: (token: string, examId: string) =>
    apiFetch<CreatedExam>(`/api/v1/exams/${examId}/publish`, {
      token,
      method: "POST",
      body: {},
    }),

  addExamQuestion: (
    token: string,
    examId: string,
    input: CreateExamQuestionInput,
  ) =>
    apiFetch<CreatedExamQuestion>(`/api/v1/exams/${examId}/questions`, {
      token,
      method: "POST",
      body: input,
    }),

  createAssignment: (
    token: string,
    lessonId: string,
    input: CreateAssignmentInput,
  ) =>
    apiFetch<CreatedAssignment>(
      `/api/v1/assignments/lessons/${lessonId}/assignments`,
      { token, method: "POST", body: input },
    ),

  updateAssignment: (
    token: string,
    assignmentId: string,
    input: UpdateAssignmentInput,
  ) =>
    apiFetch<CreatedAssignment>(`/api/v1/assignments/${assignmentId}`, {
      token,
      method: "PATCH",
      body: input,
    }),

  publishAssignment: (token: string, assignmentId: string) =>
    apiFetch<CreatedAssignment>(`/api/v1/assignments/${assignmentId}/publish`, {
      token,
      method: "POST",
      body: {},
    }),

  attachYouTube: (token: string, input: AttachYouTubeInput) =>
    apiFetch<AttachedVideo>("/api/video/youtube", {
      token,
      method: "POST",
      body: input,
    }),
};
