import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsController } from './entitlements.controller';
import { PrismaService } from '../tenants/prisma.service';

@Module({
  controllers: [EntitlementsController],
  providers: [EntitlementsService, PrismaService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}