import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Connection comes from the environment (never hardcode credentials:
    // a live superuser password in source is a secret leak AND, written as
    // a bare identifier, a compile error). MIGRATION_DATABASE_URL is the
    // superuser connection string per apps/api/.env.example.
    const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "Missing MIGRATION_DATABASE_URL (or DATABASE_URL) environment variable",
      );
    }

    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

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
