import {
  Controller,
  Post,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";
import { SkipThrottle } from "@nestjs/throttler";
import { VideoService } from "./video.service";

/**
 * Provider-to-server video callbacks.
 *
 * This controller is deliberately not protected by JwtAuthGuard: Bunny/VdoCipher
 * cannot present a user session. Authentication is the provider HMAC, checked
 * against the exact raw request bytes inside VideoService before any state
 * change. Tenant resolution still runs first, based on the callback Host.
 */
@SkipThrottle()
@Controller("video/webhooks")
export class VideoWebhookController {
  constructor(private readonly videoService: VideoService) {}

  @Post(":provider")
  @HttpCode(HttpStatus.OK)
  async receive(
    @Param("provider") provider: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    if (!req.tenantId) {
      throw new BadRequestException("Tenant could not be resolved");
    }

    return this.videoService.handleProviderWebhook(
      provider,
      req.tenantId,
      req.rawBody,
      headers,
    );
  }
}
