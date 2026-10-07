import { Module } from "@nestjs/common";
import { SectionsService } from "./sections.service";
import { PrismaService } from "../../tenants/prisma.service";

@Module({
  providers: [SectionsService, PrismaService],
  exports: [SectionsService],
})
export class SectionsModule {}
