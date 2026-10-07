import { Module } from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantController } from "./tenant.controller";
import { PrismaService } from "./prisma.service";
import { TenantResolverMiddleware } from "./tenant-resolver.middleware";

@Module({
  controllers: [TenantController],
  providers: [TenantService, PrismaService],
  exports: [TenantService, PrismaService],
})
export class TenantModule {
  configure(consumer: any) {
    consumer.apply(TenantResolverMiddleware).forRoutes("*");
  }
}
