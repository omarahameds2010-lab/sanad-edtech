import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParserNs from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Logger } from "nestjs-pino";
import { CsrfOriginGuard } from "./common/guards/csrf-origin.guard";
import { COOKIE_NAMES } from "./modules/auth/cookies";

/** esModuleInterop is on, so the default import is the callable middleware. */
const cookieParser = (cookieParserNs as any).default ?? cookieParserNs;

function validateSecrets(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const defaults = {
    JWT_SECRET: "your-super-secret-jwt-key-change-in-production",
    VIDEO_TOKEN_SECRET: "change-in-production",
    VIDEO_WATERMARK_HMAC_SECRET: "change-in-production",
  };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = process.env[key];
    if (!value || value === defaultValue) {
      const msg = `❌ SECURITY ERROR: ${key} is not set or uses default value. Refusing to start.`;
      if (isProduction) {
        console.error(msg);
        process.exit(1);
      } else {
        console.warn(`⚠️  ${msg} (allowed in development)`);
      }
    }
  }
}

/**
 * CORS origin resolution.
 *
 * `origin: "*"` combined with `credentials: true` is not a configuration — it
 * is a silently broken one. Browsers refuse to expose a credentialed response
 * whose ACAO is `*`, so every authenticated cross-origin call from the SPA
 * fails. Worse, a well-meaning "fix" of echoing the Origin header turns the
 * API into a credential-accepting proxy for any site.
 *
 * So: an explicit allow-list, one env var, shared with the CSRF guard.
 */
function resolveCorsOrigin():
  | string[]
  | ((
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean | string) => void,
    ) => void) {
  const allow = CsrfOriginGuard.allowedOrigins();

  // Nothing configured (production): refuse every cross-origin credentialed
  // request. Fail closed — a missing allow-list must not become a wildcard.
  if (allow.length === 0) {
    return (_origin, cb) => cb(null, false);
  }

  return (origin, cb) => {
    if (!origin) return cb(null, false);
    return cb(null, allow.includes(origin));
  };
}

async function bootstrap() {
  validateSecrets();

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Must be registered BEFORE anything reads req.cookies — the entire session
  // model reads the refresh token out of the cookie jar.
  app.use(cookieParser());

  // CSRF defence, applied globally. GET/HEAD/OPTIONS are exempted inside the
  // guard itself so read-heavy routes pay nothing.
  app.useGlobalGuards(new CsrfOriginGuard());

  app.enableCors({
    origin: resolveCorsOrigin(),
    // Required for cookies to be sent at all. This is exactly why `*` cannot
    // be used above.
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "idempotency-key",
      "X-Requested-With",
    ],
    exposedHeaders: ["set-cookie"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Health endpoints
  app.setGlobalPrefix("api");

  // OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle("Learning Platform API")
    .setDescription("Multi-tenant white-label LMS for Egyptian teachers")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addCookieAuth(COOKIE_NAMES.access, {
      type: "apiKey",
      in: "cookie",
    })
    .addCookieAuth(COOKIE_NAMES.refresh, {
      type: "apiKey",
      in: "cookie",
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // Canonical ports lock (governance): API :3002, Web :3001.
  // Never rely on defaults or auto-bump — mismatch breaks login/CORS silently.
  const port = process.env.PORT || 3002;
  await app.listen(port);

  console.log(`🚀 API is running on http://localhost:${port}`);
  console.log(`📊 Health: http://localhost:${port}/api/health`);
  console.log(`🔌 Ready: http://localhost:${port}/api/ready`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  console.log(
    `🍪 Session cookies: ${COOKIE_NAMES.access} / ${COOKIE_NAMES.refresh} ` +
      `(HttpOnly, SameSite=${process.env.COOKIE_SAMESITE ?? "strict"})`,
  );
}

bootstrap();
