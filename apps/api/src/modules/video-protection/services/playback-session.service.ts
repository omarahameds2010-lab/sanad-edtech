import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import { EntitlementsService } from '../../entitlements/entitlements.service';
import { SignedTokenService, VideoPlaybackToken } from './signed-token.service';
import { WatermarkEngine, WatermarkPayload } from './watermark-engine';
import { Prisma, PlaybackSessionStatus, RiskLevel, CaptureEventType, SecurityEventSeverity } from '@prisma/client';
import * as crypto from 'crypto';

export interface AuthorizePlaybackInput {
  lessonId: string;
  deviceId: string;
  deviceFingerprint: string;
  userAgent: string;
  ip: string;
}

export interface HeartbeatInput {
  sessionId: string;
  position: number;
  seekCount: number;
  visible: boolean;
  focused: boolean;
}

export interface CaptureEventInput {
  sessionId: string;
  eventType: CaptureEventType;
  metadata?: Record<string, any>;
}

export interface RiskSignals {
  concurrentSessions: number;
  deviceLimitExceeded: boolean;
  ipChangeDetected: boolean;
  rapidSeeking: boolean;
  abnormalPlaybackRate: boolean;
  captureEvents: number;
  watermarkTampered: boolean;
}

@Injectable()
export class PlaybackSessionService {
  private readonly maxConcurrentSessions: number;
  private readonly maxDevices: number;
  private readonly heartbeatTtlSec: number;
  private readonly riskThresholds = {
    medium: 30,
    high: 60,
  };

  constructor(
    private prisma: PrismaService,
    private entitlementsService: EntitlementsService,
    private signedTokenService: SignedTokenService,
    private watermarkEngine: WatermarkEngine,
  ) {
    this.maxConcurrentSessions = 1; // Default, overridden by tenant config
    this.maxDevices = 2; // Default, overridden by tenant config
    this.heartbeatTtlSec = 60; // 60 seconds grace period
  }

