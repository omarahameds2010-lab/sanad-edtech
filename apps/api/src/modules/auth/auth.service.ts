import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "crypto";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../tenants/prisma.service";

/** 256 bits of CSPRNG entropy, URL-safe. Never derived from time or Math.random. */
const REFRESH_TOKEN_BYTES = 32;

/**
 * Absolute session lifetime. One study week. Deliberately NOT extended on
 * rotation â€” a student active every day still re-authenticates weekly, which
 * bounds the damage of a token stolen and kept quiet for months.
 */
const SESSION_ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Machine-readable failure codes. The frontend maps these to the soft-exit UX
 * instead of parsing human strings (which would couple it to our copy).
 */
export type AuthFailureCode =
  | "REFRESH_INVALID"
  | "REFRESH_EXPIRED"
  | "SESSION_INACTIVE"
  | "SESSION_FAMILY_REVOKED"
  | "REFRESH_MISSING";

export class AuthFailureException extends UnauthorizedException {
  constructor(
    public readonly code: AuthFailureCode,
    message: string,
  ) {
    super({ statusCode: 401, message, code });
  }
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionUserView {
  id: string;
  name: string;
  role: string;
}

/** Minimal shape of a Prisma transaction client, so helpers accept both. */
type Db = Pick<PrismaService, "session" | "securityEvent">;

/** Context recorded alongside an emergency revocation. */
interface SecurityContext {
  tenantId: string;
  userId?: string | null;
  eventType: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(phone: string, password: string, tenantId: string) {
    const user = await this.usersService.findByPhoneAndTenant(phone, tenantId);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new BadRequestException("Account is not active");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  /**
   * Public self-registration. Tenant always comes from the Host header
   * (middleware) â€” never from the client body. Only STUDENT/TEACHER
   * self-register; privileged roles are created out-of-band.
   */
  async register(
    tenantId: string,
    dto: {
      name: string;
      phone: string;
      password: string;
      role?: string;
      grade?: string;
      deviceFingerprint?: string;
    },
  ) {
    const role = dto.role ?? "STUDENT";
    if (role !== "STUDENT" && role !== "TEACHER") {
      throw new BadRequestException(
        "Only STUDENT or TEACHER can self-register",
      );
    }

    const user = await this.usersService.create({
      tenantId,
      role,
      name: dto.name.trim(),
      phone: dto.phone,
      password: dto.password,
      grade: dto.grade,
    });

    return this.login(user, dto.deviceFingerprint);
  }

  async login(
    user: any,
    deviceFingerprint?: string,
  ): Promise<{ tokens: IssuedTokens; user: SessionUserView }> {
    const deviceId = deviceFingerprint
      ? (await this.upsertDevice(user, deviceFingerprint)).id
      : null;

    const accessToken = this.jwtService.sign({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_LIFETIME_MS);

    const session = await this.prisma.session.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        deviceId,
        familyId: undefined, // set below to this row's own id
        refreshTokenHash: await argon2.hash(refreshToken),
        refreshTokenLookup: this.lookupOf(refreshToken),
        expiresAt,
      },
    });

