# Security Architecture Specification

## Overview
Security architecture for the Learning Platform. Defense in depth with zero trust principles.

## Security Principles
1. **Default Deny** - Everything forbidden unless explicitly allowed
2. **Least Privilege** - Minimum permissions necessary
3. **Defense in Depth** - Multiple layers, no single point of failure
4. **Audit Everything** - Every sensitive action logged
5. **Fail Secure** - Failures default to secure state
6. **No Secrets in Code** - All secrets externalized

## Architecture Overview
```
INTERNET
    │
Cloudflare (CDN + WAF + DNS + DDoS)
    │
Static Assets | API / Web | Video CDN
    │            │           │
CDN Cache   Next.js+NestJS  Video CDN (Bunny/VdoCipher)
                │
           NestJS Backend
                │
         PolicyEngine (RBAC + Resource + Feature + Entitlement + Ownership)
                │
     ┌──────────┼──────────┐
     │          │          │
Core App    PII Vault    Payment Layer
                │
         PostgreSQL + RLS + app_user
```

## Security Layers

### 1. Network Layer (Cloudflare)
- WAF: OWASP Top 10, rate limiting, bot protection
- DDoS Protection: Automatic mitigation
- SSL/TLS: TLS 1.2+, HSTS, certificate transparency
- DNS: DNSSEC, CAA records

### 2. Application Layer (NestJS)

#### Authentication
| Component | Implementation |
|-----------|----------------|
| Password Hashing | Argon2id (memory-hard, time-cost=3, parallelism=1) |
| Access Token | JWT RS256, 15min TTL, in memory |
| Refresh Token | 7d, rotating, HttpOnly Secure cookie, reuse detection → revoke family |
| 2FA | TOTP (mandatory for ADMIN/TEACHER) |
| Device Fingerprinting | Canvas + navigator + headers → SHA256 |

#### Authorization
```typescript
can(user, action, resource, context): PolicyDecision

Checks in order:
1. Tenant isolation (RLS + application check)
2. RBAC (role permissions)
3. Resource ownership
4. Entitlements (per-student resource access)
5. Feature flags (plan + tenant override)
6. Plan limits (quotas)
```

#### Request Flow
```
Request → Cloudflare WAF → Rate Limit → Auth → Tenant Resolution →
Authorization → Validation → Business Logic → Audit → Response
```

### 3. Database Layer (PostgreSQL + RLS)

#### Tenant Isolation
- Every tenant-scoped table has `tenant_id` column
- `FORCE ROW LEVEL SECURITY` on all tenant-scoped tables
- Runtime user `app_user`: no SUPERUSER, no BYPASSRLS
- Tenant context set per transaction: `set_config('app.tenant_id', ..., true)`

#### RLS Policy Pattern
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_name ON table_name
  FOR SELECT USING (current_setting('app.tenant_id', true) = tenant_id::text);
```

#### Runtime User (`app_user`)
```sql
CREATE ROLE app_user WITH LOGIN PASSWORD '...';
GRANT CONNECT ON DATABASE learning_platform TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
REVOKE BYPASSRLS ON ALL TABLES IN SCHEMA public FROM app_user;
```

#### Migration User
- `postgres` superuser used ONLY for `prisma migrate`
- NEVER used by application runtime

### 4. Data Protection

#### PII Classification
| Classification | Fields | Access |
|----------------|--------|--------|
| **RESTRICTED** | National ID, password hash, refresh tokens, payment secrets | App-level encryption + KMS |
| **CONFIDENTIAL** | Phone, email, birth date, guardian info | Encrypted at rest, blind indexes |
| **INTERNAL** | Name, enrollment, progress, orders | Standard access via RLS |
| **PUBLIC** | Course titles, public certificates | Public read |

#### Encryption
- **At Rest**: PostgreSQL TDE + Application-level encryption (AES-256-GCM)
- **In Transit**: TLS 1.2+ everywhere
- **Key Management**: AWS KMS / HashiCorp Vault (production)
- **Envelope Encryption**: DEK per data set, KEK from KMS

#### Blind Indexes
For searching encrypted PII without decryption:
```sql
phone_blind_index = HMAC_SHA256(phone_normalized, index_key)
```

### 5. Payment Security

#### Golden Rules
1. Never trust payment status from client
2. Never trust amount/discount from client
3. Never trust provider callback until verified
5. Never process same payment event twice
5. Never create enrollment from browser redirect alone
6. Never mutate historical financial records

#### Flow
```
Student → Create Order → PaymentIntent → Provider → Verified Webhook
                                                      ↓
                                            Payment = PAID
                                                      ↓
                                    Ledger + Enrollment + Outbox
```

#### Webhook Security
1. HMAC signature verification (provider-specific)
2. Replay protection: `UNIQUE(provider, external_event_id)` + inbox table
3. Idempotent processing
5. Inbox table → queue → normalize → state machine

#### Ledger (Double-Entry)
```
Payment PAID:
  DEBIT: PLATFORM_RECEIVABLE
  CREDIT: CUSTOMER_CLEARING

Refund:
  CREDIT: PLATFORM_RECEIVABLE
  DEBIT: CUSTOMER_CLEARING

Settlement:
  DEBIT: PLATFORM_CASH
  CREDIT: TEACHER_PAYABLE
