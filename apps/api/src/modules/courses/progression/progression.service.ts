import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import {
  Prisma,
  ContentUnlockType,
  ContentLockStatus,
  LessonType,
} from "@prisma/client";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { AuditService } from "../../audit/audit.service";
import { applyTenantContext } from "../../../common/prisma/tenant-context";

@Injectable()
export class ProgressionService {
  constructor(
    private prisma: PrismaService,
    private idempotencyService: IdempotencyService,
    private auditService: AuditService,
  ) {}

  /**
   * Handle ENTER_ASSIGNMENT progression event
   * When a student starts an assignment attempt, unlock the linked exam
   * lesson FOR THIS STUDENT (audit 2026-10-16 §6.1 — was tenant-wide).
   */
  async handleEnterAssignment(
    tenantId: string,
    userId: string,
    assignmentId: string,
    lessonId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      idempotencyKey,
      "progression:enter_assignment",
      { assignmentId, lessonId },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      return idempotencyResult.response;
    }

    // Find lessons that are unlocked by ENTER_ASSIGNMENT on this assignment
    const lessonsToUnlock = await this.prisma.lesson.findMany({
      where: {
        tenantId,
        unlockType: ContentUnlockType.ENTER_ASSIGNMENT,
        unlockTargetId: assignmentId,
        lockStatus: ContentLockStatus.LOCKED,
      },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    const response = await this.grantUnlocks(
      tenantId,
      userId,
      lessonsToUnlock,
      ContentUnlockType.ENTER_ASSIGNMENT,
      assignmentId,
    );

    await this.idempotencyService.markCompleted(
      tenantId,
      idempotencyKey,
      response,
    );
    return response;
  }

  /**
   * Handle ENTER_EXAM progression event
   * When a student starts an exam attempt, unlock the next lesson
   * FOR THIS STUDENT (audit 2026-10-16 §6.1 — was tenant-wide).
   */
  async handleEnterExam(
    tenantId: string,
    userId: string,
    examId: string,
    lessonId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      idempotencyKey,
      "progression:enter_exam",
      { examId, lessonId },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      return idempotencyResult.response;
    }

    // Find lessons that are unlocked by ENTER_EXAM on this exam
    const lessonsToUnlock = await this.prisma.lesson.findMany({
      where: {
        tenantId,
        unlockType: ContentUnlockType.ENTER_EXAM,
        unlockTargetId: examId,
        lockStatus: ContentLockStatus.LOCKED,
      },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    const response = await this.grantUnlocks(
      tenantId,
      userId,
      lessonsToUnlock,
      ContentUnlockType.ENTER_EXAM,
      examId,
    );

    await this.idempotencyService.markCompleted(
      tenantId,
      idempotencyKey,
      response,
    );
    return response;
  }

  /**
   * Get the next lesson in a section
   * Used to determine which lesson to unlock after ENTER_EXAM
   */
  async getNextLesson(tenantId: string, currentLessonId: string) {
    const currentLesson = await this.prisma.lesson.findFirst({
      where: { id: currentLessonId, tenantId },
      include: { section: true },
    });

    if (!currentLesson) {
      throw new NotFoundException("Current lesson not found");
    }

    const nextLesson = await this.prisma.lesson.findFirst({
      where: {
        tenantId,
        sectionId: currentLesson.sectionId,
        orderIndex: { gt: currentLesson.orderIndex },
      },
      orderBy: { orderIndex: "asc" },
    });

    return nextLesson;
  }

  /**
   * Configure a lesson to unlock when an assignment is entered
   */
  async configureUnlockOnEnterAssignment(
    tenantId: string,
    lessonId: string,
    assignmentId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        unlockType: ContentUnlockType.ENTER_ASSIGNMENT,
        unlockTargetId: assignmentId,
        lockStatus: ContentLockStatus.LOCKED,
      },
    });

