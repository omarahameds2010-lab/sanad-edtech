import { Module } from "@nestjs/common";
import { ProgressionService } from "./progression.service";
import { ProgressionController } from "./progression.controller";
import { PrismaService } from "../../tenants/prisma.service";
import { AuditModule } from "../../audit/audit.module";
import { PaymentsModule } from "../../payments/payments.module";

@Module({
  imports: [AuditModule, PaymentsModule],
  controllers: [ProgressionController],
  providers: [ProgressionService, PrismaService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
