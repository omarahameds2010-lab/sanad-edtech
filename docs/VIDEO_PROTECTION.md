# Video Content Protection Specification

> **Current implementation status — 25 October 2026.** This is a design specification; the verified runtime status is maintained in [`CURRENT-STATE.md`](CURRENT-STATE.md). Read this banner before treating any control below as shipped.
>
> **What exists in the repository now**
>
> - `BunnyStreamProvider` with upload URL/TUS token, status, delete, and webhook verification helpers.
> - `VdoCipherProvider` is an explicit stub.
> - `SignedTokenService` (HMAC playback token), `WatermarkEngine` (deterministic positions + HMAC payload), and playback-session/risk primitives.
> - Teacher can attach an unlisted YouTube id; the current student demo player is the YouTube IFrame API (`youtube-nocookie.com`).
>
> **What does not exist / is not active**
>
> - There is **no video webhook HTTP route**. Provider webhook helpers are not exposed.
> - There is **no `WatermarkOverlay` React component** in `apps/web`; the overlay/tamper-detection UI described below is a specification, not current UI.
> - The current YouTube demo path does not use the Bunny token/watermark pipeline.
> - The playback token TTL default is **5 minutes** (`VIDEO_TOKEN_TTL_MS=300000`), not 2 hours.
> - Video protection is deterrence/traceability, not DRM. Do not claim unbreakable protection.
> - Locked-lesson enforcement is advisory in student API views; see `CURRENT-STATE.md`.

## Overview
Video content protection for the Learning Platform. The goal is **not** 100% piracy prevention (impossible), but to:
- Make piracy harder and traceable
- Identify leaked content sources
- Limit unauthorized playback
- Detect and respond to abuse

## Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Screen recording (native app) | High | Medium | FLAG_SECURE / UIScreen.isCaptured → blackout |
| Screen recording (web) | High | Medium | Watermark + tamper detection + risk scoring |
| Video download (HLS segments) | Medium | High | Short-lived signed tokens (5 min default), token bound to session |
| Credential sharing | Medium | High | Device fingerprinting, concurrent session limit, risk scoring |
| Token theft | Low | High | Short TTL (5 min default), session binding, IP/domain lock |
| CDN token leakage | Low | High | Short TTL, HMAC signing, token bound to session |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Student    │────▶│   API       │────▶│  Provider   │────▶│   CDN       │
│  (Browser)  │     │  (NestJS)   │     │ (Bunny)     │     │  (Bunny)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Request       │                   │                   │
       │  playback token   │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  2. HLS Request   │                   │                   │
       │  (with token)     │                   │                   │
       │──────────────────────────────────────▶│                   │
       │                   │                   │                   │
       │◀──────────────────────────────────────│                   │
       │  3. HLS Segments  │                   │                   │
       │                   │                   │                   │
       │  4. Render        │                   │                   │
       │  + Watermark      │                   │                   │
       │  + Heartbeat      │                   │                   │
