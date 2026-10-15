import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import { ConfigService } from "@nestjs/config";
import { VideoProviderRegistry } from "./providers/video-provider.registry";
import { FeatureFlagsService } from "../feature-flags/feature-flags.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { AuditService } from "../audit/audit.service";
import { OutboxService } from "../outbox/outbox.service";
import { Prisma, VideoStatus } from "@prisma/client";
import * as crypto from "crypto";

export interface CreateVideoInput {
  lessonId: string;
  title: string;
  description?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface AttachYouTubeInput {
  lessonId: string;
  title: string;
  providerVideoId: string;
  description?: string;
}

export interface VideoQuotaResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    fileSize: number;
    storedHours: number;
  };
  limits: {
    maxFileSize: number;
    maxStoredHours: number;
  };
}

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private videoProviderRegistry: VideoProviderRegistry,
    private featureFlagsService: FeatureFlagsService,
    private entitlementsService: EntitlementsService,
    private auditService: AuditService,
    private outboxService: OutboxService,
  ) {}

  /**
   * Get tenant video quotas from config or use defaults
   */
  private getTenantQuotas(tenantId: string): {
    maxFileSize: number;
    maxStoredHours: number;
  } {
    const defaultQuotas = {
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB default
      maxStoredHours: 100, // 100 hours default
    };

    // In a real implementation, this would come from tenant config or plan
    return defaultQuotas;
  }

  /**
   * Check tenant video quotas before allowing upload
   */
  async checkQuotas(
    tenantId: string,
    fileSize: number,
  ): Promise<VideoQuotaResult> {
    const quotas = this.getTenantQuotas(tenantId);

    // Get current usage
    const [totalSize, totalHours] = await Promise.all([
      this.prisma.video.aggregate({
        where: { tenantId, status: { not: "ARCHIVED" } },
        _sum: { fileSize: true },
      }),
      this.prisma.video.aggregate({
        where: { tenantId, status: { not: "ARCHIVED" } },
        _sum: { duration: true },
      }),
    ]);

    const currentFileSize = Number(totalSize._sum.fileSize || 0);
    const currentStoredHours = Math.ceil(
      Number(totalHours._sum.duration || 0) / 3600,
    );

    const newFileSize = currentFileSize + fileSize;
    const newStoredHours = currentStoredHours + Math.ceil(0); // Duration unknown at upload time

    if (newFileSize > quotas.maxFileSize) {
      return {
        allowed: false,
        reason: `File size would exceed tenant quota of ${this.formatBytes(quotas.maxFileSize)}`,
        currentUsage: {
          fileSize: currentFileSize,
          storedHours: currentStoredHours,
        },
        limits: {
          maxFileSize: quotas.maxFileSize,
          maxStoredHours: quotas.maxStoredHours,
        },
      };
    }

    if (newStoredHours > quotas.maxStoredHours) {
      return {
        allowed: false,
        reason: `Stored hours would exceed tenant quota of ${quotas.maxStoredHours} hours`,
        currentUsage: {
          fileSize: currentFileSize,
          storedHours: currentStoredHours,
        },
        limits: {
          maxFileSize: quotas.maxFileSize,
          maxStoredHours: quotas.maxStoredHours,
        },
      };
    }

    return {
      allowed: true,
      currentUsage: {
        fileSize: currentFileSize,
        storedHours: currentStoredHours,
      },
      limits: {
        maxFileSize: quotas.maxFileSize,
        maxStoredHours: quotas.maxStoredHours,
      },
    };
  }

  /**
   * Create a video entry and get signed upload URL
   */
  async createVideo(
    tenantId: string,
    userId: string,
    input: {
      lessonId: string;
      title: string;
      description?: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
    },
    providerName?: string,
  ) {
    // Check feature flag
    const flags = await this.featureFlagsService.getTenantFlags(tenantId);
    if (!flags.videoPlayback?.enabled) {
      throw new ForbiddenException("Video uploads not enabled for this tenant");
    }

    // Verify lesson exists and user has access
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: input.lessonId, tenantId },
      include: { section: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    if (lesson.type !== "VIDEO") {
      throw new BadRequestException("Lesson is not a video type");
    }

    // Check quotas
    const quotaCheck = await this.checkQuotas(tenantId, input.fileSize);
    if (!quotaCheck.allowed) {
      throw new BadRequestException(quotaCheck.reason);
    }

    // Get provider
    const provider = this.videoProviderRegistry.getProvider(providerName);
    if (!provider) {
      throw new BadRequestException("Video provider not available");
    }

    // Check file type and size against provider limits
    if (!provider.supportedMimeTypes.includes(input.mimeType)) {
      throw new BadRequestException(
        `File type ${input.mimeType} not supported by provider`,
      );
    }

    if (input.fileSize > provider.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds provider limit of ${this.formatBytes(provider.maxFileSize)}`,
      );
    }

    // Create video record in database
    const video = await this.prisma.video.create({
      data: {
        tenantId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        status: "UPLOADING",
        provider: "bunny-stream", // default provider
        fileSize: BigInt(input.fileSize),
        mimeType: input.mimeType,
        uploadedBy: userId,
        uploadedAt: new Date(),
      },
    });

    // Create signed upload URL via provider
    const providerResult = await this.videoProviderRegistry
      .getProvider()
      .createUpload({
        lessonId: input.lessonId,
        tenantId,
        userId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      });

    // Update video with provider info
    const updatedVideo = await this.prisma.video.update({
      where: { id: video.id },
      data: {
        provider:
          this.videoProviderRegistry.getDefaultProvider()?.name ||
          "bunny-stream",
        providerVideoId: providerResult.providerVideoId,
        providerUploadUrl: providerResult.uploadUrl,
        uploadUrlExpiresAt: providerResult.uploadUrlExpiresAt,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: "VIDEO_UPLOAD_INITIATED",
      resourceType: "video",
      resourceId: updatedVideo.id,
      metadata: {
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        provider: updatedVideo.provider,
        providerVideoId: updatedVideo.providerVideoId,
      },
    });

    // Publish event
    await this.outboxService.publish(tenantId, {
      eventType: "video.upload.initiated",
      aggregateType: "video",
      aggregateId: updatedVideo.id,
      payload: {
        videoId: updatedVideo.id,
        provider: updatedVideo.provider,
        providerVideoId: updatedVideo.providerVideoId,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      },
    });

    return {
      video: updatedVideo,
      uploadUrl: providerResult.uploadUrl,
      uploadUrlExpiresAt: providerResult.uploadUrlExpiresAt,
    };
  }

  /**
   * Get video status from provider
   */
  async syncVideoStatus(videoId: string, tenantId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, tenantId },
    });

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const provider = this.videoProviderRegistry.getProvider(video.provider);
    if (!provider) {
      throw new BadRequestException("Video provider not available");
    }

    const status = await provider.getStatus(video.providerVideoId!);

    // Update video status
    const updatedVideo = await this.prisma.video.update({
      where: { id: videoId },
      data: {
        status: status.status,
        duration: status.duration,
        width: status.width,
        height: status.height,
        hlsManifestUrl: status.hlsManifestUrl,
        dashManifestUrl: status.dashManifestUrl,
        thumbnailUrl: status.thumbnailUrl,
        errorMessage: status.errorMessage,
        processedAt: ["READY", "PUBLISHED"].includes(status.status)
          ? new Date()
          : null,
        publishedAt: status.status === "PUBLISHED" ? new Date() : null,
      },
    });

    return updatedVideo;
  }

  /**
   * Get playback token for a video
   */
  async getPlaybackToken(
    tenantId: string,
    videoId: string,
    sessionId: string,
    studentId: string,
  ) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, tenantId },
    });

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    // Check video is ready for playback
    if (!["READY", "PUBLISHED"].includes(video.status)) {
      throw new ForbiddenException("Video not ready for playback");
    }

    const provider = this.videoProviderRegistry.getProvider(video.provider);
    if (!provider) {
      throw new BadRequestException("Video provider not available");
    }

    const tokenResult = await provider.getPlaybackToken(
      video.providerVideoId!,
      sessionId,
      tenantId,
      studentId,
    );

    return {
      playbackUrl: tokenResult.playbackUrl,
      token: tokenResult.token,
      expiresAt: tokenResult.expiresAt,
      drm: tokenResult.drm,
    };
  }

  /**
   * Delete video
   */
  async deleteVideo(tenantId: string, videoId: string, userId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, tenantId },
    });

    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const provider = this.videoProviderRegistry.getProvider(video.provider);
    if (!provider) {
      throw new BadRequestException("Video provider not available");
    }

    const result = await provider.deleteVideo(video.providerVideoId!);

    if (!result.success) {
      throw new BadRequestException(
        result.errorMessage || "Failed to delete video from provider",
      );
    }

    // Mark as archived instead of deleting (for audit trail)
    await this.prisma.video.update({
      where: { id: videoId },
      data: { status: "ARCHIVED" },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: "VIDEO_DELETED",
      resourceType: "video",
      resourceId: videoId,
      metadata: {
        provider: video.provider,
        providerVideoId: video.providerVideoId,
      },
    });

    // Publish event
    await this.outboxService.publish(tenantId, {
      eventType: "video.deleted",
      aggregateType: "video",
      aggregateId: videoId,
      payload: {
        videoId,
        provider: video.provider,
        providerVideoId: video.providerVideoId,
      },
    });

    return { success: true };
  }

  /**
   * Get video by ID with tenant check
   */
  async getVideo(tenantId: string, videoId: string) {
    return this.prisma.video.findFirst({
      where: { id: videoId, tenantId },
    });
  }

  /**
   * List videos for a lesson
   */
  async listVideosByLesson(tenantId: string, lessonId: string) {
    return this.prisma.video.findMany({
      where: { lessonId, tenantId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Attach a YouTube UNLISTED video to a lesson. This is the urgent path
   * for teachers: no upload pipeline, no provider keys — the student
   * player already embeds providerVideoId. Only one active YouTube
   * video per lesson (re-attach = delete + attach).
   */
  async attachYouTubeVideo(
    tenantId: string,
    userId: string,
    input: AttachYouTubeInput,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: input.lessonId, tenantId },
    });
    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const videoId = input.providerVideoId.trim();
    if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      throw new BadRequestException("Invalid YouTube video id");
    }

    const existing = await this.prisma.video.findFirst({
      where: {
        tenantId,
        lessonId: input.lessonId,
        provider: "youtube",
        status: { in: [VideoStatus.READY, VideoStatus.PUBLISHED] },
      },
    });
    if (existing) {
      throw new ConflictException(
        "Lesson already has a YouTube video (delete it first to replace)",
      );
    }

    const video = await this.prisma.video.create({
      data: {
        tenantId,
        lessonId: input.lessonId,
        title: input.title,
        description: input.description,
        status: VideoStatus.READY,
        provider: "youtube",
        providerVideoId: videoId,
        uploadedBy: userId,
        uploadedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    await this.auditService.log({
      tenantId,
      actorUserId: userId,
      action: "VIDEO_YOUTUBE_ATTACHED",
      resourceType: "video",
      resourceId: video.id,
      metadata: { lessonId: input.lessonId, providerVideoId: videoId },
    });

    return video;
  }

  /**
   * Handle provider webhook
   */
  async handleProviderWebhook(
    providerName: string,
    payload: any,
    headers: Record<string, string>,
  ) {
    const provider = this.videoProviderRegistry.getProvider(providerName);
    if (!provider) {
      throw new BadRequestException("Provider not found");
    }

    // Verify webhook signature
    const isValid = await provider.verifyWebhook(payload, headers);
    if (!isValid) {
      throw new BadRequestException("Invalid webhook signature");
    }

    // Process webhook
    await provider.handleWebhook(payload);

    // Log webhook
    await this.auditService.log({
      tenantId: "system",
      actorUserId: undefined,
      action: "VIDEO_WEBHOOK_RECEIVED",
      resourceType: "video",
      resourceId: payload.providerVideoId,
      metadata: { provider: providerName, eventType: payload.eventType },
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
