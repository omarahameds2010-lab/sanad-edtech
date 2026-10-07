import { Module } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";
import { PolicyEngine } from "./policy-engine";
import { PrismaService } from "../tenants/prisma.service";
import { TenantModule } from "../tenants/tenant.module";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { EntitlementsModule } from "../entitlements/entitlements.module";

@Module({
  imports: [TenantModule, FeatureFlagsModule, EntitlementsModule],
  providers: [AuthorizationService, PolicyEngine, PrismaService],
  exports: [AuthorizationService, PolicyEngine],
})
export class AuthorizationModule {}
