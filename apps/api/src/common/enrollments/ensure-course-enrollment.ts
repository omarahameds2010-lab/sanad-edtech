import { Prisma } from "@prisma/client";

/**
 * Enrollment sources that can be written by the platform itself.
 *
 * The `enrollments.source` column is a free string, but keeping the writers on
 * one union avoids typo drift between checkout, vouchers and direct enroll.
 */
export type CourseEnrollmentSource =
  | "purchase"
  | "voucher"
  | "admin_grant"
  | "student";

export interface EnsureCourseEnrollmentInput {
  tenantId: string;
  userId: string;
  courseId: string;
  source: CourseEnrollmentSource;
  startsAt?: Date;
}

/**
 * Creates or reactivates the one enrollment row for (user, course).
 *
 * This runs inside the caller's interactive transaction so payment settlement
 * (ledger + entitlement + enrollment) stays atomic. `upsert` is idempotent:
 * webhook retries and voucher crash-resumes hit the same row instead of
 * failing on the `(userId, courseId)` unique constraint.
 */
export async function ensureCourseEnrollment(
  tx: Prisma.TransactionClient,
  input: EnsureCourseEnrollmentInput,
): Promise<void> {
  await tx.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId: input.courseId,
      },
    },
    create: {
      tenantId: input.tenantId,
      userId: input.userId,
      courseId: input.courseId,
      status: "ACTIVE",
      source: input.source,
      startsAt: input.startsAt ?? new Date(),
    },
    update: {
      status: "ACTIVE",
    },
  });
}
