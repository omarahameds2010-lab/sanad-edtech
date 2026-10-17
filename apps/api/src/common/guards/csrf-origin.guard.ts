import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

/**
 * CSRF defence by origin verification.
 *
 * The session is carried in `SameSite=Strict` cookies, which already refuses to
 * travel on a cross-site request. That protection is one env var away from
 * being relaxed — the off-site Paymob/Fawry payment redirect is exactly the
 * flow that needs it relaxed — so this guard is the layer that keeps CSRF
 * closed regardless of how SameSite is configured.
 *
 * Verification order:
 *
 *   1. `Origin`  — present on every cross-origin request and on same-origin
 *                  POST/PUT/PATCH/DELETE from a browser.
 *   2. `Referer` — the fallback for older browsers that omit Origin.
 *
 * Both are compared against the closed allow-list in ALLOWED_ORIGINS. A request
 * carrying NEITHER header is not a browser request at all (curl, a provider
 * webhook, a server-to-server call) and therefore cannot mount a browser-based
 * CSRF attack; it authenticates with a bearer token instead. Those are allowed
 * through and exempted per-path below.
 */
@Injectable()
export class CsrfOriginGuard implements CanActivate {
  /** Methods that change state. GET/HEAD/OPTIONS are exempted for speed. */
  private static readonly UNSAFE_METHODS = new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);

  /**
   * Paths reached without a browser.
   *
   * Provider webhooks are sent by Paymob/Fawry servers. There is no Origin to
   * verify, and they are authenticated by HMAC signature — a strictly stronger
   * guarantee than an Origin check would ever be.
   */
  private static readonly EXEMPT_PATH_PREFIXES = [
    "/api/payments/webhooks",
    "/api/health",
    "/api/ready",
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      path: string;
      headers: Record<string, string | undefined>;
    }>();

    // Rule 5: safe methods are exempted outright. A GET must never mutate, and
    // witholding the check here keeps the cost off every read-heavy route.
    if (!CsrfOriginGuard.UNSAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const path = request.path ?? "";

    if (
      CsrfOriginGuard.EXEMPT_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      )
    ) {
      return true;
    }

    const origin = this.readHeader(request, "origin");
    const referer = this.readHeader(request, "referer");

    // Neither header present: not a browser request (see class doc).
    if (!origin && !referer) {
      return true;
    }

    // When Origin is present it is authoritative; Referer is only consulted
    // when Origin is missing, because Origin is always trustworthy when sent.
    const candidate = origin ?? referer;
    const source: "Origin" | "Referer" = origin ? "Origin" : "Referer";

    if (candidate && !this.isAllowed(candidate)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: `Request ${source} is not in the allowed list.`,
        code: "ORIGIN_REJECTED",
      });
    }

    return true;
  }

  private readHeader(
    request: { headers: Record<string, string | undefined> },
    name: string,
  ): string | undefined {
    const value = request.headers[name];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  /**
   * Match a candidate against the closed allow-list.
   *
   * `Referer` is a full URL (including path and query), so it is reduced to its
   * origin before comparison; `Origin` is already an origin.
   */
  private isAllowed(candidate: string): boolean {
    const normalised = this.toOrigin(candidate);
    if (!normalised) return false;
    return this.allowedOrigins().includes(normalised);
  }

  private toOrigin(value: string): string | null {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }

  /**
   * The closed allow-list. One env var, shared with the CORS configuration in
   * main.ts — two separate lists for the same concept is how they drift.
   *
   * Defaults to the real front-end ports for this platform (the web app runs on
   * :3001, the API on :3002), so a fresh clone cannot be locked out.
   */
  static allowedOrigins(): string[] {
    const configured = (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (configured.length > 0) return configured;

    // Nothing configured: allow localhost only, and never in production.
    if (process.env.NODE_ENV !== "production") {
      return ["http://localhost:3001", "http://localhost:3000"];
    }

    return [];
  }

  private allowedOrigins(): string[] {
    return CsrfOriginGuard.allowedOrigins();
  }
}
