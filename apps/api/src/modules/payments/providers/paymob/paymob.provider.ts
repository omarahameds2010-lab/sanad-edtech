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

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

interface PaymobTransaction {
  id: string;
  amount_cents: number;
  currency: string;
  is_refunded: boolean;
  is_refund: boolean;
  is_voided: boolean;
  is_capture: boolean;
  is_void: boolean;
  is_refund_pending: boolean;
  is_voided_pending: boolean;
  captured_amount: number;
  refunded_amount_cents: number;
  source_data: {
    type: string;
    pan: string;
    sub_type: string;
  };
  payment_method: string;
  created_at: string;
}

@Injectable()
export class PaymobProvider implements PaymentProvider {
  readonly name = "paymob";
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
  private apiKey: string;
  private integrationId: string;
  private iframeId: string;
  private hmacSecret: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      configService.get<string>("PAYMOB_BASE_URL") ||
      "https://accept.paymob.com/api";
    this.apiKey = configService.get<string>("PAYMOB_API_KEY") || "";
    this.integrationId =
      configService.get<string>("PAYMOB_INTEGRATION_ID") || "";
    this.iframeId = configService.get<string>("PAYMOB_IFRAME_ID") || "";
    this.hmacSecret = configService.get<string>("PAYMOB_HMAC_SECRET") || "";
  }

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    try {
      const authToken = await this.authenticate();
      const orderId = await this.createOrder(authToken, input);
      const paymentToken = await this.createPaymentKey(
        authToken,
        orderId,
        input,
      );

      let redirectUrl: string;
      if (input.paymentMethod === "CARD") {
        redirectUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${this.iframeId}?payment_token=${paymentToken}`;
      } else {
        redirectUrl = `https://accept.paymobsolutions.com/api/acceptance/payments/pay?payment_token=${paymentToken}`;
      }

      return {
        success: true,
        providerPaymentId: orderId.toString(),
        providerTransactionId: paymentToken,
        redirectUrl,
        clientToken: paymentToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        rawResponse: { orderId, paymentToken },
      };
    } catch (error) {
      return {
        success: false,
        errorCode: "PROVIDER_ERROR",
        errorMessage: error.message,
        rawResponse: error.response?.data,
      };
    }
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<ProviderPaymentStatus> {
    try {
      const authToken = await this.authenticate();
      const transaction = await this.getTransaction(
        authToken,
        input.providerTransactionId || input.providerPaymentId || "",
      );

      return this.mapTransactionToStatus(transaction);
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
      providerTransactionId: input.providerTransactionId,
      providerPaymentId: input.providerPaymentId,
      orderId: input.orderId,
    });
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhookResult> {
    const isValid = this.verifyHmac(
      input.rawBody,
      input.headers["hmac"] || input.headers["x-paymob-hmac"] || "",
    );

    if (!isValid) {
      return { valid: false, errorCode: "INVALID_SIGNATURE" };
    }

    const payload =
      typeof input.rawBody === "string"
        ? JSON.parse(input.rawBody)
        : input.rawBody;
    const obj = payload.obj || payload;

    return {
      valid: true,
      eventType: this.mapEventType(obj),
      externalEventId: obj.id?.toString() || obj.order?.id?.toString(),
      paymentId: obj.order?.id?.toString(),
      transactionId: obj.id?.toString(),
      status: this.mapPaymobStatus(obj.success, obj.pending),
      amountMinor: BigInt(obj.amount_cents || 0),
      currency: obj.currency || "EGP",
      paidAt: obj.created_at ? new Date(obj.created_at) : new Date(),
      rawPayload: payload,
    };
  }

  private async authenticate(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey }),
    });

    const data: PaymobAuthResponse = await response.json();
    return data.token;
  }

  private async createOrder(
    token: string,
    input: CreateProviderPaymentInput,
  ): Promise<number> {
    const response = await fetch(`${this.baseUrl}/ecommerce/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: Number(input.amountMinor),
        currency: input.currency,
        items: [],
        merchant_order_id: input.orderId,
      }),
    });

    const data: PaymobOrderResponse = await response.json();
    return data.id;
  }

  private async createPaymentKey(
    token: string,
    orderId: number,
    input: CreateProviderPaymentInput,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/acceptance/payment_keys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: Number(input.amountMinor),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: input.customerEmail || "customer@example.com",
          floor: "NA",
          first_name: input.customerName?.split(" ")[0] || "Customer",
          street: "NA",
          building: "NA",
          phone_number: input.customerPhone || "+201000000000",
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: "EG",
          last_name:
            input.customerName?.split(" ").slice(1).join(" ") || "User",
          state: "NA",
        },
        currency: input.currency,
        integration_id: parseInt(this.integrationId),
      }),
    });

    const data: PaymobPaymentKeyResponse = await response.json();
    return data.token;
  }

  private async getTransaction(
    token: string,
    paymentToken: string,
  ): Promise<PaymobTransaction> {
    const response = await fetch(
      `${this.baseUrl}/acceptance/payments/search?payment_token=${paymentToken}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await response.json();
    return data.transactions?.[0] || data;
  }

  private mapTransactionToStatus(
    transaction: PaymobTransaction,
  ): ProviderPaymentStatus {
    let status:
      | "PAID"
      | "FAILED"
      | "PENDING"
      | "EXPIRED"
      | "CANCELLED"
      | "REFUND_PENDING"
      | "REFUNDED";

    if (transaction.is_refunded) {
      status = "REFUNDED";
    } else if (transaction.is_void || transaction.is_voided) {
      status = "CANCELLED";
    } else if (transaction.captured_amount > 0) {
      status = "PAID";
    } else if (transaction.is_refund_pending) {
      status = "REFUND_PENDING";
    } else {
      status = "PENDING";
    }

    return {
      status,
      providerPaymentId: transaction.id?.toString(),
      providerTransactionId: transaction.id?.toString(),
      amountMinor: BigInt(transaction.amount_cents || 0),
      currency: transaction.currency || "EGP",
      paidAt: transaction.created_at
        ? new Date(transaction.created_at)
        : undefined,
      rawResponse: transaction,
    };
  }

  private mapPaymobStatus(
    success: boolean,
    pending: boolean,
  ): "PAID" | "FAILED" | "PENDING" {
    if (success && !pending) return "PAID";
    if (!success) return "FAILED";
    return "PENDING";
  }

  private mapEventType(obj: any): string {
    if (obj.success === true && obj.pending !== true) return "payment.paid";
    if (obj.success === false) return "payment.failed";
    if (obj.pending === true) return "payment.pending";
    if (obj.is_refunded === true) return "payment.refunded";
    if (obj.is_void === true || obj.is_voided === true)
      return "payment.cancelled";
    return "payment.unknown";
  }

  private verifyHmac(body: string | Buffer, receivedHmac: string): boolean {
    if (!receivedHmac || !this.hmacSecret) return false;

    const expectedHmac = crypto
      .createHmac("sha512", this.hmacSecret)
      .update(typeof body === "string" ? body : body.toString())
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(receivedHmac, "hex"),
      Buffer.from(expectedHmac, "hex"),
    );
  }

  async refund(input: ProviderRefundInput): Promise<ProviderRefundResult> {
    try {
      const authToken = await this.authenticate();

      const response = await fetch(
        `${this.baseUrl}/acceptance/void_refund/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            auth_token: authToken,
            transaction_id: input.providerTransactionId,
            amount_cents: Number(input.amountMinor),
          }),
        },
      );

      const data = await response.json();

      return {
        success: true,
        providerRefundId: data.id?.toString(),
        status: "SUCCEEDED",
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
}
