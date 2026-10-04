import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentTenant(@Request() req) {
    return {
      id: req.tenantId,
      ...req.tenant,
    };
  }
}
