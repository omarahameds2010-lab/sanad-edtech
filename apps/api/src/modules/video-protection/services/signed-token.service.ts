import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WatermarkEngine, WatermarkPayload } from './watermark-engine';

export interface VideoPlaybackToken {
  token: string;
  expiresAt: number;
  lessonId: string;
  videoId: string;
  studentId: string;
  playbackSessionId: string;
  watermark: {
    payload: WatermarkPayload;
    seed: string; // base64 encoded bigint
    signature: string;
    positions: Array<{ x: number; y: number; rotate: number; opacity: number }>;
  };
  policy: {
    maxConcurrentSessions: number;
    maxDevices: number;
    domainLock: boolean;
    captureProtection: boolean;
  };
}

export interface TokenPayload {
  lessonId: string;
  videoId: string;
  studentId: string;
  playbackSessionId: string;
  issuedAt: number;
  expiresAt: number;
  watermarkSeed: string;
  watermarkSignature: string;
  policyHash: string;
}

@Injectable()
export class SignedTokenService {
  private readonly tokenSecret: string;
  private readonly tokenTtlMs: number;
  private readonly issuer: string;

  constructor(
    private configService: ConfigService,
    private watermarkEngine: WatermarkEngine,
  ) {
    this.tokenSecret = configService.get<string>('VIDEO_TOKEN_SECRET') || 'default-video-token-secret-change-in-production';
    this.tokenTtlMs = configService.get<number>('VIDEO_TOKEN_TTL_MS') || 5 * 60 * 1000; // 5 minutes
    this.issuer = configService.get<string>('VIDEO_TOKEN_ISSUER') || 'learning-platform';
  }

  /**
   * Generate a signed video playback token with embedded watermark data
   */
  async generateToken(params: {
    lessonId: string;
    videoId: string;
    studentId: string;
    playbackSessionId: string;
    watermarkPayload: WatermarkPayload;
    videoDurationSec: number;
    tenantConfig: {
      maxConcurrentSessions: number;
      maxDevices: number;
      domainLock: boolean;
      captureProtection: boolean;
    };
  }): Promise<VideoPlaybackToken> {
    const { lessonId, videoId, studentId, playbackSessionId, watermarkPayload, videoDurationSec, tenantConfig } = params;

    const issuedAt = Date.now();
    const expiresAt = issuedAt + this.tokenTtlMs;

    // Generate watermark data
    const watermarkData = this.watermarkEngine.createWatermarkData(watermarkPayload, videoDurationSec);

    // Generate positions for the token (client will use these)
    const positions = this.watermarkEngine.generatePositionSequence(
      watermarkData.seed,
      videoDurationSec,
    );

    // Create policy hash for integrity
    const policyString = JSON.stringify(tenantConfig);
    const policyHash = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(policyString)
      .digest('hex')
      .substring(0, 16);

    // Create token payload
    const payload: TokenPayload = {
      lessonId,
      videoId,
      studentId,
      playbackSessionId,
      issuedAt,
      expiresAt,
      watermarkSeed: watermarkData.seed.toString(),
      watermarkSignature: watermarkData.signature,
      policyHash,
    };

    // Sign the token (JWT-like but custom for video)
    const token = this.signToken(payload);

    return {
      token,
      expiresAt,
      lessonId,
      videoId,
      studentId,
      playbackSessionId,
      watermark: {
        payload: watermarkPayload,
        seed: watermarkData.seed.toString(),
        signature: watermarkData.signature,
        positions,
      },
      policy: tenantConfig,
    };
  }

  /**
   * Sign token payload using HMAC-SHA256
   */
  private signToken(payload: TokenPayload): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(`${header}.${payloadB64}`)
      .digest('base64url');

    return `${header}.${payloadB64}.${signature}`;
  }

  /**
   * Verify and decode a video playback token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [headerB64, payloadB64, signature] = parts;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.tokenSecret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      // Decode payload
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as TokenPayload;

      // Check expiration
      if (Date.now() > payload.expiresAt) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Verify watermark data from token
   */
  verifyWatermarkFromToken(token: string): {
    valid: boolean;
    watermarkPayload?: WatermarkPayload;
    seed?: bigint;
    expiresAt?: number;
  } {
    const payload = this.verifyToken(token);
    if (!payload) {
      return { valid: false };
    }

    const seed = BigInt(payload.watermarkSeed);
    const isValid = this.watermarkEngine.verifySignature(
      {
        studentName: '', // Will be filled from context
        studentPhone: '',
        studentId: '',
        tenantName: '',
        enrollmentId: '',
        issuedAt: payload.issuedAt,
      },
      seed,
      payload.expiresAt,
      payload.watermarkSignature,
    );

    return {
      valid: isValid,
      seed,
      expiresAt: payload.expiresAt,
    };
  }

  /**
   * Extract playback session ID from token without full verification
   * Used for quick lookup in heartbeat
   */
  extractPlaybackSessionId(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payloadB64 = parts[1];
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as TokenPayload;
      return payload.playbackSessionId;
    } catch {
      return null;
    }
  }

  /**
   * Get token TTL in milliseconds
   */
  getTokenTtlMs(): number {
    return this.tokenTtlMs;
  }
}