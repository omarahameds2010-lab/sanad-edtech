import { Module } from "@nestjs/common";
import { TenantService } from "./tenant.service";
import { TenantController } from "./tenant.controller";
import { TenantResolverMiddleware } from "./tenant-resolver.middleware";

@Module({
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {
  configure(consumer: any) {
    consumer.apply(TenantResolverMiddleware).forRoutes("*");
  }
}
