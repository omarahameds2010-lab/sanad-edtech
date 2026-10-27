import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { HealthController } from "./common/health.controller";
import { ClientIpThrottlerGuard } from "./common/guards/client-ip-throttler.guard";
import { PrismaModule } from "./common/prisma/prisma.module";
import { TenantModule } from "./modules/tenants/tenant.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { AuditModule } from "./modules/audit/audit.module";
import { OutboxModule } from "./modules/outbox/outbox.module";
import { AuthorizationModule } from "./modules/authorization/authorization.module";
import { FeatureFlagsModule } from "./modules/feature-flags/feature-flags.module";
import { EntitlementsModule } from "./modules/entitlements/entitlements.module";
import { PlansModule } from "./modules/plans/plans.module";
import { VideoProtectionModule } from "./modules/video-protection/video-protection.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { VideoModule } from "./modules/video/video.module";
import { CoursesModule } from "./modules/courses/courses.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === "development"
            ? { target: "pino-pretty" }
            : undefined,
        level: process.env.LOG_LEVEL || "info",
      },
    }),
    // Global per-IP ceiling. Auth routes add stricter per-handler limits in
    // AuthController; health and provider webhooks opt out below.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    TenantModule,
    TerminusModule,
    AuthModule,
    UsersModule,
    AuditModule,
    OutboxModule,
    AuthorizationModule,
    FeatureFlagsModule,
    EntitlementsModule,
    PlansModule,
    VideoProtectionModule,
    PaymentsModule,
    VideoModule,
    CoursesModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ClientIpThrottlerGuard,
    },
  ],
})
export class AppModule {}
