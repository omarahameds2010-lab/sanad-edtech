import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import {
  applyTenantContext,
  getTenantId,
} from "../../common/prisma/tenant-context";

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

    // ------------------------------------------------------------------
    // Runtime row-level-security context (audit 2026-10-16 §3.3 / P1).
    //
    // When the request runs inside TenantResolverMiddleware's
    // AsyncLocalStorage scope, every MODEL operation is executed inside a
    // short transaction that first sets app.tenant_id transaction-locally —
    // same connection, same transaction — so PostgreSQL RLS policies see
    // the right tenant even on a reused pooled connection.
    //
    // Without a store (health checks, seeds, CLI scripts) operations pass
    // through exactly as before.
    //
    // Interactive `$transaction(cb)` callers get a plain tx client; they
    // set the context themselves via applyTenantContext(tx, tenantId)
    // (done in the payment/voucher and course-reorder paths).
    // ------------------------------------------------------------------
    const base = this; // eslint-disable-line @typescript-eslint/no-this-alias -- per-op transactions must run on the non-extended client (avoids re-entering the extension)
    const extended = this.$extends({
      name: "tenant-rls-context",
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const tenantId = getTenantId();
            if (!tenantId) {
              return query(args);
            }
            return base.$transaction(async (tx: any) => {
              await applyTenantContext(tx, tenantId);
              return tx[model][operation](args);
            });
          },
        },
      },
    }) as unknown as PrismaClient;

    // Route every Prisma member through the extended client, while keeping
    // the Nest lifecycle hooks on the base instance. `instanceof
    // PrismaService` still holds — the proxy target is the real instance.
    const serviceMembers = new Set(["onModuleInit", "onModuleDestroy"]);
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string" && serviceMembers.has(prop)) {
          const member = Reflect.get(target, prop);
          return typeof member === "function" ? member.bind(target) : member;
        }
        const value = (extended as any)[prop];
        if (value !== undefined) {
          return typeof value === "function" ? value.bind(extended) : value;
        }
        const fallback = Reflect.get(target, prop);
        return typeof fallback === "function"
          ? fallback.bind(target)
          : fallback;
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
}
