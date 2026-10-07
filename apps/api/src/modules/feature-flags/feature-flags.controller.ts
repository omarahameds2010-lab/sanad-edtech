import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FeatureFlagsService } from "./feature-flags.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("api/feature-flags")
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  @Get()
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getAllFlags(@Request() req) {
    const flags = await this.featureFlagsService.getTenantFlags(req.tenantId);
    return { flags };
  }

  @Get(":key")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getFlag(@Request() req, @Param("key") key: string) {
    const flag = await this.featureFlagsService.getFlag(req.tenantId, key);
    return { flag };
  }

  @Put(":key")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async setFlag(
    @Request() req,
    @Param("key") key: string,
    @Body() body: { enabled: boolean; value?: any },
  ) {
    await this.featureFlagsService.setTenantOverride(
      req.tenantId,
      key,
      body.enabled,
      body.value,
    );
    const flag = await this.featureFlagsService.getFlag(req.tenantId, key);
    return { flag };
  }

  @Delete(":key")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async removeFlag(@Request() req, @Param("key") key: string) {
    await this.featureFlagsService.removeTenantOverride(req.tenantId, key);
    const flag = await this.featureFlagsService.getFlag(req.tenantId, key);
    return { flag };
  }

  @Get("catalog/all")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getCatalog() {
    const flags = await this.featureFlagsService.getAllFlags();
    return { flags };
  }
}
