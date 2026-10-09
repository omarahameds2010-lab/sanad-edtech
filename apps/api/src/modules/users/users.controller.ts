import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.sub);
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      grade: user.grade,
    };
  }

  @Get(":id")
  @RequirePermission({
    action: "read",
    resourceType: "user",
    resourceIdParam: "id",
  })
  async getStudentDetail(@Request() req, @Param("id") id: string) {
    // Students may only read their own file; teachers/admins per RBAC.
    if (req.user.role === "STUDENT" && id !== req.user.sub) {
      throw new ForbiddenException("You can only view your own profile");
    }
    const result = await this.usersService.getStudentDetail(
      req.tenantId,
      id,
    );
    return { data: result };
  }
}
