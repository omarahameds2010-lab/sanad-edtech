import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    // Railway's public proxy intermittently refuses the first handshake(s).
    // Retry with backoff instead of crashing the boot on a transient P1001.
    const attempts = 10;
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.$connect();
        console.log(`✅ Database connected (attempt ${i})`);
        return;
      } catch (err: any) {
        console.log(
          `⏳ DB connect attempt ${i}/${attempts} failed (${err?.code ?? "unknown"}), retrying...`,
        );
        if (i === attempts) throw err;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
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