```

## Components

### 1. VideoProvider Abstraction
```typescript
interface VideoProvider {
  createUpload(input): Promise<CreateUploadResult>;   // Direct upload URL
  getStatus(videoId): Promise<VideoStatusResult>;     // Sync status
  getPlaybackToken(videoId, sessionId, ...): Promise<PlaybackTokenResult>;
  deleteVideo(videoId): Promise<DeleteVideoResult>;
  handleWebhook(payload): Promise<void>;              // Normalize events
  verifyWebhook(payload, headers): Promise<boolean>;  // HMAC verify
}
```

**Implemented:**
- `BunnyStreamProvider`: upload URL/TUS token, status, delete, and webhook verification helper. The HTTP webhook route is **not** wired.
- `VdoCipherProvider`: Stub (official integration pending).

### 2. WatermarkEngine
Deterministic, cryptographically signed, tamper-evident watermark.

**Payload:**
```json
{
  "studentName": "Ahmed Mohamed",
  "studentPhone": "01012345678",
  "studentId": "student_abc123",
  "tenantName": "Mr. Ahmed Academy",
  "enrollmentId": "enr_xyz789",
  "issuedAt": 1728000000000,
  "expiresAt": 1728007200000,
  "seed": 1234567890123456
}
```

**Signature:** HMAC-SHA256 with `VIDEO_WATERMARK_HMAC_SECRET`

**Position Algorithm (mulberry32 PRNG):**
```typescript
function positionAt(seed: bigint, step: number, baseOpacity = 0.65): Position {
  const rand = mulberry32(Number(seed & 0xffffffffn) + step * 7919);
  return {
    x: 4 + rand() * 56,           // 4% - 60%
    y: 6 + rand() * 76,           // 6% - 82%
    rotate: -6 + rand() * 12,     // -6° to +6°
    opacity: Math.max(0.35, baseOpacity - 0.15 + rand() * 0.3)
  };
}
```
- Changes every 7 seconds (`positionChangeInterval`)
- Safe zones: avoids edges where controls/overlays might hide it
- Deterministic: same seed = same position sequence

### 3. SignedTokenService
Short-lived JWT-like tokens for playback authorization.

**Token Payload:**
```json
{
  "videoId": "vid_abc123",
  "sessionId": "sess_xyz789",
  "tenantId": "tenant_abc",
  "studentId": "student_xyz",
  "exp": 1728007200,
  "iat": 1728000000
}
```

**Token Format:** `header.payload.signature` (base64url)
- **Header**: `{ "alg": "HS256", "typ": "JWT" }`
- **Signature**: HMAC-SHA256 with `VIDEO_TOKEN_SECRET`
- **TTL**: 5 minutes by default (`VIDEO_TOKEN_TTL_MS=300000`; configurable). The older 2-hour claim in this document was stale.

### 4. PlaybackSessionService
Manages playback sessions with security controls.

**Session Lifecycle:**
```
AUTHORIZE → ACTIVE (heartbeat every 15-30s) → END / REVOKE
                │
                ├── Heartbeat: position, seekCount, visible, focused
                ├── Risk scoring: seeks, visibility, captures, IP changes
                ├── Capture events: screenshot, recording, tamper, focus loss
                └── Risk level: LOW → allow, MEDIUM → challenge, HIGH/CRITICAL → revoke
```

**Risk Scoring:**
| Signal | Weight |
|--------|--------|
| Rapid seeking (>10/15s) | +15 |
| Visibility loss | +10 |
| Focus loss | +10 |
| Screenshot detected | +25 |
| Screen recording detected | +40 |
| Watermark tampered | +50 |
| DevTools suspected | +20 |
| IP change (rapid) | +25 |
| Device limit exceeded | +30 |
| Concurrent sessions | +30 |

**Risk Levels:**
- **LOW (0-29)**: Allow
- **MEDIUM (30-59)**: Challenge / rate-limit
- **HIGH (60-79)**: Revoke session / require re-auth
- **CRITICAL (80+)**: Block / admin review

### 4. WatermarkOverlay (React Component — specification only; not shipped)
```tsx
<WatermarkOverlay
  lines={["Ahmed Mohamed", "01012345678", "Student #123", "Teacher Academy", "01:23:45"]}
  seed={1234567890123456}
  intervalSec={7}
  onTamper={() => {
    // Pause video, send capture event, increase risk score
    player.pause();
    sendCaptureEvent('WATERMARK_TAMPERED');
  }}
