import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import {
  PaymentProvider,
  ProviderCapabilities,
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  ProviderPaymentStatus,
  VerifyProviderPaymentInput,
  ProviderRefundInput,
  ProviderRefundResult,
  VerifyWebhookInput,
  VerifiedWebhookResult,
} from "../payment-provider.interface";

interface FawryChargeResponse {
  type: string;
  referenceNumber: string;
  orderStatus: string;
  paymentAmount: number;
  customerProfileId: string;
  customerMobile: string;
  customerEmail: string;
  paymentMethod: string;
  paymentMenus: any[];
  statusCode: number;
  statusDescription: string;
}

interface FawryRefundResponse {
  type: string;
  referenceNumber: string;
  refundAmount: number;
  statusCode: number;
  statusDescription: string;
}

interface FawryStatusResponse {
  requestId: string;
  fawryRefNumber: string;
  merchantRefNumber: string;
  customerProfileId: string;
  customerMobile: string;
  customerEmail: string;
  paymentAmount: number;
  orderAmount: number;
  orderStatus: string;
  orderExpiryDate: number;
  paymentMethod: string;
  paymentMenus: any[];
  statusCode: number;
  statusDescription: string;
}

@Injectable()
export class FawryProvider implements PaymentProvider {
  readonly name = "fawry";
  readonly capabilities: ProviderCapabilities = {
    cards: true,
    wallets: true,
    bankTransfer: false,
    instantPayment: false,
    refunds: true,
    partialRefunds: true,
    webhooks: true,
    hostedCheckout: true,
  };

