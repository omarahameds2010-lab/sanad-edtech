import { Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { PrismaService } from "../../tenants/prisma.service";

@Module({
  providers: [LessonsService, PrismaService],
  exports: [LessonsService],
})
export class LessonsModule {}
