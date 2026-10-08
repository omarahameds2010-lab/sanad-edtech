import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { VideoProtectionService } from "./video-protection.service";
import { PrismaService } from "../tenants/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("video-protection")
@UseGuards(JwtAuthGuard)
export class VideoProtectionController {
  constructor(
    private videoProtectionService: VideoProtectionService,
    private prisma: PrismaService,
  ) {}

  /**
   * Authorize video playback - called by student before starting video
   */
  @Post("playback/authorize")
  @HttpCode(HttpStatus.OK)
  @RequirePermission({ action: "watch", resourceType: "lesson" })
  async authorizePlayback(
    @Request() req,
    @Body()
    body: { lessonId: string; deviceId: string; deviceFingerprint: string },
  ) {
    const token = await this.videoProtectionService.authorizePlayback(
      req.user.sub,
      req.tenantId,
      {
        lessonId: body.lessonId,
        deviceId: body.deviceId,
        deviceFingerprint: body.deviceFingerprint,
        userAgent: req.headers["user-agent"] || "",
        ip: req.ip || "",
      },
    );

    return { token };
  }

  /**
   * Heartbeat from video player
   */
  @Post("playback/:sessionId/heartbeat")
  @HttpCode(HttpStatus.OK)
  @RequirePermission({ action: "watch", resourceType: "lesson" })
  async heartbeat(
    @Request() req,
    @Param("sessionId") sessionId: string,
    @Body()
    body: {
      position: number;
      seekCount: number;
      visible: boolean;
      focused: boolean;
    },
  ) {
    const result = await this.videoProtectionService.handleHeartbeat(
      req.tenantId,
      req.user.sub,
      { sessionId, ...body },
    );

    return result;
  }

  /**
   * Capture event from player (screenshot, recording, tamper)
   */
  @Post("playback/:sessionId/capture-event")
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission({ action: "watch", resourceType: "lesson" })
  async captureEvent(
    @Request() req,
    @Param("sessionId") sessionId: string,
    @Body() body: { eventType: string; metadata?: Record<string, any> },
  ) {
    await this.videoProtectionService.handleCaptureEvent(
      req.tenantId,
      req.user.sub,
      { sessionId, eventType: body.eventType, metadata: body.metadata },
    );

    return { received: true };
  }

  /**
   * End playback session
   */
  @Post("playback/:sessionId/end")
  @HttpCode(HttpStatus.OK)
  @RequirePermission({ action: "watch", resourceType: "lesson" })
  async endSession(@Request() req, @Param("sessionId") sessionId: string) {
    await this.videoProtectionService.endSession(
      req.tenantId,
      req.user.sub,
      sessionId,
    );
    return { ended: true };
  }

  /**
   * Get active sessions for current student
   */
  @Get("playback/sessions/active")
  @RequirePermission({ action: "read", resourceType: "analytics" })
  async getActiveSessions(@Request() req) {
    const sessions = await this.videoProtectionService.getActiveSessions(
      req.tenantId,
      req.user.sub,
    );
    return { sessions };
  }

  /**
   * Get tenant video security configuration
   */
  @Get("config")
  @RequirePermission({ action: "read", resourceType: "settings" })
  async getConfig(@Request() req) {
    const config = await this.videoProtectionService.getTenantVideoConfig(
      req.tenantId,
    );
    return { config };
  }

  /**
   * Update tenant video security configuration (admin)
   */
  @Put("config")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async updateConfig(@Request() req, @Body() body: { videoSecurity: any }) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId: req.tenantId },
    });

    const currentConfig = (tenantConfig?.config as any) || {};
    const newConfig = {
      ...currentConfig,
      videoSecurity: body.videoSecurity,
    };

    await this.prisma.tenantConfig.upsert({
      where: { tenantId: req.tenantId },
      update: {
        config: newConfig,
        version: { increment: 1 },
      },
      create: {
        tenantId: req.tenantId,
        config: newConfig,
      },
    });

    const config = await this.videoProtectionService.getTenantVideoConfig(
      req.tenantId,
    );
    return { config };
  }

  /**
   * Get video security stats (admin/teacher dashboard)
   */
  @Get("stats")
  @RequirePermission({ action: "read", resourceType: "analytics" })
  async getStats(@Request() req) {
    const stats = await this.videoProtectionService.getVideoSecurityStats(
      req.tenantId,
    );
    return { stats };
  }

  /**
   * Admin: Revoke a student's playback session
   */
  @Post("admin/sessions/:sessionId/revoke")
  @RequirePermission({ action: "manage", resourceType: "settings" })
  async revokeSession(
    @Request() req,
    @Param("sessionId") sessionId: string,
    @Body() body: { reason: string },
  ) {
    await this.videoProtectionService.revokeSession(
      req.tenantId,
      sessionId,
      body.reason,
    );
    return { revoked: true };
  }

  /**
   * Admin: Get all active sessions for a student
   */
  @Get("admin/students/:studentId/sessions")
  @RequirePermission({ action: "read", resourceType: "analytics" })
  async getStudentSessions(
    @Request() req,
    @Param("studentId") studentId: string,
  ) {
    const sessions = await this.videoProtectionService.getActiveSessions(
      req.tenantId,
      studentId,
    );
    return { sessions };
  }

  /**
   * Verify playback token (for CDN/edge validation)
   */
  @Post("verify-token")
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() body: { token: string }) {
    const result = await this.videoProtectionService.verifyPlaybackToken(
      body.token,
    );
    return result;
  }
}