  /**
   * Authorize video playback and create a playback session
   */
  async authorizePlayback(
    studentId: string,
    tenantId: string,
    input: AuthorizePlaybackInput,
    tenantConfig: {
      maxConcurrentSessions: number;
      maxDevices: number;
      domainLock: boolean;
      captureProtection: boolean;
      watermark: {
        enabled: boolean;
        showName: boolean;
        showPhone: boolean;
        showStudentId: boolean;
        showTimestamp: boolean;
        dynamicPosition: boolean;
        positionChangeInterval: number;
        opacity: number;
        rotation: boolean;
        failurePolicy: 'STRICT' | 'BALANCED' | 'LOW_RISK';
      };
    },
  ): Promise<VideoPlaybackToken> {
    // 1. Check entitlement for the lesson
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: input.lessonId },
      include: { section: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    if (lesson.status !== 'PUBLISHED' && lesson.status !== 'READY') {
      throw new ForbiddenException('Lesson not available');
    }

    // Check if lesson is free or requires entitlement
    if (!lesson.isFree) {
      const hasEntitlement = await this.entitlementsService.hasEntitlement(
        studentId,
        'lesson',
        input.lessonId,
      );

      if (!hasEntitlement) {
        // Check course entitlement
        const courseEntitlement = await this.entitlementsService.hasEntitlement(
          studentId,
          'course',
          lesson.section.courseId,
        );

        if (!courseEntitlement) {
          await this.logSecurityEvent(tenantId, studentId, 'VIDEO_ACCESS_DENIED', SecurityEventSeverity.WARNING, {
            lessonId: input.lessonId,
            reason: 'NO_ENTITLEMENT',
          });
          throw new ForbiddenException({ code: 'NO_ENTITLEMENT', message: 'No active entitlement for this lesson' });
        }
      }
    }

    // 2. Get or register device
    const device = await this.getOrRegisterDevice(tenantId, studentId, input.deviceId, input.deviceFingerprint);

    // 3. Check device limit
    const deviceCount = await this.prisma.device.count({
      where: { userId: studentId, tenantId, revokedAt: null },
    });

    if (deviceCount > tenantConfig.maxDevices) {
      await this.logSecurityEvent(tenantId, studentId, 'DEVICE_LIMIT_EXCEEDED', SecurityEventSeverity.WARNING, {
        deviceCount,
        maxDevices: tenantConfig.maxDevices,
        deviceId: input.deviceId,
      });
      throw new ForbiddenException({ 
        code: 'DEVICE_LIMIT', 
        message: `Device limit exceeded. Max ${tenantConfig.maxDevices} devices allowed.` 
      });
    }

    // 4. Check concurrent session limit
    const activeSessions = await this.prisma.playbackSession.count({
      where: {
        tenantId,
        studentId,
        status: PlaybackSessionStatus.ACTIVE,
      },
    });

    if (activeSessions >= tenantConfig.maxConcurrentSessions) {
      // Revoke oldest session if single session policy
      if (tenantConfig.maxConcurrentSessions === 1) {
        const oldestSession = await this.prisma.playbackSession.findFirst({
          where: { tenantId, studentId, status: PlaybackSessionStatus.ACTIVE },
          orderBy: { startedAt: 'asc' },
        });

        if (oldestSession) {
          await this.revokeSession(oldestSession.id, 'NEW_SESSION_STARTED');
        }
      } else {
        await this.logSecurityEvent(tenantId, studentId, 'CONCURRENT_SESSION_LIMIT', SecurityEventSeverity.WARNING, {
          activeSessions,
          maxSessions: tenantConfig.maxConcurrentSessions,
        });
        throw new ForbiddenException({ 
          code: 'SESSION_CONFLICT', 
          message: 'Maximum concurrent sessions reached' 
        });
      }
    }

    // 5. Check for suspicious activity (IP change, etc.)
    const riskSignals = await this.evaluateRiskSignals(studentId, tenantId, input.ip, device.id);
    if (riskSignals.ipChangeDetected) {
      await this.logSecurityEvent(tenantId, studentId, 'IP_CHANGE_DETECTED', SecurityEventSeverity.WARNING, {
        sessionId: 'new',
        ip: input.ip,
      });
    }

    // 6. Get video info (from lesson or video provider)
    const videoId = lesson.videoId || `video-${lesson.id}`;
    const videoDurationSec = lesson.duration || 3600; // Default 1 hour if not set

    // 7. Build watermark payload
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const watermarkPayload: WatermarkPayload = {
      studentName: tenantConfig.watermark.showName ? student?.name || 'Student' : '',
      studentPhone: tenantConfig.watermark.showPhone ? student?.phone || '' : '',
      studentId: tenantConfig.watermark.showStudentId ? studentId : '',
      tenantName: tenant?.name || '',
      enrollmentId: '', // Could be populated from enrollment
      issuedAt: Date.now(),
    };

    // 8. Create playback session
    const session = await this.createPlaybackSession({
      tenantId,
      studentId,
      deviceId: device.id,
      lessonId: input.lessonId,
      videoId,
      watermarkPayload,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    // 9. Generate signed playback token
    const token = await this.signedTokenService.generateToken({
      lessonId: input.lessonId,
      videoId,
      studentId,
      playbackSessionId: session.id,
      watermarkPayload,
      videoDurationSec,
      tenantConfig: {
        maxConcurrentSessions: tenantConfig.maxConcurrentSessions,
        maxDevices: tenantConfig.maxDevices,
        domainLock: tenantConfig.domainLock,
        captureProtection: tenantConfig.captureProtection,
      },
    });

    // 10. Log audit
    await this.logSecurityEvent(tenantId, studentId, 'PLAYBACK_AUTHORIZED', SecurityEventSeverity.INFO, {
      sessionId: session.id,
      lessonId: input.lessonId,
      deviceId: device.id,
    });

    return token;
  }

  /**
   * Handle heartbeat from player
   */
  async handleHeartbeat(tenantId: string, studentId: string, input: HeartbeatInput): Promise<{
    action: 'ALLOW' | 'CHALLENGE' | 'REVOKE';
    videoToken?: string;
  }> {
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Playback session not found');
    }

    if (session.tenantId !== tenantId || session.studentId !== studentId) {
      throw new ForbiddenException('Session access denied');
    }

    if (session.status !== PlaybackSessionStatus.ACTIVE) {
      return { action: 'REVOKE' };
    }

    // Update last heartbeat
    await this.prisma.playbackSession.update({
      where: { id: input.sessionId },
      data: { lastHeartbeatAt: new Date() },
    });

    // Persist video progress into the LMS progress model
    const existing = await this.prisma.lessonProgress.findUnique({
      where: { tenantId_userId_lessonId: { tenantId, userId: studentId, lessonId: session.lessonId } },
    });
    const position = Math.max(0, Math.floor(input.position));
    await this.prisma.lessonProgress.upsert({
      where: { tenantId_userId_lessonId: { tenantId, userId: studentId, lessonId: session.lessonId } },
      create: { tenantId, userId: studentId, lessonId: session.lessonId, watchedSeconds: position, lastPosition: position },
      update: { watchedSeconds: Math.max(existing?.watchedSeconds ?? 0, position), lastPosition: position },
    });

    // Evaluate risk based on heartbeat data
    const riskScore = this.calculateRiskScore(input, session);
    const riskLevel = this.getRiskLevel(riskScore);

    // Update session risk score
    await this.prisma.playbackSession.update({
      where: { id: input.sessionId },
      data: { riskScore, riskLevel },
    });

    // Take action based on risk level
    if (riskLevel === RiskLevel.HIGH) {
      await this.revokeSession(input.sessionId, 'HIGH_RISK');
      return { action: 'REVOKE' };
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      // Could issue new token with tighter restrictions
      return { action: 'CHALLENGE' };
    }

    return { action: 'ALLOW' };
  }

  /**
   * Handle capture event from client (screenshot, screen recording, watermark tamper)
   */
  async handleCaptureEvent(tenantId: string, studentId: string, input: CaptureEventInput): Promise<void> {
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: input.sessionId },
    });

    if (!session || session.tenantId !== tenantId || session.studentId !== studentId) {
      return; // Silently ignore invalid sessions
    }

    // Log capture event
    await this.prisma.captureEvent.create({
      data: {
        tenantId,
        studentId,
        deviceId: session.deviceId,
        playbackSessionId: input.sessionId,
        videoId: session.videoId,
        eventType: input.eventType,
        metadata: input.metadata,
      },
    });

    // Update session risk score based on event type
    const riskIncrement = this.getCaptureEventRisk(input.eventType);
    const newRiskScore = Math.min(100, session.riskScore + riskIncrement);
    const newRiskLevel = this.getRiskLevel(newRiskScore);

    await this.prisma.playbackSession.update({
      where: { id: input.sessionId },
      data: { riskScore: newRiskScore, riskLevel: newRiskLevel },
    });

    // Log security event
    await this.logSecurityEvent(tenantId, studentId, `CAPTURE_${input.eventType}`, SecurityEventSeverity.WARNING, {
      sessionId: input.sessionId,
      riskIncrement,
      newRiskScore,
      metadata: input.metadata,
    });

    // Take action if risk is high
    if (newRiskLevel === RiskLevel.HIGH) {
      await this.revokeSession(input.sessionId, `CAPTURE_EVENT_${input.eventType}`);
    }
  }

  /**
   * End playback session
   */
  async endSession(tenantId: string, studentId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tenantId !== tenantId || session.studentId !== studentId) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.playbackSession.update({
      where: { id: sessionId },
      data: {
        status: PlaybackSessionStatus.ENDED,
        endedAt: new Date(),
      },
    });

    await this.logSecurityEvent(tenantId, studentId, 'PLAYBACK_ENDED', SecurityEventSeverity.INFO, {
      sessionId,
      duration: Date.now() - session.startedAt.getTime(),
    });
  }

  /**
   * Revoke a playback session
   */
  async revokeSession(sessionId: string, reason: string): Promise<void> {
    await this.prisma.playbackSession.update({
      where: { id: sessionId },
      data: {
        status: PlaybackSessionStatus.REVOKED,
        endedAt: new Date(),
      },
    });
  }

  /**
   * Get active sessions for a student
   */
  async getActiveSessions(tenantId: string, studentId: string) {
    return this.prisma.playbackSession.findMany({
      where: {
        tenantId,
        studentId,
        status: PlaybackSessionStatus.ACTIVE,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  /**
   * Get session details
   */
  async getSession(tenantId: string, studentId: string, sessionId: string) {
    const session = await this.prisma.playbackSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tenantId !== tenantId || session.studentId !== studentId) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  /**
   * Cleanup stale sessions (cron job)
   */
  async cleanupStaleSessions(): Promise<number> {
    const staleThreshold = new Date(Date.now() - this.heartbeatTtlSec * 1000);

    const result = await this.prisma.playbackSession.updateMany({
      where: {
        status: PlaybackSessionStatus.ACTIVE,
        lastHeartbeatAt: { lt: staleThreshold },
      },
      data: {
        status: PlaybackSessionStatus.ENDED,
        endedAt: new Date(),
      },
    });

    return result.count;
  }

  // Private helper methods

  private async getOrRegisterDevice(
    tenantId: string,
    studentId: string,
    deviceId: string,
    fingerprint: string,
  ) {
    let device = await this.prisma.device.findUnique({
      where: { tenantId_fingerprint: { tenantId, fingerprint } },
    });

    if (!device) {
      device = await this.prisma.device.create({
        data: {
          tenantId,
          userId: studentId,
          fingerprint,
        },
      });
    } else {
      // Update last seen
      await this.prisma.device.update({
        where: { id: device.id },
        data: { lastSeen: new Date() },
      });
    }

    return device;
  }

  private async createPlaybackSession(params: {
    tenantId: string;
    studentId: string;
    deviceId: string;
    lessonId: string;
    videoId: string;
    watermarkPayload: WatermarkPayload;
    ip: string;
    userAgent: string;
  }) {
    const watermarkData = this.watermarkEngine.createWatermarkData(params.watermarkPayload, 3600);

    return this.prisma.playbackSession.create({
      data: {
        tenantId: params.tenantId,
        studentId: params.studentId,
        deviceId: params.deviceId,
        lessonId: params.lessonId,
        videoId: params.videoId,
        watermarkSeed: watermarkData.seed,
        watermarkPayload: {
          ...params.watermarkPayload,
          seed: watermarkData.seed.toString(),
          signature: watermarkData.signature,
          expiresAt: watermarkData.expiresAt,
        } as Prisma.InputJsonValue,
        ipHash: this.hashValue(params.ip),
        userAgentHash: this.hashValue(params.userAgent),
        status: PlaybackSessionStatus.ACTIVE,
      },
    });
  }

  private async evaluateRiskSignals(
    studentId: string,
    tenantId: string,
    currentIp: string,
    deviceId: string,
  ): Promise<RiskSignals> {
    // Check recent sessions for IP changes
    const recentSessions = await this.prisma.playbackSession.findMany({
      where: {
        tenantId,
        studentId,
        startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
      select: { ipHash: true, deviceId: true },
    });

    const uniqueIps = new Set(recentSessions.map(s => s.ipHash)).size;
    const uniqueDevices = new Set(recentSessions.map(s => s.deviceId)).size;
    const currentIpHash = this.hashValue(currentIp);

    const ipChangeDetected = recentSessions.length > 0 && 
      !recentSessions.some(s => s.ipHash === currentIpHash);

    return {
      concurrentSessions: await this.prisma.playbackSession.count({
        where: { tenantId, studentId, status: PlaybackSessionStatus.ACTIVE },
      }),
      deviceLimitExceeded: uniqueDevices > this.maxDevices,
      ipChangeDetected,
      rapidSeeking: false,
      abnormalPlaybackRate: false,
      captureEvents: 0,
      watermarkTampered: false,
    };
  }

  private calculateRiskScore(input: HeartbeatInput, session: any): number {
    let score = session.riskScore || 0;

    // Rapid seeking detection
    if (input.seekCount > 10) {
      score += 15;
    }

    // Visibility/focus loss
    if (!input.visible) score += 10;
    if (!input.focused) score += 10;

    // Position anomalies (seeking backwards/forwards rapidly)
    // This would need more sophisticated tracking

    return Math.min(100, score);
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= this.riskThresholds.high) return RiskLevel.HIGH;
    if (score >= this.riskThresholds.medium) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private getCaptureEventRisk(eventType: CaptureEventType): number {
    switch (eventType) {
      case CaptureEventType.WATERMARK_TAMPERED:
        return 50;
      case CaptureEventType.SCREEN_RECORDING_DETECTED:
        return 40;
      case CaptureEventType.SCREENSHOT:
        return 25;
      case CaptureEventType.DEVTOOLS_SUSPECTED:
        return 20;
      case CaptureEventType.PLAYER_HIDDEN:
        return 30;
      case CaptureEventType.FOCUS_LOST:
        return 5;
      default:
        return 10;
    }
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 32);
  }

  private async logSecurityEvent(
    tenantId: string,
    userId: string,
    eventType: string,
    severity: SecurityEventSeverity,
    metadata: Record<string, any>,
  ) {
    await this.prisma.securityEvent.create({
      data: {
        tenantId,
        userId,
        eventType,
        severity,
        metadata: metadata as Prisma.InputJsonValue,
        ipHash: metadata.ip ? this.hashValue(metadata.ip) : null,
        deviceId: metadata.deviceId,
        requestId: metadata.requestId,
      },
    });
  }
}