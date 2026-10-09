import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError, api, apiFetch, newIdempotencyKey } from "./api";

function mockFetchOnce(payload: unknown, status = 200) {
  const json = vi.fn().mockResolvedValue(payload);
  const fetchMock = vi.fn().mockResolvedValue({ ok: status < 300, status, json });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, json };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends the Bearer token when provided", async () => {
    const { fetchMock } = mockFetchOnce({ data: { ok: true } });
    await apiFetch("/api/v1/exams/x/view", { token: "tok-123" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok-123",
    );
  });

  it("sends the idempotency-key header for mutating calls", async () => {
    const { fetchMock } = mockFetchOnce({ data: {} });
    await apiFetch("/api/v1/exams/x/enter", {
      method: "POST",
      token: "t",
      body: { lessonId: "l1" },
      idempotencyKey: "key-1",
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(
      "key-1",
    );
    expect(init.body).toBe(JSON.stringify({ lessonId: "l1" }));
  });

  it("unwraps the { data } envelope", async () => {
    mockFetchOnce({ data: { id: "e1" } });
    await expect(apiFetch("/x")).resolves.toEqual({ id: "e1" });
  });

  it("returns raw JSON when there is no envelope (login)", async () => {
    const raw = { accessToken: "a", user: { id: "u" } };
    mockFetchOnce(raw);
    await expect(apiFetch("/api/auth/login", { method: "POST" })).resolves.toEqual(
      raw,
    );
  });

  it("throws ApiError with the server message on failure", async () => {
    mockFetchOnce({ message: "Not enrolled in this course" }, 403);
    const err = await apiFetch("/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).message).toBe("Not enrolled in this course");
  });
});

describe("exam endpoints", () => {
  it("enterExam posts lessonId with an idempotency key", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { attempt: { attemptId: "a1" }, unlocked: null },
    });
    const result = await api.enterExam("t", "exam-1", "lesson-1", "idem-9");
    expect(result.attempt.attemptId).toBe("a1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/exams/exam-1/enter");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(
      "idem-9",
    );
  });

  it("submitExam posts answers with an idempotency key", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { attemptId: "a1", status: "SUBMITTED" },
    });
    const answers = [{ questionId: "q1", answer: "a" }];
    await api.submitExam("t", "exam-1", answers, "idem-7");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).answers).toEqual(answers);
  });
});

describe("newIdempotencyKey", () => {
  it("generates unique keys", () => {
    const keys = new Set(
      Array.from({ length: 50 }, () => newIdempotencyKey()),
    );
    expect(keys.size).toBe(50);
  });
});

describe("teacher grading endpoints", () => {
  it("getGradingQueue supports an optional status filter", async () => {
    const { fetchMock } = mockFetchOnce({ data: { attempts: [], nextCursor: null } });
    await api.getGradingQueue("t", "exam-1", "SUBMITTED");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/exams/exam-1/attempts/grading?status=SUBMITTED");
  });

  it("getGradingQueue omits the filter when absent", async () => {
    const { fetchMock } = mockFetchOnce({ data: { attempts: [], nextCursor: null } });
    await api.getGradingQueue("t", "exam-1");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/v1/exams/exam-1/attempts/grading");
  });

  it("gradeAttempt posts score and feedback", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { id: "a1", status: "GRADED", score: 85 },
    });
    const result = await api.gradeAttempt("t", "a1", {
      score: 85,
      feedback: "Good",
    });
    expect(result.score).toBe(85);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      score: 85,
      feedback: "Good",
    });
  });

  it("getTeacherExam requests questions", async () => {
    const { fetchMock } = mockFetchOnce({ data: { id: "e1", questions: [] } });
    await api.getTeacherExam("t", "e1");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/exams/e1?questions=true");
  });
});

