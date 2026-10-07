import { Module } from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { PrismaService } from "../../tenants/prisma.service";

@Module({
  providers: [EnrollmentsService, PrismaService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
