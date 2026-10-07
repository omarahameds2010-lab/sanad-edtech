import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { PlansService, PlanLimits } from "./plans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("api/plans")
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getAllPlans() {
    const plans = this.plansService.getAllPlans();
    return { plans };
  }

  @Get("current")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getCurrentPlan(@Request() req) {
    const plan = await this.plansService.getTenantPlan(req.tenantId);
    const limits = await this.plansService.getTenantLimits(req.tenantId);
    const subscription = await this.plansService.getTenantSubscription(
      req.tenantId,
    );
    return { plan, limits, subscription };
  }

  @Get(":planId")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getPlan(@Param("planId") planId: string) {
    const plan = this.plansService.getPlan(planId);
    if (!plan) {
      return { plan: null };
    }
    return { plan };
  }

  @Get(":planId/limits")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getPlanLimits(@Param("planId") planId: string) {
    const limits = this.plansService.getPlanLimits(planId);
    return { limits };
  }

  @Get(":planId/features")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getPlanFeatures(@Param("planId") planId: string) {
    const features = this.plansService.getPlanFeatures(planId);
    return { features };
  }

  @Post("check-limit")
  @RequirePermission({ action: "read", resourceType: "analytics" })
  async checkLimit(
    @Request() req,
    @Body() body: { limitKey: keyof PlanLimits; currentUsage: number },
  ) {
    const result = await this.plansService.checkLimit(
      req.tenantId,
      body.limitKey,
      body.currentUsage,
    );
    return result;
  }

  @Post("subscribe")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async subscribe(
    @Request() req,
    @Body() body: { planId: string; trialDays?: number },
  ) {
    const subscription = await this.plansService.createSubscription(
      req.tenantId,
      body.planId,
      {
        trialDays: body.trialDays,
      },
    );
    return { subscription };
  }

  @Put("subscription/cancel")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async cancelSubscription(
    @Request() req,
    @Body() body: { atPeriodEnd?: boolean } = {},
  ) {
    const subscription = await this.plansService.cancelSubscription(
      req.tenantId,
      body.atPeriodEnd ?? true,
    );
    return { subscription };
  }

  @Put("subscription/plan")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async changePlan(@Request() req, @Body() body: { planId: string }) {
    const subscription = await this.plansService.updateSubscriptionPlan(
      req.tenantId,
      body.planId,
    );
    return { subscription };
  }
}
