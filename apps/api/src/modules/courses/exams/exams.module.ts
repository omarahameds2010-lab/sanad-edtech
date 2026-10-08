import { Module } from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { ExamsController } from "./exams.controller";
import { PrismaService } from "../../tenants/prisma.service";
import { PaymentsModule } from "../../payments/payments.module";
import { ProgressionModule } from "../progression/progression.module";

@Module({
  imports: [PaymentsModule, ProgressionModule],
  controllers: [ExamsController],
  providers: [ExamsService, PrismaService],
  exports: [ExamsService],
})
export class ExamsModule {}
