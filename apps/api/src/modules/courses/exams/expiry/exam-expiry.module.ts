import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { redisConnectionOptions } from "../../../../common/redis/redis-connection";
import { EXAM_EXPIRY_QUEUE } from "./exam-expiry.constants";
import { ExamExpiryProcessor } from "./exam-expiry.processor";
import { ExamExpiryScheduler } from "./exam-expiry.scheduler";

@Module({
  imports: [
    BullModule.forRoot({ redis: redisConnectionOptions() }),
    BullModule.registerQueue({ name: EXAM_EXPIRY_QUEUE }),
  ],
  providers: [ExamExpiryScheduler, ExamExpiryProcessor],
  exports: [ExamExpiryScheduler],
})
export class ExamExpiryModule {}
