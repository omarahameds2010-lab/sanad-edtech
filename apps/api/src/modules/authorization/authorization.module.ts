import { Module } from "@nestjs/common";
import { AuthorizationService } from "./authorization.service";
import { PolicyEngine } from "./policy-engine";
import { PrismaService } from "../tenants/prisma.service";
import { TenantModule } from "../tenants/tenant.module";

@Module({
  imports: [TenantModule],
  providers: [AuthorizationService, PolicyEngine, PrismaService],
  exports: [AuthorizationService, PolicyEngine],
})
export class AuthorizationModule {}