```

### 6. Video Security
See `docs/VIDEO_PROTECTION.md` for full specification.

Key layers:
1. **Direct Upload**: Browser → Provider (TUS), never through API
2. **Quotas**: Per-tenant max file size & stored hours
3. **Playback Token**: Short-lived JWT (2h), bound to session + student
4. **Watermark**: Deterministic HMAC-signed payload, moving position
4. **Session Binding**: Device fingerprint, single active session, heartbeat risk scoring
4. **Capture Detection**: Screenshot, recording, tamper, focus loss
5. **Risk Engine**: LOW/MEDIUM/HIGH/CRITICAL → allow/challenge/revoke

### 7. Secrets Management

#### Environment Separation
| Environment | Secrets Source |
|-------------|----------------|
| Development | `.env.local` (gitignored) |
| Staging | GitHub Actions secrets / Vault |
| Production | HashiCorp Vault / AWS Secrets Manager |

#### Required Secrets
| Secret | Rotation | Default Check |
|--------|----------|---------------|
| `JWT_SECRET` | 90 days | Refuses default in prod |
| `VIDEO_TOKEN_SECRET` | 90 days | Refuses default in prod |
| `VIDEO_WATERMARK_HMAC_SECRET` | 90 days | Refuses default in prod |
| `PAYMOB_API_KEY` | Per provider policy | N/A |
| `FAWRY_SECRET_KEY` | Per provider policy | N/A |
| `BUNNY_STREAM_API_KEY` | Per provider policy | N/A |
| `BUNNY_STREAM_SIGNING_KEY` | 90 days | N/A |
| `DATABASE_URL` (app_user) | 90 days | N/A |
| `MIGRATION_DATABASE_URL` (postgres) | 90 days | CI/CD only |

#### Production Startup Validation
```typescript
function validateSecrets(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaults = {
    JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
    VIDEO_TOKEN_SECRET: 'change-in-production',
    VIDEO_WATERMARK_HMAC_SECRET': 'change-in-production',
  };

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = process.env[key];
    if (!value || value === defaultValue) {
      const msg = `SECURITY ERROR: ${key} is not set or uses default value.`;
      if (isProduction) {
        console.error(msg);
        process.exit(1);
      } else {
        console.warn(`⚠️  ${msg} (allowed in development)`);
      }
    }
  }
}
```

### 8. Audit & Monitoring

#### Audit Log Structure
```typescript
interface AuditLog {
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  previousState?: any;
  nextState?: any;
  reason?: string;
  requestId: string;
  ipHash: string;
  metadata: Record<string, any>;
  createdAt: DateTime;
}
```

#### Critical Actions Audited
| Category | Actions |
|----------|---------|
| Auth | LOGIN, LOGOUT, PASSWORD_CHANGE, 2FA_ENABLED, REFRESH_REUSE_DETECTED |
| Payments | PAYMENT_CREATED, PAYMENT_PAID, PAYMENT_REFUNDED, VOUCHER_REDEEMED |
| Video | VIDEO_UPLOAD, PLAYBACK_AUTHORIZED, PLAYBACK_REVOKED, CAPTURE_EVENT |
| Admin | USER_ROLE_CHANGED, TENANT_CONFIG_CHANGED, SECRET_ROTATED |
| Security | CROSS_TENANT_ATTEMPT, WEBHOOK_SIGNATURE_FAILED, RISK_THRESHOLD_EXCEEDED |

### 9. Incident Response

#### Severity Levels
| Level | Examples | Response Time |
|-------|----------|---------------|
| **SEV-1** | Cross-tenant data leak, payment compromise, KMS compromise, mass PII exposure | Immediate (15 min) |
| **SEV-2** | Admin account compromise, video token abuse at scale, payment inconsistency | 1 hour |
| **SEV-3** | Single suspicious account, limited failed webhook, isolated security event | 4 hours |

#### Containment Procedures
| Incident | Immediate Action |
|----------|------------------|
| Credential compromise | Revoke sessions → Rotate secrets → Disable affected accounts |
| Payment provider compromise | Disable provider → Freeze payments → Reconcile |
| Video abuse at scale | Enable STRICT mode → Revoke sessions → Block IPs |
| Cross-tenant access | Emergency RLS audit → Disable affected endpoints → Investigate |

#### Forensic Preservation
- **Never** delete logs during incident
- Export relevant audit logs to secure storage
- Preserve database snapshots
- Document timeline with timestamps

### 9. Compliance Considerations

| Regulation | Applicable | Implementation |
|------------|------------|----------------|
| GDPR (if EU students) | Conditional | Data export/deletion, consent, DPIA |
| PCI DSS (payments) | Yes | Provider handles card data; we store only tokens |
| Egypt Data Protection Law | Yes | Local data residency, consent, breach notification |
| COPPA (minors) | Yes | Guardian consent, data minimization, deletion rights |

## Security Checklist for Releases

### Pre-Deploy
- [ ] All secrets rotated from defaults
- [ ] `pnpm build` passes with 0 errors
- [ ] `pnpm test` passes (unit + integration)
- [ ] Dependency audit: `pnpm audit --prod`
- [ ] Prisma migration reviewed
- [ ] RLS policies verified for new tables
- [ ] Secrets not in code/git history

### Post-Deploy
- [ ] Health checks passing
- [ ] Error rates normal
- [ ] Webhook delivery successful
- [ ] Audit logs flowing
- [ ] Metrics dashboards green

## Related Documentation
- `docs/ARCHITECTURE.md` - System architecture
- `docs/VIDEO_PROTECTION.md` - Video security details
- `docs/STATUS.md` - Current project status
- `AGENTS.md` - Project rules and conventions