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
    // Runtime connection: the non-owner app_user role, subject to FORCE RLS.
    // Never fall back to MIGRATION_DATABASE_URL here. Migrations and seeds
    // opt into the owner connection explicitly (MIGRATION_DATABASE_URL) in
    // their own commands; the API runtime must not silently become a
    // superuser bypass.
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "Missing DATABASE_URL (runtime app_user connection) environment variable",
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
    // Without a store (health/readiness, pre-auth tenant resolution) the
    // operation passes through. Health uses SELECT 1 and tenant resolution
    // uses a SECURITY DEFINER function, so neither needs tenant rows. Seeds
    // and migrations connect separately as the owner via
    // MIGRATION_DATABASE_URL.
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

        // Make the RLS mode visible in the startup log. A superuser connection
        // silently bypasses FORCE ROW LEVEL SECURITY, so this line is the
        // quickest way to catch a misconfigured runtime URL.
        try {
          const identity = await this.$queryRawUnsafe<
            Array<{ current_user: string; is_superuser: string }>
          >(
            "SELECT current_user, current_setting('is_superuser') AS is_superuser",
          );
          const row = identity[0];
          if (row) {
            console.log(
              `🔐 DB runtime role: ${row.current_user} (superuser=${row.is_superuser})`,
            );
            if (row.is_superuser === "on") {
              console.warn(
                "⚠️ RLS is NOT enforcing: the runtime is connected as a superuser. Point DATABASE_URL at app_user.",
              );
            }
          }
        } catch (identityError: any) {
          console.warn(
            `Could not read the database runtime role: ${identityError?.message ?? identityError}`,
          );
        }

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
