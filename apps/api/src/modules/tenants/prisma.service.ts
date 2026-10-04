import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper to set tenant context for RLS
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', $1, true)`,
      [tenantId],
    );
  }

  // Helper to clear tenant context
  async clearTenantContext() {
    await this.$executeRawUnsafe(
      `SELECT set_config('app.tenant_id', '', true)`,
    );
  }
}
