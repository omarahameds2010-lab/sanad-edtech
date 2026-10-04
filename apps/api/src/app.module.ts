import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './common/health.controller';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TenantModule } from './modules/tenants/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { PlansModule } from './modules/plans/plans.module';
import { VideoProtectionModule } from './modules/video-protection/video-protection.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty' }
          : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),
    TenantModule,
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
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