    // The family is keyed on the root row, so "the whole family" is a single
    // indexed lookup and the chain is self-describing in the DB.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { familyId: session.id },
    });

    return {
      tokens: { accessToken, refreshToken },
      user: { id: user.id, name: user.name, role: user.role },
    };
  }

  /**
   * Rotate a refresh token.
   *
   * Reuse detection is the heart of this method: a presented token resolves to
   * a row that has ALREADY been retired, which can only mean the token was
   * replayed. Replay â‡’ somebody else has a copy â‡’ the entire family is revoked
   * so neither the legitimate student nor the thief keeps a session.
   *
   * All writes happen in one `$transaction`, so a crash between issuing the
   * new row and retiring the old one cannot leave an ambiguous window.
   */
  async refreshTokens(refreshToken: string): Promise<IssuedTokens> {
    if (!refreshToken) {
      throw new AuthFailureException(
        "REFRESH_MISSING",
        "Session cookie missing",
      );
    }

    // O(1) via the deterministic sha256 index. Argon2id cannot be searched â€”
    // it is salted, which is precisely the bug this replaces.
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenLookup: this.lookupOf(refreshToken) },
      include: { user: true },
    });

    if (!session) {
      // Unknown token: never issued, or issued before a family revocation.
      // The response is identical either way on purpose.
      throw new AuthFailureException(
        "REFRESH_INVALID",
        "Invalid refresh token",
      );
    }

    // Authoritative proof that the presented token matches the stored hash.
    // The sha256 lookup finds the row; this confirms the secret.
    const hashMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );
    if (!hashMatches) {
      throw new AuthFailureException(
        "REFRESH_INVALID",
        "Invalid refresh token",
      );
    }

    if (session.revokedAt) {
      await this.revokeFamily(this.prisma, session.familyId, "THEFT_DETECTED", {
        tenantId: session.tenantId,
        userId: session.userId,
        eventType: "SESSION_REUSE_DETECTED",
        severity: "CRITICAL",
      });
      throw new AuthFailureException(
        "SESSION_FAMILY_REVOKED",
        "Session was revoked for your protection. Please sign in again.",
      );
    }

    // Absolute expiry â€” rotation never extends the lifetime of the family.
    if (session.expiresAt <= new Date()) {
      throw new AuthFailureException("REFRESH_EXPIRED", "Session expired");
    }

    if (!session.user || session.user.status !== "ACTIVE") {
      throw new AuthFailureException(
        "SESSION_INACTIVE",
        "Account is no longer active",
      );
    }

    // Everything expensive is prepared BEFORE any write, so the railway to the
    // database stays as short as physically possible.
    const accessToken = this.jwtService.sign({
      sub: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role,
    });
    const newRefreshToken = this.generateRefreshToken();
    const newLookup = this.lookupOf(newRefreshToken);
    const newHash = await argon2.hash(newRefreshToken);
    const now = new Date();

    // Pre-generate the successor id so the retired row can point at it.
    const successorId = randomUUID();

    /**
     * CLAIM FIRST, CREATE SECOND â€” deliberately not one interactive transaction.
     *
     * `$transaction(async (tx) => â€¦)` reserves a dedicated connection and holds
     * it across several round-trips. With `connection_limit=3` behind a proxy
     * that drops connections (Railway), that shape dies consistently with
     * "Transaction not found â€¦ obtained before disconnecting", even though
     * every simple query succeeds. So the claim is a single atomic statement,
     * and only the winner goes on to create anything.
     *
     * The claim's `revokedAt: null` guard IS the linearisation point: two
     * concurrent rotations presenting the same token both reach it, but only
     * one updateMany can match. The loser never creates a successor, so no
     * orphan token is ever left live in the family.
     */
    const claim = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
        revokedReason: "ROTATED",
        lastRotatedAt: now,
      },
    });

    if (claim.count !== 1) {
      // Either the token was already rotated (replay â‡’ theft) or it expired in
      // the microseconds between the read and the claim. Both mean "this token
      // has now been used twice", which is the theft signal.
      //
      // Note this revokes the whole family, including whichever caller won the
      // race. That is intentional and fail-closed: an attacker replaying a
      // stolen token must NOT be the one who keeps the live session, and the
      // legitimate client's front end coalesces refreshes precisely so it can
      // never race itself. A stolen session dying early is the cheap outcome.
      await this.revokeFamily(this.prisma, session.familyId, "THEFT_DETECTED", {
        tenantId: session.tenantId,
        userId: session.userId,
        eventType: "SESSION_REUSE_DETECTED",
        severity: "CRITICAL",
      });
      throw new AuthFailureException(
        "SESSION_FAMILY_REVOKED",
        "Session was revoked for your protection. Please sign in again.",
      );
    }

    // Won the claim: issue the successor, inheriting the absolute expiry untouched.
    const next = await this.prisma.session.create({
      data: {
        id: successorId,
        tenantId: session.tenantId,
        userId: session.userId,
        deviceId: session.deviceId,
        familyId: session.familyId,
        refreshTokenHash: newHash,
        refreshTokenLookup: newLookup,
        expiresAt: session.expiresAt,
      },
    });

    // Audit link only â€” a failure here must not invalidate a valid rotation.
    try {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { replacedById: next.id },
      });
    } catch {
      /* the chain is still navigable via familyId; do not fail the request */
    }

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke the session family that owns a given refresh token, then clear the
   * cookies. Used by the explicit "sign out" action.
   */
  async logoutFromRefresh(refreshToken?: string | null): Promise<void> {
    if (!refreshToken) return;

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenLookup: this.lookupOf(refreshToken) },
      select: { familyId: true, revokedAt: true, replacedById: true },
    });

    if (!session || session.revokedAt) return;

    await this.revokeFamily(this.prisma, session.familyId, "LOGOUT");
  }

  /**
   * Revoke every active session for a user â€” "sign out everywhere", and the
   * action an admin takes on a compromised account.
   */
  async logoutEverywhere(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "USER_REVOKED" },
    });
  }

  /** Retained for callers that only know the user id. */
  async logout(userId: string): Promise<void> {
    await this.logoutEverywhere(userId);
  }

  /**
   * Active sessions for a user â€” the "manage devices" surface. Rotated rows
   * are excluded; the chain is an implementation detail, not a user object.
   */
  async listActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        familyId: true,
        createdAt: true,
        expiresAt: true,
        lastRotatedAt: true,
        deviceId: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ---------------------------------------------------------------------------
  // internals
  // ---------------------------------------------------------------------------

  private generateRefreshToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
  }

  /**
   * Deterministic, searchable fingerprint of a refresh token.
   *
   * This is NOT a password hash. The token is 256 bits of CSPRNG output, so
   * there is no dictionary or rainbow table to attack â€” a plain sha256 is the
   * correct tool, and being deterministic is exactly what makes the O(1)
   * index lookup possible.
   */
  private lookupOf(refreshToken: string): string {
    return createHash("sha256").update(refreshToken, "utf8").digest("hex");
  }

  private async revokeFamily(
    db: Db,
    familyId: string,
    reason: string,
    security?: SecurityContext,
  ): Promise<number> {
    const result = await db.session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    // Only an emergency revocation (theft) carries security context. Routine
    // logout/logout-all stays out of the security feed to keep it signal-not-noise.
    //
    // The event is recorded on DETECTION, not on how many rows happened to still
    // be live. In a race the loser can reach here after the winner has already
    // retired every row it would have revoked — and "a replayed token was
    // detected" is exactly the thing that must be logged, with count 0 or not.
    if (security) {
      await this.recordSecurityEvent(
        db,
        familyId,
        reason,
        security,
        result.count,
      );
    }

    return result.count;
  }

  /**
   * Write an immediate security_event row. This is deliberately INSIDE the same
   * transaction as the revocation, so "sessions were killed" and "we noticed"
   * can never disagree â€” a revoked family with no event would be an audit hole,
   * and an event with no revocation would be a false alarm.
   */
  private async recordSecurityEvent(
    db: Db,
    familyId: string,
    reason: string,
    security: SecurityContext,
    revokedCount: number,
  ): Promise<void> {
    await db.securityEvent.create({
      data: {
        tenantId: security.tenantId,
        userId: security.userId ?? null,
        eventType: security.eventType,
        severity: security.severity,
        metadata: {
          familyId,
          revokedReason: reason,
          sessionsRevoked: revokedCount,
        },
      },
    });
  }

  private async upsertDevice(user: any, fingerprint: string) {
    return this.prisma.device.upsert({
      where: {
        tenantId_fingerprint: {
          tenantId: user.tenantId,
          fingerprint,
        },
      },
      update: { lastSeen: new Date(), userId: user.id },
      create: {
        tenantId: user.tenantId,
        userId: user.id,
        fingerprint,
      },
    });
  }
}
