import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export interface WatermarkPayload {
  studentName: string;
  studentPhone: string;
  studentId: string;
  tenantName: string;
  enrollmentId: string;
  issuedAt: number;
}

export interface WatermarkData {
  payload: WatermarkPayload;
  seed: bigint;
  signature: string;
  expiresAt: number;
}

export interface Position {
  x: number;
  y: number;
  rotate: number;
  opacity: number;
}

@Injectable()
export class WatermarkEngine {
  private readonly hmacSecret: string;
  private readonly tokenTtlMs: number;
  private readonly positionChangeIntervalSec: number;

  constructor(private configService: ConfigService) {
    this.hmacSecret =
      configService.get<string>("VIDEO_WATERMARK_HMAC_SECRET") ||
      "default-watermark-secret-change-in-production";
    this.tokenTtlMs =
      configService.get<number>("VIDEO_TOKEN_TTL_MS") || 5 * 60 * 1000; // 5 minutes default
    this.positionChangeIntervalSec =
      configService.get<number>("WATERMARK_POSITION_CHANGE_INTERVAL_SEC") || 7;
  }

  /**
   * Mulberry32 PRNG - deterministic, fast, good distribution
   * Same seed = same sequence of positions
   */
  private mulberry32(seed: number) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Generate deterministic position for a given step
   * Safe zones: 4-60% x, 6-82% y to avoid covering critical content
   */
  positionAt(seed: bigint, step: number, baseOpacity = 0.65): Position {
    const seedNumber = Number(seed & 0xffffffffn);
    const rand = this.mulberry32(seedNumber + step * 7919);
    return {
      x: 4 + rand() * 56, // 4% to 60%
      y: 6 + rand() * 76, // 6% to 82%
      rotate: -6 + rand() * 12, // -6 to +6 degrees
      opacity: Math.max(0.35, baseOpacity - 0.15 + rand() * 0.3), // 0.35 to 0.8
    };
  }

  /**
   * Generate all positions for a playback session
   * Returns array of positions for the entire video duration
   */
  generatePositionSequence(
    seed: bigint,
    videoDurationSec: number,
    baseOpacity = 0.65,
  ): Position[] {
    const positions: Position[] = [];
    const totalSteps = Math.ceil(
      videoDurationSec / this.positionChangeIntervalSec,
    );

    for (let step = 0; step < totalSteps; step++) {
      positions.push(this.positionAt(seed, step, baseOpacity));
    }

    return positions;
  }

  /**
   * Create HMAC-SHA256 signature for watermark payload
   * Payload: studentName|studentPhone|studentId|tenantName|enrollmentId|issuedAt|expiresAt|seed
   */
  signPayload(
    payload: WatermarkPayload,
    seed: bigint,
    expiresAt: number,
  ): string {
    const data = [
      payload.studentName,
      payload.studentPhone,
      payload.studentId,
      payload.tenantName,
      payload.enrollmentId,
      payload.issuedAt.toString(),
      expiresAt.toString(),
      seed.toString(),
    ].join("|");

    return crypto
      .createHmac("sha256", this.hmacSecret)
      .update(data)
      .digest("hex");
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(
    payload: WatermarkPayload,
    seed: bigint,
    expiresAt: number,
    signature: string,
  ): boolean {
    const expectedSignature = this.signPayload(payload, seed, expiresAt);
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  }

  /**
   * Generate cryptographically secure random seed for watermark
   */
  generateSeed(): bigint {
    const buffer = crypto.randomBytes(8);
    return buffer.readBigUInt64LE(0);
  }

  /**
   * Create watermark data for a playback session
   */
  createWatermarkData(
    payload: WatermarkPayload,
    videoDurationSec: number,
  ): WatermarkData {
    const seed = this.generateSeed();
    const issuedAt = Date.now();
    const expiresAt = issuedAt + this.tokenTtlMs;

    const signature = this.signPayload(payload, seed, expiresAt);
    const positions = this.generatePositionSequence(seed, videoDurationSec);

    return {
      payload,
      seed,
      signature,
      expiresAt,
    };
  }

  /**
   * Get position at specific timestamp (for client-side rendering)
   */
  getPositionAtTime(
    seed: bigint,
    timestampSec: number,
    baseOpacity = 0.65,
  ): Position {
    const step = Math.floor(timestampSec / this.positionChangeIntervalSec);
    return this.positionAt(seed, step, baseOpacity);
  }

  /**
   * Verify watermark data integrity (used by player to validate payload)
   */
  validateWatermarkData(data: WatermarkData): boolean {
    if (Date.now() > data.expiresAt) {
      return false; // Expired
    }
    return this.verifySignature(
      data.payload,
      data.seed,
      data.expiresAt,
      data.signature,
    );
  }

  getTokenTtlMs(): number {
    return this.tokenTtlMs;
  }

  getPositionChangeIntervalSec(): number {
    return this.positionChangeIntervalSec;
  }
}
