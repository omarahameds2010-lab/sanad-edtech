import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "phone",
      passwordField: "password",
    });
  }

  async validate(phone: string, password: string, req: any): Promise<any> {
    // Get tenantId from request (set by TenantResolverMiddleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException("Tenant context required");
    }

    const user = await this.authService.validateUser(phone, password, tenantId);

    return user;
  }
}
