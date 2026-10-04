import { Controller, Post, Get, Put, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { VideoService, CreateVideoInput } from './video.service';
import { VideoProviderRegistry } from './providers/video-provider.registry';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../authorization/authorization.decorators';

@Controller('api/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(
    private videoService: VideoService,
    private videoProviderRegistry: VideoProviderRegistry,
  ) {}

  /**
   * Create video and get signed upload URL
   */
  @Post('lessons/:lessonId/videos')
  @RequirePermission({ action: 'create', resourceType: 'video' })
  @HttpCode(HttpStatus.CREATED)
  async createVideo(
    @Request() req,
    @Param('lessonId') lessonId: string,
    @Body() body: Omit<CreateVideoInput, 'lessonId'>,
  ) {
    const result = await this.videoService.createVideo(
      req.tenantId,
      req.user.sub,
      { ...body, lessonId },
    );
    return result;
  }

  /**
   * Get video upload status
   */
  @Get('videos/:videoId/status')
  @RequirePermission({ action: 'read', resourceType: 'video', resourceIdParam: 'videoId' })
  async getVideoStatus(@Request() req, @Param('videoId') videoId: string) {
    const video = await this.videoService.getVideo(req.tenantId, videoId);
    if (!video) {
      return { status: 'NOT_FOUND' };
    }

    // If video is still uploading/processing, sync with provider
    if (['UPLOADING', 'PROCESSING'].includes(video.status)) {
      await this.videoService.syncVideoStatus(video.id, req.tenantId);
      return this.videoService.getVideo(req.tenantId, videoId);
    }

    return { status: video.status, video };
  }

  /**
   * Sync video status with provider
   */
  @Put('videos/:videoId/sync')
  @RequirePermission({ action: 'manage', resourceType: 'video', resourceIdParam: 'videoId' })
  async syncVideoStatus(@Request() req, @Param('videoId') videoId: string) {
    const video = await this.videoService.syncVideoStatus(videoId, req.tenantId);
    return { video };
  }

  /**
   * Get playback token for video
   */
  @Post('videos/:videoId/playback-token')
  @RequirePermission({ action: 'watch', resourceType: 'video', resourceIdParam: 'videoId' })
  async getPlaybackToken(
    @Request() req,
    @Param('videoId') videoId: string,
    @Body() body: { sessionId: string },
  ) {
    const token = await this.videoService.getPlaybackToken(
      req.tenantId,
      videoId,
      body.sessionId,
      req.user.sub,
    );
    return token;
  }

  /**
   * Get video details
   */
  @Get('videos/:videoId')
  @RequirePermission({ action: 'read', resourceType: 'video', resourceIdParam: 'videoId' })
  async getVideo(@Request() req, @Param('videoId') videoId: string) {
    const video = await this.videoService.getVideo(req.tenantId, videoId);
    if (!video) {
      return { video: null };
    }
    return { video };
  }

  /**
   * List videos for a lesson
   */
  @Get('lessons/:lessonId/videos')
  @RequirePermission({ action: 'read', resourceType: 'video' })
  async listLessonVideos(@Request() req, @Param('lessonId') lessonId: string) {
    const videos = await this.videoService.listVideosByLesson(req.tenantId, lessonId);
    return { videos };
  }

  /**
   * Delete video
   */
  @Delete('videos/:videoId')
  @RequirePermission({ action: 'delete', resourceType: 'video', resourceIdParam: 'videoId' })
  @HttpCode(HttpStatus.OK)
  async deleteVideo(@Request() req, @Param('videoId') videoId: string) {
    await this.videoService.deleteVideo(req.tenantId, videoId, req.user.sub);
    return { deleted: true };
  }

  /**
   * Get available providers
   */
  @Get('providers')
  @RequirePermission({ action: 'read', resourceType: 'settings' })
  async getProviders() {
    const providers = this.videoProviderRegistry.getEnabledProviders();
    return {
      providers: providers.map(p => ({
        name: p.name,
        maxFileSize: p.maxFileSize,
        supportedMimeTypes: p.supportedMimeTypes,
      })),
      defaultProvider: this.videoProviderRegistry.getDefaultProvider()?.name,
    };
  }
}