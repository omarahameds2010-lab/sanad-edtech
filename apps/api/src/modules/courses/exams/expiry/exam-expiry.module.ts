import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { EXAM_EXPIRY_QUEUE } from "./exam-expiry.constants";
import { ExamExpiryProcessor } from "./exam-expiry.processor";
import { ExamExpiryScheduler } from "./exam-expiry.scheduler";

function redisConnection() {
  const raw = process.env.REDIS_URL?.trim();

  if (raw) {
    try {
      const parsed = new URL(raw);
      const db = parsed.pathname.replace(/^\//, "");

      return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        username: parsed.username
          ? decodeURIComponent(parsed.username)
          : undefined,
        password: parsed.password
          ? decodeURIComponent(parsed.password)
          : undefined,
        db: db ? Number(db) : undefined,
        tls: parsed.protocol === "rediss:" ? {} : undefined,
      };
    } catch {
      // Fall through to the discrete host/port settings below.
    }
  }

  return {
    host: process.env.REDIS_HOST?.trim() || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
  };
}

@Module({
  imports: [
    BullModule.forRoot({ redis: redisConnection() }),
    BullModule.registerQueue({ name: EXAM_EXPIRY_QUEUE }),
  ],
  providers: [ExamExpiryScheduler, ExamExpiryProcessor],
  exports: [ExamExpiryScheduler],
})
export class ExamExpiryModule {}
