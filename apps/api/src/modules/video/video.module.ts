import { Module } from "@nestjs/common";
import { VideoService } from "./video.service";
import { VideoController } from "./video.controller";
import { VideoProviderRegistry } from "./providers/video-provider.registry";
import { BunnyStreamProvider } from "./providers/bunny-stream.provider";
import { VdoCipherProvider } from "./providers/vdocipher.provider";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { AuditModule } from "../audit/audit.module";
import { OutboxModule } from "../outbox/outbox.module";

@Module({
  imports: [
    FeatureFlagsModule,
    EntitlementsModule,
    AuthorizationModule,
    AuditModule,
    OutboxModule,
  ],
  controllers: [VideoController],
  providers: [
    VideoService,
    VideoProviderRegistry,
    BunnyStreamProvider,
    VdoCipherProvider,
  ],
  exports: [VideoService, VideoProviderRegistry],
})
export class VideoModule {}
