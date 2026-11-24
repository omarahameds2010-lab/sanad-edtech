import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { HttpOutboxTransport } from "./http-outbox.transport";
import { OutboxAdminController } from "./outbox-admin.controller";
import { OutboxAdminService } from "./outbox-admin.service";
import { OutboxDeadLetterAlerter } from "./outbox-dead-letter-alerter";
import { OutboxDispatchProcessor } from "./outbox-dispatch.processor";
import { OutboxDispatchScheduler } from "./outbox-dispatch.scheduler";
import { OUTBOX_QUEUE } from "./outbox-delivery.constants";
import { OutboxDispatcherService } from "./outbox-dispatcher.service";
import { OutboxService } from "./outbox.service";

@Module({
  imports: [BullModule.registerQueue({ name: OUTBOX_QUEUE }), AuditModule],
  controllers: [OutboxAdminController],
  providers: [
    OutboxService,
    OutboxAdminService,
    HttpOutboxTransport,
    OutboxDeadLetterAlerter,
    OutboxDispatcherService,
    OutboxDispatchProcessor,
    OutboxDispatchScheduler,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
