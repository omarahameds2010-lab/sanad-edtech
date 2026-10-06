import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import { Prisma, ContentUnlockType, ContentLockStatus, LessonType } from '@prisma/client';
import { IdempotencyService } from '../../payments/security/idempotency.service';
import { AuditService } from '../../audit/audit.service';

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
      'progression:enter_assignment',
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
          include: {
            course: true,
          },
        },
      },
    });

    if (lessonsToUnlock.length === 0) {
      // No lessons to unlock - this is normal
      const response = { unlocked: 0, lessonIds: [] };
      await this.idempotencyService.markCompleted(tenantId, idempotencyKey, response);
      return response;
    }

    // Unlock each lesson in a transaction
    const unlockedLessonIds: string[] = [];

    for (const lesson of lessonsToUnlock) {
      // Verify student is enrolled in the course
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.section.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        continue; // Skip if not enrolled
      }

      // Unlock the lesson
      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: { lockStatus: ContentLockStatus.UNLOCKED },
      });

      unlockedLessonIds.push(lesson.id);

      // Audit log
      await this.auditService.log({
        tenantId,
        actorUserId: userId,
        action: 'CONTENT_UNLOCKED',
        resourceType: 'lesson',
        resourceId: lesson.id,
        metadata: {
          unlockType: ContentUnlockType.ENTER_ASSIGNMENT,
          unlockTargetId: assignmentId,
          courseId: lesson.section.courseId,
        },
      });
    }

    const response = {
      unlocked: unlockedLessonIds.length,
      lessonIds: unlockedLessonIds,
    };

    await this.idempotencyService.markCompleted(tenantId, idempotencyKey, response);
    return response;
  }

  /**
   * Handle ENTER_EXAM progression event
   * When a student starts an exam attempt, unlock the next lesson
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
      'progression:enter_exam',
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
          include: {
            course: true,
          },
        },
      },
    });

    if (lessonsToUnlock.length === 0) {
      // No lessons to unlock - this is normal
      const response = { unlocked: 0, lessonIds: [] };
      await this.idempotencyService.markCompleted(tenantId, idempotencyKey, response);
      return response;
    }

    // Unlock each lesson in a transaction
    const unlockedLessonIds: string[] = [];

    for (const lesson of lessonsToUnlock) {
      // Verify student is enrolled in the course
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.section.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        continue; // Skip if not enrolled
      }

      // Unlock the lesson
      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: { lockStatus: ContentLockStatus.UNLOCKED },
      });

      unlockedLessonIds.push(lesson.id);

      // Audit log
      await this.auditService.log({
        tenantId,
        actorUserId: userId,
        action: 'CONTENT_UNLOCKED',
        resourceType: 'lesson',
        resourceId: lesson.id,
        metadata: {
          unlockType: ContentUnlockType.ENTER_EXAM,
          unlockTargetId: examId,
          courseId: lesson.section.courseId,
        },
      });
    }

    const response = {
      unlocked: unlockedLessonIds.length,
      lessonIds: unlockedLessonIds,
    };

    await this.idempotencyService.markCompleted(tenantId, idempotencyKey, response);
    return response;
  }

  /**
   * Get the next lesson in a section
   * Used to determine which lesson to unlock after ENTER_EXAM
   */
  async getNextLesson(tenantId: string, currentLessonId: string) {
    const currentLesson = await this.prisma.lesson.findUnique({
      where: { id: currentLessonId },
      include: { section: true },
    });

    if (!currentLesson) {
      throw new NotFoundException('Current lesson not found');
    }

    const nextLesson = await this.prisma.lesson.findFirst({
      where: {
        tenantId,
        sectionId: currentLesson.sectionId,
        orderIndex: { gt: currentLesson.orderIndex },
      },
      orderBy: { orderIndex: 'asc' },
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
      throw new NotFoundException('Lesson not found');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
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
      throw new NotFoundException('Lesson not found');
    }

    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
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
   */
  async getStudentProgression(
    tenantId: string,
    userId: string,
    courseId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Not enrolled in this course');
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
      orderBy: { orderIndex: 'asc' },
    });

    const progression = lessons.map((lesson) => {
      const isLocked = lesson.lockStatus === ContentLockStatus.LOCKED;
      const isUnlocked = lesson.lockStatus === ContentLockStatus.UNLOCKED;
      const isAvailable = lesson.lockStatus === ContentLockStatus.AVAILABLE;

      let unlockInfo: any = null;

      if (isLocked && lesson.unlockType && lesson.unlockTargetId) {
        unlockInfo = {
          unlockType: lesson.unlockType,
          unlockTargetId: lesson.unlockTargetId,
          description: this.getUnlockDescription(lesson.unlockType, lesson.unlockTargetId),
        };
      }

      return {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        orderIndex: lesson.orderIndex,
        lockStatus: lesson.lockStatus,
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
      throw new NotFoundException('Lesson not found');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { lockStatus: ContentLockStatus.UNLOCKED },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CONTENT_MANUALLY_UNLOCKED',
      resourceType: 'lesson',
      resourceId: lessonId,
      metadata: { reason },
    });

    return updated;
  }

  /**
   * Reset lesson lock status (for TEACHER use)
   */
  async resetLessonLock(tenantId: string, userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        lockStatus: ContentLockStatus.LOCKED,
        unlockType: ContentUnlockType.NONE,
        unlockTargetId: null,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: 'CONTENT_LOCK_RESET',
      resourceType: 'lesson',
      resourceId: lessonId,
      metadata: {},
    });

    return updated;
  }

  // ==================== HELPER METHODS ====================

  private getUnlockDescription(unlockType: ContentUnlockType, unlockTargetId: string): string {
    switch (unlockType) {
      case ContentUnlockType.ENTER_ASSIGNMENT:
        return 'Unlocks when you enter the assignment';
      case ContentUnlockType.ENTER_EXAM:
        return 'Unlocks when you enter the exam';
      case ContentUnlockType.COMPLETE_ASSIGNMENT:
        return 'Unlocks when you complete the assignment';
      case ContentUnlockType.COMPLETE_EXAM:
        return 'Unlocks when you complete the exam';
      case ContentUnlockType.PASS_EXAM:
        return 'Unlocks when you pass the exam';
      case ContentUnlockType.SCORE_THRESHOLD:
        return 'Unlocks when you reach a score threshold';
      case ContentUnlockType.TIME_ELAPSED:
        return 'Unlocks after a certain time';
      case ContentUnlockType.MANUAL:
        return 'Unlocked by teacher';
      default:
        return 'Unknown unlock condition';
    }
  }
}
