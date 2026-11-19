import { redisConnectionOptions } from "./redis-connection";

const KEYS = ["REDIS_URL", "REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD"];
const original = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

function restoreEnv() {
  for (const key of KEYS) {
    const value = original[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("redisConnectionOptions", () => {
  afterEach(restoreEnv);

  it("prefers REDIS_URL and decodes credentials", () => {
    process.env.REDIS_URL =
      "rediss://user:p%40ss@redis.example.com:6380/2";

    expect(redisConnectionOptions()).toEqual({
      host: "redis.example.com",
      port: 6380,
      username: "user",
      password: "p@ss",
      db: 2,
      tls: {},
    });
  });

  it("uses discrete host, port, and password settings", () => {
    delete process.env.REDIS_URL;
    process.env.REDIS_HOST = "cache.internal";
    process.env.REDIS_PORT = "6381";
    process.env.REDIS_PASSWORD = "secret";

    expect(redisConnectionOptions()).toEqual({
      host: "cache.internal",
      port: 6381,
      password: "secret",
    });
  });

  it("falls back to the local defaults for a malformed URL", () => {
    process.env.REDIS_URL = "://bad";
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;

    expect(redisConnectionOptions()).toEqual({
      host: "127.0.0.1",
      port: 6379,
      password: undefined,
    });
  });
});
