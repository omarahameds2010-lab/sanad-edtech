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
      // Look up tenant by domain
      const tenantDomain = await this.prisma.tenantDomain.findUnique({
        where: { domain },
        include: { tenant: true },
      });

      if (!tenantDomain) {
        throw new NotFoundException(`Tenant not found for domain: ${domain}`);
      }

      if (tenantDomain.tenant.status !== "ACTIVE") {
        throw new BadRequestException("Tenant is not active");
      }

      tenant = tenantDomain.tenant;
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
