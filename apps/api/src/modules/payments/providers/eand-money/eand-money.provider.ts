import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  ProviderCapabilities,
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  ProviderPaymentStatus,
  VerifyProviderPaymentInput,
  VerifyWebhookInput,
  VerifiedWebhookResult,
} from '../payment-provider.interface';

@Injectable()
export class EandMoneyProvider implements PaymentProvider {
  readonly name = 'eand_money';
  readonly capabilities: ProviderCapabilities = {
    cards: false,
    wallets: true,
    bankTransfer: false,
    instantPayment: false,
    refunds: false,
    partialRefunds: false,
    webhooks: true,
    hostedCheckout: true,
  };

  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private merchantId: string;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>('EAND_MONEY_BASE_URL') || '';
    this.clientId = configService.get<string>('EAND_MONEY_CLIENT_ID') || '';
    this.clientSecret = configService.get<string>('EAND_MONEY_CLIENT_SECRET') || '';
    this.merchantId = configService.get<string>('EAND_MONEY_MERCHANT_ID') || '';
    this.enabled = configService.get<boolean>('EAND_MONEY_ENABLED') || false;
  }

  async createPayment(input: CreateProviderPaymentInput): Promise<CreateProviderPaymentResult> {
    if (!this.enabled) {
      return {
        success: false,
        errorCode: 'PROVIDER_DISABLED',
        errorMessage: 'e& money provider is not enabled',
      };
    }

    // e& money integration requires official merchant integration
    // This is a stub - actual implementation depends on official integration
    return {
      success: false,
      errorCode: 'NOT_IMPLEMENTED',
      errorMessage: 'e& money integration requires official merchant integration. Use Paymob/Fawry for wallet payments or contact payment team.',
    };
  }

  async getPaymentStatus(input: GetProviderPaymentStatusInput): Promise<ProviderPaymentStatus> {
    return { status: 'CREATED', errorCode: 'NOT_IMPLEMENTED' };
  }

  async verifyPayment(input: VerifyProviderPaymentInput): Promise<ProviderPaymentStatus> {
    return this.getPaymentStatus({ providerTransactionId: input.providerTransactionId, orderId: input.orderId });
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookResult> {
    return { valid: false, errorCode: 'NOT_IMPLEMENTED' };
  }
}