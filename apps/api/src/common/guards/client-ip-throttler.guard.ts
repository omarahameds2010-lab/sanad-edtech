import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { clientIp } from "./client-ip";

/**
 * The stock ThrottlerGuard keys on `req.ip`, which is the Railway/Vercel proxy
 * address when Express does not trust forwarded headers. That would put every
 * caller in one shared bucket. Resolve the forwarded client address instead.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  async getTracker(request: Record<string, any>): Promise<string> {
    return clientIp(request);
  }
}
