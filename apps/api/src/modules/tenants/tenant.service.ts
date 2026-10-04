import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async getTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: { config: true },
    });
  }

  async getTenantByDomain(domain: string) {
    const tenantDomain = await this.prisma.tenantDomain.findUnique({
      where: { domain },
      include: { tenant: { include: { config: true } } },
    });

    return tenantDomain?.tenant;
  }

  async createTenant(data: {
    name: string;
    slug: string;
    domain: string;
    config?: any;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          domains: {
            create: {
              domain: data.domain,
              isPrimary: true,
            },
          },
          config: data.config
            ? {
                create: {
                  config: data.config,
                },
              }
            : undefined,
        },
      });

      return tenant;
    });
  }
}
