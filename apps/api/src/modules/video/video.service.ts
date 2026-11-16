import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
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
import { applyTenantContext } from "../../common/prisma/tenant-context";
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
   * Handle a provider webhook.
   *
   * The raw body is verified before any parsing so the HMAC covers exactly the
   * bytes the provider signed. The tenant comes from the request Host (the
   * provider posts to the tenant's public API origin), and every lookup/update
   * is scoped to it. The route is public at the HTTP layer but the provider
   * signature is the authentication boundary.
   */
  async handleProviderWebhook(
    providerName: string,
    tenantId: string,
    rawBody: Buffer | string | undefined,
    headers: Record<string, string>,
  ): Promise<{
    received: true;
    matched: boolean;
    videoId?: string;
    status?: VideoStatus;
    ignored?: string;
    duplicate?: boolean;
  }> {
    const normalizedProvider =
      providerName === "bunny" ? "bunny-stream" : providerName;
    const provider =
      this.videoProviderRegistry.getProvider(normalizedProvider);
    if (!provider) {
      throw new BadRequestException("Provider not found");
    }

    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException("Raw webhook body is required");
    }

    const isValid = await provider.verifyWebhook(rawBody, headers);
    if (!isValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    let payload: any;
    try {
      payload = JSON.parse(
        typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"),
      );
    } catch {
      throw new BadRequestException("Invalid webhook JSON");
    }

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("Invalid webhook payload");
    }

    const providerVideoId = String(
      payload.VideoGuid ??
        payload.videoGuid ??
        payload.videoId ??
        payload.providerVideoId ??
        "",
    ).trim();

    if (!providerVideoId) {
      return { received: true, matched: false, ignored: "MISSING_VIDEO_ID" };
    }

    const video = await this.prisma.video.findFirst({
      where: { tenantId, providerVideoId },
    });
    if (!video) {
      return { received: true, matched: false, ignored: "VIDEO_NOT_FOUND" };
    }
    if (video.status === VideoStatus.ARCHIVED) {
      return {
        received: true,
        matched: true,
        videoId: video.id,
        status: video.status,
        ignored: "ARCHIVED",
      };
    }

    const nextStatus = this.mapVideoWebhookStatus(payload);
    if (!nextStatus) {
      return {
        received: true,
        matched: true,
        videoId: video.id,
        ignored: "UNKNOWN_STATUS",
      };
    }

    // Do not let a late/out-of-order callback move a finished video backwards.
    if (
      nextStatus !== VideoStatus.FAILED &&
      this.videoStatusRank(nextStatus) < this.videoStatusRank(video.status)
    ) {
      return {
        received: true,
        matched: true,
        videoId: video.id,
        status: video.status,
        ignored: "STALE_STATUS",
      };
    }

    if (video.status === nextStatus) {
      return {
        received: true,
        matched: true,
        videoId: video.id,
        status: video.status,
        duplicate: true,
      };
    }

    const duration = this.positiveInt(
      payload.Length ?? payload.length ?? payload.duration,
    );
    const width = this.positiveInt(payload.Width ?? payload.width);
    const height = this.positiveInt(payload.Height ?? payload.height);
    const thumbnailUrl =
      payload.ThumbnailUrl ?? payload.thumbnailUrl ?? undefined;
    const errorMessage =
      payload.ErrorMessage ?? payload.errorMessage ?? payload.Message;

    const updated = await this.prisma.$transaction(async (tx) => {
      await applyTenantContext(tx, tenantId);

      const row = await tx.video.update({
        where: { id: video.id },
        data: {
          status: nextStatus,
          ...(duration !== null ? { duration } : {}),
          ...(width !== null ? { width } : {}),
          ...(height !== null ? { height } : {}),
          ...(typeof thumbnailUrl === "string" && thumbnailUrl
            ? { thumbnailUrl }
            : {}),
          ...(nextStatus === VideoStatus.READY
            ? { processedAt: new Date(), errorMessage: null }
            : {}),
          ...(nextStatus === VideoStatus.PUBLISHED
            ? { processedAt: new Date(), publishedAt: new Date() }
            : {}),
          ...(nextStatus === VideoStatus.FAILED
            ? {
                errorMessage:
                  typeof errorMessage === "string" && errorMessage
                    ? errorMessage
                    : "Provider reported a processing failure",
              }
            : {}),
        },
      });

      // The status update and the outbox row commit together. A retry after a
      // crash cannot leave a READY video with no event, and the duplicate
      // status check above prevents a replayed callback from publishing twice.
      await this.outboxService.publish(
        tenantId,
        {
          eventType: this.videoWebhookEventType(nextStatus),
          aggregateType: "video",
          aggregateId: video.id,
          payload: {
            videoId: video.id,
            provider: normalizedProvider,
            providerVideoId,
            status: nextStatus,
          },
        },
        tx,
      );

      return row;
    });

    await this.auditService.log({
      tenantId,
      action: "VIDEO_WEBHOOK_PROCESSED",
      resourceType: "video",
      resourceId: video.id,
      metadata: {
        provider: normalizedProvider,
        providerVideoId,
        status: nextStatus,
        eventType: payload.EventType ?? payload.eventType ?? null,
      },
    });

    return {
      received: true,
      matched: true,
      videoId: updated.id,
      status: updated.status,
    };
  }

  private mapVideoWebhookStatus(payload: any): VideoStatus | null {
    const numeric = Number(payload.Status ?? payload.status);
    if (Number.isFinite(numeric)) {
      const statusMap: Record<number, VideoStatus> = {
        0: VideoStatus.UPLOADING,
        1: VideoStatus.PROCESSING,
        2: VideoStatus.READY,
        3: VideoStatus.FAILED,
      };
      if (statusMap[numeric]) return statusMap[numeric];
    }

    const event = String(
      payload.EventType ?? payload.eventType ?? "",
    ).toLowerCase();
    if (event.includes("fail")) return VideoStatus.FAILED;
    if (
      event.includes("processed") ||
      event.includes("finished") ||
      event.includes("completed")
    ) {
      return VideoStatus.READY;
    }
    if (event.includes("processing") || event.includes("uploaded")) {
      return VideoStatus.PROCESSING;
    }
    if (event.includes("created")) return VideoStatus.UPLOADING;

    return null;
  }

  private videoStatusRank(status: VideoStatus): number {
    switch (status) {
      case VideoStatus.UPLOADING:
        return 0;
      case VideoStatus.PROCESSING:
        return 1;
      case VideoStatus.FAILED:
        return 1;
      case VideoStatus.READY:
        return 2;
      case VideoStatus.PUBLISHED:
        return 3;
      case VideoStatus.ARCHIVED:
        return 4;
      default:
        return 0;
    }
  }

  private videoWebhookEventType(status: VideoStatus): string {
    switch (status) {
      case VideoStatus.UPLOADING:
        return "video.upload.started";
      case VideoStatus.PROCESSING:
        return "video.processing.started";
      case VideoStatus.READY:
        return "video.processing.completed";
      case VideoStatus.FAILED:
        return "video.processing.failed";
      case VideoStatus.PUBLISHED:
        return "video.published";
      case VideoStatus.ARCHIVED:
        return "video.deleted";
      default:
        return "video.processing.completed";
    }
  }

  private positiveInt(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return Math.trunc(numeric);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