/>
```

**Tamper Detection:**
- MutationObserver watches for removal/hiding/opacity change
- Interval check every 2s (display:none, visibility:hidden, opacity<0.2)
- On tamper: pause video + send `WATERMARK_TAMPERED` event → risk score +50

### 5. Native App Protection
| Platform | Mechanism |
|----------|-----------|
| **Android** | `WindowManager.LayoutParams.FLAG_SECURE` → screenshot/recording = black screen |
| **iOS** | `UIScreen.main.isCaptured` observer → hide video layer + pause + send event |
| **iOS** | `UIApplication.userDidTakeScreenshotNotification` → send `SCREENSHOT` event |

### 6. Web Best-Effort Protection
| Technique | Effectiveness |
|-----------|---------------|
| Watermark + HMAC | Traceability + tamper evidence |
| Short-lived tokens (5 min default) | Limits token reuse window |
| Token bound to session | Prevents token sharing |
| Visibility/Focus monitoring | Detects tab switching |
| DevTools detection | Detects inspection attempts |
| MutationObserver on watermark | Detects DOM tampering |

**Reality Check:** Web cannot prevent screen recording (OBS, phone camera, HDMI capture). Goal is **traceability + deterrence**.

## Video State Machine

```
UPLOADING ──▶ PROCESSING ──▶ READY ──▶ PUBLISHED
    │              │            │
    │              ▼            ▼
    │           FAILED ◀──── ARCHIVED
    │              │
    └──────────────┘ (retry or manual)
```

**Provider Webhook Events:**
| Provider Event | Internal Event | Action |
|----------------|----------------|--------|
| `video.upload.started` | `video.upload.started` | status=UPLOADING |
| `video.upload.completed` | `video.upload.completed` | status=PROCESSING |
| `video.processing` | `video.processing.started` | status=PROCESSING |
| `video.processed` | `video.processing.completed` | status=READY |
| `video.failed` | `video.processing.failed` | status=FAILED + errorMessage |
| `video.published` | `video.published` | status=PUBLISHED |
| `video.deleted` | `video.deleted` | status=ARCHIVED |

## Quotas & Limits

Per-tenant (configurable via plan):
| Quota | Default | Enforcement |
|-------|---------|-------------|
| Max file size | 5 GB | Before upload URL issued |
| Max stored hours | 100 hours | Before upload URL issued |
| Max concurrent sessions | 1 | Session creation |
| Max devices | 2 | Device registration |
| Token TTL | 5 minutes default | Signed token exp claim |
| Session heartbeat | 15-30s | Auto-revoke on timeout |

## Audit & Monitoring

### Audit Events
| Event | Fields |
|-------|--------|
| `VIDEO_UPLOAD_INITIATED` | videoId, fileSize, mimeType, provider |
| `VIDEO_UPLOAD_COMPLETED` | videoId, providerVideoId |
| `VIDEO_STATUS_CHANGED` | videoId, oldStatus, newStatus |
| `PLAYBACK_AUTHORIZED` | videoId, sessionId, studentId, deviceId |
| `PLAYBACK_REVOKED` | sessionId, reason, riskScore |
| `CAPTURE_EVENT` | sessionId, eventType, metadata, riskScore |
| `WATERMARK_TAMPERED` | sessionId, videoId, riskScore |
| `VIDEO_DELETED` | videoId, providerVideoId |

### Security Events (VIDEO_*)
| Event | Severity | Action |
|-------|----------|--------|
| `VIDEO_ACCESS_DENIED` | WARNING | Log only |
| `VIDEO_PLAYBACK_REVOKED` | WARNING | Session ended |
| `CAPTURE_SCREENSHOT` | WARNING | Risk +25 |
| `CAPTURE_SCREEN_RECORDING` | HIGH | Risk +40 |
| `WATERMARK_TAMPERED` | CRITICAL | Risk +50, revoke session |
| `DEVTOOLS_SUSPECTED` | WARNING | Risk +20 |

## Configuration

### Environment Variables
```bash
# Video Security
VIDEO_WATERMARK_HMAC_SECRET="change-in-production"  # HMAC for watermark payload
VIDEO_TOKEN_SECRET="change-in-production"           # JWT signing for playback tokens
VIDEO_TOKEN_ISSUER="learning-platform"
VIDEO_TOKEN_TTL_MS="300000"                         # 5 minutes default
# Playback token TTL is read by SignedTokenService (5 min default)

