import { PaymentMethod, PaymentStatus, PaymentAttemptStatus } from '@prisma/client';

export { PaymentMethod, PaymentStatus, PaymentAttemptStatus };

export interface ProviderCapabilities {
  cards: boolean;
  wallets: boolean;
  bankTransfer: boolean;
  instantPayment: boolean;
  refunds: boolean;
  partialRefunds: boolean;
  webhooks: boolean;
  hostedCheckout: boolean;
}

export interface CreateProviderPaymentInput {
  amountMinor: bigint;
  currency: string;
  orderId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  returnUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  idempotencyKey: string;
}

export interface CreateProviderPaymentResult {
  success: boolean;
  providerPaymentId?: string;
  providerTransactionId?: string;
  clientToken?: string;
  redirectUrl?: string;
  referenceNumber?: string;
  expiresAt?: Date;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface GetProviderPaymentStatusInput {
  providerPaymentId?: string;
  providerTransactionId?: string;
  orderId: string;
}

export interface ProviderPaymentStatus {
  status: PaymentStatus;
  providerPaymentId?: string;
  providerTransactionId?: string;
  amountMinor?: bigint;
  currency?: string;
  paidAt?: Date;
  failureCode?: string;
  failureReason?: string;
  errorCode?: string;
  rawResponse?: any;
}

export interface VerifyProviderPaymentInput {
  providerPaymentId?: string;
  providerTransactionId?: string;
  orderId: string;
  amountMinor: bigint;
  currency: string;
}

export interface ProviderRefundInput {
  providerPaymentId: string;
  providerTransactionId: string;
  amountMinor: bigint;
  currency: string;
  reason?: string;
  idempotencyKey: string;
}

export interface ProviderRefundResult {
  success: boolean;
  providerRefundId?: string;
  status?: RefundStatus;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface VerifyWebhookInput {
  provider: string;
  rawBody: string | Buffer;
  headers: Record<string, string>;
  secret: string;
}

export interface VerifiedWebhookResult {
  valid: boolean;
  eventType?: string;
  externalEventId?: string;
  paymentId?: string;
  transactionId?: string;
  status?: PaymentStatus;
  amountMinor?: bigint;
  currency?: string;
  paidAt?: Date;
  rawPayload?: any;
  errorCode?: string;
}

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';

export interface PaymentProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  createPayment(input: CreateProviderPaymentInput): Promise<CreateProviderPaymentResult>;
  getPaymentStatus(input: GetProviderPaymentStatusInput): Promise<ProviderPaymentStatus>;
  verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatus>;
  refund?(input: ProviderRefundInput): Promise<ProviderRefundResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookResult>;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  environment: 'sandbox' | 'production';
  credentials: Record<string, string>;
  settings?: Record<string, any>;
}

export interface ProviderHealthStatus {
  provider: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'DISABLED';
  lastCheck: Date;
  latencyMs?: number;
  errorRate?: number;
  details?: string;
}