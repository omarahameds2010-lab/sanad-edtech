-- Assignment retakes
--
-- A student can now have one row per attempt. `submittedAt` becomes the
-- authoritative submission timestamp and stays NULL while an attempt is in
-- progress; `startedAt` is the timer start and `attemptNumber` gives each
-- retake a stable, unique identity.
--
-- Existing rows were created under the one-attempt model, so they are treated
-- as submitted attempt #1. Their original `submittedAt` is the best available
-- `startedAt` backfill; no historical row is deleted or rewritten.

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "assignment_submissions"
ADD COLUMN "attemptNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "startedAt" TIMESTAMP(3);

-- Backfill before enforcing NOT NULL/default. Existing rows already have a
-- non-null submittedAt (the old column was NOT NULL).
UPDATE "assignment_submissions"
SET "startedAt" = "submittedAt"
WHERE "startedAt" IS NULL;

ALTER TABLE "assignment_submissions"
ALTER COLUMN "startedAt" SET NOT NULL,
ALTER COLUMN "startedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "submittedAt" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP DEFAULT;

-- DropIndex
DROP INDEX "assignment_submissions_assignmentId_studentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_attemptNumber_key"
ON "assignment_submissions"("assignmentId", "studentId", "attemptNumber");
