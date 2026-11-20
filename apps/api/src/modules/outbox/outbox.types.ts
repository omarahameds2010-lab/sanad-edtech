export interface OutboxEnvelope {
  id: string;
  type: string;
  version: number;
  tenantId: string;
  occurredAt: string;
  aggregate: {
    type: string;
    id: string;
  };
  payload: unknown;
}

export interface OutboxDeliveryResult {
  ok: boolean;
  retryable: boolean;
  status?: number;
  error?: string;
}

export interface OutboxTransport {
  readonly enabled: boolean;
  deliver(envelope: OutboxEnvelope): Promise<OutboxDeliveryResult>;
}
