import { PolicyEngine } from "./policy-engine";

/**
 * RBAC gates for the student exam/assignment loop.
 * Runs with in-context entitlements/flags — no database needed.
 */
describe("PolicyEngine (student loop)", () => {
  const engine = new PolicyEngine({} as any);
  const student = {
    userId: "student-1",
    tenantId: "tenant-1",
    role: "STUDENT",
  };

  it("allows a student to submit an exam", async () => {
    const decision = await engine.can(
      {
        ...student,
        featureFlags: { exams: true },
        entitlements: [
          {
            resourceType: "exam",
            resourceId: "exam-1",
            status: "ACTIVE",
            source: "admin_grant",
          },
        ],
      } as any,
      "submit",
      "exam",
      {
        id: "exam-1",
      },
    );
    expect(decision.allowed).toBe(true);
  });

  it("allows a student to enter (attempt) an assignment with entitlement", async () => {
    const decision = await engine.can(
      {
        ...student,
        featureFlags: { assignments: true },
        entitlements: [
          {
            resourceType: "assignment",
            resourceId: "a-1",
            status: "ACTIVE",
            source: "admin_grant",
          },
        ],
      } as any,
      "attempt",
      "assignment",
      { id: "a-1" },
    );
    expect(decision.allowed).toBe(true);
  });

  it("allows when the flag is an { enabled, value } object (audit §3.2 regression)", async () => {
    const decision = await engine.can(
      {
        ...student,
        featureFlags: { assignments: { enabled: true, value: true } },
        entitlements: [
          {
            resourceType: "assignment",
            resourceId: "a-1",
            status: "ACTIVE",
            source: "admin_grant",
          },
        ],
      } as any,
      "submit",
      "assignment",
      { id: "a-1" },
    );
    expect(decision.allowed).toBe(true);
  });

  it("denies with FEATURE_DISABLED when the object has enabled: false", async () => {
    const decision = await engine.can(
      {
        ...student,
        featureFlags: { assignments: { enabled: false, value: false } },
        entitlements: [
          {
            resourceType: "assignment",
            resourceId: "a-1",
            status: "ACTIVE",
            source: "admin_grant",
          },
        ],
      } as any,
      "submit",
      "assignment",
      { id: "a-1" },
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("FEATURE_DISABLED");
  });

  it("still forbids a student from grading", async () => {
    const decision = await engine.can(student, "grade", "exam", {
      id: "exam-1",
    });
    expect(decision.allowed).toBe(false);
  });

  it("allows a teacher to grade attempts", async () => {
    const decision = await engine.can(
      { ...student, role: "TEACHER" },
      "grade",
      "attempt",
      { id: "att-1" },
    );
    expect(decision.allowed).toBe(true);
  });

  it("allows a teacher to call AI evaluation on assignments", async () => {
    const decision = await engine.can(
      { ...student, role: "TEACHER" },
      "evaluate",
      "assignment",
      { id: "a-1" },
    );
    expect(decision.allowed).toBe(true);
  });

  it("allows a teacher to publish an assignment", async () => {
    const decision = await engine.can(
      { ...student, role: "TEACHER" },
      "publish",
      "assignment",
      { id: "a-1" },
    );
    expect(decision.allowed).toBe(true);
  });

  it("allows a student to self-evaluate an assignment answer", async () => {
    const decision = await engine.can(student, "evaluate", "assignment", {
      id: "a-1",
    });
    expect(decision.allowed).toBe(true);
  });

  // Audit issue #8 (2026-10-16): the official enroll route
  // (POST /v1/enrollments/courses/:courseId/enroll, @CanEnroll) requires
  // action "enroll" on resource "enrollment" — previously granted to NO role,
  // so every student got 403 while an unguarded duplicate route did the work.
  it("allows a student to enroll in a course", async () => {
    const decision = await engine.can(student, "enroll", "enrollment", {
      id: "course-1",
    });
    expect(decision.allowed).toBe(true);
  });

  it("denies enroll for a teacher (self-enroll is student-only)", async () => {
    const decision = await engine.can(
      { ...student, role: "TEACHER" },
      "enroll",
      "enrollment",
      { id: "course-1" },
    );
    expect(decision.allowed).toBe(false);
  });

  it("denies enroll for a parent", async () => {
    const decision = await engine.can(
      { ...student, role: "PARENT" },
      "enroll",
      "enrollment",
      { id: "course-1" },
    );
    expect(decision.allowed).toBe(false);
  });
});
