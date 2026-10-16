import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { PrismaService } from "./prisma.service";

declare module "express" {
  interface Request {
    tenantId?: string;
    tenant?: any;
  }
}

type ResolvedTenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private tenantCache = new Map<string, any>();

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;

    if (!host) {
      throw new BadRequestException("Host header is required");
    }

    // Extract domain (remove port if present)
    const domain = host.split(":")[0];

    // Skip tenant resolution for health checks and platform admin routes
    if (
      req.path.startsWith("/api/health") ||
      req.path.startsWith("/api/ready")
    ) {
      return next();
    }

    // Check cache first
    let tenant = this.tenantCache.get(domain);

    if (!tenant) {
      // Resolve through a SECURITY DEFINER function: this runs before any
      // authentication, so no tenant context (app.tenant_id) exists yet and
      // RLS would block a plain SELECT against tenant_domains/tenants
      // (see 20261016000001_tenant_resolution_fn).
      const rows = await this.prisma.$queryRaw<ResolvedTenantRow[]>`
        SELECT id, slug, name, status
        FROM app_resolve_tenant_by_domain(${domain})
      `;
      const resolved = rows[0];

      if (!resolved) {
        throw new NotFoundException(`Tenant not found for domain: ${domain}`);
      }

      if (resolved.status !== "ACTIVE") {
        throw new BadRequestException("Tenant is not active");
      }

      tenant = resolved;
      this.tenantCache.set(domain, tenant);
    }

    // Set tenant context
    req.tenantId = tenant.id;
    req.tenant = tenant;

    // Set PostgreSQL RLS context (this will be done in a transaction context)
    // For now, we store it in the request for the interceptor to use
    req.headers["x-tenant-id"] = tenant.id;

    next();
  }
}
