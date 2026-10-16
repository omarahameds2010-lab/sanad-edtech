import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Request-scoped tenant context (audit 2026-10-16 §3.3 / P1).
 *
 * The tenant is resolved from the request Host by
 * TenantResolverMiddleware (modules/tenants/tenant-resolver.middleware.ts).
 * From there, everything downstream — guards, controllers, services and the
 * PrismaService wrapper — executes inside this AsyncLocalStorage scope.
 *
 * PrismaService reads `getTenantId()` and sets
 * `app.tenant_id` transaction-locally (set_config(..., true)) before every
 * model operation, so PostgreSQL RLS policies never see a stale or missing
 * tenant on a pooled connection.
 */

export type TenantContext = { tenantId: string };

export const tenantContextStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantId(): string | undefined {
  return tenantContextStorage.getStore()?.tenantId;
}

export function runWithTenantId<T>(tenantId: string, fn: () => T): T {
  return tenantContextStorage.run({ tenantId }, fn);
}

/**
 * SQL used to inject the tenant. `true` = transaction-local: the setting
 * disappears when the enclosing transaction ends, so pooled connections can
 * never leak a previous tenant to the next request.
 */
export const SET_TENANT_CONTEXT_SQL =
  "SELECT set_config('app.tenant_id', $1, true)";

/**
 * Sets the tenant context on an explicit transaction client. Required inside
 * interactive `$transaction(async (tx) => …)` callbacks, whose tx client is
 * NOT wrapped by the automatic per-operation injection.
 */
export async function applyTenantContext(
  tx: {
    $executeRawUnsafe: (sql: string, ...values: unknown[]) => Promise<number>;
  },
  tenantId: string,
): Promise<void> {
  await tx.$executeRawUnsafe(SET_TENANT_CONTEXT_SQL, tenantId);
}
