import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";

export interface LessonLockState {
  id: string;
  lockStatus: string;
}

/**
 * Student-side lock enforcement for assessment endpoints.
 *
 * `getStudentLesson` can return a locked lesson's metadata (so the curriculum
 * can explain the prerequisite), but the assignment/exam payloads themselves
 * must not be reachable until the per-student grant exists. Without this
 * check the lock was advisory: a student who knew the assessment id could
 * call the student endpoint directly.
 */
export async function assertLessonAccessible(
  prisma: PrismaService,
  tenantId: string,
  userId: string,
  lesson: LessonLockState,
): Promise<void> {
  if (lesson.lockStatus !== "LOCKED") return;

  const grant = await prisma.studentLessonUnlock.findFirst({
    where: { tenantId, userId, lessonId: lesson.id },
    select: { id: true },
  });

  if (!grant) {
    throw new ForbiddenException({
      statusCode: 403,
      message: "This lesson is locked",
      code: "LESSON_LOCKED",
    });
  }
}