describe("remaining nav endpoints", () => {
  it("getMyEnrollments hits the enrollments endpoint", async () => {
    const { fetchMock } = mockFetchOnce({ data: [] });
    await api.getMyEnrollments("t");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/v1/enrollments/me");
  });

  it("listAssignments hits the assignments endpoint", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { assignments: [], nextCursor: null },
    });
    await api.listAssignments("t");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/v1/assignments");
  });

  it("getProfile hits users/me (raw, no envelope)", async () => {
    mockFetchOnce({ id: "u1", name: "N", role: "STUDENT", grade: null });
    await expect(api.getProfile("t")).resolves.toEqual({
      id: "u1",
      name: "N",
      role: "STUDENT",
      grade: null,
    });
  });

  it("listOrders hits the payments orders endpoint", async () => {
    const { fetchMock } = mockFetchOnce({
      orders: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    const result = await api.listOrders("t");
    expect(result.total).toBe(0);
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/payments/orders");
  });

  it("getCurrentTenant hits tenants/current", async () => {
    const { fetchMock } = mockFetchOnce({ id: "t1", name: "T" });
    await api.getCurrentTenant("t");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/tenants/current");
  });

  it("createCourse posts the course payload and returns 201 data", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { id: "c1", title: "T", slug: "t", status: "DRAFT" },
    });
    const result = await api.createCourse("t", {
      title: "T",
      slug: "t",
      visibility: "PUBLIC",
      language: "ar",
      price: 0,
      currency: "EGP",
    });
    expect(result.id).toBe("c1");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).title).toBe("T");
  });
});

describe("five new pages endpoints", () => {
  it("getCourseStructureBySlug is public (no token)", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { course: { id: "c1" }, sections: [] },
    });
    await api.getCourseStructureBySlug("demo-math-1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:3001/api/v1/public/courses/demo-math-1/structure",
    );
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("getStudentCourseStructure passes the token", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { course: { id: "c1" }, sections: [] },
    });
    await api.getStudentCourseStructure("t", "c1");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:3001/api/v1/student/courses/c1/structure",
    );
  });

  it("enrollCourse posts to the enroll endpoint", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { id: "e1", status: "ACTIVE" },
    });
    const result = await api.enrollCourse("t", "c1");
    expect(result.status).toBe("ACTIVE");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/enrollments/courses/c1/enroll");
    expect(init.method).toBe("POST");
  });

  it("startAssignment posts lessonId with idempotency key", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { attemptId: "s1", expiresAt: "2026-01-01T00:00:00Z" },
    });
    await api.startAssignment("t", "a1", "l1", "idem-a");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/assignments/a1/enter");
    expect(JSON.parse(init.body as string)).toEqual({ lessonId: "l1" });
    expect((init.headers as Record<string, string>)["idempotency-key"]).toBe(
      "idem-a",
    );
  });

  it("submitAssignment posts content", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { attemptId: "s1", status: "SUBMITTED" },
    });
    const result = await api.submitAssignment("t", "a1", "my answer", "k2");
    expect(result.status).toBe("SUBMITTED");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).content).toBe("my answer");
  });

  it("getSubmissionQueue supports a status filter", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { submissions: [], nextCursor: null },
    });
    await api.getSubmissionQueue("t", "a1", "SUBMITTED");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/assignments/a1/submissions?status=SUBMITTED");
  });

  it("gradeSubmission posts score and feedback", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { id: "s1", status: "GRADED", score: 90 },
    });
    const result = await api.gradeSubmission("t", "s1", {
      score: 90,
      feedback: "Nice",
    });
    expect(result.score).toBe(90);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/assignments/submissions/s1/grade");
    expect(init.method).toBe("POST");
  });

  it("getStudentFile hits users/:id", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { user: { id: "u1" }, enrollments: [] },
    });
    await api.getStudentFile("t", "u1");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3001/api/users/u1");
  });

  it("listPublicCourses is public and supports search", async () => {
    const { fetchMock } = mockFetchOnce({
      data: { courses: [], nextCursor: null },
    });
    await api.listPublicCourses("جبر");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/v1/public/courses?search=");
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });
});
