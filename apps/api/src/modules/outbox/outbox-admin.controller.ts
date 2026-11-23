import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import {
  CanManageOutbox,
  CanReadOutbox,
} from "../authorization/authorization.decorators";
import { OutboxAdminService } from "./outbox-admin.service";

@Controller("v1/admin/outbox")
export class OutboxAdminController {
  constructor(private readonly outboxAdmin: OutboxAdminService) {}

  /**
   * List this tenant's dead-lettered events. The response deliberately omits
   * the payload; operators get the event identity, error, and retry metadata.
   */
  @Get("dead-letters")
  @CanReadOutbox()
  async listDeadLetters(@Request() req, @Query("limit") limit?: string) {
    return this.outboxAdmin.listDeadLetters(
      req.tenantId,
      limit === undefined ? undefined : Number(limit),
    );
  }

  /** Requeue one dead letter for the next sweep. ADMIN-only. */
  @Post("dead-letters/:eventId/retry")
  @HttpCode(202)
  @CanManageOutbox()
  async retryDeadLetter(
    @Request() req,
    @Param("eventId") eventId: string,
  ) {
    return this.outboxAdmin.retryDeadLetter(req.tenantId, eventId, {
      userId: req.user?.sub,
      ip: req.ip,
      userAgent: req.headers?.["user-agent"],
    });
  }
}