    return updated;
  }

  /**
   * Configure a lesson to unlock when an exam is entered
   */
  async configureUnlockOnEnterExam(
    tenantId: string,
    lessonId: string,
    examId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        unlockType: ContentUnlockType.ENTER_EXAM,
        unlockTargetId: examId,
        lockStatus: ContentLockStatus.LOCKED,
      },
    });

    return updated;
  }

  /**
   * Get student's lesson progression status
   *
   * Per-student since the §6.1 fix: an unlock grant for THIS student wins
   * over the authored lock state; authored UNLOCKED/AVAILABLE still apply to
   * everyone (teacher-wide states).
   */
  async getStudentProgression(
    tenantId: string,
    userId: string,
    courseId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        tenantId,
        userId,
        courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Not enrolled in this course");
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        tenantId,
        section: { courseId },
      },
      include: {
        section: true,
        assignment: true,
        exam: true,
      },
      orderBy: { orderIndex: "asc" },
    });

    const grants = await this.prisma.studentLessonUnlock.findMany({
      where: {
        tenantId,
        userId,
        lessonId: { in: lessons.map((lesson) => lesson.id) },
      },
      select: {
        lessonId: true,
        unlockType: true,
        sourceId: true,
        unlockedAt: true,
      },
    });
    const grantByLesson = new Map(
      grants.map((grant) => [grant.lessonId, grant]),
    );

    const progression = lessons.map((lesson) => {
      const grant = grantByLesson.get(lesson.id);
      const effectiveLockStatus = grant
        ? ContentLockStatus.UNLOCKED
        : lesson.lockStatus;

      const isLocked = effectiveLockStatus === ContentLockStatus.LOCKED;
      const isUnlocked = effectiveLockStatus === ContentLockStatus.UNLOCKED;
      const isAvailable = effectiveLockStatus === ContentLockStatus.AVAILABLE;

      let unlockInfo: any = null;

      if (grant) {
        unlockInfo = {
          unlockType: grant.unlockType,
          unlockTargetId: grant.sourceId,
          unlockedAt: grant.unlockedAt,
          description: this.getUnlockDescription(
            grant.unlockType,
            grant.sourceId ?? "",
          ),
        };
      } else if (isLocked && lesson.unlockType && lesson.unlockTargetId) {
        unlockInfo = {
          unlockType: lesson.unlockType,
          unlockTargetId: lesson.unlockTargetId,
          description: this.getUnlockDescription(
            lesson.unlockType,
            lesson.unlockTargetId,
          ),
        };
      }

      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        orderIndex: lesson.orderIndex,
        lockStatus: effectiveLockStatus,
        isLocked,
        isUnlocked,
        isAvailable,
        unlockInfo,
      };
    });

    return {
      courseId,
      userId,
      progression,
    };
  }

  /**
   * Manually unlock a lesson (for TEACHER use)
   */
  async manuallyUnlockLesson(
    tenantId: string,
    userId: string,
    lessonId: string,
    reason?: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { lockStatus: ContentLockStatus.UNLOCKED },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: "CONTENT_MANUALLY_UNLOCKED",
      resourceType: "lesson",
      resourceId: lessonId,
      metadata: { reason },
    });

    return updated;
  }

  /**
   * Reset lesson lock status (for TEACHER use).
   *
   * Also revokes every per-student unlock for the lesson — otherwise the
   * "reset" would leave granted students unlocked (audit 2026-10-16 §6.1).
   */
  async resetLessonLock(tenantId: string, userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);

      await tx.studentLessonUnlock.deleteMany({
        where: { tenantId, lessonId },
      });

      return tx.lesson.update({
        where: { id: lessonId },
        data: {
          lockStatus: ContentLockStatus.LOCKED,
          unlockType: ContentUnlockType.NONE,
          unlockTargetId: null,
        },
      });
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: "CONTENT_LOCK_RESET",
      resourceType: "lesson",
      resourceId: lessonId,
      metadata: {},
    });

    return updated;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Grant per-student unlocks for a batch of lessons inside ONE transaction.
   *
   * Idempotency comes from the database itself: the unique index
   * (tenantId, userId, lessonId) + `skipDuplicates` make the ENTER flow safe
   * under retries and concurrent requests — a repeated grant is a no-op
   * instead of a duplicate row or an error (audit 2026-10-16 §6.1).
   */
  private async grantUnlocks(
    tenantId: string,
    userId: string,
    lessons: Array<{ id: string; section: { courseId: string } }>,
    unlockType: ContentUnlockType,
    sourceId: string,
  ): Promise<{ unlocked: number; lessonIds: string[] }> {
    if (lessons.length === 0) {
      return { unlocked: 0, lessonIds: [] };
    }

    const granted: Array<{ lessonId: string; courseId: string }> = [];

    await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);

      for (const lesson of lessons) {
        // Verify the student is enrolled in the lesson's course
        const enrollment = await tx.enrollment.findFirst({
          where: {
            tenantId,
            userId,
            courseId: lesson.section.courseId,
            status: "ACTIVE",
          },
        });

        if (!enrollment) {
          continue; // Skip if not enrolled
        }

        const created = await tx.studentLessonUnlock.createMany({
          data: [
            {
              tenantId,
              userId,
              lessonId: lesson.id,
              unlockType,
              sourceId,
            },
          ],
          skipDuplicates: true,
        });

        if (created.count > 0) {
          granted.push({
            lessonId: lesson.id,
            courseId: lesson.section.courseId,
          });
        }
      }
    });

    for (const item of granted) {
      // Audit after commit (best-effort: the grant rows are the source of truth)
      await this.auditService.log({
        tenantId,
        actorUserId: userId,
        action: "CONTENT_UNLOCKED",
        resourceType: "lesson",
        resourceId: item.lessonId,
        metadata: {
          unlockType,
          unlockTargetId: sourceId,
          courseId: item.courseId,
        },
      });
    }

    return {
      unlocked: granted.length,
      lessonIds: granted.map((item) => item.lessonId),
    };
  }

  private getUnlockDescription(
    unlockType: ContentUnlockType,
    unlockTargetId: string,
  ): string {
    switch (unlockType) {
      case ContentUnlockType.ENTER_ASSIGNMENT:
        return "Unlocks when you enter the assignment";
      case ContentUnlockType.ENTER_EXAM:
        return "Unlocks when you enter the exam";
      case ContentUnlockType.COMPLETE_ASSIGNMENT:
        return "Unlocks when you complete the assignment";
      case ContentUnlockType.COMPLETE_EXAM:
        return "Unlocks when you complete the exam";
      case ContentUnlockType.PASS_EXAM:
        return "Unlocks when you pass the exam";
      case ContentUnlockType.SCORE_THRESHOLD:
        return "Unlocks when you reach a score threshold";
      case ContentUnlockType.TIME_ELAPSED:
        return "Unlocks after a certain time";
      case ContentUnlockType.MANUAL:
        return "Unlocked by teacher";
      default:
        return "Unknown unlock condition";
    }
  }
}
