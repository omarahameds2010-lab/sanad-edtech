import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { setAuthCookies, clearAuthCookies, readRefreshToken } from "./cookies";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login.
   *
   * The refresh token NEVER appears in the response body — it is written
   * straight into an HttpOnly cookie, so no JavaScript on the page can read
   * it even under XSS. The access token does go in the body, because the SPA
   * needs it to build an Authorization header; it lives in React memory only
   * and expires in 15 minutes.
   */
  @Post("login")
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req,
    @Response({ passthrough: true }) res,
    @Body() loginDto: LoginDto,
  ) {
    const { tokens, user } = await this.authService.login(
      req.user,
      loginDto.deviceFingerprint,
    );
    setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken, user };
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Request() req,
    @Response({ passthrough: true }) res,
    @Body() registerDto: RegisterDto,
  ) {
    const { tokens, user } = await this.authService.register(
      req.tenantId,
      registerDto,
    );
    setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken, user };
  }

  /**
   * Silent rotation. The token arrives as a cookie and nothing else — a
   * refresh token in the request body would be a second, weaker attack path.
   *
   * Emits a fresh cookie pair in the same response, which is what makes the
   * rotation atomic from the client's point of view.
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req, @Response({ passthrough: true }) res) {
    const refreshToken = readRefreshToken(req);
    const tokens = await this.authService.refreshTokens(refreshToken ?? "");
    setAuthCookies(res, tokens);
    return { accessToken: tokens.accessToken };
  }

  /** Sign out this device/family. Cookies are cleared regardless. */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Response({ passthrough: true }) res) {
    await this.authService.logoutFromRefresh(readRefreshToken(req));
    clearAuthCookies(res);
    return { message: "Logged out successfully" };
  }

  /** Sign out every device. */
  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req, @Response({ passthrough: true }) res) {
    await this.authService.logoutEverywhere(req.user.sub);
    clearAuthCookies(res);
    return { message: "Signed out of all devices" };
  }

  /** The "manage devices" surface. Excludes rotated chain rows. */
  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async sessions(@Request() req) {
    return this.authService.listActiveSessions(req.user.sub);
  }
}