# Bunny Stream
BUNNY_STREAM_API_KEY=""
BUNNY_STREAM_LIBRARY_ID=""
BUNNY_STREAM_BASE_URL="https://video.bunnycdn.com"
BUNNY_STREAM_CDN_HOSTNAME=""                        # e.g., "123456.b-cdn.net"
BUNNY_STREAM_IFRAME_ID=""                           # For iframe embed
BUNNY_STREAM_SIGNING_KEY=""                         # Webhook HMAC key

# VdoCipher (stub)
VDOCIPHER_CLIENT_ID=""
VDOCIPHER_CLIENT_SECRET=""
VDOCIPHER_BASE_URL="https://dev.vdocipher.com/api"
```

### Tenant Config (JSON in `tenant_config.config`)
```json
{
  "videoSecurity": {
    "watermark": {
      "enabled": true,
      "showName": true,
      "showPhone": true,
      "showStudentId": true,
      "showTimestamp": true,
      "dynamicPosition": true,
      "positionChangeInterval": 7,
      "opacity": 0.65,
      "rotation": true,
      "failurePolicy": "BALANCED"
    },
    "deviceLimit": 2,
    "singleActiveSession": true,
    "signedPlaybackTokens": true,
    "domainLock": true,
    "captureProtection": {
      "native": true,
      "webBestEffort": true,
      "onCapture": "BLACKOUT_AND_PAUSE"
    },
    "suspiciousActivityDetection": true
  }
}
```

## Testing Requirements

> The checklists below are acceptance criteria for the protection design, not a statement that every test exists today. The current API suite is **357/357**; the video module has a service spec, but there is no browser `WatermarkOverlay` test because no such component is shipped. Do not mark a box complete without a real test.

### Unit Tests
- [ ] `WatermarkEngine.positionAt()` deterministic with same seed
- [ ] `WatermarkEngine.signPayload()` / `verifySignature()` roundtrip
- [ ] `SignedTokenService` token creation + verification + expiration
- [ ] `PlaybackSessionService` risk scoring logic
- [ ] `WatermarkOverlay` tamper detection (MutationObserver mock)

### Integration Tests
- [ ] Tenant A cannot get playback token for Tenant B's video
- [ ] Expired token rejected by `verifyPlaybackToken`
- [ ] Webhook signature forgery rejected
- [ ] Concurrent session limit enforced
- [ ] Device limit enforced
- [ ] Quota enforcement before upload URL
- [ ] Webhook replay attack ignored (idempotency)
- [ ] Webhook signature forgery rejected

### E2E Tests
- [ ] Teacher uploads video → student watches → watermark visible
- [ ] Student screen records → capture event logged → risk score increases
- [ ] Student shares token → second session rejected (single session)
- [ ] Expired token rejected at CDN edge

## Monitoring & Alerting

### Metrics
| Metric | Threshold | Alert |
|--------|-----------|-------|
| `video.playback.revoked.rate` | > 5% / 5min | WARNING |
| `video.capture_events.rate` | > 10/min | WARNING |
| `video.watermark_tampered.rate` | > 0 / 5min | CRITICAL |
| `video.webhook.signature_failure.rate` | > 1% / 5min | CRITICAL |
| `video.upload.failure.rate` | > 10% / 15min | WARNING |
| `video.quota_exceeded.count` | > 0 / hour | INFO |

### Dashboards
- Video upload funnel (initiated → uploaded → processed → published)
- Playback success rate by provider
- Risk score distribution
- Capture events by type
- Quota utilization by tenant

## Future Enhancements

| Feature | Priority | Effort |
|---------|----------|--------|
| DRM (Widevine/FairPlay) via Bunny/VdoCipher | High | Medium |
| Per-segment encryption (AES-128) | Medium | Low |
| Machine learning risk scoring | Low | High |
| Forensic watermark extraction tool | Medium | Medium |
| Automated DMCA takedown integration | Low | Medium |

---

## LMS Core: Assignment/Exam Timers & Content Progression System

### Assignment Timer
- **Default**: 300 minutes (5 hours / 18000 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **Frontend displays**: remaining time only (derived from expiresAt)
- **Refresh/browser restart must NOT reset timer**
- **Timer belongs to the attempt**, not the generic assignment
- Once an attempt starts: `expiresAt` is authoritative
- Starting the same attempt again MUST NOT reset the timer

### Exam Timer
- **Default**: 70 minutes (4200 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **On refresh**: expiresAt unchanged
- **On browser clock manipulation**: server time authoritative
- Each attempt has its own timer (no shared timer)

### Timer Storage Decision
- Store: `startedAt`, `expiresAt`
- Do NOT store only: `remainingSeconds` (derived value)
- Canonical: `expiresAt = source of truth`
- `remainingSeconds = derived display value`

### Content Progression System (Progression by Entry)

**Current active progression rules:**
```
ENTER_ASSIGNMENT
    ↓
