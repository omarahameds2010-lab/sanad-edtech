import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import {
  PlaybackSessionService,
  AuthorizePlaybackInput,
} from "./services/playback-session.service";
import {
  SignedTokenService,
  VideoPlaybackToken,
} from "./services/signed-token.service";

interface TenantVideoConfig {
  videoSecurity?: {
    watermark?: {
      enabled?: boolean;
      showName?: boolean;
      showPhone?: boolean;
      showStudentId?: boolean;
      showTimestamp?: boolean;
      dynamicPosition?: boolean;
      positionChangeInterval?: number;
      opacity?: number;
      rotation?: boolean;
      failurePolicy?: "STRICT" | "BALANCED" | "LOW_RISK";
    };
    deviceLimit?: number;
    singleActiveSession?: boolean;
    signedPlaybackTokens?: boolean;
    domainLock?: boolean;
    captureProtection?: {
      native?: boolean;
      webBestEffort?: boolean;
      onCapture?: string;
    };
    suspiciousActivityDetection?: boolean;
  };
}

@Injectable()
export class VideoProtectionService {
  constructor(
    private prisma: PrismaService,
    private featureFlagsService: FeatureFlagsService,
    private playbackSessionService: PlaybackSessionService,
    private signedTokenService: SignedTokenService,
  ) {}

  /**
   * Get tenant video security configuration
   */
  async getTenantVideoConfig(tenantId: string) {
    const tenantConfig = await this.prisma.tenantConfig.findUnique({
      where: { tenantId },
    });

    const flags = await this.featureFlagsService.getTenantFlags(tenantId);

    // Default video security config
    const defaultConfig = {
      videoSecurity: {
        watermark: {
          enabled: flags.videoPlayback?.enabled ?? true,
          showName: true,
          showPhone: true,
          showStudentId: true,
          showTimestamp: true,
          dynamicPosition: true,
          positionChangeInterval: 7,
          opacity: 0.65,
          rotation: true,
          failurePolicy: "BALANCED" as const,
        },
        deviceLimit: 2,
        singleActiveSession: true,
        signedPlaybackTokens: true,
        domainLock: true,
        captureProtection: {
          native: true,
          webBestEffort: true,
          onCapture: "BLACKOUT_AND_PAUSE" as const,
        },
        suspiciousActivityDetection: true,
      },
    };

    // Merge with tenant config
    const tenantVideoConfig = (tenantConfig?.config as TenantVideoConfig) || {};
    if (tenantVideoConfig.videoSecurity) {
      return {
        ...defaultConfig,
        videoSecurity: {
          ...defaultConfig.videoSecurity,
          ...tenantVideoConfig.videoSecurity,
          watermark: {
            ...defaultConfig.videoSecurity.watermark,
            ...tenantVideoConfig.videoSecurity.watermark,
          },
          captureProtection: {
            ...defaultConfig.videoSecurity.captureProtection,
            ...tenantVideoConfig.videoSecurity.captureProtection,
          },
        },
      };
    }

    return defaultConfig;
  }

  /**
   * Authorize video playback for a student
   */
  async authorizePlayback(
    studentId: string,
    tenantId: string,
    input: AuthorizePlaybackInput,
  ): Promise<VideoPlaybackToken> {
    // Verify student belongs to tenant
    const student = await this.prisma.user.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new ForbiddenException("Student not found in tenant");
    }

    if (student.status !== "ACTIVE") {
      throw new ForbiddenException("Student account not active");
    }

    // Get tenant video config
    const tenantConfig = await this.getTenantVideoConfig(tenantId);
    const videoConfig = tenantConfig.videoSecurity;

    // Check if video playback is enabled via feature flag
    if (!videoConfig.watermark.enabled) {
      throw new ForbiddenException(
        "Video playback not enabled for this tenant",
      );
    }

    // Delegate to playback session service
    return this.playbackSessionService.authorizePlayback(
      studentId,
      tenantId,
      input,
      {
        maxConcurrentSessions: videoConfig.singleActiveSession
          ? 1
          : videoConfig.deviceLimit,
        maxDevices: videoConfig.deviceLimit,
        domainLock: videoConfig.domainLock,
        captureProtection:
          videoConfig.captureProtection.native ||
          videoConfig.captureProtection.webBestEffort,
        watermark: videoConfig.watermark,
      },
    );
  }

  /**
   * Handle heartbeat from video player
   */
  async handleHeartbeat(
    tenantId: string,
    studentId: string,
    input: {
      sessionId: string;
      position: number;
      seekCount: number;
      visible: boolean;
      focused: boolean;
    },
  ) {
    return this.playbackSessionService.handleHeartbeat(
      tenantId,
      studentId,
      input,
    );
  }

  /**
   * Handle capture event from player
   */
  async handleCaptureEvent(
    tenantId: string,
    studentId: string,
    input: {
      sessionId: string;
      eventType: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.playbackSessionService.handleCaptureEvent(tenantId, studentId, {
      sessionId: input.sessionId,
      eventType: input.eventType as any,
      metadata: input.metadata,
    });
  }

  /**
   * End playback session
   */
  async endSession(tenantId: string, studentId: string, sessionId: string) {
    return this.playbackSessionService.endSession(
      tenantId,
      studentId,
      sessionId,
    );
  }

  /**
   * Get active sessions for student
   */
  async getActiveSessions(tenantId: string, studentId: string) {
    return this.playbackSessionService.getActiveSessions(tenantId, studentId);
  }

  /**
   * Revoke a specific session (admin/teacher action)
   */
  async revokeSession(tenantId: string, sessionId: string, reason: string) {
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tenantId !== tenantId) {
      throw new ForbiddenException("Session not found");
    }

    return this.playbackSessionService.revokeSession(sessionId, reason);
  }

  /**
   * Verify a playback token (used by CDN/edge)
   */
  async verifyPlaybackToken(token: string): Promise<{
    valid: boolean;
    payload?: any;
  }> {
    const payload = this.signedTokenService.verifyToken(token);
    if (!payload) {
      return { valid: false };
    }

    // Verify session still exists and is active
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: payload.playbackSessionId },
    });

    if (!session || session.status !== "ACTIVE") {
      return { valid: false };
    }

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return { valid: false };
    }

    return { valid: true, payload };
  }

  /**
   * Get video security stats for tenant (admin dashboard)
   */
  async getVideoSecurityStats(tenantId: string) {
    const [
      activeSessions,
      totalSessionsToday,
      captureEvents,
      securityEvents,
      revokedSessions,
    ] = await Promise.all([
      this.prisma.playbackSession.count({
        where: { tenantId, status: "ACTIVE" },
      }),
      this.prisma.playbackSession.count({
        where: {
          tenantId,
          startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.captureEvent.count({
        where: {
          tenantId,
          detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.securityEvent.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          eventType: { startsWith: "VIDEO" },
        },
      }),
      this.prisma.playbackSession.count({
        where: {
          tenantId,
          status: "REVOKED",
          endedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      activeSessions,
      totalSessionsToday,
      captureEvents24h: captureEvents,
      securityEvents24h: securityEvents,
      revokedSessions24h: revokedSessions,
    };
  }
}
