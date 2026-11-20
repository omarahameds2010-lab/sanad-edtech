import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { HttpOutboxTransport } from "./http-outbox.transport";
import { OutboxDispatchProcessor } from "./outbox-dispatch.processor";
import { OutboxDispatchScheduler } from "./outbox-dispatch.scheduler";
import { OUTBOX_QUEUE } from "./outbox-delivery.constants";
import { OutboxDispatcherService } from "./outbox-dispatcher.service";
import { OutboxService } from "./outbox.service";

@Module({
  imports: [BullModule.registerQueue({ name: OUTBOX_QUEUE })],
  providers: [
    OutboxService,
    HttpOutboxTransport,
    OutboxDispatcherService,
    OutboxDispatchProcessor,
    OutboxDispatchScheduler,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