EXAM becomes available

ENTER_EXAM
    ↓
NEXT LESSON becomes available
```

**Active unlock types (current phase):**
- `ENTER_ASSIGNMENT` → unlock linked Exam
- `ENTER_EXAM` → unlock NEXT LESSON

**Future extension points (not implemented yet):**
- `COMPLETE_ASSIGNMENT` → unlock next
- `COMPLETE_EXAM` → unlock next
- `PASS_EXAM` → unlock next
- `SCORE_THRESHOLD` → unlock next
- `TIME_ELAPSED` → unlock after time
- `MANUAL` → teacher manual unlock

### Progression Trigger
**Current implementation:**
- Student enters Assignment (`POST /api/v1/assignments/:id/enter`)
  → record ENTER_ASSIGNMENT
  → linked Exam becomes available

- Student enters Exam (`POST /api/v1/exams/:id/enter`)
  → record ENTER_EXAM
  → next lesson becomes available

**Progression does NOT require:**
- SUBMITTED
- GRADED
- PASS
- Score threshold

### Progression Security
- Frontend MUST NOT control unlock state
- Unlock decisions happen on server:
  - Student Request → Auth → Tenant → Authorization → Enrollment → Entitlement → Business Rule → Transaction → Progression Update → Audit/Event
- Frontend receives only: `isLocked: boolean`, `unlockType: ContentUnlockType`

### Idempotency for Progression
- Progression updates must be idempotent
- Use idempotency keys for unlock operations
- Database constraints prevent duplicate unlocks
- Transaction + database constraints protect against concurrent requests

### Content Unlock Types (Active vs Future)
| Unlock Type | Status | Description |
|-------------|--------|-------------|
| `ENTER_ASSIGNMENT` | **ACTIVE** | Student enters assignment |
| `ENTER_EXAM` | **ACTIVE** | Student enters exam |
| `COMPLETE_ASSIGNMENT` | FUTURE | Assignment completed |
| `COMPLETE_EXAM` | FUTURE | Exam completed |
| `PASS_EXAM` | FUTURE | Exam passed |
| `SCORE_THRESHOLD` | FUTURE | Score threshold reached |
| `TIME_ELAPSED` | FUTURE | Time elapsed |
| `MANUAL` | FUTURE | Teacher manual unlock |

### Progression Security
- **Idempotency**: Progression updates must be idempotent
- **Transaction**: Progression updates in same transaction as business logic
- **Audit**: Every unlock event logged with reason
- **Idempotency keys**: Prevent duplicate unlocks on retry
- **Database constraints**: Prevent duplicate unlocks at DB level

### Timer Security
- **Timer state belongs to the individual attempt record**
- Store: `startedAt`, `expiresAt` (authoritative)
- Do NOT store only `remainingSeconds` (derived value)
- **Canonical**: `expiresAt = source of truth`
- `remainingSeconds = derived display value`

### Assignment Timer
- **Default**: 300 minutes (5 hours / 18000 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **Frontend displays**: remaining time only (derived from expiresAt)
- **Refresh/browser restart must NOT reset timer**
- **Timer belongs to the attempt**, not the generic assignment
- Once an attempt starts: `expiresAt` is authoritative
- Starting the same attempt again MUST NOT reset the timer

### Exam Timer
- **Default**: 70 minutes (4200 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **On refresh**: expiresAt unchanged
- **On browser clock manipulation**: server time authoritative
- Each attempt has its own timer (no shared timer)

### Timer Storage Decision
- Store: `startedAt`, `expiresAt`
- Do NOT store only: `remainingSeconds` (derived value)
- Canonical: `expiresAt = source of truth`
- `remainingSeconds = derived display value`

### Assignment Timer
- **Default**: 300 minutes (5 hours / 18000 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **Frontend displays**: remaining time only (derived from expiresAt)
- **Refresh/browser restart must NOT reset timer**
- **Timer belongs to the attempt**, not the generic assignment
- Once an attempt starts: `expiresAt` is authoritative
- Starting the same attempt again MUST NOT reset the timer

### Exam Timer
- **Default**: 70 minutes (4200 seconds)
- **Server-authoritative**: `expiresAt = startedAt + configured duration`
- **On refresh**: expiresAt unchanged
- **On browser clock manipulation**: server time authoritative
- Each attempt has its own timer (no shared timer)

### Timer Storage Decision
- Store: `startedAt`, `expiresAt`
- Do NOT store only: `remainingSeconds` (derived value)
- Canonical: `expiresAt = source of truth`
- `remainingSeconds = derived display value`

### Content Progression System (Progression by Entry)

**Current active progression rules:**
```
ENTER_ASSIGNMENT
    ↓
