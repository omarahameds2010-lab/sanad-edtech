import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import type { Queue } from "bull";
import {
  EXAM_EXPIRY_JOB,
  EXAM_EXPIRY_QUEUE,
  ScheduleExamExpiryInput,
} from "./exam-expiry.constants";

/**
 * Schedules a server-side expiry job when a student starts an exam.
 *
 * The client still auto-submits at zero, but an abandoned tab must not keep an
 * attempt IN_PROGRESS forever. The job lives in Redis, so it survives an API
 * restart; it is scheduled a few seconds after the deadline so the normal
 * client submit wins the common race.
 */
@Injectable()
export class ExamExpiryScheduler {
  private readonly logger = new Logger(ExamExpiryScheduler.name);

  constructor(
    @InjectQueue(EXAM_EXPIRY_QUEUE)
    private readonly queue: Queue,
  ) {}

  async scheduleAttemptExpiry(input: ScheduleExamExpiryInput): Promise<void> {
    const delay = Math.max(0, input.expiresAt.getTime() - Date.now()) + 5_000;

    try {
      await this.queue.add(
        EXAM_EXPIRY_JOB,
        {
          tenantId: input.tenantId,
          examId: input.examId,
          attemptId: input.attemptId,
          studentId: input.studentId,
        },
        {
          delay,
          jobId: input.attemptId,
          attempts: 3,
          backoff: { type: "exponential", delay: 5_000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    } catch (error) {
      // Starting an exam must not fail because Redis/queueing is unavailable.
      // The client-side timer still submits; this log is the observable hint.
      this.logger.warn(
        `Could not schedule exam expiry for attempt ${input.attemptId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
