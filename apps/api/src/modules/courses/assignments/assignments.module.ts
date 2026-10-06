import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../../tenants/prisma.service';
import { PaymentsModule } from '../../payments/payments.module';
import { ProgressionModule } from '../progression/progression.module';

@Module({
  imports: [PaymentsModule, ProgressionModule],
  providers: [AssignmentsService, PrismaService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
