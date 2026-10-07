import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  EntitlementsService,
  CreateEntitlementInput,
  GrantEntitlementInput,
  EntitlementSource,
} from "./entitlements.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("api/entitlements")
@UseGuards(JwtAuthGuard)
export class EntitlementsController {
  constructor(private entitlementsService: EntitlementsService) {}

  @Get()
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getUserEntitlements(@Request() req, @Query("status") status?: string) {
    const entitlements = await this.entitlementsService.getUserEntitlements(
      req.user.sub,
      status ? [status as any] : ["active"],
    );
    return { entitlements };
  }

  @Get("check")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async checkEntitlement(
    @Request() req,
    @Query("resourceType") resourceType: string,
    @Query("resourceId") resourceId: string,
  ) {
    const result = await this.entitlementsService.checkAccess(
      req.user.sub,
      resourceType,
      resourceId,
    );
    return result;
  }

  @Get("stats")
  @RequirePermission({ action: "read", resourceType: "analytics" })
  async getStats(@Request() req) {
    const stats = await this.entitlementsService.getEntitlementStats(
      req.tenantId,
    );
    return { stats };
  }

  @Get("tenant")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getTenantEntitlements(
    @Request() req,
    @Query("userId") userId?: string,
    @Query("resourceType") resourceType?: string,
    @Query("status") status?: string,
  ) {
    const entitlements = await this.entitlementsService.getTenantEntitlements(
      req.tenantId,
      {
        userId,
        resourceType,
        status: status as any,
      },
    );
    return { entitlements };
  }

  @Post("grant")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async grantEntitlement(@Request() req, @Body() body: GrantEntitlementInput) {
    const entitlement = await this.entitlementsService.grantEntitlement({
      ...body,
      tenantId: req.tenantId,
    });
    return { entitlement };
  }

  @Post("grant-course")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async grantCourseEntitlement(
    @Request() req,
    @Body()
    body: {
      userId: string;
      courseId: string;
      source: EntitlementSource;
      metadata?: Record<string, any>;
    },
  ) {
    const entitlements = await this.entitlementsService.grantCourseEntitlement(
      req.tenantId,
      body.userId,
      body.courseId,
      body.source,
      body.metadata,
    );
    return { entitlements };
  }

  @Put(":id/revoke")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async revokeEntitlement(
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    const entitlement = await this.entitlementsService.revokeEntitlement(
      id,
      body.reason,
    );
    return { entitlement };
  }

  @Put(":id")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async updateEntitlement(
    @Param("id") id: string,
    @Body() body: Partial<CreateEntitlementInput>,
  ) {
    const entitlement = await this.entitlementsService.updateEntitlement(
      id,
      body,
    );
    return { entitlement };
  }

  @Post("expire")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async expireEntitlements() {
    const count = await this.entitlementsService.expireEntitlements();
    return { expiredCount: count };
  }
}
