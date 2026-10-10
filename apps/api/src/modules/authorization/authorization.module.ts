import { Global, Module } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";
import { PolicyEngine } from "./policy-engine";
import { TenantModule } from "../tenants/tenant.module";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { EntitlementsModule } from "../entitlements/entitlements.module";

@Global()
@Module({
  imports: [TenantModule, FeatureFlagsModule, EntitlementsModule],
  providers: [AuthorizationService, PolicyEngine],
  exports: [AuthorizationService, PolicyEngine],
})
export class AuthorizationModule {}
