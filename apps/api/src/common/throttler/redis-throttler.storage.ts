import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import {
  ThrottlerStorage,
  ThrottlerStorageService,
} from "@nestjs/throttler";
import Redis from "ioredis";
import { redisConnectionOptions } from "../redis/redis-connection";

type ThrottlerStorageRecord = Awaited<
  ReturnType<ThrottlerStorage["increment"]>
>;

const INCREMENT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { current, ttl }
`;

/**
 * Shared throttler storage backed by Redis.
 *
 * The in-memory default only enforces a limit inside one API process. Redis
 * makes the counter shared across API instances, which is required once more
 * than one instance is running behind the same tunnel/load balancer.
 *
 * If Redis is unavailable, requests fall back to the in-memory store instead
 * of failing closed with a 500. The fallback is per-instance and is logged once
 * per outage; distributed enforcement resumes automatically after reconnect.
 */
@Injectable()
export class RedisThrottlerStorage
  implements ThrottlerStorage, OnApplicationShutdown
{
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallback = new ThrottlerStorageService();
  private readonly redis: Redis;
  private fallbackWarned = false;

  constructor(redis?: Redis) {
    this.redis =
      redis ??
      new Redis({
        ...redisConnectionOptions(),
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 1_000,
      });

    this.redis.on("error", (error: Error) => {
      this.warnFallback(error);
    });

    if (!redis) {
      void this.redis.connect().catch((error: Error) => {
        this.warnFallback(error);
      });
    }
  }

  async increment(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const result = (await this.redis.eval(
        INCREMENT_SCRIPT,
        1,
        `sanad:throttle:${key}`,
        ttl,
      )) as [number, number];

      this.fallbackWarned = false;
      return {
        totalHits: Number(result[0]),
        timeToExpire: Math.max(0, Number(result[1])),
      };
    } catch (error) {
      this.warnFallback(error as Error);
      return this.fallback.increment(key, ttl);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.fallback.onApplicationShutdown();

    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  private warnFallback(error: Error): void {
    if (this.fallbackWarned) return;

    this.fallbackWarned = true;
    this.logger.warn(
      `Redis throttler storage unavailable; using the per-instance fallback: ${error?.message ?? "unknown error"}`,
    );
  }
}
