import { Module } from "@nestjs/common";
import { ProgressionService } from "./progression.service";
import { PrismaService } from "../../tenants/prisma.service";
import { AuditModule } from "../../audit/audit.module";
import { PaymentsModule } from "../../payments/payments.module";

@Module({
  imports: [AuditModule, PaymentsModule],
  providers: [ProgressionService, PrismaService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
