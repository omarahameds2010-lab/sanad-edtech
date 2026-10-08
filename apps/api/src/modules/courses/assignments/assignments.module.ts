import { Module } from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { AssignmentsController } from "./assignments.controller";
import { PrismaService } from "../../tenants/prisma.service";
import { PaymentsModule } from "../../payments/payments.module";
import { ProgressionModule } from "../progression/progression.module";

@Module({
  imports: [PaymentsModule, ProgressionModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, PrismaService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
