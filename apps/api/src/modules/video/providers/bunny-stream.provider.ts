import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import {
  VideoProvider,
  CreateUploadInput,
  CreateUploadResult,
  VideoStatusResult,
  PlaybackTokenResult,
  DeleteVideoResult,
  WebhookPayload,
  VideoStatus,
  VideoWebhookEventType,
} from "./video-provider.interface";

@Injectable()
export class BunnyStreamProvider implements VideoProvider {
  readonly name = "bunny-stream";
  readonly supportedMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
  ];
  readonly maxFileSize = 50 * 1024 * 1024 * 1024; // 50GB

  private readonly apiKey: string;
  private readonly libraryId: string;
  private readonly baseUrl: string;
  private readonly cdnHostname: string;
  private readonly signingKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>("BUNNY_STREAM_API_KEY") || "";
    this.libraryId = configService.get<string>("BUNNY_STREAM_LIBRARY_ID") || "";
    this.baseUrl =
      configService.get<string>("BUNNY_STREAM_BASE_URL") ||
      "https://video.bunnycdn.com";
    this.cdnHostname =
      configService.get<string>("BUNNY_STREAM_CDN_HOSTNAME") || "";
    this.signingKey =
      configService.get<string>("BUNNY_STREAM_SIGNING_KEY") || "";

    if (!this.apiKey || !this.libraryId) {
      console.warn(
        "[BunnyStreamProvider] Missing required configuration (BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID)",
      );
    }
  }

  async createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
    if (!this.apiKey || !this.libraryId) {
      throw new BadRequestException("Bunny Stream not configured");
    }

    // Validate file type
    if (!this.supportedMimeTypes.includes(input.mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${input.mimeType}`);
    }

    if (input.fileSize > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize} bytes`,
      );
    }

    // Create video entry in Bunny Stream
    const response = await fetch(
      `${this.baseUrl}/library/${this.libraryId}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: input.fileName,
          // Store our internal IDs in custom data
          meta: {
            lessonId: input.lessonId,
            tenantId: input.tenantId,
            userId: input.userId,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(
        `Failed to create video in Bunny Stream: ${error}`,
      );
    }

    const data = (await response.json()) as {
      guid: string;
      title: string;
      status: number;
    };

    // Generate signed upload URL (TUS endpoint)
    const uploadUrl = `${this.baseUrl}/library/${this.libraryId}/videos/${data.guid}`;

    // Generate signed token for TUS upload
    const tusToken = this.generateTusToken(data.guid);

    // Upload URL expires in 24 hours
    const uploadUrlExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      uploadUrl: `${uploadUrl}?access_token=${tusToken}`,
      videoId: data.guid, // Using Bunny's GUID as our videoId
      providerVideoId: data.guid,
      uploadUrlExpiresAt,
      providerData: {
        tusEndpoint: uploadUrl,
        tusToken,
      },
    };
  }

  async getStatus(videoId: string): Promise<VideoStatusResult> {
    if (!this.apiKey || !this.libraryId) {
      throw new BadRequestException("Bunny Stream not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
      {
        headers: {
          AccessKey: this.apiKey,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundException(
          `Video ${videoId} not found in Bunny Stream`,
        );
      }
      const error = await response.text();
      throw new BadRequestException(`Failed to get video status: ${error}`);
    }

    const data = (await response.json()) as {
      guid: string;
      title: string;
      status: number;
      length: number;
      width: number;
      height: number;
      thumbnailUrl: string;
      storageSize: number;
      dateCreated: string;
    };

    // Map Bunny Stream status to our VideoStatus
    // 0 = Uploading, 1 = Processing, 2 = Ready, 3 = Failed
    const statusMap: Record<number, VideoStatus> = {
      0: "UPLOADING",
      1: "PROCESSING",
      2: "READY",
      3: "FAILED",
    };

    const status = statusMap[data.status] || "UPLOADING";

    // Bunny Stream CDN URLs
    const cdnBase = this.cdnHostname || `${this.libraryId}.b-cdn.net`;
    const hlsManifestUrl = `https://${cdnBase}/${videoId}/playlist.m3u8`;
    const dashManifestUrl = `https://${cdnBase}/${videoId}/manifest.mpd`;
    const thumbnailUrl =
      data.thumbnailUrl || `https://${cdnBase}/${data.guid}/thumbnail.jpg`;

    return {
      status,
      providerVideoId: data.guid,
      duration: data.length,
      width: data.width,
      height: data.height,
      hlsManifestUrl,
      dashManifestUrl,
      thumbnailUrl,
    };
  }

  async getPlaybackToken(
    videoId: string,
    sessionId: string,
    tenantId: string,
    studentId: string,
  ): Promise<PlaybackTokenResult> {
    if (!this.apiKey || !this.libraryId) {
      throw new BadRequestException("Bunny Stream not configured");
    }

    // Verify video exists and is ready
    const status = await this.getStatus(videoId);
    if (status.status !== "READY" && status.status !== "PUBLISHED") {
      throw new BadRequestException("Video not ready for playback");
    }

    // Bunny Stream uses signed URLs with token signing
    // Generate a short-lived signed token for playback
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const expires = Math.floor(expiresAt.getTime() / 1000);

    // Create token payload
    const tokenPayload = {
      videoId,
      sessionId,
      tenantId,
      studentId,
      exp: expires,
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign the token
    const token = this.signToken(tokenPayload);

    // Build playback URL with token
    const cdnBase = this.cdnHostname || `${this.libraryId}.b-cdn.net`;
    const playbackUrl = `https://${cdnBase}/${videoId}/playlist.m3u8?token=${token}`;

    return {
      playbackUrl,
      token,
      expiresAt,
    };
  }

  async deleteVideo(videoId: string): Promise<DeleteVideoResult> {
    if (!this.apiKey || !this.libraryId) {
      throw new BadRequestException("Bunny Stream not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/library/${this.libraryId}/videos/${videoId}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: this.apiKey,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, errorMessage: "Video not found" };
      }
      const error = await response.text();
      return {
        success: false,
        errorMessage: `Failed to delete video: ${error}`,
      };
    }

    return { success: true };
  }

  async handleWebhook(webhook: {
    eventType: string;
    providerVideoId: string;
    status: string;
    duration?: number;
    width?: number;
    height?: number;
    hlsManifestUrl?: string;
    dashManifestUrl?: string;
    thumbnailUrl?: string;
    errorMessage?: string;
    rawPayload: Record<string, any>;
  }): Promise<void> {
    // Map Bunny Stream webhook events to our internal event types
    const eventMap: Record<string, string> = {
      "video.created": "video.upload.started",
      "video.uploaded": "video.upload.completed",
      "video.processing": "video.processing.started",
      "video.processed": "video.processing.completed",
      "video.failed": "video.processing.failed",
      "video.deleted": "video.deleted",
    };

    const eventType =
      eventMap[webhook.rawPayload?.eventType || ""] ||
      "video.processing.completed";

    // Map Bunny status to our VideoStatus
    const statusMap: Record<number, string> = {
      0: "UPLOADING",
      1: "PROCESSING",
      2: "READY",
      3: "FAILED",
    };

    const status = statusMap[webhook.rawPayload?.status || 0] || "PROCESSING";

    const webhookPayload: import("./video-provider.interface").WebhookPayload =
      {
        eventType: eventType as any,
        providerVideoId: webhook.providerVideoId,
        status: status as any,
        duration: webhook.duration,
        width: webhook.width,
        height: webhook.height,
        hlsManifestUrl: webhook.hlsManifestUrl,
        dashManifestUrl: webhook.dashManifestUrl,
        thumbnailUrl: webhook.thumbnailUrl,
        errorMessage: webhook.errorMessage,
        rawPayload: webhook.rawPayload,
      };

    // The actual processing is handled by the VideoWebhookService
    // This provider just normalizes the payload
    console.log("[BunnyStreamProvider] Webhook received:", webhookPayload);
  }

  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
  ): Promise<boolean> {
    // Bunny Stream uses a secret key for webhook verification
    // The signature is in the 'X-Bunny-Signature' header
    const signature =
      headers["x-bunny-signature"] || headers["x-bunny-stream-signature"];

    if (!signature || !this.signingKey) {
      return Promise.resolve(false);
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.signingKey)
      .update(typeof payload === "string" ? payload : payload.toString())
      .digest("hex");

    return Promise.resolve(
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      ),
    );
  }

  private generateTusToken(videoGuid: string): string {
    // Generate a TUS upload token for Bunny Stream
    // This is a simplified implementation - Bunny uses specific token format
    const payload = {
      videoId: videoGuid,
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    };
    return this.signToken(payload);
  }

  private signToken(payload: Record<string, any>): string {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64url");
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = crypto
      .createHmac("sha256", this.signingKey || this.apiKey)
      .update(`${header}.${payloadB64}`)
      .digest("base64url");
    return `${header}.${payloadB64}.${signature}`;
  }
}
