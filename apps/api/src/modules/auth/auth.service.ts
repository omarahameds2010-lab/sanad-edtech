import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../tenants/prisma.service";

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
   * (middleware) — never from the client body. Only STUDENT/TEACHER
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
      throw new BadRequestException("Only STUDENT or TEACHER can self-register");
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

  async login(user: any, deviceFingerprint?: string) {    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();

    // Store session in database
    await this.prisma.session.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        refreshTokenHash: await argon2.hash(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Store device if fingerprint provided
    if (deviceFingerprint) {
      await this.prisma.device.upsert({
        where: {
          tenantId_fingerprint: {
            tenantId: user.tenantId,
            fingerprint: deviceFingerprint,
          },
        },
        update: { lastSeen: new Date() },
        create: {
          tenantId: user.tenantId,
          userId: user.id,
          fingerprint: deviceFingerprint,
        },
      });
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    // Verify refresh token exists and is not revoked
    const hashedToken = await argon2.hash(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashedToken },
      include: { user: true },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    // Generate new tokens
    const payload = {
      sub: session.user.id,
      tenantId: session.user.tenantId,
      role: session.user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.generateRefreshToken();

    // Rotate refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: await argon2.hash(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });
  }

  private generateRefreshToken(): string {
    return Buffer.from(
      Date.now().toString() + Math.random().toString(),
    ).toString("base64");
  }
}
