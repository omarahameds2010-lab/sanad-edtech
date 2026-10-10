import { Module } from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import {
  LessonsController,
  StudentLessonsController,
} from "./lessons.controller";

@Module({
  controllers: [LessonsController, StudentLessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
