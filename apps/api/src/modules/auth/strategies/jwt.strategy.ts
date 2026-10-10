import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { readAccessToken } from "../cookies";

/**
 * Accepts the access token from EITHER source, cookie first:
 *
 *   1. `sanad_access_token` cookie — sent automatically by the browser on
 *      every /api call. No JavaScript involvement, so it is immune to a
 *      scripted request from an injected XSS payload.
 *   2. `Authorization: Bearer <token>` — the in-memory token the SPA holds.
 *      Kept working so the Next.js server components, Swagger UI and any
 *      machine-to-machine client keep functioning.
 *
 * Cookie-first matters: if both are present they should agree, and trusting
 * the one an attacker cannot influence is the safe default.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => readAccessToken(req as never) ?? undefined,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("JWT_SECRET") ||
        "your-secret-key-change-in-production",
    });
  }

  async validate(payload: any) {
    if (!payload.tenantId || !payload.sub) {
      throw new UnauthorizedException("Invalid token");
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
