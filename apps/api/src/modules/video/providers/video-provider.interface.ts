export interface CreateUploadInput {
  lessonId: string;
  tenantId: string;
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface CreateUploadResult {
  uploadUrl: string;
  videoId: string;
  providerVideoId?: string;
  uploadUrlExpiresAt: Date;
  providerData?: Record<string, any>;
}

export interface VideoStatusResult {
  status: VideoStatus;
  providerVideoId?: string;
  duration?: number;
  width?: number;
  height?: number;
  hlsManifestUrl?: string;
  dashManifestUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
}

export interface PlaybackTokenResult {
  playbackUrl: string;
  token: string;
  expiresAt: Date;
  drm?: {
    licenseUrl: string;
    certificateUrl?: string;
  };
}

export interface DeleteVideoResult {
  success: boolean;
  errorMessage?: string;
}

export interface WebhookPayload {
  eventType: VideoWebhookEventType;
  providerVideoId: string;
  status: VideoStatus;
  duration?: number;
  width?: number;
  height?: number;
  hlsManifestUrl?: string;
  dashManifestUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  rawPayload: Record<string, any>;
}

export type VideoStatus =
  "UPLOADING" | "PROCESSING" | "READY" | "PUBLISHED" | "FAILED" | "ARCHIVED";

export type VideoWebhookEventType =
  | "video.upload.started"
  | "video.upload.completed"
  | "video.processing.started"
  | "video.processing.completed"
  | "video.processing.failed"
  | "video.published"
  | "video.deleted";

export interface VideoProvider {
  readonly name: string;
  readonly supportedMimeTypes: string[];
  readonly maxFileSize: number;

  createUpload(input: CreateUploadInput): Promise<CreateUploadResult>;
  getStatus(videoId: string): Promise<VideoStatusResult>;
  getPlaybackToken(
    videoId: string,
    sessionId: string,
    tenantId: string,
    studentId: string,
  ): Promise<PlaybackTokenResult>;
  deleteVideo(videoId: string): Promise<DeleteVideoResult>;
  handleWebhook(payload: WebhookPayload): Promise<void>;
  verifyWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
  ): Promise<boolean>;
}
