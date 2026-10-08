import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { EnrollmentsService } from "./enrollments.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CanEnroll,
  CanManageEnrollment,
  CanReadEnrollment,
  RequirePermission,
} from "../../authorization/authorization.decorators";

@Controller("api/v1/enrollments")
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post("courses/:courseId/enroll")
  @CanEnroll("courseId")
  async enroll(
    @Request() req,
    @Param("courseId") courseId: string,
  ) {
    const result = await this.enrollmentsService.enroll(
      req.tenantId,
      req.user.sub,
      courseId,
    );
    return { data: result };
  }

  @Get("me")
  @RequirePermission({ action: "read", resourceType: "enrollment" })
  async myEnrollments(@Request() req, @Query() query: any) {
    const result = await this.enrollmentsService.listEnrollments(
      req.tenantId,
      req.user.sub,
      query.status,
    );
    return { data: result };
  }

  @Get(":enrollmentId")
  @CanReadEnrollment()
  async get(
    @Request() req,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    const result = await this.enrollmentsService.getEnrollment(
      req.tenantId,
      req.user.sub,
      enrollmentId,
    );
    return { data: result };
  }

  @Post(":enrollmentId/cancel")
  @CanReadEnrollment()
  async cancel(
    @Request() req,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    const result = await this.enrollmentsService.cancelEnrollment(
      req.tenantId,
      req.user.sub,
      enrollmentId,
    );
    return { data: result };
  }

  @Post(":enrollmentId/suspend")
  @CanManageEnrollment()
  async suspend(
    @Request() req,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    const result = await this.enrollmentsService.suspendEnrollment(
      req.tenantId,
      enrollmentId,
    );
    return { data: result };
  }

  @Post(":enrollmentId/reactivate")
  @CanManageEnrollment()
  async reactivate(
    @Request() req,
    @Param("enrollmentId") enrollmentId: string,
  ) {
    const result = await this.enrollmentsService.reactivateEnrollment(
      req.tenantId,
      enrollmentId,
    );
    return { data: result };
  }
}
