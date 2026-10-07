import { Module } from "@nestjs/common";
import { VideoProtectionService } from "./video-protection.service";
import { VideoProtectionController } from "./video-protection.controller";
import { SignedTokenService } from "./services/signed-token.service";
import { WatermarkEngine } from "./services/watermark-engine";
import { PlaybackSessionService } from "./services/playback-session.service";
import { PrismaService } from "../tenants/prisma.service";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { OutboxModule } from "../outbox/outbox.module";

@Module({
  imports: [
    EntitlementsModule,
    FeatureFlagsModule,
    AuthorizationModule,
    OutboxModule,
  ],
  controllers: [VideoProtectionController],
  providers: [
    VideoProtectionService,
    SignedTokenService,
    WatermarkEngine,
    PlaybackSessionService,
    PrismaService,
  ],
  exports: [
    VideoProtectionService,
    SignedTokenService,
    WatermarkEngine,
    PlaybackSessionService,
  ],
})
export class VideoProtectionModule {}
