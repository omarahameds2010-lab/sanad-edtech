import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { AttemptStatus } from "@prisma/client";
import type { Job } from "bull";
import { runWithTenantId } from "../../../../common/prisma/tenant-context";
import { PrismaService } from "../../../tenants/prisma.service";
import {
  EXAM_EXPIRY_JOB,
  EXAM_EXPIRY_QUEUE,
  ExamExpiryJobData,
} from "./exam-expiry.constants";

const DEFAULT_TIMER_MINUTES = 70;

@Processor(EXAM_EXPIRY_QUEUE)
export class ExamExpiryProcessor {
  private readonly logger = new Logger(ExamExpiryProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process(EXAM_EXPIRY_JOB)
  async expireAttempt(job: Job<ExamExpiryJobData>) {
    const { tenantId, examId, attemptId } = job.data;

    // Background jobs have no request ALS scope. Re-enter the job's tenant so
    // every Prisma operation sets app.tenant_id and RLS stays enforced.
    return runWithTenantId(tenantId, async () => {
      const attempt = await this.prisma.examAttempt.findFirst({
        where: { id: attemptId, tenantId, examId },
        include: { exam: { select: { timerMinutes: true } } },
      });

      if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
        return { status: "skipped", reason: "not-active" };
      }

      const timerMinutes =
        attempt.exam?.timerMinutes ?? DEFAULT_TIMER_MINUTES;
      const expiresAt = new Date(
        attempt.startedAt.getTime() + timerMinutes * 60_000,
      );

      if (Date.now() < expiresAt.getTime()) {
        // The delayed job arrived early (clock skew). Throw so Bull retries
        // with backoff instead of closing the attempt before its deadline.
        throw new Error("attempt-not-yet-expired");
      }

      const updated = await this.prisma.examAttempt.updateMany({
        where: {
          id: attemptId,
          tenantId,
          examId,
          status: AttemptStatus.IN_PROGRESS,
        },
        data: {
          status: AttemptStatus.TIMED_OUT,
          submittedAt: new Date(),
          timeRemainingSeconds: 0,
        },
      });

      if (updated.count === 0) {
        return { status: "skipped", reason: "race" };
      }

      this.logger.log(
        `Exam attempt auto-expired: tenant=${tenantId} exam=${examId} attempt=${attemptId}`,
      );

      return { status: "expired", attemptId, examId };
    });
  }
}
