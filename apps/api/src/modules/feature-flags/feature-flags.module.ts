import { Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { PrismaService } from '../tenants/prisma.service';

@Module({
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, PrismaService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}