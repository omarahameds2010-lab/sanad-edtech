import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { SkipThrottle } from "@nestjs/throttler";
import { PrismaService } from "../modules/tenants/prisma.service";

// Railway and uptime probes must never be throttled: a 429 would look like a
// database outage and could trigger a restart loop.
@SkipThrottle()
@Controller("")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Get("health")
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.prismaHealth.pingCheck("database", this.prisma),
    ]);
  }

  @Get("ready")
  @HealthCheck()
  readyCheck() {
    return this.health.check([
      () => this.prismaHealth.pingCheck("database", this.prisma),
    ]);
  }
}
