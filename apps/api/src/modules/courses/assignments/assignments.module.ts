import { Module } from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { AssignmentsController } from "./assignments.controller";
import { SanadClient } from "./sanad.client";
import { PaymentsModule } from "../../payments/payments.module";
import { ProgressionModule } from "../progression/progression.module";

@Module({
  imports: [PaymentsModule, ProgressionModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, SanadClient],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
