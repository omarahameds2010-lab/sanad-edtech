import { Controller, Get, Query, Request } from "@nestjs/common";
import { CanReadAnalytics } from "../authorization/authorization.decorators";
import { AnalyticsService } from "./analytics.service";

@Controller("v1/teacher/analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Real, tenant-scoped teacher analytics. Every number is derived from the
   * tenant's own courses, enrollments, lesson progress, submissions, and exam
   * attempts; there are no placeholder values or cross-tenant reads.
   */
  @Get("overview")
  @CanReadAnalytics()
  async overview(@Request() req, @Query("days") days?: string) {
    const parsed = Number(days);
    return this.analyticsService.getTeacherOverview(
      req.tenantId,
      Number.isFinite(parsed) ? parsed : 30,
    );
  }
}
