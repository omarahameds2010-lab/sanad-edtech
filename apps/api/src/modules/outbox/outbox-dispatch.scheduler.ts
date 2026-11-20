import { InjectQueue } from "@nestjs/bull";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import type { Queue } from "bull";
import {
  OUTBOX_QUEUE,
  OUTBOX_SWEEP_JOB,
  outboxSweepIntervalMs,
} from "./outbox-delivery.constants";

/**
 * Installs one repeatable Bull sweep. Bull stores the repeatable job in Redis,
 * so there is one sweep across API instances and it survives an API restart.
 * A Redis outage only logs a warning; it never blocks application boot.
 */
@Injectable()
export class OutboxDispatchScheduler implements OnModuleInit {
  private readonly logger = new Logger(OutboxDispatchScheduler.name);

  constructor(
    @InjectQueue(OUTBOX_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const every = outboxSweepIntervalMs();
    try {
      await this.queue.add(
        OUTBOX_SWEEP_JOB,
        {},
        {
          repeat: { every },
          jobId: OUTBOX_SWEEP_JOB,
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.log(`Outbox sweep scheduled every ${every}ms.`);
    } catch (error) {
      this.logger.warn(
        `Could not schedule the outbox sweep: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
