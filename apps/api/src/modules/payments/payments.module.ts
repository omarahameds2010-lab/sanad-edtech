import { Module } from "@nestjs/common";
import { PaymentOrchestratorService } from "./payment-orchestrator.service";
import { VoucherProvider } from "./providers/voucher/voucher.provider";
import { ProviderRegistryService } from "./providers/provider-registry.service";
import { ProviderRouterService } from "./routing/provider-router.service";
import { PaymentsController } from "./controllers/payments.controller";
import { WebhookController } from "./webhooks/webhook.controller";
import { WebhookInboxService } from "./webhooks/webhook-inbox.service";
import { LedgerService } from "./ledger/ledger.service";
import { PaymentRiskService } from "./fraud/payment-risk.service";
import { IdempotencyService } from "./security/idempotency.service";
import { PaymentAuditService } from "./security/payment-audit.service";
import { PaymobProvider } from "./providers/paymob/paymob.provider";
import { FawryProvider } from "./providers/fawry/fawry.provider";
import { InstapayProvider } from "./providers/instapay/instapay.provider";
import { VodafoneCashProvider } from "./providers/vodafone-cash/vodafone-cash.provider";
import { EandMoneyProvider } from "./providers/eand-money/eand-money.provider";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { AuthorizationModule } from "../authorization/authorization.module";
import { OutboxModule } from "../outbox/outbox.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    EntitlementsModule,
    FeatureFlagsModule,
    AuthorizationModule,
    OutboxModule,
    AuthModule,
  ],
  controllers: [PaymentsController, WebhookController],
  providers: [
    PaymentOrchestratorService,
    VoucherProvider,
    ProviderRegistryService,
    ProviderRouterService,
    WebhookInboxService,
    LedgerService,
    PaymentRiskService,
    IdempotencyService,
    PaymentAuditService,
    PaymobProvider,
    FawryProvider,
    InstapayProvider,
    VodafoneCashProvider,
    EandMoneyProvider,
  ],
  exports: [
    PaymentOrchestratorService,
    VoucherProvider,
    ProviderRegistryService,
    ProviderRouterService,
    WebhookInboxService,
    LedgerService,
    PaymentRiskService,
    IdempotencyService,
    PaymentAuditService,
  ],
})
export class PaymentsModule {}
