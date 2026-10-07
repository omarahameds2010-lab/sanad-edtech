import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
} from "../payment-provider.interface";

@Injectable()
export class InstapayProvider implements PaymentProvider {
  readonly name = "instapay";
  readonly capabilities: ProviderCapabilities = {
    cards: false,
    wallets: false,
    bankTransfer: true,
    instantPayment: true,
    refunds: false,
    partialRefunds: false,
    webhooks: true,
    hostedCheckout: false,
  };

  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private certificate: string;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.baseUrl = configService.get<string>("INSTAPAY_BASE_URL") || "";
    this.clientId = configService.get<string>("INSTAPAY_CLIENT_ID") || "";
    this.clientSecret =
      configService.get<string>("INSTAPAY_CLIENT_SECRET") || "";
    this.certificate = configService.get<string>("INSTAPAY_CERTIFICATE") || "";
    this.enabled = configService.get<boolean>("INSTAPAY_ENABLED") || false;
  }

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    if (!this.enabled) {
      return {
        success: false,
        errorCode: "PROVIDER_DISABLED",
        errorMessage: "InstaPay provider is not enabled",
      };
    }

    // InstaPay integration requires official IPN/merchant onboarding
    // This is a stub - actual implementation depends on official integration
    return {
      success: false,
      errorCode: "NOT_IMPLEMENTED",
      errorMessage:
        "InstaPay integration requires official IPN merchant onboarding. Use manual transfer fallback or contact payment team.",
    };
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    return { status: "CREATED", errorCode: "NOT_IMPLEMENTED" };
  }

  async verifyPayment(
    input: VerifyProviderPaymentInput,
  ): Promise<ProviderPaymentStatus> {
    return this.getPaymentStatus({
      providerTransactionId: input.providerTransactionId,
      orderId: input.orderId,
    });
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    return { valid: false, errorCode: "NOT_IMPLEMENTED" };
  }
}
