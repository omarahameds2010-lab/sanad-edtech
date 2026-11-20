import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { OUTBOX_QUEUE, OUTBOX_SWEEP_JOB } from "./outbox-delivery.constants";
import { OutboxDispatcherService } from "./outbox-dispatcher.service";

@Processor(OUTBOX_QUEUE)
export class OutboxDispatchProcessor {
  constructor(private readonly dispatcher: OutboxDispatcherService) {}

  @Process(OUTBOX_SWEEP_JOB)
  async sweep(_job: Job) {
    return this.dispatcher.sweep();
  }
}
