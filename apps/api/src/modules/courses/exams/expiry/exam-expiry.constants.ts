export const EXAM_EXPIRY_QUEUE = "exam-expiry";
export const EXAM_EXPIRY_JOB = "expire-attempt";

export interface ExamExpiryJobData {
  tenantId: string;
  examId: string;
  attemptId: string;
  studentId: string;
}

export interface ScheduleExamExpiryInput extends ExamExpiryJobData {
  expiresAt: Date;
}
