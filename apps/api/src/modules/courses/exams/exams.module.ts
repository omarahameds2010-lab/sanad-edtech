import { Module } from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { ExamsController } from "./exams.controller";
import { PaymentsModule } from "../../payments/payments.module";
import { ProgressionModule } from "../progression/progression.module";
import { ExamExpiryModule } from "./expiry/exam-expiry.module";

@Module({
  imports: [PaymentsModule, ProgressionModule, ExamExpiryModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
