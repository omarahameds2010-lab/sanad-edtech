import { Module } from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { EnrollmentsController } from "./enrollments.controller";
import { PrismaService } from "../../tenants/prisma.service";

@Module({
  providers: [EnrollmentsService, PrismaService],
  controllers: [EnrollmentsController],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
