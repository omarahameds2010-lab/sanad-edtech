import {
  Controller,
  Post,
  RawBodyRequest,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { Request } from "express";
import { WebhookInboxService } from "./webhook-inbox.service";

@Controller("payments/webhooks")
export class WebhookController {
  constructor(private webhookInbox: WebhookInboxService) {}

  @Post("paymob")
  @HttpCode(HttpStatus.OK)
  async paymobWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.PAYMOB_HMAC_SECRET || "";
    return this.webhookInbox.receiveWebhook(
      "paymob",
      req.rawBody,
      headers,
      secret,
    );
  }

  @Post("fawry")
  @HttpCode(HttpStatus.OK)
  async fawryWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.FAWRY_SECURE_HASH_KEY || "";
    return this.webhookInbox.receiveWebhook(
      "fawry",
      req.rawBody,
      headers,
      secret,
    );
  }

  @Post("instapay")
  @HttpCode(HttpStatus.OK)
  async instapayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.INSTAPAY_WEBHOOK_SECRET || "";
    return this.webhookInbox.receiveWebhook(
      "instapay",
      req.rawBody,
      headers,
      secret,
    );
  }

  @Post("vodafone-cash")
  @HttpCode(HttpStatus.OK)
  async vodafoneCashWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.VODAFONE_CASH_WEBHOOK_SECRET || "";
    return this.webhookInbox.receiveWebhook(
      "vodafone_cash",
      req.rawBody,
      headers,
      secret,
    );
  }

  @Post("eand-money")
  @HttpCode(HttpStatus.OK)
  async eandMoneyWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: Record<string, string>,
  ) {
    const secret = process.env.EAND_MONEY_WEBHOOK_SECRET || "";
    return this.webhookInbox.receiveWebhook(
      "eand_money",
      req.rawBody,
      headers,
      secret,
    );
  }
}
