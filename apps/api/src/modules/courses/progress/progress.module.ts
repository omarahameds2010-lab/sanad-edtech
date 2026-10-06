import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../tenants/prisma.service';

@Module({
  providers: [ProgressService, PrismaService],
  exports: [ProgressService],
})
export class ProgressModule {}