EXAM becomes available

ENTER_EXAM
    ↓
NEXT LESSON becomes available
```

**Active unlock types (current phase):**
- `ENTER_ASSIGNMENT` → unlock linked Exam
- `ENTER_EXAM` → unlock NEXT LESSON

**Future extension points (not implemented yet):**
- `COMPLETE_ASSIGNMENT` → unlock next
- `COMPLETE_EXAM` → unlock next
- `PASS_EXAM` → unlock next
- `SCORE_THRESHOLD` → unlock next
- `TIME_ELAPSED` → unlock after time
- `MANUAL` → teacher manual unlock

### Progression Trigger
**Current implementation:**
- Student enters Assignment (`POST /api/v1/assignments/:id/enter`)
  → record ENTER_ASSIGNMENT
  → linked Exam becomes available

- Student enters Exam (`POST /api/v1/exams/:id/enter`)
  → record ENTER_EXAM
  → next lesson becomes available

**Progression does NOT require:**
- SUBMITTED
- GRADED
- PASS
- Score threshold

### Progression Security
- **Frontend MUST NOT control unlock state**
- Unlock decisions happen on server:
  - Student Request → Auth → Tenant → Authorization → Enrollment → Entitlement → Business Rule → Transaction → Progression Update → Audit/Event
- Frontend receives only: `isLocked: boolean`, `unlockType: ContentUnlockType`

### Idempotency for Progression
- Progression updates must be idempotent
- Use idempotency keys for unlock operations
- Database constraints prevent duplicate unlocks
- Transaction + database constraints protect against concurrent requests

---

## Testing Requirements

> The checklists below are acceptance criteria for the protection design, not a statement that every test exists today. The current API suite is **357/357**; the video module has a service spec, but there is no browser `WatermarkOverlay` test because no such component is shipped. Do not mark a box complete without a real test.

### Unit Tests
- [ ] `WatermarkEngine.positionAt()` deterministic with same seed
- [ ] `WatermarkEngine.signPayload()` / `verifySignature()` roundtrip
- [ ] `SignedTokenService` token creation + verification + expiration
- [ ] `PlaybackSessionService` risk scoring logic
- [ ] `WatermarkOverlay` tamper detection (MutationObserver mock)

### Integration Tests
- [ ] Tenant A cannot get playback token for Tenant B's video
- [ ] Expired token rejected by `verifyPlaybackToken`
- [ ] Webhook signature forgery rejected
- [ ] Concurrent session limit enforced
- [ ] Device limit enforced
- [ ] Quota enforcement before upload URL
- [ ] Webhook replay attack ignored (idempotency)
- [ ] Webhook signature forgery rejected

### E2E Tests
- [ ] Teacher uploads video → student watches → watermark visible
- [ ] Student screen records → capture event logged → risk score increases
- [ ] Student shares token → second session rejected (single session)
- [ ] Expired token rejected at CDN edge

### New Tests for LMS Core
- [ ] **Assignment timer**: starts on ENTER, expires correctly, no reset on refresh
- [ ] **Exam timer**: starts on ENTER, expires correctly, no reset on refresh
- [ ] **Progression by Entry**: ENTER_ASSIGNMENT → Exam unlocks, ENTER_EXAM → Next Lesson unlocks
- [ ] **No score-based progression**: Student can progress without passing
- [ ] **Timer persistence**: Refresh/browser close doesn't reset timer
- [ ] **Concurrency**: Two tabs starting same assignment don't create two attempts
- [ ] **Idempotent progression**: Repeated unlock requests don't create duplicates
- [ ] **Server-authoritative timer**: Browser clock manipulation doesn't affect expiry

---

## Monitoring & Alerting

### Metrics
| Metric | Threshold | Alert |
|--------|-----------|-------|
| `video.playback.revoked.rate` | > 5% / 5min | WARNING |
| `video.capture_events.rate` | > 10/min | WARNING |
| `video.watermark_tampered.rate` | > 0 / 5min | CRITICAL |
| `video.webhook.signature_failure.rate` | > 1% / 5min | CRITICAL |
| `video.upload.failure.rate` | > 10% / 15min | WARNING |
| `video.quota_exceeded.count` | > 0 / hour | INFO |

### New Metrics for LMS Core
| Metric | Threshold | Alert |
|--------|-----------|-------|
| `assignment.timer.expired.rate` | > 10% / 5min | INFO |
| `exam.timer.expired.rate` | > 10% / 5min | INFO |
| `progression.unlock.rate` | > 100/min | INFO |
| `progression.idempotent_conflict.rate` | > 0 / 5min | WARNING |

---

## Future Enhancements

| Feature | Priority | Effort |
|---------|----------|--------|
| DRM (Widevine/FairPlay) via Bunny/VdoCipher | High | Medium |
| Per-segment encryption (AES-128) | Medium | Low |
| Machine learning risk scoring | Low | High |
| Forensic watermark extraction tool | Medium | Medium |
| Automated DMCA takedown integration | Low | Medium |
| **Assignment/Exam timer API** | **High** | **Medium** |
| **Content Progression API** | **High** | **Medium** |

---

## Security Reality Check

> **No video protection is 100% foolproof.** Screen recording via external camera, HDMI capture cards, virtual machines, and rooted/jailbroken devices cannot be prevented.

**Our strategy:**
1. **Raise the bar** - Make casual piracy inconvenient
2. **Traceability** - Every leaked video identifies the source student
3. **Deterrence** - Visible watermark + known consequences
4. **Detection** - Capture events + risk scoring → automated response
4. **Containment** - Short tokens, session limits, device limits limit blast radius

---

## Related docs
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/STATUS.md`

## Implementation
- `apps/api/src/modules/video/`
- `apps/api/src/modules/video-protection/`
- `apps/api/src/modules/assignments/`
- `apps/api/src/modules/exams/`
- `apps/api/src/modules/content-progression/`