  private baseUrl: string;
  private merchantCode: string;
  private merchantSecretKey: string;
  private secureHashKey: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      configService.get<string>("FAWRY_BASE_URL") ||
      "https://atfawry.fawrystaging.com";
    this.merchantCode = configService.get<string>("FAWRY_MERCHANT_CODE") || "";
    this.merchantSecretKey =
      configService.get<string>("FAWRY_SECRET_KEY") || "";
    this.secureHashKey =
      configService.get<string>("FAWRY_SECURE_HASH_KEY") || "";
  }

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    try {
      const chargeRequest = this.buildChargeRequest(input);
      const signature = this.generateChargeSignature(chargeRequest);

      const response = await fetch(
        `${this.baseUrl}/ECommerceWeb/Fawry/payments/charge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...chargeRequest, signature }),
        },
      );

      const data: FawryChargeResponse = await response.json();

      if (data.statusCode !== 200) {
        return {
          success: false,
          errorCode: "FAWRY_CHARGE_FAILED",
          errorMessage: data.statusDescription,
          rawResponse: data,
        };
      }

      let redirectUrl = "";
      if (data.paymentMenus?.length > 0) {
        redirectUrl = data.paymentMenus[0].paymentMenuURL || "";
      }

      return {
        success: true,
        providerPaymentId: data.referenceNumber,
        providerTransactionId: data.referenceNumber,
        redirectUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: "PROVIDER_ERROR",
        errorMessage: error.message,
      };
    }
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    try {
      const statusRequest = {
        merchantCode: this.merchantCode,
        merchantRefNum: input.providerPaymentId || input.orderId,
        signature: this.generateStatusSignature(
          input.providerPaymentId || input.orderId,
        ),
      };

      const response = await fetch(
        `${this.baseUrl}/ECommerceWeb/Fawry/payments/status/v2`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(statusRequest),
        },
      );

      const data: FawryStatusResponse = await response.json();

      if (data.statusCode !== 200) {
        return {
          status: "FAILED",
          errorCode: "FAWRY_STATUS_FAILED",
          failureReason: data.statusDescription,
        };
      }

      return this.mapFawryStatus(data);
    } catch (error) {
      return {
        status: "FAILED",
        errorCode: "PROVIDER_ERROR",
        failureReason: error.message,
      };
    }
  }

  async verifyPayment(
    input: VerifyProviderPaymentInput,
  ): Promise<ProviderPaymentStatus> {
    return this.getPaymentStatus({
      providerPaymentId: input.providerTransactionId || input.providerPaymentId,
      orderId: input.orderId,
    });
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    const payload =
      typeof input.rawBody === "string"
        ? JSON.parse(input.rawBody)
        : input.rawBody;

    // Fawry webhook verification uses a different approach
    // The notification contains a signature we need to verify
    const receivedSignature =
      input.headers["signature"] || input.headers["x-fawry-signature"] || "";
    const expectedSignature = this.generateWebhookSignature(payload);

    if (
      !crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature),
      )
    ) {
      return { valid: false, errorCode: "INVALID_SIGNATURE" };
    }

    return {
      valid: true,
      eventType: this.mapWebhookEventType(payload),
      externalEventId: payload.referenceNumber || payload.merchantRefNumber,
      paymentId: payload.merchantRefNumber,
      transactionId: payload.fawryRefNumber,
      status: this.mapFawryOrderStatus(payload.orderStatus),
      amountMinor: BigInt(
        Math.round((payload.paymentAmount || payload.orderAmount) * 100),
      ),
      currency: "EGP",
      paidAt: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
      rawPayload: payload,
    };
  }

  private buildChargeRequest(input: CreateProviderPaymentInput) {
    return {
      merchantCode: this.merchantCode,
      merchantRefNum: input.orderId,
      customerName: input.customerName || "Customer",
      customerMobile: input.customerPhone || "",
      customerEmail: input.customerEmail || "customer@example.com",
      customerProfileId: input.userId,
      paymentMethod: this.mapPaymentMethod(input.paymentMethod),
      amount: Number(input.amountMinor) / 100,
      currencyCode: input.currency,
      language: "ar",
      chargeItems: [
        {
          itemId: input.orderId,
          description: `Order ${input.orderId}`,
          price: Number(input.amountMinor) / 100,
          quantity: 1,
        },
      ],
      returnUrl:
        input.returnUrl ||
        `${this.configService.get("APP_URL")}/payment/callback`,
    };
  }

  private mapPaymentMethod(method: string): string {
    switch (method) {
      case "CARD":
        return "PayAtFawry";
      case "MOBILE_WALLET":
        return "MWALLET";
      case "INSTANT_PAYMENT":
        return "INSTAPAY";
      case "VOUCHER":
        return "VOUCHER";
      default:
        return "PayAtFawry";
    }
  }

  private generateChargeSignature(request: any): string {
    const str = `${request.merchantCode}${request.merchantRefNum}${request.customerProfileId}${request.paymentMethod}${request.amount}${request.currencyCode}${request.language}${this.merchantSecretKey}`;
    return crypto.createHash("sha256").update(str).digest("hex");
  }

  private generateStatusSignature(merchantRefNum: string): string {
    const str = `${this.merchantCode}${merchantRefNum}${this.merchantSecretKey}`;
    return crypto.createHash("sha256").update(str).digest("hex");
  }

  private generateWebhookSignature(payload: any): string {
    // Fawry webhook signature format
    const str = `${this.merchantCode}${payload.referenceNumber}${payload.merchantRefNumber}${payload.customerProfileId}${payload.paymentAmount}${payload.orderAmount}${payload.orderStatus}${payload.paymentMethod}${this.secureHashKey}`;
    return crypto.createHash("sha256").update(str).digest("hex");
  }

  private mapFawryStatus(data: FawryStatusResponse): ProviderPaymentStatus {
    const statusMap: Record<
      string,
      "PAID" | "FAILED" | "PENDING" | "EXPIRED" | "CANCELLED" | "REFUNDED"
    > = {
      PAID: "PAID",
      NEW: "PENDING",
      CANCELED: "CANCELLED",
      REFUNDED: "REFUNDED",
      EXPIRED: "EXPIRED",
      FAILED: "FAILED",
    };

    return {
      status: statusMap[data.orderStatus] || "PENDING",
      providerPaymentId: data.fawryRefNumber,
      providerTransactionId: data.merchantRefNumber,
      amountMinor: BigInt(
        Math.round((data.paymentAmount || data.orderAmount) * 100),
      ),
      currency: "EGP",
      paidAt: data.orderExpiryDate ? new Date(data.orderExpiryDate) : undefined,
      rawResponse: data,
    };
  }

  private mapFawryOrderStatus(
    orderStatus: string,
  ): "PAID" | "FAILED" | "PENDING" | "EXPIRED" | "CANCELLED" | "REFUNDED" {
    const statusMap: Record<
      string,
      "PAID" | "FAILED" | "PENDING" | "EXPIRED" | "CANCELLED" | "REFUNDED"
    > = {
      PAID: "PAID",
      NEW: "PENDING",
      CANCELED: "CANCELLED",
      REFUNDED: "REFUNDED",
      EXPIRED: "EXPIRED",
      FAILED: "FAILED",
    };
    return statusMap[orderStatus] || "PENDING";
  }

  private mapWebhookEventType(payload: any): string {
    switch (payload.orderStatus) {
      case "PAID":
        return "payment.paid";
      case "CANCELED":
        return "payment.cancelled";
      case "REFUNDED":
        return "payment.refunded";
      case "EXPIRED":
        return "payment.expired";
      case "FAILED":
        return "payment.failed";
      default:
        return "payment.unknown";
    }
  }

  async refund(input: ProviderRefundInput): Promise<ProviderRefundResult> {
    try {
      const refundRequest = {
        merchantCode: this.merchantCode,
        referenceNumber: input.providerTransactionId,
        refundAmount: Number(input.amountMinor) / 100,
        reason: input.reason || "Refund requested",
        signature: this.generateRefundSignature(
          input.providerTransactionId,
          Number(input.amountMinor) / 100,
        ),
      };

      const response = await fetch(
        `${this.baseUrl}/ECommerceWeb/Fawry/payments/refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refundRequest),
        },
      );

      const data: FawryRefundResponse = await response.json();

      return {
        success: data.statusCode === 200,
        providerRefundId: data.referenceNumber,
        status: data.statusCode === 200 ? "SUCCEEDED" : "FAILED",
        errorCode: data.statusCode !== 200 ? "REFUND_FAILED" : undefined,
        errorMessage: data.statusDescription,
        rawResponse: data,
      };
    } catch (error) {
      return {
        success: false,
        errorCode: "REFUND_FAILED",
        errorMessage: error.message,
      };
    }
  }

  private generateRefundSignature(
    referenceNumber: string,
    amount: number,
  ): string {
    const str = `${this.merchantCode}${referenceNumber}${amount}${this.merchantSecretKey}`;
    return crypto.createHash("sha256").update(str).digest("hex");
  }
}
