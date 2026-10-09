import { Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import {
  LessonsController,
  StudentLessonsController,
} from "./lessons.controller";
import { PrismaService } from "../../tenants/prisma.service";

@Module({
  controllers: [LessonsController, StudentLessonsController],
  providers: [LessonsService, PrismaService],
  exports: [LessonsService],
})
export class LessonsModule {}
