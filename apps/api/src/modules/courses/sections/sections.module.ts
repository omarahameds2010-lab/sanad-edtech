import { Module } from "@nestjs/common";
import { SectionsService } from "./sections.service";

@Module({
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
